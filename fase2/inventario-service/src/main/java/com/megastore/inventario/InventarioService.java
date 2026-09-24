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
    private final StockRepository stockRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key-inventario-reservado:inventario.reservado}")
    private String routingKeyReservado;
    
    @Value("${app.rabbitmq.routing-key-inventario-insuficiente:inventario.insuficiente}")
    private String routingKeyInsuficiente;

    public InventarioService(ReservaRepository reservaRepository, StockRepository stockRepository, RabbitTemplate rabbitTemplate) {
        this.reservaRepository = reservaRepository;
        this.stockRepository = stockRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @RabbitListener(queues = "${app.rabbitmq.queue-ordenes-para-inventario:inventario.orden.queue}")
    @Transactional
    public void procesarOrdenCreada(Map<String, Object> ordenData) {
        try {
            String ordenId = ordenData.get("ordenId") != null ? ordenData.get("ordenId").toString() : 
                (ordenData.get("id") != null ? ordenData.get("id").toString() : "ORD-UNKNOWN");
            // Se asume que el MS de Órdenes manda un productoId y la cantidad requerida en el evento
            Object rawPid = ordenData.get("productoId");
            String productoId = (rawPid != null && !rawPid.toString().isBlank()) ? rawPid.toString() : "PROD-001";
            Object rawQty = ordenData.get("cantidad");
            Integer cantidadSolicitada = 1;
            if (rawQty != null) {
                try {
                    cantidadSolicitada = Integer.parseInt(rawQty.toString());
                } catch (NumberFormatException ignored) {}
            }
            
            System.out.println("[INVENTARIO LISTENER] Procesando Orden: " + ordenId + " | Producto: " + productoId + " | Cantidad: " + cantidadSolicitada);

            // 1. Calcular stock total real del producto en todas las ubicaciones
            List<Stock> stocks = stockRepository.findByProductoId(productoId);
            if (stocks == null || stocks.isEmpty()) {
                stocks = stockRepository.findByProductoId(productoId.toLowerCase());
            }
            if (stocks == null || stocks.isEmpty()) {
                stocks = stockRepository.findByProductoId(productoId.toUpperCase());
            }
            Integer stockTotal = (stocks != null) ? stocks.stream().mapToInt(Stock::getCantidad).sum() : 0;
                                                
            // 2. Calcular cuántas unidades ya están reservadas (por otras órdenes)
            List<Reserva> reservas = reservaRepository.findByProductoIdAndActivaTrue(productoId);
            if (reservas == null || reservas.isEmpty()) {
                reservas = reservaRepository.findByProductoIdAndActivaTrue(productoId.toLowerCase());
            }
            if (reservas == null || reservas.isEmpty()) {
                reservas = reservaRepository.findByProductoIdAndActivaTrue(productoId.toUpperCase());
            }
            Integer stockReservado = (reservas != null) ? reservas.stream().mapToInt(Reserva::getCantidad).sum() : 0;

            int stockDisponible = stockTotal - stockReservado;

            Map<String, Object> eventoRespuesta = new HashMap<>();
            eventoRespuesta.put("ordenId", ordenId);
            eventoRespuesta.put("fecha", LocalDateTime.now().toString());

            // 3. Regla de Negocio Crítica: ¿Alcanza el inventario?
            if (stockDisponible >= cantidadSolicitada) {
                // Registrar reserva temporal con bloqueo de 15 minutos (asignamos CD_NORTE temporalmente por el MVP)
                Reserva reserva = new Reserva(ordenId, productoId, "CD_NORTE", cantidadSolicitada);
                reservaRepository.save(reserva);

                eventoRespuesta.put("estado", "INVENTARIO_RESERVADO");
                if (ordenData.get("total") != null) eventoRespuesta.put("total", ordenData.get("total"));
                if (ordenData.get("monto") != null) eventoRespuesta.put("monto", ordenData.get("monto"));
                if (ordenData.get("canal") != null) eventoRespuesta.put("canal", ordenData.get("canal"));
                if (ordenData.get("direccion") != null) eventoRespuesta.put("direccion", ordenData.get("direccion"));
                if (ordenData.get("direccionDestino") != null) eventoRespuesta.put("direccionDestino", ordenData.get("direccionDestino"));
                if (ordenData.get("numeroTarjeta") != null) eventoRespuesta.put("numeroTarjeta", ordenData.get("numeroTarjeta"));

                rabbitTemplate.convertAndSend(exchangeName, routingKeyReservado, eventoRespuesta);
                
                System.out.println("[INVENTARIO] EXITO: Stock reservado (15 min). Evento 'inventario.reservado' publicado.");
            } else {
                // No hay suficiente inventario disponible
                eventoRespuesta.put("estado", "INVENTARIO_INSUFICIENTE");
                eventoRespuesta.put("motivo", "Stock insuficiente. Solicitado: " + cantidadSolicitada + " | Disponible real: " + stockDisponible);
                
                rabbitTemplate.convertAndSend(exchangeName, routingKeyInsuficiente, eventoRespuesta);
                System.out.println("[INVENTARIO] FALLO: Stock insuficiente. Evento 'inventario.insuficiente' publicado.");
            }
            
        } catch (Exception e) {
            System.err.println("Error procesando reserva de inventario: " + e.getMessage());
        }
    }

    @Scheduled(fixedRate = 60000) // Se ejecuta cada minuto
    @Transactional
    public void liberarReservasExpiradas() {
        LocalDateTime now = LocalDateTime.now();
        List<Reserva> expiradas = reservaRepository.findByActivaTrueAndFechaExpiracionBefore(now);

        for (Reserva r : expiradas) {
            r.setActiva(false);
            reservaRepository.save(r);
            System.out.println("[EXPIRACION RESERVA] Reserva " + r.getId() + " expirada (>15 min) liberada para orden " + r.getOrdenId());
        }
    }
}
