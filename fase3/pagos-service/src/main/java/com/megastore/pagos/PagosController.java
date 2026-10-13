package com.megastore.pagos;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
@CrossOrigin(origins = "*")
public class PagosController {

    private final IntentoPagoRepository intentoPagoRepository;
    private final PagosService pagosService;

    public PagosController(IntentoPagoRepository intentoPagoRepository, PagosService pagosService) {
        this.intentoPagoRepository = intentoPagoRepository;
        this.pagosService = pagosService;
    }

    /**
     * GET /api/pagos/orden/{ordenId}
     * Consulta el historial de intentos de cobro para una orden.
     */
    @GetMapping("/orden/{ordenId}")
    public ResponseEntity<List<IntentoPago>> consultarHistorialCobranza(@PathVariable String ordenId) {
        List<IntentoPago> historial = intentoPagoRepository.findByOrdenId(ordenId);
        if (historial.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(historial);
    }

    @GetMapping("/contingencia")
    public ResponseEntity<List<IntentoPago>> listarPagosEnContingencia() {
        List<IntentoPago> encolados = intentoPagoRepository.findAll().stream()
                .filter(p -> "ENCOLADO_CONTINGENCIA".equalsIgnoreCase(p.getResultado()))
                .toList();
        return ResponseEntity.ok(encolados);
    }

    @PostMapping("/reprocesar-dlq")
    public ResponseEntity<Map<String, Object>> reprocesarDlq() {
        return ResponseEntity.ok(pagosService.reprocesarPagosEnContingencia());
    }

    /**
     * POST /api/pagos/procesar
     *
     * Bifurca el flujo según metodoPago:
     *   - TARJETA_PAYKLIK    → llama a PayKlik con Circuit Breaker + DLQ como fallback
     *   - CREDITO_PROPIO_30D → registra financiamiento diferido sin pasarela
     *
     * En ambos casos publica el evento unificado pago.confirmado en RabbitMQ.
     */
    @PostMapping("/procesar")
    public ResponseEntity<?> procesarPago(@RequestBody PagoRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "El cuerpo de la solicitud no puede estar vacío"));
        }

        if (request.getOrdenId() == null || request.getOrdenId().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ordenId es obligatorio"));
        }

        if (request.getMonto() == null || request.getMonto().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "monto debe ser mayor a cero"));
        }

        if (request.getMetodoPago() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "metodoPago es obligatorio. Valores validos: TARJETA_PAYKLIK, CREDITO_PROPIO_30D"));
        }

        if (request.getMetodoPago() == MetodoPago.TARJETA_PAYKLIK) {
            if (request.getNumeroTarjeta() == null || request.getNumeroTarjeta().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "numeroTarjeta es obligatorio para TARJETA_PAYKLIK"));
            }
            IntentoPago resultado = pagosService.procesarPagoConCircuitBreaker(
                    request.getOrdenId(),
                    request.getMonto(),
                    request.getCanal(),
                    request.getNumeroTarjeta(),
                    request.getDireccionDestino()
            );
            return ResponseEntity.ok(resultado);

        } else {
            // MetodoPago.CREDITO_PROPIO_30D — sin pasarela, sin Circuit Breaker
            IntentoPago resultado = pagosService.procesarCreditoPropioBNPL(
                    request.getOrdenId(),
                    request.getMonto(),
                    request.getCanal(),
                    request.getDireccionDestino()
            );
            return ResponseEntity.ok(resultado);
        }
    }
}
