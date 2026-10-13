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

    /**
     * Escucha el evento inventario.reservado desde RabbitMQ.
     * Bifurca el flujo según el campo metodoPago del evento:
     *   - TARJETA_PAYKLIK o payklik → Circuit Breaker + PayKlik
     *   - CREDITO_PROPIO_30D o credito_propio → BNPL diferido 30 días
     */
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
        String metodoPagoStr = evento.containsKey("metodoPago") ? (String) evento.get("metodoPago") : "TARJETA_PAYKLIK";
        String numeroTarjeta = evento.containsKey("numeroTarjeta") ? (String) evento.get("numeroTarjeta") : "4500123456784242";
        String direccionDestino = evento.containsKey("direccionDestino") ? (String) evento.get("direccionDestino") : (String) evento.get("direccion");

        // Determinar la ruta usando el enum tipado y plazoDias (compatible con strings del frontend y API)
        Object plazoObj = evento.get("plazoDias");
        int plazoDias = 0;
        if (plazoObj != null) {
            try {
                plazoDias = Integer.parseInt(plazoObj.toString());
            } catch (NumberFormatException ignored) {}
        }

        MetodoPago parsed = MetodoPago.fromValue(metodoPagoStr);
        MetodoPago metodoPago = (plazoDias == 30 || parsed == MetodoPago.CREDITO_PROPIO_30D)
                ? MetodoPago.CREDITO_PROPIO_30D
                : MetodoPago.TARJETA_PAYKLIK;

        if (metodoPago == MetodoPago.CREDITO_PROPIO_30D) {
            // Sin pasarela, sin Circuit Breaker
            pagosService.procesarCreditoPropioBNPL(ordenId, monto, canal, direccionDestino);
        } else {
            // Cobro con Circuit Breaker activo contra PayKlik
            pagosService.procesarPagoConCircuitBreaker(ordenId, monto, canal, numeroTarjeta, direccionDestino);
        }
    }
}
