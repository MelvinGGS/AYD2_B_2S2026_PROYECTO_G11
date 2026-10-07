using System.ComponentModel.DataAnnotations;

namespace LogisticaService
{
    public class Rastreo
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CodigoRastreo { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string UbicacionActual { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}