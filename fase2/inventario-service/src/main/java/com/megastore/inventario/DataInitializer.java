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
        // Solo cargamos si la base de datos está vacía
        if (productoRepository.count() == 0) {
            System.out.println("[INVENTARIO] Cargando datos semilla (Catálogo, CDs, Tiendas y Stock)...");

            Producto p1 = productoRepository.save(new Producto("PROD-001", "Lavadora Mabe 20kg", "Linea Blanca", 4500.00));
            Producto p2 = productoRepository.save(new Producto("PROD-002", "Refrigeradora LG 14 pies", "Linea Blanca", 7500.00));
            Producto p3 = productoRepository.save(new Producto("PROD-003", "TV Samsung 55 UHD", "Electronica", 3500.00));
            Producto p4 = productoRepository.save(new Producto("PROD-004", "Zapatillas Nike Air", "Ropa y Calzado", 800.00));

            // Crear 2 Centros de Distribución
            Ubicacion cdNorte = ubicacionRepository.save(new Ubicacion("CD_NORTE", "Centro Distribución Norte", "CD"));
            Ubicacion cdSur = ubicacionRepository.save(new Ubicacion("CD_SUR", "Centro Distribución Sur", "CD"));

            // Crear las 32 Tiendas Físicas
            for (int i = 1; i <= 32; i++) {
                String idTienda = String.format("TND_%02d", i);
                ubicacionRepository.save(new Ubicacion(idTienda, "Tienda " + i, "TIENDA"));
            }

            // Distribuir Stock Inicial
            stockRepository.save(new Stock(p1, cdNorte, 50));
            stockRepository.save(new Stock(p1, cdSur, 30));
            stockRepository.save(new Stock(p2, cdNorte, 20));
            stockRepository.save(new Stock(p3, cdSur, 100));
            
            // Stock en algunas tiendas
            stockRepository.save(new Stock(p4, ubicacionRepository.findById("TND_01").get(), 15));
            stockRepository.save(new Stock(p4, ubicacionRepository.findById("TND_05").get(), 10));

            System.out.println("[INVENTARIO] Datos semilla cargados con éxito.");
        }
    }
}
