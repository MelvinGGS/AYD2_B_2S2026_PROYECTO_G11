package com.megastore.inventario;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InventarioService {

    private final ReservaRepository reservaRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key-inventario-reservado:inventario.reservado}")
    private String routingKeyReservado;

    public InventarioService(ReservaRepository reservaRepository, RabbitTemplate rabbitTemplate) {
        this.reservaRepository = reservaRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @RabbitListener(queues = "${app.rabbitmq.queue-ordenes-para-inventario:inventario.orden.queue}")
    @Transactional
    public void procesarOrdenCreada(Map<String, Object> ordenData) {
        try {
            String ordenId = (String) ordenData.get("id");
            System.out.println("[INVENTARIO LISTENER] Procesando reserva temporal para Orden: " + ordenId);

            // Registrar reserva temporal con bloqueo de 15 minutos
            Reserva reserva = new Reserva(ordenId, "prod-general", "CD_NORTE", 1);
            reservaRepository.save(reserva);

            // Publicar evento al bus RabbitMQ
            Map<String, Object> evento = new HashMap<>();
            evento.put("ordenId", ordenId);
            evento.put("estado", "INVENTARIO_RESERVADO");
            evento.put("fecha", LocalDateTime.now().toString());

            rabbitTemplate.convertAndSend(exchangeName, routingKeyReservado, evento);
            System.out.println("[INVENTARIO] Stock reservado (15 min) y evento publicado para orden: " + ordenId);
        } catch (Exception e) {
            System.err.println("Error procesando reserva de inventario: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void liberarReservasExpiradas() {
        LocalDateTime now = LocalDateTime.now();
        List<Reserva> expiradas = reservaRepository.findByActivaTrueAndFechaExpiracionBefore(now);

        for (Reserva r : expiradas) {
            r.setActiva(false);
            reservaRepository.save(r);
            System.out.println("[EXPIRACIÓN RESERVA] Reserva " + r.getId() + " expirada (>15 min) liberada para orden " + r.getOrdenId());
        }
    }
}
