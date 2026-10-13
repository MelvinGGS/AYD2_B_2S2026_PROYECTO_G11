package com.megastore.pagos;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
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

    /**
     * POST /api/pagos/procesar
     *
     * Bifurca el flujo según metodoPago:
     *   - TARJETA_PAYKLIK    → llama a PayKlik con Circuit Breaker + DLQ como fallback
     *   - CREDITO_PROPIO_30D → registra financiamiento diferido sin pasarela
     *
     * En ambos casos publica el evento unificado pago.confirmado en RabbitMQ.
     *
     * @param request DTO validado. Si metodoPago no es uno de los dos valores válidos,
     *                Spring retorna 400 Bad Request automáticamente (deserialización del enum).
     */
    @PostMapping("/procesar")
    public ResponseEntity<?> procesarPago(@Valid @RequestBody PagoRequest request) {

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
