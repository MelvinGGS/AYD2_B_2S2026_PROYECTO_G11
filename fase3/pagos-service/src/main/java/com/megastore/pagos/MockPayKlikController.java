package com.megastore.pagos;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/payklik", "/mock/payklik"})
@CrossOrigin(origins = "*")
public class MockPayKlikController {

    @PostMapping("/cobrar")
    public ResponseEntity<Map<String, Object>> procesarCobro(@RequestBody(required = false) Map<String, Object> solicitud) {
        if (solicitud == null || solicitud.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "RECHAZADO",
                    "error", "Solicitud de cobro vacia o invalida."
            ));
        }

        Object montoObj = solicitud.get("monto") != null ? solicitud.get("monto") : solicitud.get("total");
        if (montoObj == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "RECHAZADO",
                    "error", "El monto de la transaccion es obligatorio."
            ));
        }

        BigDecimal monto;
        try {
            monto = new BigDecimal(montoObj.toString());
            if (monto.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", "RECHAZADO",
                        "error", "El monto debe ser mayor a cero."
                ));
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "RECHAZADO",
                    "error", "Formato de monto invalido."
            ));
        }

        String referencia = "PK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        System.out.println("[PAYKLIK GATEWAY] Transaccion procesada exitosamente. Monto: Q" + monto + " | Referencia: " + referencia);

        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("status", "APROBADO");
        respuesta.put("referencia", referencia);
        respuesta.put("fecha", LocalDateTime.now().toString());
        respuesta.put("mensaje", "Transaccion autorizada exitosamente por PayKlik Gateway.");

        return ResponseEntity.ok(respuesta);
    }
}
