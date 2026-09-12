namespace LogisticaService
{
    public class Despacho
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string OrdenId { get; set; } = string.Empty;
        public string UbicacionOrigen { get; set; } = "CD_NORTE";
        public string DireccionDestino { get; set; } = string.Empty;
        public string CodigoRastreo { get; set; } = string.Empty;
        public string Estado { get; set; } = "PENDIENTE"; // PENDIENTE, PREPARADO, EN_TRANSITO, ENTREGADO
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        public DateTime? FechaEntrega { get; set; }
    }
}
