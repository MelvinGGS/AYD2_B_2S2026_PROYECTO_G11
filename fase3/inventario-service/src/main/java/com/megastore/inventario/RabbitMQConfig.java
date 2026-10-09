package com.megastore.inventario;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue-ordenes-para-inventario:inventario.orden.queue}")
    private String queueName;

    @Value("${app.rabbitmq.queue-cancelacion:inventario.cancelacion.queue}")
    private String queueCancelacionName;

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue inventarioOrdenQueue() {
        return new Queue(queueName, true);
    }

    @Bean
    public Binding bindingInventario(Queue inventarioOrdenQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(inventarioOrdenQueue).to(topicExchange).with("orden.creada");
    }

    @Bean
    public Queue inventarioCancelacionQueue() {
        return new Queue(queueCancelacionName != null ? queueCancelacionName : "inventario.cancelacion.queue", true);
    }

    @Bean
    public Binding bindingInventarioCancelacion(Queue inventarioCancelacionQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(inventarioCancelacionQueue).to(topicExchange).with("orden.cancelada");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
