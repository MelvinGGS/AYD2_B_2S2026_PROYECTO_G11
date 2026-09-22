package com.megastore.facturacion;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.FileWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

@Service
public class FacturacionService {

    private final FacturaRepository facturaRepository;
    private final RestTemplate restTemplate;

    @Value("${app.facturacion.uploads-dir:uploads}")
    private String uploadsDir;

    @Value("${server.port:8084}")
    private String serverPort;

    public FacturacionService(FacturaRepository facturaRepository) {
        this.facturaRepository = facturaRepository;
        this.restTemplate = new RestTemplate();
    }

    public String generarYTransmitirDteSat(String ordenId, BigDecimal total) {
        String serie = "A" + (new Random().nextInt(90) + 10);
        int numero = new Random().nextInt(900000) + 100000;
        String autorizacion = "FEL-" + LocalDateTime.now().getYear() + "-" + (new Random().nextInt(90000) + 10000);

        String xmlDte = String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<DTE xmlns=\"http://www.sat.gob.gt/fel/dte\" Version=\"0.1\">\n" +
            "    <DatosEmision>\n" +
            "        <Emisor NITEmisor=\"103849204\" NombreEmisor=\"MegaStore Retail S.A.\"/>\n" +
            "        <Receptor IDReceptor=\"CF\" CUIReceptor=\"29938132922\"/>\n" +
            "        <DatosGenerales Tipo=\"FACT\" FechaHoraEmision=\"%s\" CodigoMoneda=\"GTQ\"/>\n" +
            "        <Certificacion Serie=\"%s\" NumeroDocumento=\"%d\" NumeroAutorizacion=\"%s\"/>\n" +
            "        <Totales GranTotal=\"%.2f\" TotalImpuestos=\"%.2f\"/>\n" +
            "    </DatosEmision>\n" +
            "</DTE>",
            LocalDateTime.now().toString(), serie, numero, autorizacion,
            total.doubleValue(), total.multiply(new BigDecimal("0.12")).doubleValue()
        );

        boolean satAutorizada = false;
        long esperaMs = 1000;
        String mockUrl = "http://localhost:" + serverPort + "/mock/sat/validar";

        // TAREA: Reintentos con Backoff Exponencial
        for (int intento = 1; intento <= 3; intento++) {
            try {
                System.out.println("[TRANSMISIÓN SAT] Intento " + intento + "/3 para orden " + ordenId + "...");
                
                // Llamada real al mock
                ResponseEntity<String> response = restTemplate.postForEntity(mockUrl, xmlDte, String.class);
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    satAutorizada = true;
                    break;
                }
            } catch (Exception e) {
                System.err.println("Intento " + intento + " fallido ante SAT. Razón: " + e.getMessage());
                try {
                    Thread.sleep(esperaMs);
                } catch (InterruptedException ignored) {}
                esperaMs *= 2; // 1s -> 2s -> 4s
            }
        }

        // TAREA: Desvío a DLQ si se agotan intentos (Lanza excepción para que RabbitMQ lo mueva)
        if (!satAutorizada) {
            System.err.println("[ERROR CRÍTICO] La SAT no respondió tras 3 intentos. Desviando orden " + ordenId + " a DLQ.");
            throw new RuntimeException("Fallo de comunicación con la SAT. Enviando a DLQ.");
        }

        // Si es exitoso, guardar en disco y BD
        String rutaArchivo = guardarXmlEnDisco(autorizacion, xmlDte);
        
        Factura factura = new Factura();
        factura.setOrdenId(ordenId);
        factura.setAutorizacion(autorizacion);
        factura.setSerie(serie);
        factura.setNumero(numero);
        factura.setTotal(total);
        factura.setRutaArchivoXml(rutaArchivo);
        factura.setFechaEmision(LocalDateTime.now());
        facturaRepository.save(factura);

        System.out.println("[SAT APROBADA] Factura " + autorizacion + " guardada en BD y disco.");
        return autorizacion;
    }

    private String guardarXmlEnDisco(String autorizacion, String xmlContent) {
        try {
            File dir = new File(uploadsDir);
            if (!dir.exists()) dir.mkdirs();
            File archivo = new File(dir, autorizacion + ".xml");
            try (FileWriter writer = new FileWriter(archivo)) {
                writer.write(xmlContent);
            }
            return archivo.getAbsolutePath();
        } catch (Exception e) {
            throw new RuntimeException("Error guardando XML", e);
        }
    }

    // TAREA: Tarea programada AS/400
    @Scheduled(cron = "${app.erp.export-cron:0 */30 * * * *}")
    public void exportarResumenErpAS400() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmm"));
        String nombreArchivo = "resumen_erp_" + timestamp + ".csv";
        try {
            File dir = new File(uploadsDir);
            if (!dir.exists()) dir.mkdirs();
            File csvFile = new File(dir, nombreArchivo);

            try (FileWriter writer = new FileWriter(csvFile)) {
                writer.write("FECHA,ORDEN_ID,CANAL,TOTAL,NIT_EMISOR,AUTORIZACION_SAT\n");
                // Iterar la base de datos real (opcional) o mantener el mock
                writer.write(String.format("%s,ORD-SYNC,OMNICANAL,0.00,103849204,AS400-BATCH\n", LocalDateTime.now()));
            }
            System.out.println("[ERP AS/400 EXPORT] Archivo estructurado generado: " + nombreArchivo);
        } catch (Exception e) {
            System.err.println("Error exportando a ERP: " + e.getMessage());
        }
    }
}