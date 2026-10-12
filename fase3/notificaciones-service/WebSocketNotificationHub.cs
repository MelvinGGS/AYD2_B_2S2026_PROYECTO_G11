using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace NotificacionesService
{
    public class WebSocketNotificationHub
    {
        private readonly ILogger<WebSocketNotificationHub> _logger;
        private readonly ConcurrentDictionary<string, (WebSocket Socket, string? OrdenIdFilter)> _clients = new();

        public WebSocketNotificationHub(ILogger<WebSocketNotificationHub> logger)
        {
            _logger = logger;
        }

        public int ConnectedClientsCount => _clients.Count;

        public async Task HandleWebSocketAsync(WebSocket webSocket, string? ordenIdFilter, CancellationToken cancellationToken)
        {
            var connectionId = Guid.NewGuid().ToString();
            _clients.TryAdd(connectionId, (webSocket, ordenIdFilter));
            _logger.LogInformation("[WEBSOCKET HUB] Cliente conectado ID: {ConnectionId} (Filtro Orden: {OrdenId}) | Total activos: {Total}", 
                connectionId, ordenIdFilter ?? "TODAS", _clients.Count);

            // Enviar mensaje de bienvenida / handshake
            var welcomeMsg = new NotificationMessage
            {
                Id = 0,
                Evento = "conexion.establecida",
                Titulo = "Conexión Reactiva Establecida",
                Mensaje = string.IsNullOrEmpty(ordenIdFilter) 
                    ? "Conectado al canal global de notificaciones reactivas (WebSockets)" 
                    : $"Suscrito a eventos reactivos de la orden: {ordenIdFilter}",
                OrdenId = ordenIdFilter,
                Tipo = "SISTEMA",
                Fecha = DateTime.UtcNow
            };
            await SendDirectAsync(webSocket, welcomeMsg, cancellationToken);

            var buffer = new byte[1024 * 4];

            try
            {
                while (webSocket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Cerrado por cliente", cancellationToken);
                        break;
                    }
                    else if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var incomingText = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        _logger.LogDebug("[WEBSOCKET RECV] De {ConnectionId}: {Text}", connectionId, incomingText);

                        // Si el cliente envía ping, responder pong
                        if (incomingText.Trim().Equals("ping", StringComparison.OrdinalIgnoreCase))
                        {
                            var pongBytes = Encoding.UTF8.GetBytes("pong");
                            await webSocket.SendAsync(new ArraySegment<byte>(pongBytes), WebSocketMessageType.Text, true, cancellationToken);
                        }
                    }
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning("[WEBSOCKET] Conexión interrumpida para {ConnectionId}: {Error}", connectionId, ex.Message);
            }
            finally
            {
                _clients.TryRemove(connectionId, out _);
                _logger.LogInformation("[WEBSOCKET HUB] Cliente desconectado ID: {ConnectionId} | Total activos: {Total}", connectionId, _clients.Count);
            }
        }

        public async Task BroadcastAsync(NotificationMessage message, CancellationToken cancellationToken = default)
        {
            var json = JsonSerializer.Serialize(message);
            var bytes = Encoding.UTF8.GetBytes(json);
            var buffer = new ArraySegment<byte>(bytes);

            var tasks = new List<Task>();

            foreach (var kvp in _clients)
            {
                var connectionId = kvp.Key;
                var (socket, filter) = kvp.Value;

                if (socket.State != WebSocketState.Open)
                {
                    _clients.TryRemove(connectionId, out _);
                    continue;
                }

                // Filtrar si el cliente se suscribió a una orden específica
                if (!string.IsNullOrEmpty(filter) && !string.IsNullOrEmpty(message.OrdenId))
                {
                    if (!string.Equals(filter, message.OrdenId, StringComparison.OrdinalIgnoreCase))
                    {
                        continue; // No coincide con la orden solicitada por este cliente
                    }
                }

                tasks.Add(Task.Run(async () =>
                {
                    try
                    {
                        await socket.SendAsync(buffer, WebSocketMessageType.Text, true, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning("[WEBSOCKET SEND ERROR] Error enviando a {ConnectionId}: {Error}", connectionId, ex.Message);
                        _clients.TryRemove(connectionId, out _);
                    }
                }, cancellationToken));
            }

            if (tasks.Count > 0)
            {
                await Task.WhenAll(tasks);
                _logger.LogInformation("[WEBSOCKET BROADCAST] Notificación ID {Id} ({Evento}) enviada a {Count} clientes activos.", 
                    message.Id, message.Evento, tasks.Count);
            }
        }

        private static async Task SendDirectAsync(WebSocket socket, NotificationMessage message, CancellationToken cancellationToken)
        {
            if (socket.State == WebSocketState.Open)
            {
                var json = JsonSerializer.Serialize(message);
                var bytes = Encoding.UTF8.GetBytes(json);
                await socket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, cancellationToken);
            }
        }
    }
}
