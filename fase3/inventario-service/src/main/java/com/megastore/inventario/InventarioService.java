package com.megastore.inventario;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    private static class SolicitudItem {
        final String productoId;
        final int cantidad;
        SolicitudItem(String productoId, int cantidad) {
            this.productoId = productoId;
            this.cantidad = cantidad;
        }
    }

    @RabbitListener(queues = "${app.rabbitmq.queue-ordenes-para-inventario:inventario.orden.queue}")
    @Transactional
    public void procesarOrdenCreada(Map<String, Object> ordenData) {
        try {
            String ordenId = ordenData.get("ordenId") != null ? ordenData.get("ordenId").toString() : 
                (ordenData.get("id") != null ? ordenData.get("id").toString() : "ORD-UNKNOWN");

            // Extraer items solicitados, soporta arreglo de items o campos individuales productoId y cantidad
            List<SolicitudItem> itemsSolicitados = new ArrayList<>();
            Object rawItems = ordenData.get("items");
            if (rawItems instanceof List) {
                List<?> list = (List<?>) rawItems;
                if (!list.isEmpty()) {
                    for (Object itemObj : list) {
                        if (itemObj instanceof Map) {
                            Map<?, ?> itemMap = (Map<?, ?>) itemObj;
                            Object pidObj = itemMap.get("productoId");
                            String pId = (pidObj != null && !pidObj.toString().isBlank()) ? pidObj.toString() : "PROD-001";
                            int qty = 1;
                            Object qtyObj = itemMap.get("cantidad");
                            if (qtyObj != null) {
                                try { qty = Integer.parseInt(qtyObj.toString()); } catch (NumberFormatException ignored) {}
                            }
                            itemsSolicitados.add(new SolicitudItem(pId, Math.max(1, qty)));
                        }
                    }
                }
            }

            if (itemsSolicitados.isEmpty()) {
                Object rawPid = ordenData.get("productoId");
                String productoId = (rawPid != null && !rawPid.toString().isBlank()) ? rawPid.toString() : "PROD-001";
                Object rawQty = ordenData.get("cantidad");
                int cantidadSolicitada = 1;
                if (rawQty != null) {
                    try {
                        cantidadSolicitada = Integer.parseInt(rawQty.toString());
                    } catch (NumberFormatException ignored) {}
                }
                itemsSolicitados.add(new SolicitudItem(productoId, Math.max(1, cantidadSolicitada)));
            }
            
            System.out.println("[INVENTARIO LISTENER] Procesando Orden: " + ordenId + " | Items a reservar: " + itemsSolicitados.size() 
                    + " | Metodo Pago: " + ordenData.get("metodoPago"));

            // Verificar disponibilidad de stock para todos los items
            Map<SolicitudItem, Stock> asignaciones = new HashMap<>();
            boolean stockSuficienteParaTodos = true;

            for (SolicitudItem item : itemsSolicitados) {
                List<Stock> stocks = stockRepository.findByProductoId(item.productoId);
                if (stocks == null || stocks.isEmpty()) stocks = stockRepository.findByProductoId(item.productoId.toLowerCase());
                if (stocks == null || stocks.isEmpty()) stocks = stockRepository.findByProductoId(item.productoId.toUpperCase());

                Stock stockDisponible = null;
                if (stocks != null) {
                    for (Stock s : stocks) {
                        if (s.getCantidad() >= item.cantidad) {
                            stockDisponible = s;
                            break;
                        }
                    }
                }

                if (stockDisponible != null) {
                    asignaciones.put(item, stockDisponible);
                } else {
                    stockSuficienteParaTodos = false;
                    System.out.println("[INVENTARIO] Falta stock para producto: " + item.productoId + ", requerido: " + item.cantidad);
                    break;
                }
            }

            Map<String, Object> eventoRespuesta = new HashMap<>();
            eventoRespuesta.put("ordenId", ordenId);
            eventoRespuesta.put("fecha", LocalDateTime.now().toString());

            // Regla de Negocio Crítica: Reserva temporal y bloqueo optimista
            if (stockSuficienteParaTodos) {
                // Descontar físicamente y registrar reservas temporales (15 min TTL)
                for (Map.Entry<SolicitudItem, Stock> entry : asignaciones.entrySet()) {
                    SolicitudItem item = entry.getKey();
                    Stock stockAfectado = entry.getValue();

                    // FIX SOBREVENTAS: Restar cantidad física del registro Stock.
                    // Activa el Lock Optimista (@Version en Stock)
                    stockAfectado.setCantidad(stockAfectado.getCantidad() - item.cantidad);
                    stockRepository.save(stockAfectado);

                    // Registrar reserva temporal con bloqueo de 15 minutos
                    Reserva reserva = new Reserva(ordenId, item.productoId, stockAfectado.getUbicacion().getId(), item.cantidad);
                    reservaRepository.save(reserva);
                }

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
                if (ordenData.get("items") != null) eventoRespuesta.put("items", ordenData.get("items"));

                rabbitTemplate.convertAndSend(exchangeName, routingKeyReservado, eventoRespuesta);
                System.out.println("[INVENTARIO] EXITO: Stock reservado (TTL 15 min). Evento 'inventario.reservado' publicado para orden: " + ordenId);
            } else {
                // Stock insuficiente para uno o más productos
                eventoRespuesta.put("estado", "INVENTARIO_INSUFICIENTE");
                eventoRespuesta.put("motivo", "Stock insuficiente para satisfacer los productos solicitados.");
                
                rabbitTemplate.convertAndSend(exchangeName, routingKeyInsuficiente, eventoRespuesta);
                System.out.println("[INVENTARIO] FALLO: Stock insuficiente para orden " + ordenId + ". Evento 'inventario.insuficiente' publicado.");
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

    @RabbitListener(queues = "${app.rabbitmq.queue-pago-confirmado:inventario.pago.confirmado.queue}")
    @Transactional
    public void procesarPagoConfirmado(Map<String, Object> evento) {
        if (evento == null || !evento.containsKey("ordenId")) return;
        String ordenId = (String) evento.get("ordenId");
        System.out.println("[INVENTARIO] Pago confirmado para orden: " + ordenId + ". Consolidando reserva definitiva (desactivando TTL).");
        List<Reserva> reservas = reservaRepository.findByOrdenIdAndActivaTrue(ordenId);
        for (Reserva r : reservas) {
            r.setActiva(false); // Venta consolidada: ya no expira tras 15 minutos
            reservaRepository.save(r);
        }
    }

    @Scheduled(fixedRate = 60000) // Se ejecuta cada minuto
    @Transactional
    public void liberarReservasExpiradas() {
        LocalDateTime now = LocalDateTime.now();
        List<Reserva> expiradas = reservaRepository.findByActivaTrueAndFechaExpiracionBefore(now);

        for (Reserva r : expiradas) {
            if (!r.isLiberada()) {
                r.setActiva(false);
                r.setLiberada(true);
                reservaRepository.save(r);
                
                // Devolver inventario al stock físico al expirar la reserva (TTL 15 min excedido sin pago)
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
    }

    @RabbitListener(queues = "${app.rabbitmq.queue-cancelacion:inventario.cancelacion.queue}")
    @Transactional
    public void procesarOrdenCancelada(Map<String, Object> evento) {
        if (evento == null || !evento.containsKey("ordenId")) return;
        String ordenId = (String) evento.get("ordenId");
        System.out.println("[INVENTARIO] Procesando liberacion de stock por orden cancelada: " + ordenId);
        List<Reserva> reservas = reservaRepository.findByOrdenId(ordenId);
        for (Reserva r : reservas) {
            if (!r.isLiberada()) {
                r.setActiva(false);
                r.setLiberada(true);
                reservaRepository.save(r);
                List<Stock> stocks = stockRepository.findByProductoId(r.getProductoId());
                if (stocks != null) {
                    for (Stock s : stocks) {
                        if (s.getUbicacion().getId().equals(r.getUbicacionId())) {
                            s.setCantidad(s.getCantidad() + r.getCantidad());
                            stockRepository.save(s);
                            System.out.println("[INVENTARIO] Stock liberado (+ " + r.getCantidad() + ") para producto " + r.getProductoId() + " en " + s.getUbicacion().getId());
                            break;
                        }
                    }
                }
            }
        }
    }
}
