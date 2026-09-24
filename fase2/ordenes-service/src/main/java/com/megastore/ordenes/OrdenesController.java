package com.megastore.ordenes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ordenes")
@CrossOrigin(origins = "*")
public class OrdenesController {

    private final OrdenesService ordenesService;

    public OrdenesController(OrdenesService ordenesService) {
        this.ordenesService = ordenesService;
    }

    @PostMapping
    public ResponseEntity<Orden> crearOrden(@RequestBody CrearOrdenRequest request) {
        Orden nueva = ordenesService.crearOrden(request);
        return ResponseEntity.ok(nueva);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Orden> obtenerPorId(@PathVariable String id) {
        Optional<Orden> orden = ordenesService.obtenerOrdenPorId(id);
        return orden.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Orden>> listarTodas() {
        return ResponseEntity.ok(ordenesService.listarTodas());
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<Orden> actualizarEstado(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        String nuevoEstado = body.get("estado");
        if (nuevoEstado != null) {
            ordenesService.actualizarEstadoOrden(id, nuevoEstado);
        }
        return ordenesService.obtenerOrdenPorId(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
