package com.megastore.facturacion;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.Map;

@Component
public class FacturacionListener {

    private final FacturacionService facturacionService;

    public FacturacionListener(FacturacionService facturacionService) {
        this.facturacionService = facturacionService;
    }

    @RabbitListener(queues = "${app.rabbitmq.queue-facturacion:facturacion.queue}")
    public void recibirPagoConfirmado(Map<String, Object> eventoPago) {
        String ordenId = (String) eventoPago.get("ordenId");
        
        // Convierte el monto de forma segura sin importar si llega como Double o Integer
        BigDecimal total = new BigDecimal(eventoPago.get("total").toString());
        
        System.out.println("[RABBITMQ] Evento de pago confirmado recibido para orden: " + ordenId);
        
        // Dispara el flujo de facturación
        facturacionService.generarYTransmitirDteSat(ordenId, total);
    }
}