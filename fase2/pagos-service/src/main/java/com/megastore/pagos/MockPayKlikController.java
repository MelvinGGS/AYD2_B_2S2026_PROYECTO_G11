package com.megastore.pagos;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@RestController
@RequestMapping("/mock/payklik")
public class MockPayKlikController {

    private final Random random = new Random();

    @PostMapping("/cobrar")
    public ResponseEntity<Map<String, Object>> procesarCobro(@RequestBody Map<String, Object> solicitud) throws InterruptedException {
        int probabilidad = random.nextInt(100);
        
        // Simular latencia alta (30% probabilidad)
        if (probabilidad < 30) {
            System.out.println("[MOCK PAYKLIK] Simulando latencia alta...");
            Thread.sleep(6000); // 6 segundos, forzará el TimeLimiter/CircuitBreaker
        }
        
        // Simular error de servidor (20% probabilidad)
        if (probabilidad >= 30 && probabilidad < 50) {
            System.out.println("[MOCK PAYKLIK] Simulando error interno del proveedor...");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error interno en la pasarela de pagos."));
        }

        // Éxito (50% probabilidad)
        System.out.println("[MOCK PAYKLIK] Cobro exitoso.");
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("status", "APROBADO");
        respuesta.put("referencia", "PK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        
        return ResponseEntity.ok(respuesta);
    }
}
