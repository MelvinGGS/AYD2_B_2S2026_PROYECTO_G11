using Microsoft.AspNetCore.Mvc;

namespace NotificacionesService
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificacionesController : ControllerBase
    {
        [HttpGet("logs")]
        public IActionResult GetLogs()
        {
            var logs = RabbitMQConsumerService.GetLogs();
            return Ok(new
            {
                servicio = "Servicio de Notificaciones (.NET 8 C#)",
                puerto = 8086,
                totalNotificaciones = logs.Count,
                logs = logs
            });
        }

        [HttpPost("enviar")]
        public IActionResult Enviar([FromBody] NotificationLog request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Evento))
            {
                return BadRequest(new { error = "El evento y contenido son requeridos." });
            }
            request.Fecha = DateTime.UtcNow;
            RabbitMQConsumerService.RegistrarNotificacion(request.Evento, request.Contenido);
            return Ok(new
            {
                estado = "ENVIADA",
                canal = "SMS / Email Omnicanal",
                mensaje = "Notificacion procesada y registrada exitosamente.",
                notificacion = request
            });
        }

        [HttpPost("simular")]
        public IActionResult Simular([FromBody] object payload)
        {
            return Ok(new
            {
                estado = "ENVIADA",
                canal = "SMS / Email Desacoplado",
                mensaje = "Notificacion de prueba enviada al cliente.",
                payload
            });
        }

        [HttpGet("stream")]
        public async Task StreamNotifications(CancellationToken cancellationToken)
        {
            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("Connection", "keep-alive");

            int ultimoConteo = 0;
            while (!cancellationToken.IsCancellationRequested)
            {
                var logs = RabbitMQConsumerService.GetLogs();
                if (logs.Count > ultimoConteo)
                {
                    var nuevos = logs.Take(logs.Count - ultimoConteo);
                    foreach (var log in nuevos)
                    {
                        var data = System.Text.Json.JsonSerializer.Serialize(log);
                        await Response.WriteAsync($"data: {data}\n\n", cancellationToken);
                        await Response.Body.FlushAsync(cancellationToken);
                    }
                    ultimoConteo = logs.Count;
                }
                await Task.Delay(1000, cancellationToken);
            }
        }
    }
}
