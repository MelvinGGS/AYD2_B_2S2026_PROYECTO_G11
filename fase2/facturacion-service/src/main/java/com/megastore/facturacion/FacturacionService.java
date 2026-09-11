package com.megastore.facturacion;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;


@Service
public class FacturacionService {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.facturacion.uploads-dir:uploads}")
    private String uploadsDir;

    public FacturacionService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
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
            LocalDateTime.now().toString(),
            serie,
            numero,
            autorizacion,
            total.doubleValue(),
            total.multiply(new BigDecimal("0.12")).doubleValue()
        );

        // Algoritmo de Reintentos con Backoff Exponencial (1s, 2s, 4s)
        boolean satAutorizada = false;
        long esperaMs = 1000;

        for (int intento = 1; intento <= 3; intento++) {
            try {
                System.out.println("[TRANSMISIÓN SAT] Intento " + intento + "/3 para factura " + autorizacion + "...");
                // Simulación de transmisión SAT
                satAutorizada = true;
                break;
            } catch (Exception e) {
                System.err.println("Intento " + intento + " fallido ante SAT. Esperando " + esperaMs + "ms...");
                try {
                    Thread.sleep(esperaMs);
                } catch (InterruptedException ignored) {}
                esperaMs *= 2; // Backoff exponencial: 1s -> 2s -> 4s
            }
        }

        if (satAutorizada) {
            guardarXmlEnDisco(autorizacion, xmlDte);
            System.out.println("[SAT APROBADA] Factura " + autorizacion + " emitida y autorizada por SAT.");
        }

        return autorizacion;
    }

    private void guardarXmlEnDisco(String autorizacion, String xmlContent) {
        try {
            File dir = new File(uploadsDir);
            if (!dir.exists()) dir.mkdirs();
            File archivo = new File(dir, autorizacion + ".xml");
            try (FileWriter writer = new FileWriter(archivo)) {
                writer.write(xmlContent);
            }
        } catch (Exception e) {
            System.err.println("Error guardando XML en uploads: " + e.getMessage());
        }
    }

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
                writer.write(String.format("%s,ORD-SYNC,OMNICANAL,0.00,103849204,AS400-BATCH\n", LocalDateTime.now()));
            }

            System.out.println("[ERP AS/400 EXPORT] Archivo estructurado generado para AS/400: " + nombreArchivo);
        } catch (Exception e) {
            System.err.println("Error exportando lote a ERP AS/400: " + e.getMessage());
        }
    }
}
