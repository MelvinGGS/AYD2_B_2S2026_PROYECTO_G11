package com.megastore.inventario;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventario")
@CrossOrigin(origins = "*") // Permite la comunicación con el Frontend
public class InventarioController {

    private final ProductoRepository productoRepository;
    private final StockRepository stockRepository;

    public InventarioController(ProductoRepository productoRepository, StockRepository stockRepository) {
        this.productoRepository = productoRepository;
        this.stockRepository = stockRepository;
    }

    // Tarea 3: Endpoint GET /api/inventario/productos
    @GetMapping("/productos")
    public ResponseEntity<List<Producto>> getProductos(@RequestParam(required = false) String categoria) {
        if (categoria != null && !categoria.isBlank()) {
            return ResponseEntity.ok(productoRepository.findByCategoriaIgnoreCase(categoria));
        }
        return ResponseEntity.ok(productoRepository.findAll());
    }

    // Tarea 4: Endpoint GET /api/inventario/disponibilidad/{productoId}
    @GetMapping("/disponibilidad/{productoId}")
    public ResponseEntity<List<Map<String, Object>>> getDisponibilidad(@PathVariable String productoId) {
        List<Stock> stockList = stockRepository.findByProductoId(productoId);
        
        if (stockList.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Mapeamos a un formato estructurado desglosado por tienda/CD
        List<Map<String, Object>> response = stockList.stream().map(stock -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("ubicacionId", stock.getUbicacion().getId());
            map.put("nombreUbicacion", stock.getUbicacion().getNombre());
            map.put("tipoUbicacion", stock.getUbicacion().getTipo());
            map.put("cantidadDisponible", stock.getCantidad());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
}
