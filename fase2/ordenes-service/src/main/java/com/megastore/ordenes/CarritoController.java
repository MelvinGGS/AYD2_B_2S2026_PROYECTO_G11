package com.megastore.ordenes;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carrito")
@CrossOrigin(origins = "*")
public class CarritoController {

    private final CarritoService carritoService;

    public CarritoController(CarritoService carritoService) {
        this.carritoService = carritoService;
    }

    @GetMapping("/{clienteId}")
    public ResponseEntity<List<CarritoItemDto>> getCarrito(@PathVariable String clienteId) {
        return ResponseEntity.ok(carritoService.getCarrito(clienteId));
    }

    @PostMapping("/{clienteId}")
    public ResponseEntity<?> agregarItem(@PathVariable String clienteId, @RequestBody CarritoItemDto item) {
        carritoService.agregarOActualizarItem(clienteId, item);
        return ResponseEntity.ok(carritoService.getCarrito(clienteId));
    }

    @DeleteMapping("/{clienteId}")
    public ResponseEntity<?> vaciarCarrito(@PathVariable String clienteId) {
        carritoService.vaciarCarrito(clienteId);
        return ResponseEntity.ok().build();
    }
}
