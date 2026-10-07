package com.megastore.pagos;

import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
class PagosServiceTest {

    @Autowired
    private PagosService pagosService;

    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @MockBean
    private RestTemplate restTemplate;

    @MockBean
    private IntentoPagoRepository intentoPagoRepository;

    @MockBean
    private RabbitTemplate rabbitTemplate;

    @BeforeEach
    void setUp() {
        // Reiniciar el estado del Circuit Breaker antes de cada prueba
        circuitBreakerRegistry.circuitBreaker("payklikService").transitionToClosedState();
    }

    @Test
    void testCircuitBreakerAbreDespuesDeMultiplesFallos() {
        // Configurar el mock para que siempre lance una excepción (simulando error 500 o Timeout)
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Simulated Timeout"));
        
        when(intentoPagoRepository.save(any(IntentoPago.class))).thenAnswer(i -> i.getArguments()[0]);

        // Según application.yml: minimumNumberOfCalls: 3, failureRateThreshold: 50
        // Hacemos 3 peticiones fallidas
        for (int i = 0; i < 3; i++) {
            pagosService.procesarPagoConCircuitBreaker("ORD-TEST", new BigDecimal("100.00"), "Web", "1234");
        }

        // Verificamos que el Circuit Breaker cambió de estado a OPEN
        assertEquals(io.github.resilience4j.circuitbreaker.CircuitBreaker.State.OPEN, 
                circuitBreakerRegistry.circuitBreaker("payklikService").getState());

        // Verificamos que el método de fallback guardó los intentos como ENCOLADO_CONTINGENCIA
        verify(intentoPagoRepository, times(3)).save(argThat(intento -> 
            "ENCOLADO_CONTINGENCIA".equals(intento.getResultado())
        ));
        
        // Verificamos que se enviaron 3 mensajes al DLQ
        verify(rabbitTemplate, times(3)).convertAndSend(anyString(), any(Map.class));
    }
}
