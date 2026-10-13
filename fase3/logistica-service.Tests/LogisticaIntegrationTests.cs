using System.Net;
using System.Net.Http.Json;
using LogisticaService.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace LogisticaService.Tests
{
    // pruebas de integracion
    public class LogisticaIntegrationTests : IClassFixture<LogisticaApiFactory>
    {
        private const string BaseUrl = "/api/logistica";
        private readonly LogisticaApiFactory _factory;
        private readonly HttpClient _client;

        public LogisticaIntegrationTests(LogisticaApiFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        // la prueba 1 es una orden confirmada por credito propio se despacha y queda guardada con su metodo de pago
        [Fact]
        public async Task CrearDespacho_ConCreditoPropio_PersisteMetodoPagoYRastreoInicial()
        {
            var response = await _client.PostAsJsonAsync($"{BaseUrl}/despacho", new
            {
                ordenId = "IT-CR-001",
                direccionDestino = "Escuintla",
                metodoPago = "credito_propio"
            });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var despacho = await response.Content.ReadFromJsonAsync<Despacho>();
            Assert.NotNull(despacho);
            Assert.Equal(LogisticaManagerService.MetodoCreditoPropio, despacho!.MetodoPago);
            Assert.Equal("CD_SUR", despacho.UbicacionOrigen);
            Assert.Equal("PENDIENTE", despacho.Estado);
            Assert.StartsWith("TRACK-", despacho.CodigoRastreo);

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<LogisticaDbContext>();
            var guardado = await db.Despachos.SingleAsync(d => d.Id == despacho.Id);
            Assert.Equal(LogisticaManagerService.MetodoCreditoPropio, guardado.MetodoPago);

            var rastreos = await db.Rastreos.Where(r => r.CodigoRastreo == despacho.CodigoRastreo).ToListAsync();
            var inicial = Assert.Single(rastreos);
            Assert.Equal("PENDIENTE", inicial.Estado);
            Assert.Equal("CD_SUR", inicial.UbicacionActual);
        }

        // la prueba 2 los clientes que aun no envian metodoPago siguen funcionando, se usa Paylik por defecto
        [Fact]
        public async Task CrearDespacho_SinMetodoPago_AsumePayKlikPorDefecto()
        {
            var response = await _client.PostAsJsonAsync($"{BaseUrl}/despacho", new
            {
                ordenId = "IT-PK-001",
                direccionDestino = "Pickup Tienda Zona 4"
            });

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var despacho = await response.Content.ReadFromJsonAsync<Despacho>();
            Assert.Equal(LogisticaManagerService.MetodoPayKlik, despacho!.MetodoPago);
            Assert.Equal("TIENDA_CENTRAL_01", despacho.UbicacionOrigen);

            var consulta = await _client.GetFromJsonAsync<Despacho>($"{BaseUrl}/despacho/{despacho.Id}");
            Assert.Equal(LogisticaManagerService.MetodoPayKlik, consulta!.MetodoPago);
        }

        // la prueba 3 es de la seleccion de despacho optimo (CD Norte, CD Sur, Tienda) no cambia segun el metodo de pago
        [Theory]
        [InlineData("Zona 10, Ciudad de Guatemala", "CD_NORTE")]
        [InlineData("Escuintla, Costa Sur", "CD_SUR")]
        [InlineData("Pickup Tienda Zona 4", "TIENDA_CENTRAL_01")]
        public async Task SeleccionDeOrigen_EsLaMismaParaPayKlikYCreditoPropio(string direccion, string origenEsperado)
        {
            var conPayKlik = await CrearDespacho("IT-ORIGEN-PK", direccion, "PAYKLIK");
            var conCredito = await CrearDespacho("IT-ORIGEN-CR", direccion, "CREDITO_PROPIO_30D");

            Assert.Equal(origenEsperado, conPayKlik.UbicacionOrigen);
            Assert.Equal(origenEsperado, conCredito.UbicacionOrigen);
            Assert.Equal(LogisticaManagerService.MetodoPayKlik, conPayKlik.MetodoPago);
            Assert.Equal(LogisticaManagerService.MetodoCreditoPropio, conCredito.MetodoPago);
        }

        // la prueba 4 esuna orden a credito recorre toda la maquina de estados y el historial lo refleja
        [Fact]
        public async Task OrdenACredito_RecorreMaquinaDeEstadosCompletaHastaEntregado()
        {
            var despacho = await CrearDespacho("IT-FLUJO-CR", "Escuintla", "credito_propio");

            foreach (var estado in new[] { "PREPARADO", "EN_TRANSITO", "ENTREGADO" })
            {
                var response = await ActualizarEstado(despacho.CodigoRastreo, estado);
                Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            }

            var rastreo = await _client.GetFromJsonAsync<RastreoRespuesta>($"{BaseUrl}/rastreo/{despacho.CodigoRastreo}");
            Assert.NotNull(rastreo);
            Assert.Equal("ENTREGADO", rastreo!.Despacho.Estado);
            Assert.NotNull(rastreo.Despacho.FechaEntrega);
            Assert.Equal(LogisticaManagerService.MetodoCreditoPropio, rastreo.Despacho.MetodoPago);

            var estadosEnOrden = rastreo.Historial.OrderBy(r => r.Timestamp).Select(r => r.Estado);
            Assert.Equal(new[] { "PENDIENTE", "PREPARADO", "EN_TRANSITO", "ENTREGADO" }, estadosEnOrden);
        }

        // la prueba 5 son las transiciones invalidas se rechazan y no alteran el estado ni el historial
        [Fact]
        public async Task TransicionesInvalidas_RetornanBadRequestYNoAlteranElDespacho()
        {
            var despacho = await CrearDespacho("IT-INVALIDO-CR", "Zona 10", "credito_propio");

            // Saltarse PREPARADO
            var salto = await ActualizarEstado(despacho.CodigoRastreo, "EN_TRANSITO");
            Assert.Equal(HttpStatusCode.BadRequest, salto.StatusCode);

            // Estado vacio
            var nulo = await _client.PutAsJsonAsync($"{BaseUrl}/despacho/{despacho.CodigoRastreo}/estado", new { nuevoEstado = (string?)null });
            Assert.Equal(HttpStatusCode.BadRequest, nulo.StatusCode);

            var sigue = await _client.GetFromJsonAsync<RastreoRespuesta>($"{BaseUrl}/rastreo/{despacho.CodigoRastreo}");
            Assert.Equal("PENDIENTE", sigue!.Despacho.Estado);
            Assert.Single(sigue.Historial);

            // Retroceder desde un estado terminal
            await ActualizarEstado(despacho.CodigoRastreo, "PREPARADO");
            await ActualizarEstado(despacho.CodigoRastreo, "EN_TRANSITO");
            await ActualizarEstado(despacho.CodigoRastreo, "ENTREGADO");
            var retroceso = await ActualizarEstado(despacho.CodigoRastreo, "PREPARADO");
            Assert.Equal(HttpStatusCode.BadRequest, retroceso.StatusCode);

            var final = await _client.GetFromJsonAsync<RastreoRespuesta>($"{BaseUrl}/rastreo/{despacho.CodigoRastreo}");
            Assert.Equal("ENTREGADO", final!.Despacho.Estado);
            Assert.Equal(4, final.Historial.Count);
        }

        private async Task<Despacho> CrearDespacho(string ordenId, string direccion, string metodoPago)
        {
            var response = await _client.PostAsJsonAsync($"{BaseUrl}/despacho", new
            {
                ordenId,
                direccionDestino = direccion,
                metodoPago
            });
            response.EnsureSuccessStatusCode();
            return (await response.Content.ReadFromJsonAsync<Despacho>())!;
        }

        private Task<HttpResponseMessage> ActualizarEstado(string codigoRastreo, string nuevoEstado)
        {
            return _client.PutAsJsonAsync($"{BaseUrl}/despacho/{codigoRastreo}/estado", new { nuevoEstado });
        }

        private record RastreoRespuesta(Despacho Despacho, List<Rastreo> Historial);
    }
}
