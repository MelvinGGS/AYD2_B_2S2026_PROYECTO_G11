using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace NotificacionesService
{
    public class RabbitMQConsumerService : BackgroundService
    {
        private readonly ILogger<RabbitMQConsumerService> _logger;
        private readonly IConfiguration _configuration;
        private readonly NotificationBroadcaster _broadcaster;

        public RabbitMQConsumerService(
            ILogger<RabbitMQConsumerService> logger, 
            IConfiguration configuration,
            NotificationBroadcaster broadcaster)
        {
            _logger = logger;
            _configuration = configuration;
            _broadcaster = broadcaster;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Yield(); // Permite arranque del host sin bloquear el hilo principal

            var host = _configuration["RabbitMQ:Host"] ?? "localhost";
            var port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672");
            var exchange = _configuration["RabbitMQ:Exchange"] ?? "sgologic.exchange";
            var queue = _configuration["RabbitMQ:Queue"] ?? "notificaciones.queue";

            _logger.LogInformation("Iniciando consumidor reactivo RabbitMQ ({Host}:{Port}) para WebSockets y SSE...", host, port);

            var factory = new ConnectionFactory()
            {
                HostName = host,
                Port = port,
                UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                Password = _configuration["RabbitMQ:Password"] ?? "guest",
                AutomaticRecoveryEnabled = true,
                NetworkRecoveryInterval = TimeSpan.FromSeconds(5)
            };

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var connection = factory.CreateConnection();
                    var channel = connection.CreateModel();

                    channel.ExchangeDeclare(exchange: exchange, type: ExchangeType.Topic, durable: true);
                    channel.QueueDeclare(queue: queue, durable: true, exclusive: false, autoDelete: false);

                    // Suscripción a eventos clave del sistema omnicanal
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "credito.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "tracking.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "despacho.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "pago.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "orden.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "inventario.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "factura.#");

                    var consumer = new EventingBasicConsumer(channel);
                    consumer.Received += async (model, ea) =>
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);
                        var routingKey = ea.RoutingKey;

                        _logger.LogInformation("[NOTIFICACIONES MQ] Evento recibido [{RoutingKey}]: {Message}", routingKey, message);

                        try
                        {
                            var notification = ProcesarEvento(routingKey, message);
                            await _broadcaster.BroadcastAsync(notification);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error al procesar y empujar notificación reactiva para {RoutingKey}", routingKey);
                        }
                        finally
                        {
                            channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
                        }
                    };

                    channel.BasicConsume(queue: queue, autoAck: false, consumer: consumer);
                    _logger.LogInformation("Consumidor RabbitMQ conectado y escuchando eventos reactivos en cola '{Queue}'...", queue);
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Esperando conexión con RabbitMQ... ({Message})", ex.Message);
                    await Task.Delay(5000, stoppingToken);
                }
            }
        }

        private static NotificationMessage ProcesarEvento(string routingKey, string rawJson)
        {
            string? ordenId = null;
            string? estado = null;
            string? metodoPago = null;
            string? cliente = null;
            string? monto = null;
            string? codigoRastreo = null;

            try
            {
                using var doc = JsonDocument.Parse(rawJson);
                var root = doc.RootElement;

                if (root.TryGetProperty("ordenId", out var op)) ordenId = op.GetString();
                if (ordenId == null && root.TryGetProperty("id", out var ip)) ordenId = ip.GetString();

                if (root.TryGetProperty("estado", out var ep)) estado = ep.GetString();
                if (root.TryGetProperty("metodoPago", out var mp)) metodoPago = mp.GetString();
                if (root.TryGetProperty("cliente", out var cp)) cliente = cp.GetString();
                if (cliente == null && root.TryGetProperty("clienteNombre", out var cnp)) cliente = cnp.GetString();
                if (root.TryGetProperty("codigoRastreo", out var crp)) codigoRastreo = crp.GetString();
                if (codigoRastreo == null && root.TryGetProperty("guia", out var gp)) codigoRastreo = gp.GetString();

                if (root.TryGetProperty("total", out var tp)) monto = tp.ToString();
                if (monto == null && root.TryGetProperty("monto", out var mop)) monto = mop.ToString();
            }
            catch
            {
                // Payload no JSON estructurado
            }

            var notification = new NotificationMessage
            {
                Evento = routingKey,
                OrdenId = ordenId,
                Fecha = DateTime.UtcNow
            };

            // 1. Eventos de Crédito Propio (Aprobación, Evaluación o Pago BNPL)
            if (routingKey.StartsWith("credito.", StringComparison.OrdinalIgnoreCase) || 
                (routingKey.StartsWith("pago.", StringComparison.OrdinalIgnoreCase) && 
                 ("credito_propio".Equals(metodoPago, StringComparison.OrdinalIgnoreCase) || 
                  "CREDITO_PROPIO_30D".Equals(metodoPago, StringComparison.OrdinalIgnoreCase) ||
                  "PAGADO_BNPL".Equals(estado, StringComparison.OrdinalIgnoreCase))))
            {
                notification.Tipo = "CREDITO";
                string refOrden = !string.IsNullOrEmpty(ordenId) ? $" para la orden {ordenId}" : " en evaluación previa de Checkout";
                if (routingKey.Contains("rechazado", StringComparison.OrdinalIgnoreCase))
                {
                    notification.Titulo = "Crédito Propio No Aprobado";
                    notification.Mensaje = $"La evaluación de Crédito Propio{refOrden} no alcanzó el score requerido. Puedes pagar con PayKlik.";
                }
                else
                {
                    notification.Titulo = "Crédito Propio Aprobado (30 Días)";
                    notification.Mensaje = $"Tu Crédito Propio a 30 días sin intereses ha sido aprobado{refOrden}. {(!string.IsNullOrEmpty(monto) ? $"(Monto financiado: Q{monto})" : "")}".Trim();
                }
            }
            // 2. Eventos de Tracking / Logística
            else if (routingKey.StartsWith("tracking.", StringComparison.OrdinalIgnoreCase) || 
                     routingKey.StartsWith("despacho.", StringComparison.OrdinalIgnoreCase))
            {
                notification.Tipo = "TRACKING";
                notification.Titulo = "Actualización de Rastreo en Tiempo Real";
                notification.Mensaje = $"Tu orden {ordenId ?? ""} avanzó a estado: '{estado ?? "EN_TRANSITO"}'. {(!string.IsNullOrEmpty(codigoRastreo) ? $"Código de rastreo: {codigoRastreo}" : "")}";
            }
            // 3. Eventos de Pago Tradicional y Contingencia
            else if (routingKey.StartsWith("pago.", StringComparison.OrdinalIgnoreCase))
            {
                notification.Tipo = "PAGO";
                if (routingKey.Contains("contingencia", StringComparison.OrdinalIgnoreCase) || "PAGO_EN_CONTINGENCIA".Equals(estado, StringComparison.OrdinalIgnoreCase))
                {
                    notification.Titulo = "Pago Encolado en Contingencia (DLQ)";
                    notification.Mensaje = $"Pasarela PayKlik no disponible. El cobro de la orden {ordenId ?? ""} por Q{monto ?? "0.00"} fue resguardado en RabbitMQ DLQ para reintento seguro.";
                }
                else
                {
                    notification.Titulo = "Pago Confirmado";
                    notification.Mensaje = $"El pago de la orden {ordenId ?? ""} por Q{monto ?? "0.00"} ha sido procesado exitosamente.";
                }
            }
            // 4. Eventos de Inventario
            else if (routingKey.StartsWith("inventario.", StringComparison.OrdinalIgnoreCase))
            {
                notification.Tipo = "INVENTARIO";
                if (routingKey.Contains("insuficiente", StringComparison.OrdinalIgnoreCase))
                {
                    notification.Titulo = "Inventario Insuficiente";
                    notification.Mensaje = $"No hay existencias suficientes para satisfacer los productos de la orden {ordenId ?? ""}.";
                }
                else
                {
                    notification.Titulo = "Inventario Reservado";
                    notification.Mensaje = $"Stock reservado exitosamente por 15 minutos para la orden {ordenId ?? ""}.";
                }
            }
            // 5. Eventos de Orden
            else if (routingKey.StartsWith("orden.", StringComparison.OrdinalIgnoreCase))
            {
                notification.Tipo = "ORDEN";
                if (routingKey.Contains("cancelada", StringComparison.OrdinalIgnoreCase))
                {
                    notification.Titulo = "Orden Cancelada";
                    notification.Mensaje = $"La orden {ordenId ?? ""} ha sido cancelada y el stock fue liberado.";
                }
                else
                {
                    notification.Titulo = "Nueva Orden Registrada";
                    notification.Mensaje = $"Tu orden {ordenId ?? ""} ha sido creada exitosamente.";
                }
            }
            // 6. Facturación
            else if (routingKey.StartsWith("factura.", StringComparison.OrdinalIgnoreCase))
            {
                notification.Tipo = "FACTURACION";
                notification.Titulo = "Factura SAT Emitida";
                notification.Mensaje = $"Factura tributaria FEL generada para la orden {ordenId ?? ""}.";
            }
            else
            {
                notification.Tipo = "GENERAL";
                notification.Titulo = "Notificación del Sistema";
                notification.Mensaje = $"Evento recibido en la plataforma: {routingKey}.";
            }

            return notification;
        }
    }
}
