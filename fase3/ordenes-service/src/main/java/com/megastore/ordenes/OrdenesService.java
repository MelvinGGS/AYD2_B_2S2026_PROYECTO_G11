package com.megastore.ordenes;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class OrdenesService {

    private final OrdenRepository ordenRepository;
    private final EventoAuditoriaRepository auditoriaRepository;
    private final CarritoService carritoService;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key-orden-creada:orden.creada}")
    private String routingKeyOrdenCreada;

    public OrdenesService(OrdenRepository ordenRepository,
                          EventoAuditoriaRepository auditoriaRepository,
                          CarritoService carritoService,
                          RabbitTemplate rabbitTemplate) {
        this.ordenRepository = ordenRepository;
        this.auditoriaRepository = auditoriaRepository;
        this.carritoService = carritoService;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public Orden crearOrden(CrearOrdenRequest request) {
        String ordenId = "ORD-2026-" + (10000 + new Random().nextInt(90000));
        
        Orden orden = new Orden();
        orden.setId(ordenId);
        orden.setClienteId(request.getClienteId() != null ? request.getClienteId() : "1");
        orden.setClienteNombre(request.getClienteNombre() != null ? request.getClienteNombre() : "Cliente Omnicanal");
        orden.setCanal(request.getCanal() != null ? request.getCanal() : "Web Store");
        orden.setEstado("CREADA");
        orden.setCodigoRastreo("LEX-" + (100000 + new Random().nextInt(900000)) + "-GT");
        orden.setMetodoPago(request.getMetodoPago() != null ? request.getMetodoPago() : "PayKlik (Tarjeta)");
        orden.setMetodoEntrega(request.getMetodoEntrega() != null ? request.getMetodoEntrega() : "Envío a Domicilio");
        orden.setDireccion(request.getDireccion() != null ? request.getDireccion() : "Ciudad de Guatemala");

        BigDecimal subtotal = BigDecimal.ZERO;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (CarritoItemDto itemDto : request.getItems()) {
                BigDecimal precio = itemDto.getPrecio() != null ? itemDto.getPrecio() : BigDecimal.ZERO;
                int qty = itemDto.getCantidad() != null ? itemDto.getCantidad() : 1;
                ItemOrden item = new ItemOrden(itemDto.getId(), itemDto.getNombre(), precio, qty);
                orden.addItem(item);
                subtotal = subtotal.add(item.getSubtotal());
            }
        }

        BigDecimal impuestos = subtotal.multiply(new BigDecimal("0.12")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal envio = "domicilio".equalsIgnoreCase(request.getMetodoEntrega()) ? new BigDecimal("15.00") : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(impuestos).add(envio).setScale(2, RoundingMode.HALF_UP);

        orden.setSubtotal(subtotal);
        orden.setImpuestos(impuestos);
        orden.setEnvio(envio);
        orden.setTotal(total);

        // Save to Postgres
        Orden guardada = ordenRepository.save(orden);

        // Audit Event
        EventoAuditoria auditoria = new EventoAuditoria(
                guardada.getId(),
                guardada.getCanal(),
                "ORDEN_CREADA",
                "Orden creada exitosamente por monto total Q" + total
        );
        auditoriaRepository.save(auditoria);

        // Clear cart in Redis
        if (request.getClienteId() != null) {
            carritoService.vaciarCarrito(request.getClienteId());
        }

        // Publish to RabbitMQ event bus for Notificaciones and other microservices
        try {
            Map<String, Object> evento = new HashMap<>();
            evento.put("id", guardada.getId());
            evento.put("ordenId", guardada.getId());
            evento.put("cliente", guardada.getClienteNombre());
            evento.put("total", guardada.getTotal());
            evento.put("monto", guardada.getTotal());
            evento.put("canal", guardada.getCanal());
            evento.put("direccion", guardada.getDireccion());
            evento.put("direccionDestino", guardada.getDireccion());
            evento.put("estado", guardada.getEstado());
            evento.put("metodoPago", guardada.getMetodoPago() != null ? guardada.getMetodoPago() : "payklik");
            evento.put("plazoDias", "credito_propio".equalsIgnoreCase(guardada.getMetodoPago()) ? 30 : 0);
            evento.put("codigoRastreo", guardada.getCodigoRastreo());
            evento.put("fecha", guardada.getFechaCreacion().toString());
            if (guardada.getItems() != null && !guardada.getItems().isEmpty()) {
                String pId = guardada.getItems().get(0).getProductoId();
                evento.put("productoId", (pId != null && !pId.isBlank()) ? pId : "PROD-001");
                evento.put("cantidad", guardada.getItems().get(0).getCantidad() != null ? guardada.getItems().get(0).getCantidad() : 1);
            } else {
                evento.put("productoId", "PROD-001");
                evento.put("cantidad", 1);
            }

            rabbitTemplate.convertAndSend(exchangeName, routingKeyOrdenCreada, evento);
        } catch (Exception e) {
            System.err.println("Advertencia RabbitMQ: No se pudo emitir evento 'orden.creada' (RabbitMQ offline): " + e.getMessage());
        }

        return guardada;
    }

    public Optional<Orden> obtenerOrdenPorId(String id) {
        return ordenRepository.findById(id);
    }

    public List<Orden> listarTodas() {
        return ordenRepository.findAllByOrderByFechaCreacionDesc();
    }

    @org.springframework.amqp.rabbit.annotation.RabbitListener(queues = "${app.rabbitmq.queue-ordenes-status:ordenes.status.queue}")
    public void recibirActualizacionOrden(Map<String, Object> evento) {
        try {
            String ordenId = evento.containsKey("ordenId") ? (String) evento.get("ordenId") : (String) evento.get("id");
            if (ordenId != null) {
                String nuevoEstado = evento.containsKey("autorizacionSat") ? "EN_PREPARACION" : 
                    (evento.containsKey("estado") ? evento.get("estado").toString() : "PROCESANDO");
                actualizarEstadoOrden(ordenId, nuevoEstado);
            }
        } catch (Exception e) {
            System.err.println("Error actualizando estado de orden: " + e.getMessage());
        }
    }

    public void actualizarEstadoOrden(String ordenId, String nuevoEstado) {
        ordenRepository.findById(ordenId).ifPresent(orden -> {
            orden.setEstado(nuevoEstado);
            ordenRepository.save(orden);
            System.out.println("[ORDENES] Estado de orden " + ordenId + " actualizado en BD a: " + nuevoEstado);
        });
    }

    public void registrarIncidencia(String ordenId, String tipo, String detalle) {
        String tipoNorm = tipo != null ? tipo.toUpperCase() : "CONSULTA";
        String detalleNorm = detalle != null ? detalle : "Incidencia de atención al cliente";
        EventoAuditoria aud = new EventoAuditoria(
                ordenId,
                "CALL_CENTER",
                "INCIDENCIA_" + tipoNorm,
                detalleNorm
        );
        auditoriaRepository.save(aud);
        System.out.println("[AUDITORIA ATENCION] Incidencia registrada para orden " + ordenId + ": " + tipoNorm);
    }

    public List<EventoAuditoria> listarIncidencias() {
        return auditoriaRepository.findByTipoEventoStartingWithOrderByFechaDesc("INCIDENCIA");
    }
}
