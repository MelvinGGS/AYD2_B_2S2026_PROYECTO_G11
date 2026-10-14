package com.megastore.ordenes;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CreditoService {

    private final OrdenRepository ordenRepository;
    private final EventoAuditoriaRepository auditoriaRepository;

    public CreditoService(OrdenRepository ordenRepository,
                          EventoAuditoriaRepository auditoriaRepository) {
        this.ordenRepository = ordenRepository;
        this.auditoriaRepository = auditoriaRepository;
    }

    private boolean esMetodoBnpl(String metodoPago) {
        if (metodoPago == null) return false;
        String m = metodoPago.trim().toLowerCase();
        if (m.contains("payklik") || m.contains("tarjeta")) return false;
        return m.equals("credito_propio") ||
               m.equals("credito_propio_30d") ||
               m.contains("credito propio") ||
               m.contains("crédito propio") ||
               m.contains("bnpl") ||
               m.contains("30 dias") ||
               m.contains("30 días");
    }

    public Map<String, Object> evaluarCredito(String clienteId, BigDecimal montoOrden) {
        List<Orden> ordenesCliente = ordenRepository.findByClienteId(clienteId);
        long ordenesPrevias = ordenesCliente.size();

        Set<String> idsCliente = ordenesCliente.stream()
                .map(Orden::getId)
                .collect(Collectors.toSet());

        long incidencias = auditoriaRepository.findByTipoEventoStartingWithOrderByFechaDesc("INCIDENCIA").stream()
                .filter(a -> idsCliente.contains(a.getOrdenId()) || clienteId.equals(a.getOrdenId()))
                .count();

        BigDecimal montoHistorico = ordenesCliente.stream()
                .filter(o -> !"CANCELADA".equalsIgnoreCase(o.getEstado()))
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int score = 85;
        if (ordenesPrevias >= 2) {
            score += 5;
        }
        if (montoHistorico.compareTo(new BigDecimal("500.00")) >= 0) {
            score += 5;
        }
        if (incidencias > 0) {
            score -= (int) (incidencias * 15);
        }
        score = Math.max(0, Math.min(100, score));

        BigDecimal limiteCredito = new BigDecimal("5000.00");
        BigDecimal deudaActual = ordenesCliente.stream()
                .filter(o -> esMetodoBnpl(o.getMetodoPago()) && !"CANCELADA".equalsIgnoreCase(o.getEstado()))
                .map(o -> o.getTotal() != null ? o.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<EventoAuditoria> eventosAbono = auditoriaRepository.findByTipoEventoStartingWithOrderByFechaDesc("ABONO_CREDITO").stream()
                .filter(a -> clienteId.equals(a.getOrdenId()) || idsCliente.contains(a.getOrdenId()))
                .collect(Collectors.toList());

        Set<String> ordenesLiquidadas = new java.util.HashSet<>();
        BigDecimal abonosRegistrados = eventosAbono.stream()
                .map(a -> {
                    try {
                        String det = a.getDetalle();
                        if (det != null) {
                            if (det.contains("orden:")) {
                                String oStr = det.substring(det.indexOf("orden:") + 6).trim().split(" ")[0];
                                ordenesLiquidadas.add(oStr);
                            }
                            if (det.contains("monto:")) {
                                String mStr = det.substring(det.indexOf("monto:") + 6).trim().split(" ")[0];
                                return new BigDecimal(mStr);
                            }
                        }
                    } catch (Exception ignored) {}
                    return BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldoDeudor = deudaActual.subtract(abonosRegistrados).max(BigDecimal.ZERO);
        BigDecimal saldoDisponible = limiteCredito.subtract(saldoDeudor).max(BigDecimal.ZERO);

        boolean aprobado = score >= 70 && montoOrden.compareTo(saldoDisponible) <= 0;
        String fechaVencimiento = LocalDate.now().plusDays(30).toString();
        String puntualidad = incidencias == 0 ? "AL_DIA" : (incidencias == 1 ? "OBSERVACION" : "MORA_DETECTADA");

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("clienteId", clienteId);
        respuesta.put("score", score);
        respuesta.put("aprobado", aprobado);
        respuesta.put("limiteCredito", limiteCredito);
        respuesta.put("saldoDisponible", saldoDisponible);
        respuesta.put("saldoDeudor", saldoDeudor);
        respuesta.put("montoHistoricoComprado", montoHistorico);
        respuesta.put("ordenesPrevias", ordenesPrevias);
        respuesta.put("incidenciasRegistradas", incidencias);
        respuesta.put("puntualidadPago", puntualidad);
        respuesta.put("ordenesLiquidadas", ordenesLiquidadas);
        respuesta.put("plazoDias", aprobado ? 30 : 0);
        respuesta.put("fechaVencimiento", fechaVencimiento);
        respuesta.put("tasaInteres", 0.0);
        respuesta.put("mensaje", aprobado
                ? "Credito propio aprobado por 30 dias sin intereses"
                : (score < 70
                    ? "Score crediticio insuficiente (" + score + "/100) por historial de incidencias o mora en ERP"
                    : "El monto de la orden supera tu cupo disponible (Q" + saldoDisponible + ")"));

        return respuesta;
    }

    public Map<String, Object> registrarAbono(String clienteId, BigDecimal montoAbono) {
        return registrarAbono(clienteId, montoAbono, null);
    }

    public Map<String, Object> registrarAbono(String clienteId, BigDecimal montoAbono, String ordenId) {
        String sufijoOrden = (ordenId != null && !ordenId.isBlank()) ? " orden:" + ordenId.trim() : "";
        EventoAuditoria abonoAuditoria = new EventoAuditoria(
                clienteId,
                "FINANZAS",
                "ABONO_CREDITO",
                "Abono a credito propio registrado monto:" + montoAbono.toPlainString() + sufijoOrden
        );
        auditoriaRepository.save(abonoAuditoria);

        Map<String, Object> estadoActualizado = evaluarCredito(clienteId, BigDecimal.ZERO);

        Map<String, Object> resp = new HashMap<>();
        resp.put("clienteId", clienteId);
        resp.put("ordenId", ordenId);
        resp.put("montoAbonado", montoAbono);
        resp.put("saldoDeudor", estadoActualizado.get("saldoDeudor"));
        resp.put("saldoDisponible", estadoActualizado.get("saldoDisponible"));
        resp.put("ordenesLiquidadas", estadoActualizado.get("ordenesLiquidadas"));
        resp.put("mensaje", "Abono a credito propio aplicado exitosamente");
        resp.put("fecha", LocalDateTime.now().toString());
        return resp;
    }
}