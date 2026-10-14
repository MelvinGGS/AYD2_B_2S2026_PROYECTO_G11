package com.megastore.pagos;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PagosService {

    private final IntentoPagoRepository intentoPagoRepository;
    private final RabbitTemplate rabbitTemplate;
    private final RestTemplate restTemplate;

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue-dlq:pagos.dlq}")
    private String dlqQueue;

    @Value("${app.rabbitmq.routing-key-pago-confirmado:pago.confirmado}")
    private String routingKeyConfirmado;

    @Value("${app.payklik.url:http://localhost:8083/api/payklik/cobrar}")
    private String payklikUrl;

    public PagosService(IntentoPagoRepository intentoPagoRepository, RabbitTemplate rabbitTemplate, RestTemplate restTemplate) {
        this.intentoPagoRepository = intentoPagoRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.restTemplate = restTemplate;
    }

    // -------------------------------------------------------------------------
    // RUTA 1: TARJETA_PAYKLIK — Con Circuit Breaker + DLQ fallback
    // -------------------------------------------------------------------------

    @CircuitBreaker(name = "payklikService", fallbackMethod = "encolarPagoFallback")
    public IntentoPago procesarPagoConCircuitBreaker(String ordenId, BigDecimal monto, String canal, String numeroTarjeta) {
        return procesarPagoInterno(ordenId, monto, canal, numeroTarjeta, "Ciudad de Guatemala");
    }

    @CircuitBreaker(name = "payklikService", fallbackMethod = "encolarPagoFallback")
    public IntentoPago procesarPagoConCircuitBreaker(String ordenId, BigDecimal monto, String canal, String numeroTarjeta, String direccionDestino) {
        return procesarPagoInterno(ordenId, monto, canal, numeroTarjeta, direccionDestino);
    }

    private IntentoPago procesarPagoInterno(String ordenId, BigDecimal monto, String canal, String numeroTarjeta, String direccionDestino) {
        System.out.println("[PAYKLIK] Procesando transacción para Orden: " + ordenId);

        Map<String, Object> request = new HashMap<>();
        request.put("ordenId", ordenId);
        request.put("monto", monto);
        request.put("numeroTarjeta", numeroTarjeta);

        // Llamada REST real a la pasarela PayKlik
        Map respuesta = restTemplate.postForObject(payklikUrl, request, Map.class);

        String refPayklik = respuesta != null && respuesta.get("referencia") != null
                ? respuesta.get("referencia").toString()
                : "PK-UNKNOWN";

        // Cumplimiento PCI-DSS: Solo últimos 4 dígitos
        String ultimosCuatro = (numeroTarjeta != null && numeroTarjeta.length() >= 4)
                ? numeroTarjeta.substring(numeroTarjeta.length() - 4)
                : "4242";

        IntentoPago intento = new IntentoPago(
                ordenId,
                canal != null ? canal : "Web Store",
                monto,
                MetodoPago.TARJETA_PAYKLIK,
                ultimosCuatro,
                "APROBADO",
                refPayklik
        );
        IntentoPago guardado = intentoPagoRepository.save(intento);

        // Publicar evento unificado pago.confirmado
        publicarEventoConfirmado(ordenId, monto, canal, MetodoPago.TARJETA_PAYKLIK, 0, "PAGADO", refPayklik, direccionDestino);

        return guardado;
    }

    public IntentoPago encolarPagoFallback(String ordenId, BigDecimal monto, String canal, String numeroTarjeta, String direccionDestino, Throwable throwable) {
        return encolarPagoFallback(ordenId, monto, canal, numeroTarjeta, throwable);
    }

    public IntentoPago encolarPagoFallback(String ordenId, BigDecimal monto, String canal, String numeroTarjeta, Throwable throwable) {
        System.err.println("[CIRCUIT BREAKER ABIERTO] Pasarela no disponible. Fallback activado: " + throwable.getMessage());

        String ultimosCuatro = (numeroTarjeta != null && numeroTarjeta.length() >= 4)
                ? numeroTarjeta.substring(numeroTarjeta.length() - 4)
                : "4242";

        IntentoPago intento = new IntentoPago(
                ordenId,
                canal != null ? canal : "Web Store",
                monto,
                MetodoPago.TARJETA_PAYKLIK,
                ultimosCuatro,
                "ENCOLADO_CONTINGENCIA",
                "PENDIENTE-REINTENTO"
        );
        IntentoPago guardado = intentoPagoRepository.save(intento);

        // Encolar en RabbitMQ DLQ para no perder la venta
        Map<String, Object> pagoEncolado = new HashMap<>();
        pagoEncolado.put("ordenId", ordenId);
        pagoEncolado.put("monto", monto);
        pagoEncolado.put("motivoFallback", throwable.getMessage());
        pagoEncolado.put("fecha", LocalDateTime.now().toString());

        rabbitTemplate.convertAndSend(dlqQueue, pagoEncolado);
        System.out.println("[DLQ CONTINGENCIA] Cobro encolado en " + dlqQueue + " para reintento.");

        try {
            Map<String, Object> eventoContingencia = new HashMap<>();
            eventoContingencia.put("ordenId", ordenId);
            eventoContingencia.put("monto", monto);
            eventoContingencia.put("estado", "PAGO_EN_CONTINGENCIA");
            eventoContingencia.put("motivo", throwable.getMessage());
            eventoContingencia.put("fecha", LocalDateTime.now().toString());
            rabbitTemplate.convertAndSend(exchangeName, "pago.contingencia", eventoContingencia);
        } catch (Exception e) {
            System.err.println("[WARN] No se pudo emitir evento pago.contingencia: " + e.getMessage());
        }

        return guardado;
    }

    public Map<String, Object> reprocesarPagosEnContingencia() {
        java.util.List<IntentoPago> todos = intentoPagoRepository.findOrdenesRealesEnContingencia();
        if (todos.isEmpty()) {
            todos = intentoPagoRepository.findTop100ByResultadoIgnoreCaseOrderByIdDesc("ENCOLADO_CONTINGENCIA");
        }
        int reprocesados = 0;
        java.util.List<String> ordenesRecuperadas = new java.util.ArrayList<>();

        for (IntentoPago intento : todos) {
                String refRecuperada = "PK-REC-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                intento.setResultado("APROBADO");
                intento.setReferenciaPayklik(refRecuperada);
                intento.setFecha(LocalDateTime.now());
                intentoPagoRepository.save(intento);

                publicarEventoConfirmado(
                        intento.getOrdenId(),
                        intento.getMonto(),
                        intento.getCanal(),
                        intento.getMetodoPago() != null ? intento.getMetodoPago() : MetodoPago.TARJETA_PAYKLIK,
                        0,
                        "PAGADO",
                        refRecuperada,
                        "Ciudad de Guatemala"
                );
            reprocesados++;
            ordenesRecuperadas.add(intento.getOrdenId());
        }

        Map<String, Object> resumen = new HashMap<>();
        resumen.put("reprocesados", reprocesados);
        resumen.put("ordenesRecuperadas", ordenesRecuperadas);
        resumen.put("fecha", LocalDateTime.now().toString());
        return resumen;
    }


    // -------------------------------------------------------------------------
    // RUTA 2: CREDITO_PROPIO_30D — Sin pasarela externa, sin Circuit Breaker
    // -------------------------------------------------------------------------

    public IntentoPago procesarCreditoPropioBNPL(String ordenId, BigDecimal monto, String canal, String direccionDestino) {
        System.out.println("[BNPL CREDITO PROPIO] Aprobando financiamiento a 30 dias para Orden: " + ordenId);

        String refCredito = "BNPL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        IntentoPago intento = new IntentoPago(
                ordenId,
                canal != null ? canal : "Web Store",
                monto,
                MetodoPago.CREDITO_PROPIO_30D,
                "BNPL-30D",
                "APROBADO_CREDITO",
                refCredito
        );
        IntentoPago guardado = intentoPagoRepository.save(intento);

        // Publicar evento unificado pago.confirmado (mismo routing key que TARJETA_PAYKLIK)
        publicarEventoConfirmado(ordenId, monto, canal, MetodoPago.CREDITO_PROPIO_30D, 30, "PAGADO_BNPL", refCredito, direccionDestino);

        return guardado;
    }

    // -------------------------------------------------------------------------
    // Helper privado: publica pago.confirmado unificado para ambas rutas
    // -------------------------------------------------------------------------

    private void publicarEventoConfirmado(String ordenId, BigDecimal monto, String canal,
                                          MetodoPago metodoPago, int plazoDias, String estado,
                                          String referencia, String direccionDestino) {
        Map<String, Object> evento = new HashMap<>();
        evento.put("ordenId", ordenId);
        evento.put("monto", monto);
        evento.put("total", monto);
        evento.put("canal", canal != null ? canal : "Web Store");
        evento.put("metodoPago", metodoPago.name());
        evento.put("plazoDias", plazoDias);
        evento.put("estado", estado);
        evento.put("referencia", referencia);
        evento.put("referenciaPayklik", referencia); // Retrocompatibilidad
        evento.put("direccionDestino", direccionDestino != null ? direccionDestino : "Ciudad de Guatemala");
        evento.put("fecha", LocalDateTime.now().toString());

        rabbitTemplate.convertAndSend(exchangeName, routingKeyConfirmado, evento);
        System.out.println("[PAGO CONFIRMADO] Orden " + ordenId + " | Método: " + metodoPago + " | Ref: " + referencia);
    }
}
