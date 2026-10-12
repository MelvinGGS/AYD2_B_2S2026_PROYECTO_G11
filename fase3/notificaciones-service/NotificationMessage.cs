using System.Text.Json.Serialization;

namespace NotificacionesService
{
    public class NotificationMessage
    {
        public long Id { get; set; }
        public string Evento { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Mensaje { get; set; } = string.Empty;
        public string? OrdenId { get; set; }
        public string Tipo { get; set; } = "GENERAL"; // CREDITO, TRACKING, INVENTARIO, PAGO, ORDEN
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public object? Data { get; set; }
    }
}
