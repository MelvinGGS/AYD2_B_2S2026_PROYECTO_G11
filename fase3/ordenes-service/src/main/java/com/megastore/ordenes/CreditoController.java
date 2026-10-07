package com.megastore.ordenes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/credito")
@CrossOrigin(origins = "*")
public class CreditoController {

    private final OrdenRepository ordenRepository;
    private final EventoAuditoriaRepository auditoriaRepository;

    public CreditoController(OrdenRepository ordenRepository,
                             EventoAuditoriaRepository auditoriaRepository) {
        this.ordenRepository = ordenRepository;
        this.auditoriaRepository = auditoriaRepository;
    }

    @PostMapping("/evaluar")
    public ResponseEntity<Map<String, Object>> evaluarCredito(@RequestBody Map<String, Object> request) {
        String clienteId = request.get("clienteId") != null ? request.get("clienteId").toString() : "1";
        
        BigDecimal montoOrden = BigDecimal.ZERO;
        if (request.get("montoOrden") instanceof Number) {
            montoOrden = new BigDecimal(request.get("montoOrden").toString());
        } else if (request.get("montoOrden") instanceof String) {
            try {
                montoOrden = new BigDecimal((String) request.get("montoOrden"));
            } catch (Exception ignored) {}
        }

        // Historial real del cliente en el ERP/base de datos
        long ordenesPrevias = ordenRepository.count();
        long incidencias = auditoriaRepository.findByTipoEventoStartingWithOrderByFechaDesc("INCIDENCIA").size();

        // Motor de reglas de scoring crediticio
        int score = 85;
        if (ordenesPrevias >= 2) {
            score += 5; // Bonificación por historial recurrente
        }
        if (incidencias > 0) {
            score -= (int) (incidencias * 15); // Penalización por incidencias o disputas
        }

        BigDecimal limiteCredito = new BigDecimal("5000.00");
        BigDecimal saldoDisponible = new BigDecimal("3500.00");

        boolean aprobado = score >= 70 && montoOrden.compareTo(saldoDisponible) <= 0;

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("clienteId", clienteId);
        respuesta.put("score", score);
        respuesta.put("aprobado", aprobado);
        respuesta.put("limiteCredito", limiteCredito);
        respuesta.put("saldoDisponible", saldoDisponible);
        respuesta.put("plazoDias", aprobado ? 30 : 0);
        respuesta.put("tasaInteres", 0.0);
        respuesta.put("mensaje", aprobado 
                ? "Crédito propio aprobado por 30 días sin intereses" 
                : "No califica para la campaña Compra ahora, paga en 30 días");

        return ResponseEntity.ok(respuesta);
    }
}
