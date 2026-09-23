using System.Text;
using System.Text.Json;

namespace LogisticaService.Tests
{
    public class LogisticaE2ETests
    {
        private readonly HttpClient _client;
        private readonly string _baseUrl = "http://localhost:8085/api/logistica";

        public LogisticaE2ETests()
        {
            _client = new HttpClient();
        }

        public async Task PruebaFlujoPrincipal()
        {
            Console.WriteLine("Iniciando prueba E2E de flujo principal...");

            var crearDespachoRequest = new
            {
                ordenId = "ORD-001",
                direccionDestino = "Avenida La Reforma, Ciudad de Guatemala"
            };

            var jsonContent = new StringContent(
                JsonSerializer.Serialize(crearDespachoRequest),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _client.PostAsync($"{_baseUrl}/despacho", jsonContent);
            if (!response.IsSuccessStatusCode)
                throw new Exception($"Error al crear despacho: {response.StatusCode}");

            var responseBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            var codigoRastreo = doc.RootElement.GetProperty("codigoRastreo").GetString();

            Console.WriteLine($"Despacho creado con código: {codigoRastreo}");

            await Task.Delay(2000);

            var rastreoResponse = await _client.GetAsync($"{_baseUrl}/rastreo/{codigoRastreo}");
            if (!rastreoResponse.IsSuccessStatusCode)
                throw new Exception($"Error al obtener rastreo: {rastreoResponse.StatusCode}");

            Console.WriteLine("Rastreo obtenido exitosamente");

            var updateEstadoRequest = new { nuevoEstado = "PREPARADO", ubicacionActual = "CD_NORTE" };
            var updateContent = new StringContent(
                JsonSerializer.Serialize(updateEstadoRequest),
                Encoding.UTF8,
                "application/json"
            );

            var updateResponse = await _client.PutAsync($"{_baseUrl}/despacho/{codigoRastreo}/estado", updateContent);
            if (!updateResponse.IsSuccessStatusCode)
                throw new Exception($"Error al actualizar estado: {updateResponse.StatusCode}");

            Console.WriteLine("Estado actualizado a PREPARADO");

            Console.WriteLine("Prueba E2E finalizada exitosamente");
        }
    }
}