package com.megastore.facturacion;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue-facturacion:facturacion.queue}")
    private String queueFacturacion;

    @Value("${app.rabbitmq.queue-dlq:facturacion.dlq}")
    private String dlqQueue;

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue facturacionQueue() {
        return new Queue(queueFacturacion, true);
    }

    @Bean
    public Queue facturacionDlqQueue() {
        return new Queue(dlqQueue, true);
    }

    @Bean
    public Binding bindingFacturacion(Queue facturacionQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(facturacionQueue).to(topicExchange).with("pago.confirmado");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
