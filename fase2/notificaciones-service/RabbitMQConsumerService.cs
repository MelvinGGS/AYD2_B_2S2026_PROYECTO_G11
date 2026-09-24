using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace NotificacionesService
{
    public class NotificationLog
    {
        public string Evento { get; set; } = string.Empty;
        public string Contenido { get; set; } = string.Empty;
        public DateTime Fecha { get; set; } = DateTime.UtcNow;
    }

    public class RabbitMQConsumerService : BackgroundService
    {
        private readonly ILogger<RabbitMQConsumerService> _logger;
        private readonly IConfiguration _configuration;
        private static readonly List<NotificationLog> LogsMemory = new();

        public RabbitMQConsumerService(ILogger<RabbitMQConsumerService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public static List<NotificationLog> GetLogs() => LogsMemory.OrderByDescending(x => x.Fecha).Take(50).ToList();

        public static void RegistrarNotificacion(string evento, string contenido)
        {
            lock (LogsMemory)
            {
                LogsMemory.Add(new NotificationLog
                {
                    Evento = evento,
                    Contenido = contenido,
                    Fecha = DateTime.UtcNow
                });
            }
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Yield(); // Allow startup without blocking thread

            var host = _configuration["RabbitMQ:Host"] ?? "localhost";
            var port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672");
            var exchange = _configuration["RabbitMQ:Exchange"] ?? "sgologic.exchange";
            var queue = _configuration["RabbitMQ:Queue"] ?? "notificaciones.queue";

            _logger.LogInformation("Iniciando consumidor C# .NET 8 para RabbitMQ ({Host}:{Port})...", host, port);

            var factory = new ConnectionFactory()
            {
                HostName = host,
                Port = port,
                UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                Password = _configuration["RabbitMQ:Password"] ?? "guest"
            };

            IConnection? connection = null;
            IModel? channel = null;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    connection = factory.CreateConnection();
                    channel = connection.CreateModel();

                    channel.ExchangeDeclare(exchange: exchange, type: ExchangeType.Topic, durable: true);
                    channel.QueueDeclare(queue: queue, durable: true, exclusive: false, autoDelete: false);
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "orden.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "inventario.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "pago.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "factura.#");
                    channel.QueueBind(queue: queue, exchange: exchange, routingKey: "despacho.#");

                    var consumer = new EventingBasicConsumer(channel);
                    consumer.Received += (model, ea) =>
                    {
                        var body = ea.Body.ToArray();
                        var message = Encoding.UTF8.GetString(body);
                        var routingKey = ea.RoutingKey;

                        _logger.LogInformation("[NOTIFICACIONES .NET 8] Evento recibido [{RoutingKey}]: {Message}", routingKey, message);

                        lock (LogsMemory)
                        {
                            LogsMemory.Add(new NotificationLog
                            {
                                Evento = routingKey,
                                Contenido = message,
                                Fecha = DateTime.UtcNow
                            });
                        }

                        channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
                    };

                    channel.BasicConsume(queue: queue, autoAck: false, consumer: consumer);
                    _logger.LogInformation("Escuchando eventos en cola RabbitMQ '{Queue}'...", queue);
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Esperando conexion con RabbitMQ en contenedor... ({Message})", ex.Message);
                    await Task.Delay(5000, stoppingToken);
                }
            }
        }
    }
}
