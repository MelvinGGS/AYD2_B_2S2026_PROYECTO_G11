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
        String direccionDestino = (String) eventoPago.get("direccionDestino");
        if (direccionDestino == null) {
            direccionDestino = (String) eventoPago.get("direccion");
        }
        
        // Convierte el monto o total de forma segura sin importar la clave enviada
        Object totalObj = eventoPago.get("total") != null ? eventoPago.get("total") : eventoPago.get("monto");
        BigDecimal total = totalObj != null ? new BigDecimal(totalObj.toString()) : BigDecimal.ZERO;

        String metodoPago = eventoPago.get("metodoPago") != null ? eventoPago.get("metodoPago").toString() : "PAYKLIK";
        Object plazoObj = eventoPago.get("plazoDias");
        int plazoDias = 0;
        if (plazoObj != null) {
            try {
                plazoDias = Integer.parseInt(plazoObj.toString());
            } catch (NumberFormatException ignored) {}
        } else if ("credito_propio".equalsIgnoreCase(metodoPago) || "CREDITO_PROPIO_30D".equalsIgnoreCase(metodoPago)) {
            plazoDias = 30;
        }
        
        System.out.println("[RABBITMQ] Evento de pago confirmado recibido para orden: " + ordenId + " (" + metodoPago + ")");
        
        // Dispara el flujo de facturacion propagando metodo de pago y plazo
        facturacionService.generarYTransmitirDteSat(ordenId, total, direccionDestino, metodoPago, plazoDias);
    }
}