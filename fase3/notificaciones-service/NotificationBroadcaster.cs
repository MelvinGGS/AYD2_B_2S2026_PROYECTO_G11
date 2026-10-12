using System.Threading.Channels;

namespace NotificacionesService
{
    public class NotificationBroadcaster
    {
        private readonly ILogger<NotificationBroadcaster> _logger;
        private readonly WebSocketNotificationHub _webSocketHub;
        private static readonly List<NotificationMessage> History = new();
        private static long _sequenceId = 0;

        // Canal reactivo de eventos para Server-Sent Events (SSE)
        private readonly Channel<NotificationMessage> _channel = Channel.CreateUnbounded<NotificationMessage>(new UnboundedChannelOptions
        {
            SingleWriter = false,
            SingleReader = false
        });

        public NotificationBroadcaster(ILogger<NotificationBroadcaster> logger, WebSocketNotificationHub webSocketHub)
        {
            _logger = logger;
            _webSocketHub = webSocketHub;
        }

        public ChannelReader<NotificationMessage> Reader => _channel.Reader;

        public static List<NotificationMessage> GetHistory(int count = 50)
        {
            lock (History)
            {
                return History.OrderByDescending(x => x.Id).Take(count).ToList();
            }
        }

        public static List<NotificationMessage> GetHistorySince(long lastId)
        {
            lock (History)
            {
                return History.Where(x => x.Id > lastId).OrderBy(x => x.Id).ToList();
            }
        }

        public async Task BroadcastAsync(NotificationMessage message)
        {
            message.Id = Interlocked.Increment(ref _sequenceId);
            message.Fecha = DateTime.UtcNow;

            lock (History)
            {
                History.Add(message);
                if (History.Count > 200)
                {
                    History.RemoveAt(0);
                }
            }

            // Empujar a clientes WebSockets
            await _webSocketHub.BroadcastAsync(message);

            // Empujar a suscriptores SSE
            _channel.Writer.TryWrite(message);

            _logger.LogInformation("[REACTIVO PUSH] Notificación empujada: {Titulo} [{Evento}] para orden: {OrdenId}", 
                message.Titulo, message.Evento, message.OrdenId ?? "N/A");
        }
    }
}
