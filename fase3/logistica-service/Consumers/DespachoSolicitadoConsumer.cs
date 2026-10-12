using System.Text;
using System.Text.Json;
using LogisticaService.Data;
using LogisticaService.Services;
using Microsoft.Extensions.DependencyInjection;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace LogisticaService.Consumers
{
    public class DespachoSolicitadoConsumer : BackgroundService
    {
        private readonly ILogger<DespachoSolicitadoConsumer> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly MockLogiExpressService _mockLogiExpress;
        private readonly IConfiguration _configuration;
        private IConnection? _connection;
        private IModel? _channel;

        public DespachoSolicitadoConsumer(
            ILogger<DespachoSolicitadoConsumer> logger,
            IServiceScopeFactory scopeFactory,
            MockLogiExpressService mockLogiExpress,
            IConfiguration configuration)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _mockLogiExpress = mockLogiExpress;
            _configuration = configuration;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Yield();

            var host = _configuration["RabbitMQ:Host"] ?? "localhost";
            var port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672");
            var username = _configuration["RabbitMQ:Username"] ?? "guest";
            var password = _configuration["RabbitMQ:Password"] ?? "guest";
            var exchange = "sgologic.exchange";
            var queue = "logistica.despacho.solicitado";
            var dlq = "logistica.dlq";
            var routingKey = "despacho.solicitado";

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var factory = new ConnectionFactory
                    {
                        HostName = host,
                        Port = port,
                        UserName = username,
                        Password = password,
                        AutomaticRecoveryEnabled = true,
                        NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
                    };

                    _connection = factory.CreateConnection();
                    _channel = _connection.CreateModel();

                    _channel.ExchangeDeclare(exchange: exchange, type: ExchangeType.Topic, durable: true);
                    _channel.QueueDeclare(queue: queue, durable: true, exclusive: false, autoDelete: false);
                    _channel.QueueDeclare(queue: dlq, durable: true, exclusive: false, autoDelete: false);
                    _channel.QueueBind(queue: queue, exchange: exchange, routingKey: routingKey);

                    var consumer = new EventingBasicConsumer(_channel);
                    consumer.Received += async (model, ea) =>
                    {
                        await ProcessarMensaje(ea);
                    };

                    _channel.BasicConsume(queue: queue, autoAck: false, consumer: consumer);
                    _logger.LogInformation("DespachoSolicitadoConsumer conectado y escuchando en {Queue}", queue);
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning("Esperando conexión con RabbitMQ para Logística... ({Message})", ex.Message);
                    await Task.Delay(5000, stoppingToken);
                }
            }
        }

        private async Task ProcessarMensaje(BasicDeliverEventArgs ea)
        {
            try
            {
                var message = Encoding.UTF8.GetString(ea.Body.ToArray());
                _logger.LogInformation("Mensaje recibido en Logistica: {Message}", message);

                using var doc = JsonDocument.Parse(message);
                var root = doc.RootElement;

                var ordenId = root.TryGetProperty("ordenId", out var ordenProp) ? ordenProp.GetString() : Guid.NewGuid().ToString();
                var direccion = root.TryGetProperty("direccionDestino", out var dirProp) ? dirProp.GetString() : "Ciudad de Guatemala";
                var metodoPagoRecibido = root.TryGetProperty("metodoPago", out var metodoProp) && metodoProp.ValueKind == JsonValueKind.String
                    ? metodoProp.GetString()
                    : null;
                var metodoPago = LogisticaManagerService.NormalizarMetodoPago(metodoPagoRecibido);

                if (metodoPago == LogisticaManagerService.MetodoCreditoPropio)
                {
                    _logger.LogInformation("Orden {OrdenId} confirmada por Credito Propio a 30 dias, se despacha igual que PayKlik", ordenId);
                }

                // La seleccion de origen solo depende de la direccion, no del metodo de pago
                var origen = LogisticaManagerService.DeterminarOrigenOptimo(direccion ?? "Ciudad de Guatemala");
                var codigoRastreo = "TRACK-" + DateTime.UtcNow.Ticks.ToString().Substring(0, 10) + "-" + Random.Shared.Next(1000, 9999);

                var despacho = new Despacho
                {
                    Id = Guid.NewGuid().ToString(),
                    OrdenId = ordenId ?? "ORD-UNKNOWN",
                    DireccionDestino = direccion ?? "Ciudad de Guatemala",
                    UbicacionOrigen = origen,
                    CodigoRastreo = codigoRastreo,
                    Estado = "PENDIENTE",
                    MetodoPago = metodoPago,
                    FechaCreacion = DateTime.UtcNow
                };

                using (var scope = _scopeFactory.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<LogisticaDbContext>();
                    dbContext.Despachos.Add(despacho);

                    var rastreo = new Rastreo
                    {
                        Id = Guid.NewGuid().ToString(),
                        CodigoRastreo = codigoRastreo,
                        Estado = "PENDIENTE",
                        UbicacionActual = origen,
                        Timestamp = DateTime.UtcNow
                    };
                    dbContext.Rastreos.Add(rastreo);

                    await dbContext.SaveChangesAsync();
                }

                _logger.LogInformation("Despacho creado exitosamente: {Id} con guia {Guia} (metodoPago: {MetodoPago})", despacho.Id, codigoRastreo, metodoPago);
                _channel?.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error procesando mensaje en Logistica: {Message}", ex.Message);
                try
                {
                    _channel?.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
                }
                catch { }
            }
        }

        public override Task StopAsync(CancellationToken cancellationToken)
        {
            _channel?.Close();
            _connection?.Close();
            return base.StopAsync(cancellationToken);
        }
    }
}