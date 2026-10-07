using System.Text;
using System.Text.Json;

namespace LogisticaService.Services
{
    public class MockLogiExpressService
    {
        private readonly ILogger<MockLogiExpressService> _logger;
        private readonly Random _random = new Random();

        public MockLogiExpressService(ILogger<MockLogiExpressService> logger)
        {
            _logger = logger;
        }

        public async Task<CrearGuiaResponse> CrearGuia(CrearGuiaRequest request)
        {
            await Task.CompletedTask;
            try
            {
                var hashSuffix = Math.Abs((request.OrdenId ?? Guid.NewGuid().ToString()).GetHashCode()) % 9000 + 1000;
                var numeroGuia = "LX-" + DateTime.UtcNow.ToString("yyyyMMdd") + "-" + hashSuffix;

                var response = new CrearGuiaResponse
                {
                    NumeroGuia = numeroGuia,
                    Estado = "GENERADA",
                    FechaGeneracion = DateTime.UtcNow,
                    Exito = true
                };

                _logger.LogInformation($"[LOGIEXPRESS CARRIER] Guia oficial generada: {response.NumeroGuia} para Orden: {request.OrdenId}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en LogiExpress carrier: {ex.Message}");
                throw;
            }
        }

        public async Task<RastreoLogiExpressResponse> ObtenerRastreo(string numeroGuia)
        {
            await Task.CompletedTask;
            try
            {
                var response = new RastreoLogiExpressResponse
                {
                    NumeroGuia = numeroGuia,
                    EstadoActual = "EN_TRANSITO",
                    Ubicacion = "Centro de Distribucion Metropolitano, Guatemala",
                    FechaActualizacion = DateTime.UtcNow
                };

                _logger.LogInformation($"[LOGIEXPRESS] Rastreo consultado para guia: {numeroGuia}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener rastreo en LogiExpress: {ex.Message}");
                throw;
            }
        }
    }

    public class CrearGuiaRequest
    {
        public string? OrdenId { get; set; }
        public string? DireccionDestino { get; set; }
        public string? UbicacionOrigen { get; set; }
    }

    public class CrearGuiaResponse
    {
        public string? NumeroGuia { get; set; }
        public string? Estado { get; set; }
        public DateTime FechaGeneracion { get; set; }
        public bool Exito { get; set; }
    }

    public class RastreoLogiExpressResponse
    {
        public string? NumeroGuia { get; set; }
        public string? EstadoActual { get; set; }
        public string? Ubicacion { get; set; }
        public DateTime FechaActualizacion { get; set; }
    }
}