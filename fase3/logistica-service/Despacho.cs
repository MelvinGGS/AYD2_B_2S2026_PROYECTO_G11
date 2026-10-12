using System.ComponentModel.DataAnnotations;

namespace LogisticaService
{
    public class Despacho
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string OrdenId { get; set; } = string.Empty;
        public string UbicacionOrigen { get; set; } = "CD_NORTE";
        public string DireccionDestino { get; set; } = string.Empty;
        public string CodigoRastreo { get; set; } = string.Empty;
        public string Estado { get; set; } = "PENDIENTE";
        // Metodo con el que se confirmo la orden: PAYKLIK o CREDITO_PROPIO_30D
        public string MetodoPago { get; set; } = "PAYKLIK";
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaEntrega { get; set; }
    }
} 