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

    public IntentoPago procesarPagoConCircuitBreaker(String ordenId, BigDecimal monto, String canal, String numeroTarjeta) {
        return procesarPagoConCircuitBreaker(ordenId, monto, canal, numeroTarjeta, "Ciudad de Guatemala");
    }

    @CircuitBreaker(name = "payklikService", fallbackMethod = "encolarPagoFallback")
    public IntentoPago procesarPagoConCircuitBreaker(String ordenId, BigDecimal monto, String canal, String numeroTarjeta, String direccionDestino) {
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
                "TARJETA_CREDITO",
                ultimosCuatro,
                "APROBADO",
                refPayklik
        );
        IntentoPago guardado = intentoPagoRepository.save(intento);

        // Publicar pago confirmado
        Map<String, Object> evento = new HashMap<>();
        evento.put("ordenId", ordenId);
        evento.put("monto", monto);
        evento.put("total", monto);
        evento.put("canal", canal != null ? canal : "Web Store");
        evento.put("estado", "PAGADO");
        evento.put("referenciaPayklik", refPayklik);
        evento.put("direccionDestino", direccionDestino != null ? direccionDestino : "Ciudad de Guatemala");
        evento.put("fecha", LocalDateTime.now().toString());

        rabbitTemplate.convertAndSend(exchangeName, routingKeyConfirmado, evento);
        System.out.println("[PAGO CONFIRMADO] Orden " + ordenId + " cobrada. Ref: " + refPayklik);

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
                "TARJETA_CREDITO",
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

        return guardado;
    }
}
