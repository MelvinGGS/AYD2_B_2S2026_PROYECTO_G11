package com.megastore.ordenes;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CreditoService {

    private final OrdenRepository ordenRepository;

    public CreditoService(OrdenRepository ordenRepository) {
        this.ordenRepository = ordenRepository;
    }

    public Map<String, Object> evaluarCredito(String clienteId, BigDecimal montoOrden) {
        // 1. Extraer historial de compras del ERP / BD local
        List<Orden> historial = ordenRepository.findByClienteId(clienteId);
        
        int score = 50; // Puntaje base
        int devoluciones = 0;

        // 2. Reglas de Ponderación (Rápido < 500ms)
        for (Orden o : historial) {
            if ("ENTREGADA".equals(o.getEstado()) || "PAGADA".equals(o.getEstado())) {
                score += 15; // Premia pagos exitosos
            } else if ("DEVUELTA".equals(o.getEstado()) || "CANCELADA".equals(o.getEstado())) {
                score -= 20; // Penaliza fuertemente devoluciones
                devoluciones++;
            }
        }

        // Penalizar clientes nuevos intentando compras muy altas
        if (historial.isEmpty() && montoOrden.compareTo(new BigDecimal("2000")) > 0) {
            score -= 20;
        }

        // 3. Decisión
        boolean aprobado = score >= 60 && devoluciones < 3;
        BigDecimal limiteCredito = aprobado ? new BigDecimal("5000.00") : BigDecimal.ZERO;
        BigDecimal saldoDisponible = aprobado ? limiteCredito.subtract(montoOrden) : BigDecimal.ZERO;

        if (saldoDisponible.compareTo(BigDecimal.ZERO) < 0) {
            aprobado = false; // El monto supera el límite
            saldoDisponible = BigDecimal.ZERO;
        }

        // 4. Formatear respuesta según contrato
        Map<String, Object> response = new HashMap<>();
        response.put("clienteId", clienteId);
        response.put("aprobado", aprobado);
        response.put("limiteCredito", limiteCredito);
        response.put("saldoDisponible", saldoDisponible);
        response.put("score", score);
        response.put("mensaje", aprobado ? "Aprobado para compra a 30 días" : "Crédito denegado por políticas de riesgo");

        return response;
    }
}