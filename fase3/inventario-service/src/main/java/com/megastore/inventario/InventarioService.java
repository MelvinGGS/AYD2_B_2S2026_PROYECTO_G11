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

            // 1. Buscar stock físico del producto en todas las ubicaciones
            List<Stock> stocks = stockRepository.findByProductoId(productoId);
            if (stocks == null || stocks.isEmpty()) stocks = stockRepository.findByProductoId(productoId.toLowerCase());
            if (stocks == null || stocks.isEmpty()) stocks = stockRepository.findByProductoId(productoId.toUpperCase());

            // 2. Buscar una ubicación que tenga suficiente stock para la cantidad solicitada
            Stock stockAfectado = null;
            if (stocks != null) {
                for (Stock s : stocks) {
                    if (s.getCantidad() >= cantidadSolicitada) {
                        stockAfectado = s;
                        break;
                    }
                }
            }

            Map<String, Object> eventoRespuesta = new HashMap<>();
            eventoRespuesta.put("ordenId", ordenId);
            eventoRespuesta.put("fecha", LocalDateTime.now().toString());

            // 3. Regla de Negocio Crítica: ¿Alcanza el inventario?
            if (stockAfectado != null) {
                // FIX SOBREVENTAS: Restar físicamente la cantidad del registro Stock.
                // Esto activa el Lock Optimista (@Version en Stock) y lanza
                // OptimisticLockException si dos hilos intentan reservar simultáneamente.
                stockAfectado.setCantidad(stockAfectado.getCantidad() - cantidadSolicitada);
                stockRepository.save(stockAfectado);

                // Registrar reserva temporal con bloqueo de 15 minutos
                Reserva reserva = new Reserva(ordenId, productoId, stockAfectado.getUbicacion().getId(), cantidadSolicitada);
                reservaRepository.save(reserva);

                eventoRespuesta.put("estado", "INVENTARIO_RESERVADO");
                if (ordenData.get("total") != null) eventoRespuesta.put("total", ordenData.get("total"));
                if (ordenData.get("monto") != null) eventoRespuesta.put("monto", ordenData.get("monto"));
                if (ordenData.get("canal") != null) eventoRespuesta.put("canal", ordenData.get("canal"));
                if (ordenData.get("direccion") != null) eventoRespuesta.put("direccion", ordenData.get("direccion"));
                if (ordenData.get("direccionDestino") != null) eventoRespuesta.put("direccionDestino", ordenData.get("direccionDestino"));
                if (ordenData.get("numeroTarjeta") != null) eventoRespuesta.put("numeroTarjeta", ordenData.get("numeroTarjeta"));
                if (ordenData.get("metodoPago") != null) eventoRespuesta.put("metodoPago", ordenData.get("metodoPago"));
                if (ordenData.get("plazoDias") != null) eventoRespuesta.put("plazoDias", ordenData.get("plazoDias"));
                if (ordenData.get("cliente") != null) eventoRespuesta.put("cliente", ordenData.get("cliente"));

                rabbitTemplate.convertAndSend(exchangeName, routingKeyReservado, eventoRespuesta);
                System.out.println("[INVENTARIO] EXITO: Stock reservado (15 min). Evento 'inventario.reservado' publicado.");
            } else {
                // No hay suficiente inventario disponible en ninguna ubicación
                eventoRespuesta.put("estado", "INVENTARIO_INSUFICIENTE");
                eventoRespuesta.put("motivo", "Stock insuficiente. Solicitado: " + cantidadSolicitada);
                
                rabbitTemplate.convertAndSend(exchangeName, routingKeyInsuficiente, eventoRespuesta);
                System.out.println("[INVENTARIO] FALLO: Stock insuficiente. Evento 'inventario.insuficiente' publicado.");
            }
            
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException lockEx) {
            // Concurrencia detectada: dos hilos intentaron reservar el mismo stock simultáneamente.
            // Al relanzar la excepción, RabbitMQ reencolará el mensaje para reintento automático.
            System.err.println("[INVENTARIO] CONCURRENCIA: OptimisticLockException para la orden. Reencolando mensaje...");
            throw lockEx;
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
            
            // Devolver inventario al stock físico al expirar la reserva
            List<Stock> stocks = stockRepository.findByProductoId(r.getProductoId());
            if (stocks != null) {
                for (Stock s : stocks) {
                    if (s.getUbicacion().getId().equals(r.getUbicacionId())) {
                        s.setCantidad(s.getCantidad() + r.getCantidad());
                        stockRepository.save(s);
                        break;
                    }
                }
            }
            System.out.println("[EXPIRACION RESERVA] Reserva " + r.getId() + " expirada (>15 min) liberada y devuelta a stock para orden " + r.getOrdenId());
        }
    }

    @org.springframework.amqp.rabbit.annotation.RabbitListener(queues = "${app.rabbitmq.queue-cancelacion:inventario.cancelacion.queue}")
    @Transactional
    public void procesarOrdenCancelada(Map<String, Object> evento) {
        if (evento == null || !evento.containsKey("ordenId")) return;
        String ordenId = (String) evento.get("ordenId");
        System.out.println("[INVENTARIO] Procesando liberacion de stock por orden cancelada: " + ordenId);
        List<Reserva> reservas = reservaRepository.findByOrdenIdAndActivaTrue(ordenId);
        for (Reserva r : reservas) {
            r.setActiva(false);
            reservaRepository.save(r);
            List<Stock> stocks = stockRepository.findByProductoId(r.getProductoId());
            if (stocks != null) {
                for (Stock s : stocks) {
                    if (s.getUbicacion().getId().equals(r.getUbicacionId())) {
                        s.setCantidad(s.getCantidad() + r.getCantidad());
                        stockRepository.save(s);
                        break;
                    }
                }
            }
        }
    }
}
