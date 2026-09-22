package com.megastore.facturacion;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Random;

@RestController
@RequestMapping("/mock/sat")
public class MockSatController {

    @PostMapping("/validar")
    public ResponseEntity<String> validarXml(@RequestBody String xmlDte) throws InterruptedException {
        int probabilidad = new Random().nextInt(100);
        
        // 20% de probabilidad de Timeout (tarda 5 segundos y falla)
        if (probabilidad < 20) {
            Thread.sleep(5000); 
            return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT).body("Error: SAT no responde (Timeout)");
        }
        // 10% de probabilidad de Rechazo / Error Interno
        else if (probabilidad < 30) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: XML inválido o SAT caída");
        }
        
        // 70% de probabilidad de Éxito
        return ResponseEntity.ok("DTE Autorizado exitosamente por la SAT");
    }
}