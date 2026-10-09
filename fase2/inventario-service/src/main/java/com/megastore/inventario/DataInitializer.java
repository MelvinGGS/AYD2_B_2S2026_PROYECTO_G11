package com.megastore.inventario;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductoRepository productoRepository;
    private final UbicacionRepository ubicacionRepository;
    private final StockRepository stockRepository;

    public DataInitializer(ProductoRepository productoRepository, UbicacionRepository ubicacionRepository, StockRepository stockRepository) {
        this.productoRepository = productoRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.stockRepository = stockRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Solo cargamos si no hay registros en la tabla stock_inventario
        if (stockRepository.count() == 0) {
            System.out.println("[INVENTARIO] Cargando datos semilla (Catálogo, CDs, Tiendas y Stock)...");

            Producto p1 = productoRepository.findById("PROD-001").orElseGet(() -> 
                productoRepository.save(new Producto("PROD-001", "Lavadora Mabe 20kg", "Línea Blanca", 4500.00)));
            Producto p2 = productoRepository.findById("PROD-002").orElseGet(() -> 
                productoRepository.save(new Producto("PROD-002", "Refrigeradora LG 14 pies", "Línea Blanca", 7500.00)));
            Producto p3 = productoRepository.findById("PROD-003").orElseGet(() -> 
                productoRepository.save(new Producto("PROD-003", "TV Samsung 55 UHD", "Electrónica", 3500.00)));
            Producto p4 = productoRepository.findById("PROD-004").orElseGet(() -> 
                productoRepository.save(new Producto("PROD-004", "Zapatillas Nike Air", "Calzado", 800.00)));

            // Crear o recuperar los 2 Centros de Distribución
            Ubicacion cdNorte = ubicacionRepository.findById("CD_NORTE").orElseGet(() -> 
                ubicacionRepository.save(new Ubicacion("CD_NORTE", "Centro Distribución Norte", "CD")));
            Ubicacion cdSur = ubicacionRepository.findById("CD_SUR").orElseGet(() -> 
                ubicacionRepository.save(new Ubicacion("CD_SUR", "Centro Distribución Sur", "CD")));

            // Crear las 32 Tiendas Físicas
            for (int i = 1; i <= 32; i++) {
                String idTienda = String.format("TND_%02d", i);
                if (ubicacionRepository.findById(idTienda).isEmpty()) {
                    ubicacionRepository.save(new Ubicacion(idTienda, "Tienda " + i, "TIENDA"));
                }
            }

            // Distribuir Stock Inicial en CDs
            stockRepository.save(new Stock(p1, cdNorte, 50));
            stockRepository.save(new Stock(p1, cdSur, 30));
            stockRepository.save(new Stock(p2, cdNorte, 20));
            stockRepository.save(new Stock(p3, cdSur, 100));

            // Cargar y asegurar productos del catálogo web (incluyendo ofertas Black Friday)
            cargarCatalogoWeb(cdNorte, cdSur);
            
            // Stock en tiendas físicas
            ubicacionRepository.findById("TND_01").ifPresent(tnd1 -> stockRepository.save(new Stock(p4, tnd1, 15)));
            ubicacionRepository.findById("TND_05").ifPresent(tnd5 -> stockRepository.save(new Stock(p4, tnd5, 10)));

            System.out.println("[INVENTARIO] Datos semilla cargados con éxito en stock_inventario.");
        } else {
            // Asegurar que el catálogo web con Black Friday esté actualizado
            ubicacionRepository.findById("CD_NORTE").ifPresent(cdNorte -> {
                ubicacionRepository.findById("CD_SUR").ifPresent(cdSur -> {
                    cargarCatalogoWeb(cdNorte, cdSur);
                });
            });
        }
    }

    private void cargarCatalogoWeb(Ubicacion cdNorte, Ubicacion cdSur) {
        upsertProductoConStock("prod-001", "Cafetera Espresso Profesional Serie X", "Línea Blanca", 199.99, 299.99, 
            "Bomba italiana de 20 bares, vaporizador para leche y acabados en acero inoxidable.", 
            "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80", 
            "Black Friday -33%", cdNorte, 40, cdSur, 30);

        upsertProductoConStock("prod-002", "Refrigerador Inteligente Multi-Door 24 cu.ft", "Línea Blanca", 1299.00, null, 
            "Tecnología Inverter, conectividad WiFi y dispensador de agua filtrada.", 
            "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&auto=format&fit=crop&q=80", 
            "Popular", cdNorte, 15, cdSur, 10);

        upsertProductoConStock("prod-003", "Robot Aspirador con Mapeo Láser LiDAR", "Electrónica", 349.50, null, 
            "Navegación inteligente con sensor LiDAR, función mopa y control por app.", 
            "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80", 
            "Nuevo", cdNorte, 25, cdSur, 20);

        upsertProductoConStock("prod-004", "Smartwatch Deportivo V3 Pro AMOLED", "Electrónica", 139.99, 229.00, 
            "Pantalla AMOLED 1.43\", GPS integrado, monitoreo SpO2 y resistencia 5ATM.", 
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80", 
            "Black Friday -39%", cdNorte, 50, cdSur, 45);

        upsertProductoConStock("prod-005", "Auriculares Inalámbricos Noise Cancelling Pro", "Electrónica", 99.99, 169.00, 
            "Cancelación activa de ruido híbrida, 40h de batería y Bluetooth 5.3.", 
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80", 
            "Black Friday -40%", cdNorte, 60, cdSur, 40);

        upsertProductoConStock("prod-006", "Smart TV OLED 4K 65\" Cinema Edition", "Electrónica", 999.00, 1599.00, 
            "Panel OLED con Dolby Vision IQ, 120Hz para gaming y sonido Dolby Atmos.", 
            "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80", 
            "Black Friday -38%", cdNorte, 20, cdSur, 15);

        upsertProductoConStock("prod-007", "Chaqueta Impermeable Termosellada Urban", "Ropa", 89.90, null, 
            "Membrana transpirable 10K, costuras selladas y capucha ajustable.", 
            "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80", 
            "Temporada", cdNorte, 35, cdSur, 25);

        upsertProductoConStock("prod-008", "Zapatillas Running Ultralight Boost", "Calzado", 79.99, 145.00, 
            "Suela con amortiguación reactiva, tejido transpirable y sujeción ergonómica.", 
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80", 
            "Black Friday -45%", cdNorte, 40, cdSur, 35);
    }

    private void upsertProductoConStock(String id, String nombre, String categoria, Double precio, 
                                        Double precioAnterior, String descripcion, String imagen, String tag,
                                        Ubicacion cdNorte, int stockNorte, Ubicacion cdSur, int stockSur) {
        Producto prod = productoRepository.findById(id).orElse(new Producto(id, nombre, categoria, precio));
        prod.setNombre(nombre);
        prod.setCategoria(categoria);
        prod.setPrecio(precio);
        prod.setPrecioAnterior(precioAnterior);
        prod.setDescripcion(descripcion);
        prod.setImagen(imagen);
        prod.setTag(tag);
        productoRepository.save(prod);

        if (stockRepository.findByProductoId(id).isEmpty()) {
            stockRepository.save(new Stock(prod, cdNorte, stockNorte));
            stockRepository.save(new Stock(prod, cdSur, stockSur));
        }
    }
}
