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
        Object mObj = request.get("montoOrden") != null ? request.get("montoOrden") : request.get("monto");
        if (mObj instanceof Number) {
            montoOrden = new BigDecimal(mObj.toString());
        } else if (mObj instanceof String) {
            try {
                montoOrden = new BigDecimal((String) mObj);
            } catch (Exception ignored) {}
        }

        // Historial real del cliente en el ERP/base de datos (aislado por clienteId)
        List<Orden> ordenesCliente = ordenRepository.findByClienteId(clienteId);
        long ordenesPrevias = ordenesCliente.size();

        java.util.Set<String> idsCliente = ordenesCliente.stream()
                .map(Orden::getId)
                .collect(java.util.stream.Collectors.toSet());

        long incidencias = auditoriaRepository.findByTipoEventoStartingWithOrderByFechaDesc("INCIDENCIA").stream()
                .filter(a -> idsCliente.contains(a.getOrdenId()) || clienteId.equals(a.getOrdenId()))
                .count();

        // Motor de reglas de scoring crediticio
        int score = 85;
        if (ordenesPrevias >= 2) {
            score += 5; // Bonificación por historial recurrente
        }
        if (incidencias > 0) {
            score -= (int) (incidencias * 15); // Penalización por incidencias o disputas
        }

        BigDecimal limiteCredito = new BigDecimal("5000.00");
        BigDecimal deudaActual = ordenesCliente.stream()
                .filter(o -> ("credito_propio".equalsIgnoreCase(o.getMetodoPago()) || "CREDITO_PROPIO_30D".equalsIgnoreCase(o.getMetodoPago())) && !"CANCELADA".equalsIgnoreCase(o.getEstado()))
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Deducción de abonos registrados para este cliente
        BigDecimal abonosRegistrados = auditoriaRepository.findByTipoEventoStartingWithOrderByFechaDesc("ABONO_CREDITO").stream()
                .filter(a -> clienteId.equals(a.getOrdenId()) || idsCliente.contains(a.getOrdenId()))
                .map(a -> {
                    try {
                        String det = a.getDetalle();
                        if (det != null && det.contains("monto:")) {
                            String mStr = det.substring(det.indexOf("monto:") + 6).trim().split(" ")[0];
                            return new BigDecimal(mStr);
                        }
                    } catch (Exception ignored) {}
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoDeudor = deudaActual.subtract(abonosRegistrados).max(BigDecimal.ZERO);
        BigDecimal saldoDisponible = limiteCredito.subtract(saldoDeudor).max(BigDecimal.ZERO);

        boolean aprobado = score >= 70 && montoOrden.compareTo(saldoDisponible) <= 0;

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("clienteId", clienteId);
        respuesta.put("score", score);
        respuesta.put("aprobado", aprobado);
        respuesta.put("limiteCredito", limiteCredito);
        respuesta.put("saldoDisponible", saldoDisponible);
        respuesta.put("saldoDeudor", saldoDeudor);
        respuesta.put("plazoDias", aprobado ? 30 : 0);
        respuesta.put("tasaInteres", 0.0);
        respuesta.put("mensaje", aprobado 
                ? "Crédito propio aprobado por 30 días sin intereses" 
                : "No califica para la campaña Compra ahora, paga en 30 días");

        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/abono")
    public ResponseEntity<Map<String, Object>> registrarAbono(@RequestBody Map<String, Object> request) {
        String clienteId = request.get("clienteId") != null ? request.get("clienteId").toString() : "1";
        BigDecimal montoAbono = BigDecimal.ZERO;
        if (request.get("monto") instanceof Number) {
            montoAbono = new BigDecimal(request.get("monto").toString());
        } else if (request.get("monto") instanceof String) {
            try {
                montoAbono = new BigDecimal((String) request.get("monto"));
            } catch (Exception ignored) {}
        }

        if (montoAbono.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "El monto de abono debe ser mayor a 0"));
        }

        EventoAuditoria abonoAuditoria = new EventoAuditoria(
                clienteId,
                "FINANZAS",
                "ABONO_CREDITO",
                "Abono a credito propio registrado monto:" + montoAbono.toPlainString()
        );
        auditoriaRepository.save(abonoAuditoria);

        Map<String, Object> resp = new HashMap<>();
        resp.put("clienteId", clienteId);
        resp.put("montoAbonado", montoAbono);
        resp.put("mensaje", "Abono a credito propio aplicado exitosamente");
        resp.put("fecha", java.time.LocalDateTime.now().toString());

        return ResponseEntity.ok(resp);
    }
}
