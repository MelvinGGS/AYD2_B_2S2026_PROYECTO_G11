package com.megastore.ordenes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/credito")
@CrossOrigin(origins = "*")
public class CreditoController {

    private final CreditoService creditoService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    public CreditoController(CreditoService creditoService) {
        this.creditoService = creditoService;
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

        Map<String, Object> respuesta = creditoService.evaluarCredito(clienteId, montoOrden);
        boolean aprobado = Boolean.TRUE.equals(respuesta.get("aprobado"));

        try {
            if (rabbitTemplate != null) {
                rabbitTemplate.convertAndSend("sgologic.exchange", aprobado ? "credito.aprobado" : "credito.rechazado", respuesta);
            }
        } catch (Exception e) {
            System.err.println("Aviso RabbitMQ Credito: No se pudo emitir evento reactivo: " + e.getMessage());
        }

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

        Map<String, Object> resp = creditoService.registrarAbono(clienteId, montoAbono);
        return ResponseEntity.ok(resp);
    }
}
