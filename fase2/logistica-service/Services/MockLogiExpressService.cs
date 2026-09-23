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
            try
            {
                if (_random.Next(0, 100) < 2)
                {
                    _logger.LogWarning("Mock LogiExpress: Simulando timeout (2%)");
                    await Task.Delay(6000);
                    throw new TimeoutException("Timeout simulado en LogiExpress");
                }

                await Task.Delay(_random.Next(500, 2000));

                var response = new CrearGuiaResponse
                {
                    NumeroGuia = "LX-" + DateTime.UtcNow.Ticks.ToString().Substring(0, 10),
                    Estado = "GENERADA",
                    FechaGeneracion = DateTime.UtcNow,
                    Exito = true
                };

                _logger.LogInformation($"Mock LogiExpress: Guía generada: {response.NumeroGuia}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en mock LogiExpress: {ex.Message}");
                throw;
            }
        }

        public async Task<RastreoLogiExpressResponse> ObtenerRastreo(string numeroGuia)
        {
            try
            {
                await Task.Delay(_random.Next(300, 1000));

                var estados = new[] { "GENERADA", "EN_RECOJO", "EN_TRANSITO", "ENTREGADA" };
                var estadoActual = estados[_random.Next(0, estados.Length)];

                var response = new RastreoLogiExpressResponse
                {
                    NumeroGuia = numeroGuia,
                    EstadoActual = estadoActual,
                    Ubicacion = "Ciudad de Guatemala",
                    FechaActualizacion = DateTime.UtcNow
                };

                _logger.LogInformation($"Mock LogiExpress: Rastreo obtenido para {numeroGuia}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener rastreo: {ex.Message}");
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