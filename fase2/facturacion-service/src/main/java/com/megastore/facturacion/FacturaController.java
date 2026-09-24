package com.megastore.facturacion;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.util.Optional;

@RestController
@RequestMapping("/api/facturas")
@CrossOrigin(origins = "*")
public class FacturaController {

    private final FacturaRepository facturaRepository;

    public FacturaController(FacturaRepository facturaRepository) {
        this.facturaRepository = facturaRepository;
    }

    @GetMapping("/orden/{ordenId}")
    public ResponseEntity<String> descargarFacturaPorOrden(@PathVariable String ordenId) {
        Optional<Factura> facturaOpt = facturaRepository.findByOrdenId(ordenId);
        
        if (facturaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Factura no encontrada para la orden: " + ordenId);
        }

        Factura factura = facturaOpt.get();
        File archivoXml = new File(factura.getRutaArchivoXml());

        if (!archivoXml.exists()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("El archivo físico XML no existe.");
        }

        try {
            String contenidoXml = new String(Files.readAllBytes(archivoXml.toPath()));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_XML);
            headers.setContentDispositionFormData("attachment", factura.getAutorizacion() + ".xml");
            
            return new ResponseEntity<>(contenidoXml, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al leer el XML.");
        }
    }

    @GetMapping("/as400/ultimo-csv")
    public ResponseEntity<String> descargarUltimoCsvAS400() {
        File dir = new File("uploads");
        if (!dir.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Directorio de exportaciones AS/400 vacio.");
        }
        File[] archivos = dir.listFiles((d, name) -> name.startsWith("resumen_erp_") && name.endsWith(".csv"));
        if (archivos == null || archivos.length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No hay lotes CSV generados aun.");
        }
        java.util.Arrays.sort(archivos, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
        File ultimo = archivos[0];
        try {
            String contenido = new String(Files.readAllBytes(ultimo.toPath()));
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDispositionFormData("attachment", ultimo.getName());
            return new ResponseEntity<>(contenido, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al leer el archivo CSV.");
        }
    }
}