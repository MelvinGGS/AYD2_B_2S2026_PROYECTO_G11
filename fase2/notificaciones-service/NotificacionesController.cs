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
    }
}
