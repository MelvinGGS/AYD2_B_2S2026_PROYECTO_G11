package com.megastore.inventario;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private StockRepository stockRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private InventarioService inventarioService;

    private Ubicacion ubicacionNorte;
    private Producto productoLap;
    private Stock stockLap;

    @BeforeEach
    void setUp() {
        inventarioService = new InventarioService(reservaRepository, stockRepository, rabbitTemplate);
        ReflectionTestUtils.setField(inventarioService, "exchangeName", "sgologic.exchange");
        ReflectionTestUtils.setField(inventarioService, "routingKeyReservado", "inventario.reservado");
        ReflectionTestUtils.setField(inventarioService, "routingKeyInsuficiente", "inventario.insuficiente");

        ubicacionNorte = new Ubicacion("CD_NORTE", "Centro de Distribución Norte", "CD");
        productoLap = new Producto("PROD-001", "Laptop Dell Pro", "Tecnología", 4500.0, 5000.0, "img.jpg", "Oferta", "desc");
        stockLap = new Stock(productoLap, ubicacionNorte, 10);
        stockLap.setId(1L);
        stockLap.setVersion(1L);
    }

    @Test
    @DisplayName("1. Reserva de stock exitosa para orden con Crédito Propio (TTL 15 min y propagación de plazo)")
    void testReservaStockOrdenCreditoPropio_ExitoYPropagacion() {
        when(stockRepository.findByProductoId("PROD-001")).thenReturn(List.of(stockLap));

        Map<String, Object> ordenData = new HashMap<>();
        ordenData.put("ordenId", "ORD-BNPL-101");
        ordenData.put("productoId", "PROD-001");
        ordenData.put("cantidad", 2);
        ordenData.put("total", 9000.0);
        ordenData.put("monto", 9000.0);
        ordenData.put("canal", "Web Store");
        ordenData.put("metodoPago", "credito_propio");
        ordenData.put("plazoDias", 30);
        ordenData.put("cliente", "Susana P.");

        inventarioService.procesarOrdenCreada(ordenData);

        // Verifica descuento físico de stock (10 - 2 = 8)
        assertEquals(8, stockLap.getCantidad());
        verify(stockRepository, times(1)).save(stockLap);

        // Verifica creación de reserva con TTL de 15 minutos
        ArgumentCaptor<Reserva> reservaCaptor = ArgumentCaptor.forClass(Reserva.class);
        verify(reservaRepository, times(1)).save(reservaCaptor.capture());
        Reserva guardada = reservaCaptor.getValue();
        assertEquals("ORD-BNPL-101", guardada.getOrdenId());
        assertEquals("PROD-001", guardada.getProductoId());
        assertEquals(2, guardada.getCantidad());
        assertTrue(guardada.isActiva());
        assertTrue(guardada.getFechaExpiracion().isAfter(LocalDateTime.now().plusMinutes(14)));

        // Verifica publicación de evento inventario.reservado con datos de crédito propio
        ArgumentCaptor<Map<String, Object>> eventoCaptor = ArgumentCaptor.forClass(Map.class);
        verify(rabbitTemplate, times(1)).convertAndSend(eq("sgologic.exchange"), eq("inventario.reservado"), eventoCaptor.capture());
        Map<String, Object> eventoPublicado = eventoCaptor.getValue();
        assertEquals("INVENTARIO_RESERVADO", eventoPublicado.get("estado"));
        assertEquals("ORD-BNPL-101", eventoPublicado.get("ordenId"));
        assertEquals("credito_propio", eventoPublicado.get("metodoPago"));
        assertEquals(30, eventoPublicado.get("plazoDias"));
    }

    @Test
    @DisplayName("2. Reserva de stock atómica para orden multilínea (múltiples items)")
    void testReservaStock_MultiplesItems() {
        Producto productoMouse = new Producto("PROD-002", "Mouse Gamer", "Accesorios", 200.0, 250.0, "img.jpg", "Normal", "desc");
        Stock stockMouse = new Stock(productoMouse, ubicacionNorte, 5);
        stockMouse.setId(2L);
        stockMouse.setVersion(1L);

        when(stockRepository.findByProductoId("PROD-001")).thenReturn(List.of(stockLap));
        when(stockRepository.findByProductoId("PROD-002")).thenReturn(List.of(stockMouse));

        Map<String, Object> ordenData = new HashMap<>();
        ordenData.put("ordenId", "ORD-MULTI-202");
        ordenData.put("metodoPago", "CREDITO_PROPIO_30D");
        ordenData.put("plazoDias", 30);

        List<Map<String, Object>> items = new ArrayList<>();
        items.add(Map.of("productoId", "PROD-001", "cantidad", 1));
        items.add(Map.of("productoId", "PROD-002", "cantidad", 3));
        ordenData.put("items", items);

        inventarioService.procesarOrdenCreada(ordenData);

        assertEquals(9, stockLap.getCantidad());
        assertEquals(2, stockMouse.getCantidad());
        verify(stockRepository, times(1)).save(stockLap);
        verify(stockRepository, times(1)).save(stockMouse);
        verify(reservaRepository, times(2)).save(any(Reserva.class));
        verify(rabbitTemplate, times(1)).convertAndSend(eq("sgologic.exchange"), eq("inventario.reservado"), any(Map.class));
    }

    @Test
    @DisplayName("3. Rechazo por stock insuficiente (emite inventario.insuficiente sin descontar)")
    void testReservaStock_StockInsuficiente() {
        stockLap.setCantidad(1);
        when(stockRepository.findByProductoId("PROD-001")).thenReturn(List.of(stockLap));

        Map<String, Object> ordenData = new HashMap<>();
        ordenData.put("ordenId", "ORD-INSUF-303");
        ordenData.put("productoId", "PROD-001");
        ordenData.put("cantidad", 5);
        ordenData.put("metodoPago", "credito_propio");

        inventarioService.procesarOrdenCreada(ordenData);

        // No se debe modificar stock ni crear reservas
        assertEquals(1, stockLap.getCantidad());
        verify(stockRepository, never()).save(any());
        verify(reservaRepository, never()).save(any());

        // Debe emitirse inventario.insuficiente
        ArgumentCaptor<Map<String, Object>> eventoCaptor = ArgumentCaptor.forClass(Map.class);
        verify(rabbitTemplate, times(1)).convertAndSend(eq("sgologic.exchange"), eq("inventario.insuficiente"), eventoCaptor.capture());
        assertEquals("INVENTARIO_INSUFICIENTE", eventoCaptor.getValue().get("estado"));
    }

    @Test
    @DisplayName("4. Manejo de concurrencia y bloqueo optimista (@Version relanza para reintento)")
    void testReservaStock_ConcurrenciaBloqueoOptimista() {
        when(stockRepository.findByProductoId("PROD-001")).thenReturn(List.of(stockLap));
        when(stockRepository.save(any(Stock.class)))
                .thenThrow(new ObjectOptimisticLockingFailureException(Stock.class, 1L));

        Map<String, Object> ordenData = new HashMap<>();
        ordenData.put("ordenId", "ORD-LOCK-404");
        ordenData.put("productoId", "PROD-001");
        ordenData.put("cantidad", 1);

        assertThrows(ObjectOptimisticLockingFailureException.class, () -> {
            inventarioService.procesarOrdenCreada(ordenData);
        });

        // Al relanzar la excepción, RabbitMQ mantendrá o reencolará el mensaje
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Map.class));
    }

    @Test
    @DisplayName("5. Liberación automática de reservas al expirar TTL de 15 minutos (retorno de stock)")
    void testLiberarReservasExpiradas_TTL15Minutos() {
        Reserva reservaExpirada = new Reserva("ORD-EXP-505", "PROD-001", "CD_NORTE", 3);
        reservaExpirada.setId(10L);
        reservaExpirada.setActiva(true);

        when(reservaRepository.findByActivaTrueAndFechaExpiracionBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(reservaExpirada));
        when(stockRepository.findByProductoId("PROD-001")).thenReturn(List.of(stockLap));

        int stockPrevio = stockLap.getCantidad(); // 10
        inventarioService.liberarReservasExpiradas();

        // La reserva debe quedar desactivada
        assertFalse(reservaExpirada.isActiva());
        verify(reservaRepository, times(1)).save(reservaExpirada);

        // El stock debe regresar físicamente
        assertEquals(stockPrevio + 3, stockLap.getCantidad());
        verify(stockRepository, times(1)).save(stockLap);
    }

    @Test
    @DisplayName("6. Consolidación de venta al recibir pago confirmado (inactiva TTL sin devolver stock)")
    void testProcesarPagoConfirmado_ConsolidaVentaDefinitiva() {
        Reserva reservaActiva = new Reserva("ORD-PAID-606", "PROD-001", "CD_NORTE", 2);
        reservaActiva.setActiva(true);

        when(reservaRepository.findByOrdenIdAndActivaTrue("ORD-PAID-606"))
                .thenReturn(List.of(reservaActiva));

        Map<String, Object> pagoConfirmadoEvento = new HashMap<>();
        pagoConfirmadoEvento.put("ordenId", "ORD-PAID-606");
        pagoConfirmadoEvento.put("estado", "PAGADO_BNPL");
        pagoConfirmadoEvento.put("metodoPago", "credito_propio");

        inventarioService.procesarPagoConfirmado(pagoConfirmadoEvento);

        // La reserva se desactiva para no ser liberada por el TTL
        assertFalse(reservaActiva.isActiva());
        verify(reservaRepository, times(1)).save(reservaActiva);

        // El stock ya fue descontado, NO se debe incrementar
        verify(stockRepository, never()).save(any());
    }

    @Test
    @DisplayName("7. Cancelación explícita de orden libera reserva y restituye stock")
    void testProcesarOrdenCancelada_RestituyeStock() {
        Reserva reservaCancelada = new Reserva("ORD-CAN-707", "PROD-001", "CD_NORTE", 4);
        reservaCancelada.setActiva(true);

        when(reservaRepository.findByOrdenIdAndActivaTrue("ORD-CAN-707"))
                .thenReturn(List.of(reservaCancelada));
        when(stockRepository.findByProductoId("PROD-001")).thenReturn(List.of(stockLap));

        int stockPrevio = stockLap.getCantidad();
        inventarioService.procesarOrdenCancelada(Map.of("ordenId", "ORD-CAN-707"));

        assertFalse(reservaCancelada.isActiva());
        assertEquals(stockPrevio + 4, stockLap.getCantidad());
        verify(stockRepository, times(1)).save(stockLap);
    }
}
