using System.Text;
using System.Text.Json;
using LogisticaService.Data;
using LogisticaService.Services;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace LogisticaService.Consumers
{
    public class DespachoSolicitadoConsumer : BackgroundService
    {
        private readonly ILogger<DespachoSolicitadoConsumer> _logger;
        private readonly LogisticaDbContext _dbContext;
        private readonly MockLogiExpressService _mockLogiExpress;
        private IConnection? _connection;
        private IChannel? _channel;
        private readonly string _rabbitMqHost;
        private readonly int _rabbitMqPort;
        private readonly string _rabbitMqUsername;
        private readonly string _rabbitMqPassword;

        public DespachoSolicitadoConsumer(
            ILogger<DespachoSolicitadoConsumer> logger,
            LogisticaDbContext dbContext,
            MockLogiExpressService mockLogiExpress,
            IConfiguration configuration)
        {
            _logger = logger;
            _dbContext = dbContext;
            _mockLogiExpress = mockLogiExpress;
            _rabbitMqHost = configuration["RabbitMQ:Host"] ?? "localhost";
            _rabbitMqPort = int.Parse(configuration["RabbitMQ:Port"] ?? "5672");
            _rabbitMqUsername = configuration["RabbitMQ:Username"] ?? "guest";
            _rabbitMqPassword = configuration["RabbitMQ:Password"] ?? "guest";
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await ConectarRabbitMQ(stoppingToken);
        }

        private async Task ConectarRabbitMQ(CancellationToken stoppingToken)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _rabbitMqHost,
                    Port = _rabbitMqPort,
                    UserName = _rabbitMqUsername,
                    Password = _rabbitMqPassword,
                    DispatchConsumersAsync = true,
                    AutomaticRecoveryEnabled = true,
                    NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
                };

                _connection = await factory.CreateConnectionAsync(stoppingToken);
                _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);

                var exchange = "sgologic.exchange";
                var queue = "logistica.despacho.solicitado";
                var dlq = "logistica.dlq";
                var routingKey = "despacho.solicitado";

                await _channel.ExchangeDeclareAsync(exchange, "topic", durable: true, autoDelete: false, cancellationToken: stoppingToken);
                await _channel.QueueDeclareAsync(queue, durable: true, exclusive: false, autoDelete: false, cancellationToken: stoppingToken);
                await _channel.QueueDeclareAsync(dlq, durable: true, exclusive: false, autoDelete: false, cancellationToken: stoppingToken);
                await _channel.QueueBindAsync(queue, exchange, routingKey, cancellationToken: stoppingToken);

                var consumer = new AsyncEventingBasicConsumer(_channel);
                consumer.ReceivedAsync += async (model, ea) =>
                {
                    await ProcessarMensaje(ea, stoppingToken);
                };

                await _channel.BasicConsumeAsync(queue, false, "", false, false, consumerTagArguments: null, consumer, stoppingToken);

                _logger.LogInformation("DespachoSolicitadoConsumer conectado y escuchando");

                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(1000, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en DespachoSolicitadoConsumer: {ex.Message}");
                await Task.Delay(5000);
                await ConectarRabbitMQ(stoppingToken);
            }
        }

        private async Task ProcessarMensaje(BasicDeliverEventArgs ea, CancellationToken stoppingToken)
        {
            try
            {
                var message = Encoding.UTF8.GetString(ea.Body.ToArray());
                _logger.LogInformation($"Mensaje recibido: {message}");

                using var doc = JsonDocument.Parse(message);
                var root = doc.RootElement;
                
                var ordenId = root.GetProperty("ordenId").GetString();
                var direccion = root.GetProperty("direccionDestino").GetString();

                var despacho = new Despacho
                {
                    Id = Guid.NewGuid().ToString(),
                    OrdenId = ordenId,
                    DireccionDestino = direccion,
                    UbicacionOrigen = LogisticaManagerService.DeterminarOrigenOptimo(direccion),
                    CodigoRastreo = "TRACK-" + DateTime.UtcNow.Ticks.ToString().Substring(0, 10),
                    Estado = "PENDIENTE",
                    FechaCreacion = DateTime.UtcNow
                };

                _dbContext.Despachos.Add(despacho);
                await _dbContext.SaveChangesAsync(stoppingToken);

                _logger.LogInformation($"Despacho procesado: {despacho.Id}");
                await _channel!.BasicAckAsync(ea.DeliveryTag, false, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error procesando mensaje: {ex.Message}");
                if (_channel != null)
                {
                    await _channel.BasicNackAsync(ea.DeliveryTag, false, true, stoppingToken);
                }
            }
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_channel != null)
                await _channel.CloseAsync(cancellationToken);
            if (_connection != null)
                await _connection.CloseAsync(cancellationToken);

            await base.StopAsync(cancellationToken);
        }
    }
}