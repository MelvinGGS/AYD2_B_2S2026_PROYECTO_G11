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
        
        Object montoObj = evento.get("monto");
        BigDecimal monto = BigDecimal.ZERO;
        if (montoObj instanceof Number) {
            monto = new BigDecimal(montoObj.toString());
        } else if (montoObj instanceof String) {
            monto = new BigDecimal((String) montoObj);
        }

        String canal = evento.containsKey("canal") ? (String) evento.get("canal") : "Web Store";
        String numeroTarjeta = evento.containsKey("numeroTarjeta") ? (String) evento.get("numeroTarjeta") : "4500123456789012";

        // Iniciar cobro con el Circuit Breaker activo
        pagosService.procesarPagoConCircuitBreaker(ordenId, monto, canal, numeroTarjeta);
    }
}
