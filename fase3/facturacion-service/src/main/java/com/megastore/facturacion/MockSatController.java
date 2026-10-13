package com.megastore.facturacion;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/sat", "/mock/sat"})
@CrossOrigin(origins = "*")
public class MockSatController {

    private static volatile boolean deshabilitado = false;

    @GetMapping("/modo")
    public ResponseEntity<?> getModo() {
        return ResponseEntity.ok(java.util.Map.of(
                "deshabilitado", deshabilitado,
                "estadoServicio", deshabilitado ? "DESHABILITADO" : "HABILITADO"
        ));
    }

    @PostMapping("/modo")
    public ResponseEntity<?> setModo(@RequestBody(required = false) java.util.Map<String, Object> body) {
        if (body != null) {
            if (body.containsKey("deshabilitado")) {
                deshabilitado = Boolean.TRUE.equals(body.get("deshabilitado"));
            } else if (body.containsKey("falloSimulado")) {
                deshabilitado = Boolean.TRUE.equals(body.get("falloSimulado"));
            }
        }
        return ResponseEntity.ok(java.util.Map.of(
                "deshabilitado", deshabilitado,
                "estadoServicio", deshabilitado ? "DESHABILITADO" : "HABILITADO"
        ));
    }

    @PostMapping("/validar")
    public ResponseEntity<String> validarXml(@RequestBody(required = false) String xmlDte) {
        if (deshabilitado) {
            System.out.println("[SAT CERTIFICADOR FEL] Servicio deshabilitado temporalmente (HTTP 503).");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("Error 503: Certificador FEL SAT temporalmente fuera de servicio.");
        }

        if (xmlDte == null || xmlDte.isBlank() || !xmlDte.contains("<DTE") || !xmlDte.contains("</DTE>")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: Estructura DTE XML no valida segun estandar FEL SAT.");
        }

        String autorizacionSat = "SAT-FEL-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        System.out.println("[SAT CERTIFICADOR FEL] DTE validado y certificado con exito. Autorizacion: " + autorizacionSat);

        return ResponseEntity.ok("DTE Autorizado exitosamente por la SAT Superintendencia de Administracion Tributaria. Autorizacion FEL: " + autorizacionSat);
    }
}