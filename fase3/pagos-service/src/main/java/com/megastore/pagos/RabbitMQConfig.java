package com.megastore.pagos;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue-pago:pagos.queue}")
    private String queuePago;

    @Value("${app.rabbitmq.queue-dlq:pagos.dlq}")
    private String dlqQueue;

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue pagosQueue() {
        return new Queue(queuePago, true);
    }

    @Bean
    public Queue pagosDlqQueue() {
        return new Queue(dlqQueue, true);
    }

    @Bean
    public Binding bindingPagos(Queue pagosQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(pagosQueue).to(topicExchange).with("inventario.reservado");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
