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
    private final ReservaRepository reservaRepository;

    public InventarioController(ProductoRepository productoRepository, StockRepository stockRepository, ReservaRepository reservaRepository) {
        this.productoRepository = productoRepository;
        this.stockRepository = stockRepository;
        this.reservaRepository = reservaRepository;
    }

    // Tarea 3: Endpoint GET /api/inventario/productos con filtros en el backend
    @GetMapping("/productos")
    public ResponseEntity<List<Map<String, Object>>> getProductos(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) Boolean ofertas,
            @RequestParam(required = false) Double maxPrecio,
            @RequestParam(required = false) Boolean enStock
    ) {
        List<Producto> productos = productoRepository.findAll();

        List<Map<String, Object>> response = productos.stream()
            .filter(p -> {
                // Filtro de busqueda (q)
                if (q != null && !q.isBlank()) {
                    String query = q.trim().toLowerCase();
                    boolean matchNombre = p.getNombre() != null && p.getNombre().toLowerCase().contains(query);
                    boolean matchDesc = p.getDescripcion() != null && p.getDescripcion().toLowerCase().contains(query);
                    boolean matchSku = p.getId() != null && p.getId().toLowerCase().contains(query);
                    if (!matchNombre && !matchDesc && !matchSku) return false;
                }
                // Filtro de categoria
                if (categoria != null && !categoria.isBlank() && !"Todas".equalsIgnoreCase(categoria)) {
                    if (p.getCategoria() == null || !p.getCategoria().equalsIgnoreCase(categoria.trim())) {
                        return false;
                    }
                }
                // Filtro de ofertas (Black Friday)
                if (ofertas != null && ofertas) {
                    if (p.getPrecioAnterior() == null || p.getPrecio() == null || p.getPrecioAnterior() <= p.getPrecio()) {
                        return false;
                    }
                }
                // Filtro de precio maximo
                if (maxPrecio != null && maxPrecio > 0) {
                    if (p.getPrecio() == null || p.getPrecio() > maxPrecio) {
                        return false;
                    }
                }
                return true;
            })
            .map(p -> {
                List<Stock> stocks = stockRepository.findByProductoId(p.getId());
                if (stocks == null || stocks.isEmpty()) {
                    stocks = stockRepository.findByProductoId(p.getId().toLowerCase());
                }
                if (stocks == null || stocks.isEmpty()) {
                    stocks = stockRepository.findByProductoId(p.getId().toUpperCase());
                }
                int stockTotal = (stocks != null) ? stocks.stream().mapToInt(Stock::getCantidad).sum() : 0;

                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", p.getId());
                map.put("nombre", p.getNombre());
                map.put("categoria", p.getCategoria());
                map.put("precio", p.getPrecio());
                map.put("precioAnterior", p.getPrecioAnterior());
                map.put("descripcion", p.getDescripcion());
                map.put("imagen", p.getImagen());
                map.put("tag", p.getTag());
                map.put("stock", stockTotal);
                map.put("tagType", p.getTag() != null && p.getTag().contains("Black Friday") ? "orange" : "info");
                map.put("rating", 4.8);
                return map;
            })
            .filter(m -> {
                if (enStock != null && enStock) {
                    int stock = (int) m.get("stock");
                    return stock > 0;
                }
                return true;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Tarea 4: Endpoint GET /api/inventario/disponibilidad/{productoId}
    @GetMapping("/disponibilidad/{productoId}")
    public ResponseEntity<List<Map<String, Object>>> getDisponibilidad(@PathVariable String productoId) {
        List<Stock> stockList = stockRepository.findByProductoId(productoId);
        
        if (stockList.isEmpty()) {
            return ResponseEntity.status(404).body(List.of(
                Map.of("error", "Producto no encontrado", "productoId", productoId)
            ));
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

    // Endpoint GET /api/inventario/unificado para el Dashboard del Frontend
    @GetMapping("/unificado")
    public ResponseEntity<List<Map<String, Object>>> getInventarioUnificado() {
        List<Producto> productos = productoRepository.findAll();
        List<Map<String, Object>> unificado = productos.stream().map(p -> {
            List<Stock> stocks = stockRepository.findByProductoId(p.getId());
            
            int cdNorte = stocks.stream()
                    .filter(s -> s.getUbicacion() != null && "CD_NORTE".equalsIgnoreCase(s.getUbicacion().getId()))
                    .mapToInt(Stock::getCantidad)
                    .sum();
            int cdSur = stocks.stream()
                    .filter(s -> s.getUbicacion() != null && "CD_SUR".equalsIgnoreCase(s.getUbicacion().getId()))
                    .mapToInt(Stock::getCantidad)
                    .sum();
            int tiendas = stocks.stream()
                    .filter(s -> s.getUbicacion() != null && "TIENDA".equalsIgnoreCase(s.getUbicacion().getTipo()))
                    .mapToInt(Stock::getCantidad)
                    .sum();
            int total = stocks.stream().mapToInt(Stock::getCantidad).sum();

            String estado = total >= 40 ? "Óptimo" : (total >= 15 ? "Bajo" : "Crítico");

            Map<String, Object> item = new java.util.HashMap<>();
            item.put("sku", p.getId());
            item.put("producto", p.getNombre());
            item.put("categoria", p.getCategoria());
            item.put("precio", p.getPrecio());
            item.put("cdNorte", cdNorte);
            item.put("cdSur", cdSur);
            item.put("tiendas", tiendas);
            item.put("total", total);
            item.put("estado", estado);
            return item;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(unificado);
    }

    @GetMapping("/reservas")
    public ResponseEntity<List<Reserva>> getReservas() {
        return ResponseEntity.ok(reservaRepository.findAll());
    }

    @PostMapping("/stock/ajuste")
    public ResponseEntity<?> ajustarStock(@RequestBody Map<String, Object> body) {
        String productoId = body.get("productoId") != null ? body.get("productoId").toString() : null;
        String ubicacionId = body.get("ubicacionId") != null ? body.get("ubicacionId").toString() : "CD_NORTE";
        Integer cantidad = body.get("cantidad") != null ? Integer.parseInt(body.get("cantidad").toString()) : 0;

        if (productoId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "productoId es obligatorio"));
        }

        List<Stock> stocks = stockRepository.findByProductoId(productoId);
        Stock stockItem = stocks.stream()
                .filter(s -> s.getUbicacion() != null && s.getUbicacion().getId().equalsIgnoreCase(ubicacionId))
                .findFirst()
                .orElse(null);

        if (stockItem != null) {
            stockItem.setCantidad(Math.max(0, stockItem.getCantidad() + cantidad));
            stockRepository.save(stockItem);
            return ResponseEntity.ok(Map.of(
                    "status", "ACTUALIZADO",
                    "productoId", productoId,
                    "ubicacionId", ubicacionId,
                    "nuevaCantidad", stockItem.getCantidad()
            ));
        }

        return ResponseEntity.notFound().build();
    }

    private static volatile boolean inventarioDeshabilitado = false;

    @GetMapping("/modo")
    public ResponseEntity<?> getModo() {
        return ResponseEntity.ok(Map.of(
                "deshabilitado", inventarioDeshabilitado,
                "estadoServicio", inventarioDeshabilitado ? "DESHABILITADO" : "HABILITADO"
        ));
    }

    @PostMapping("/modo")
    public ResponseEntity<?> setModo(@RequestBody(required = false) Map<String, Object> body) {
        if (body != null) {
            if (body.containsKey("deshabilitado")) {
                inventarioDeshabilitado = Boolean.TRUE.equals(body.get("deshabilitado"));
            } else if (body.containsKey("falloSimulado")) {
                inventarioDeshabilitado = Boolean.TRUE.equals(body.get("falloSimulado"));
            }
        }
        return ResponseEntity.ok(Map.of(
                "deshabilitado", inventarioDeshabilitado,
                "estadoServicio", inventarioDeshabilitado ? "DESHABILITADO" : "HABILITADO"
        ));
    }
}
