package com.megastore.ordenes;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange:sgologic.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key-orden-creada:orden.creada}")
    private String routingKeyOrdenCreada;

    @Value("${app.rabbitmq.queue-notificaciones:notificaciones.queue}")
    private String queueNotificaciones;

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue notificacionesQueue() {
        return new Queue(queueNotificaciones, true);
    }

    @Bean
    public Binding bindingNotificaciones(Queue notificacionesQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(notificacionesQueue).to(topicExchange).with("orden.#");
    }

    @Bean
    public Queue ordenesStatusQueue() {
        return new Queue("ordenes.status.queue", true);
    }

    @Bean
    public Binding bindingOrdenesPago(Queue ordenesStatusQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(ordenesStatusQueue).to(topicExchange).with("pago.#");
    }

    @Bean
    public Binding bindingOrdenesDespacho(Queue ordenesStatusQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(ordenesStatusQueue).to(topicExchange).with("despacho.#");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
