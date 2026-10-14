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
    public ResponseEntity<?> crearOrden(@RequestBody CrearOrdenRequest request) {
        try {
            Orden nueva = ordenesService.crearOrden(request);
            return ResponseEntity.ok(nueva);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
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
    public ResponseEntity<?> actualizarEstado(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        try {
            String nuevoEstado = body.get("estado");
            if (nuevoEstado != null) {
                if ("CANCELADA".equalsIgnoreCase(nuevoEstado)) {
                    return ordenesService.cancelarOrden(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
                }
                ordenesService.actualizarEstadoOrden(id, nuevoEstado);
            }
            return ordenesService.obtenerOrdenPorId(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarOrden(@PathVariable String id) {
        try {
            Optional<Orden> cancelada = ordenesService.cancelarOrden(id);
            return cancelada.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/incidencias")
    public ResponseEntity<?> registrarIncidencia(@PathVariable String id, @RequestBody java.util.Map<String, String> body) {
        String tipo = body.getOrDefault("tipo", "CONSULTA");
        String detalle = body.getOrDefault("detalle", "Incidencia de atención al cliente");
        ordenesService.registrarIncidencia(id, tipo, detalle);
        return ResponseEntity.ok(java.util.Map.of("status", "REGISTRADA", "ordenId", id, "tipo", tipo));
    }

    @GetMapping("/incidencias")
    public ResponseEntity<List<EventoAuditoria>> listarIncidencias() {
        return ResponseEntity.ok(ordenesService.listarIncidencias());
    }

    @PostMapping("/incidencias/{id}/responder")
    public ResponseEntity<?> responderIncidencia(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String respuesta = body.getOrDefault("respuesta", "");
        return ordenesService.responderIncidencia(id, respuesta)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
