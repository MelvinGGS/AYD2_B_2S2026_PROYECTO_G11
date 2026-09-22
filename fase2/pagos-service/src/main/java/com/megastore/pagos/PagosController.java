package com.megastore.pagos;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
public class PagosController {

    private final IntentoPagoRepository intentoPagoRepository;

    public PagosController(IntentoPagoRepository intentoPagoRepository) {
        this.intentoPagoRepository = intentoPagoRepository;
    }

    @GetMapping("/orden/{ordenId}")
    public ResponseEntity<List<IntentoPago>> consultarHistorialCobranza(@PathVariable String ordenId) {
        List<IntentoPago> historial = intentoPagoRepository.findByOrdenId(ordenId);
        if (historial.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(historial);
    }
}
