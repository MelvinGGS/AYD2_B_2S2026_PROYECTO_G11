package com.megastore.pagos;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class PagosListener {

    private final PagosService pagosService;

    public PagosListener(PagosService pagosService) {
        this.pagosService = pagosService;
    }

    @RabbitListener(queues = "${app.rabbitmq.queue-pago:pagos.queue}")
    public void recibirEventoInventarioReservado(Map<String, Object> evento) {
        System.out.println("[RABBITMQ] Evento recibido en Pagos: " + evento);

        String ordenId = (String) evento.get("ordenId");
        
        Object montoObj = evento.get("monto") != null ? evento.get("monto") : evento.get("total");
        BigDecimal monto = BigDecimal.ZERO;
        if (montoObj instanceof Number) {
            monto = new BigDecimal(montoObj.toString());
        } else if (montoObj instanceof String) {
            monto = new BigDecimal((String) montoObj);
        }

        String canal = evento.containsKey("canal") ? (String) evento.get("canal") : "Web Store";
        String metodoPago = evento.containsKey("metodoPago") ? (String) evento.get("metodoPago") : "payklik";
        String numeroTarjeta = evento.containsKey("numeroTarjeta") ? (String) evento.get("numeroTarjeta") : "4500123456784242";
        String direccionDestino = evento.containsKey("direccionDestino") ? (String) evento.get("direccionDestino") : (String) evento.get("direccion");

        // Si la orden es bajo Crédito Propio (BNPL 30 días), procesar financiamiento sin consultar PayKlik
        if ("credito_propio".equalsIgnoreCase(metodoPago) || "CREDITO_PROPIO_30D".equalsIgnoreCase(metodoPago)) {
            pagosService.procesarCreditoPropioBNPL(ordenId, monto, canal, direccionDestino);
        } else {
            // Iniciar cobro con el Circuit Breaker activo contra pasarela PayKlik
            pagosService.procesarPagoConCircuitBreaker(ordenId, monto, canal, numeroTarjeta, direccionDestino);
        }
    }
}
