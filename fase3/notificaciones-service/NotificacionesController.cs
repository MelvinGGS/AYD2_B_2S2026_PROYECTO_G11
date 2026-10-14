using Microsoft.AspNetCore.Mvc;

namespace NotificacionesService
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificacionesController : ControllerBase
    {
        private readonly NotificationBroadcaster _broadcaster;
        private readonly WebSocketNotificationHub _webSocketHub;

        public NotificacionesController(NotificationBroadcaster broadcaster, WebSocketNotificationHub webSocketHub)
        {
            _broadcaster = broadcaster;
            _webSocketHub = webSocketHub;
        }

        [HttpGet("logs")]
        public IActionResult GetLogs([FromQuery] int limite = 50)
        {
            var logs = NotificationBroadcaster.GetHistory(limite);
            return Ok(new
            {
                servicio = "Servicio Reactivo de Notificaciones (.NET 8 C#)",
                puerto = 8086,
                clientesWebSocketConectados = _webSocketHub.ConnectedClientsCount,
                totalNotificaciones = logs.Count,
                logs
            });
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok(new
            {
                servicio = "notificaciones-service",
                estado = "OPERATIVO",
                rabbitmq = "Conectado",
                clientesWebSocketActivos = _webSocketHub.ConnectedClientsCount,
                timestamp = DateTime.UtcNow
            });
        }

        [HttpGet("stats")]
        public IActionResult GetStats()
        {
            return Ok(new
            {
                servicio = "notificaciones-service",
                protocolos = new[] { "WebSockets (ws://...)", "Server-Sent Events (SSE /stream)" },
                clientesWebSocketActivos = _webSocketHub.ConnectedClientsCount,
                timestamp = DateTime.UtcNow
            });
        }

        [HttpPost("enviar")]
        public async Task<IActionResult> Enviar([FromBody] NotificationMessage request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Evento))
            {
                return BadRequest(new { error = "El evento y contenido son requeridos." });
            }

            if (string.IsNullOrWhiteSpace(request.Titulo)) request.Titulo = "Notificación Manual";
            if (string.IsNullOrWhiteSpace(request.Mensaje)) request.Mensaje = "Mensaje emitido vía API REST";

            await _broadcaster.BroadcastAsync(request);

            return Ok(new
            {
                estado = "EMITIDO_REACTIVAMENTE",
                canales = "WebSockets + SSE",
                mensaje = "Notificación empujada a todos los clientes reactivos suscritos.",
                notificacion = request
            });
        }

        [HttpPost("simular")]
        public async Task<IActionResult> Simular([FromBody] SimularEventoRequest request)
        {
            var notif = new NotificationMessage
            {
                Evento = request.Evento ?? "tracking.actualizado",
                Titulo = request.Titulo ?? "Simulación de Tracking Reactivo",
                Mensaje = request.Mensaje ?? $"La orden {request.OrdenId ?? "ORD-DEMO"} cambió a estado {request.Estado ?? "EN_CAMINO"}.",
                OrdenId = request.OrdenId ?? "ORD-DEMO",
                Tipo = request.Tipo ?? "TRACKING"
            };

            await _broadcaster.BroadcastAsync(notif);

            return Ok(new
            {
                estado = "SIMULACION_EXITOSA",
                empujadoVia = "WebSockets & SSE",
                notificacion = notif
            });
        }

        [HttpGet("stream")]
        public async Task StreamNotifications(CancellationToken cancellationToken)
        {
            await StreamInternal(null, cancellationToken);
        }

        [HttpGet("stream/{ordenId}")]
        public async Task StreamNotificationsPorOrden(string ordenId, CancellationToken cancellationToken)
        {
            await StreamInternal(ordenId, cancellationToken);
        }

        private async Task StreamInternal(string? ordenIdFilter, CancellationToken cancellationToken)
        {
            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");
            Response.Headers.Append("Access-Control-Allow-Origin", "*");

            // Mensaje inicial de handshake
            var handshake = System.Text.Json.JsonSerializer.Serialize(new
            {
                tipo = "SISTEMA",
                mensaje = string.IsNullOrEmpty(ordenIdFilter) 
                    ? "Canal reactivo SSE conectado" 
                    : $"Canal reactivo SSE conectado para la orden: {ordenIdFilter}",
                timestamp = DateTime.UtcNow
            });
            await Response.WriteAsync($"data: {handshake}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);

            long lastProcessedId = 0;

            // Enviar histórico reciente de la orden si aplica
            var historico = NotificationBroadcaster.GetHistory(20);
            foreach (var h in historico.OrderBy(x => x.Id))
            {
                if (string.IsNullOrEmpty(ordenIdFilter) || string.Equals(h.OrdenId, ordenIdFilter, StringComparison.OrdinalIgnoreCase))
                {
                    var data = System.Text.Json.JsonSerializer.Serialize(h);
                    await Response.WriteAsync($"data: {data}\n\n", cancellationToken);
                    await Response.Body.FlushAsync(cancellationToken);
                    if (h.Id > lastProcessedId) lastProcessedId = h.Id;
                }
            }

            // Escuchar el canal reactivo sin polling
            var reader = _broadcaster.Reader;
            try
            {
                while (await reader.WaitToReadAsync(cancellationToken))
                {
                    while (reader.TryRead(out var msg))
                    {
                        if (msg.Id <= lastProcessedId) continue;

                        if (string.IsNullOrEmpty(ordenIdFilter) || 
                            string.Equals(msg.OrdenId, ordenIdFilter, StringComparison.OrdinalIgnoreCase) ||
                            msg.OrdenId == null)
                        {
                            var data = System.Text.Json.JsonSerializer.Serialize(msg);
                            await Response.WriteAsync($"data: {data}\n\n", cancellationToken);
                            await Response.Body.FlushAsync(cancellationToken);
                            lastProcessedId = msg.Id;
                        }
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Cliente cerró la conexión SSE limpiamente
            }
        }
    }

    public class SimularEventoRequest
    {
        public string? Evento { get; set; }
        public string? Titulo { get; set; }
        public string? Mensaje { get; set; }
        public string? OrdenId { get; set; }
        public string? Tipo { get; set; }
        public string? Estado { get; set; }
    }
}
