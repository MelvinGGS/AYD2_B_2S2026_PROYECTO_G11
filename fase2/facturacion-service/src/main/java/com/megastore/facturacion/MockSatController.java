package com.megastore.facturacion;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/sat", "/mock/sat"})
@CrossOrigin(origins = "*")
public class MockSatController {

    @PostMapping("/validar")
    public ResponseEntity<String> validarXml(@RequestBody(required = false) String xmlDte) {
        if (xmlDte == null || xmlDte.isBlank() || !xmlDte.contains("<DTE") || !xmlDte.contains("</DTE>")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: Estructura DTE XML no valida segun estandar FEL SAT.");
        }

        String autorizacionSat = "SAT-FEL-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        System.out.println("[SAT CERTIFICADOR FEL] DTE validado y certificado con exito. Autorizacion: " + autorizacionSat);

        return ResponseEntity.ok("DTE Autorizado exitosamente por la SAT Superintendencia de Administracion Tributaria. Autorizacion FEL: " + autorizacionSat);
    }
}