using LogisticaService.Data;
using LogisticaService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LogisticaService.Controllers
{
    [ApiController]
    [Route("api/logistica")]
    public class LogisticaController : ControllerBase
    {
        private readonly LogisticaDbContext _dbContext;
        private readonly ILogger<LogisticaController> _logger;
        private readonly MockLogiExpressService _mockLogiExpress;
        private readonly IConfiguration _configuration;

        public LogisticaController(
            LogisticaDbContext dbContext,
            ILogger<LogisticaController> logger,
            MockLogiExpressService mockLogiExpress,
            IConfiguration configuration)
        {
            _dbContext = dbContext;
            _logger = logger;
            _mockLogiExpress = mockLogiExpress;
            _configuration = configuration;
        }

        [HttpPost("despacho")]
        public async Task<ActionResult<Despacho>> CrearDespacho([FromBody] CreateDespachoRequest request)
        {
            try
            {
                var origen = LogisticaManagerService.DeterminarOrigenOptimo(request.DireccionDestino);
                var metodoPago = LogisticaManagerService.NormalizarMetodoPago(request.MetodoPago);

                var despacho = new Despacho
                {
                    Id = Guid.NewGuid().ToString(),
                    OrdenId = request.OrdenId,
                    UbicacionOrigen = origen,
                    DireccionDestino = request.DireccionDestino,
                    CodigoRastreo = GenerarCodigoRastreo(),
                    Estado = "PENDIENTE",
                    MetodoPago = metodoPago,
                    FechaCreacion = DateTime.UtcNow
                };

                _dbContext.Despachos.Add(despacho);
                await _dbContext.SaveChangesAsync();

                var rastreo = new Rastreo
                {
                    Id = Guid.NewGuid().ToString(),
                    CodigoRastreo = despacho.CodigoRastreo,
                    Estado = "PENDIENTE",
                    UbicacionActual = origen,
                    Timestamp = DateTime.UtcNow
                };

                _dbContext.Rastreos.Add(rastreo);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation($"Despacho creado: {despacho.Id} (metodoPago: {despacho.MetodoPago})");
                return CreatedAtAction(nameof(ObtenerRastreo), new { codigoRastreo = despacho.CodigoRastreo }, despacho);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al crear despacho: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("rastreo/{codigoRastreo}")]
        public async Task<ActionResult<dynamic>> ObtenerRastreo(string codigoRastreo)
        {
            try
            {
                var despacho = await _dbContext.Despachos
                    .FirstOrDefaultAsync(d => d.CodigoRastreo == codigoRastreo);

                if (despacho == null)
                    return NotFound(new { error = "Despacho no encontrado" });

                var rastreos = await _dbContext.Rastreos
                    .Where(r => r.CodigoRastreo == codigoRastreo)
                    .OrderByDescending(r => r.Timestamp)
                    .ToListAsync();

                return Ok(new { despacho, historial = rastreos });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener rastreo: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("despacho/{id}/estado")]
        public async Task<ActionResult> ActualizarEstado(string id, [FromBody] UpdateEstadoRequest request)
        {
            try
            {
                var despacho = await _dbContext.Despachos.FindAsync(id)
                    ?? await _dbContext.Despachos.FirstOrDefaultAsync(d => d.CodigoRastreo == id);
                if (despacho == null)
                    return NotFound(new { error = "Despacho no encontrado" });

                if (!LogisticaManagerService.ValidarTransicionEstado(despacho.Estado, request.NuevoEstado))
                    return BadRequest(new { error = $"Transición inválida de {despacho.Estado} a {request.NuevoEstado}" });

                despacho.Estado = request.NuevoEstado.ToUpper();
                if (request.NuevoEstado.Equals("ENTREGADO", StringComparison.OrdinalIgnoreCase))
                    despacho.FechaEntrega = DateTime.UtcNow;

                _dbContext.Despachos.Update(despacho);
                await _dbContext.SaveChangesAsync();

                var ubicacion = request.UbicacionActual ?? despacho.UbicacionOrigen;
                var rastreo = new Rastreo
                {
                    Id = Guid.NewGuid().ToString(),
                    CodigoRastreo = despacho.CodigoRastreo,
                    Estado = request.NuevoEstado.ToUpper(),
                    UbicacionActual = ubicacion,
                    Timestamp = DateTime.UtcNow
                };

                _dbContext.Rastreos.Add(rastreo);
                await _dbContext.SaveChangesAsync();

                LogisticaManagerService.PublicarEventoDespacho(_configuration, despacho, ubicacion);

                _logger.LogInformation($"Despacho {id} actualizado a {request.NuevoEstado}");
                return Ok(new { mensaje = "Estado actualizado", despacho });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al actualizar estado: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("despacho/{id}")]
        public async Task<ActionResult<Despacho>> ObtenerDespacho(string id)
        {
            try
            {
                var despacho = await _dbContext.Despachos.FindAsync(id)
                    ?? await _dbContext.Despachos.FirstOrDefaultAsync(d => d.CodigoRastreo == id);
                if (despacho == null)
                    return NotFound(new { error = "Despacho no encontrado" });

                return Ok(despacho);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener despacho: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("api/logiexpress/guia")]
        [HttpPost("mock/logiexpress/guia")]
        public async Task<ActionResult<CrearGuiaResponse>> CrearGuiaMockLogiExpress([FromBody] CrearGuiaRequest request)
        {
            try
            {
                var response = await _mockLogiExpress.CrearGuia(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error en LogiExpress: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("api/logiexpress/rastreo/{numeroGuia}")]
        [HttpGet("mock/logiexpress/rastreo/{numeroGuia}")]
        public async Task<ActionResult<RastreoLogiExpressResponse>> ObtenerRastreoMockLogiExpress(string numeroGuia)
        {
            try
            {
                var response = await _mockLogiExpress.ObtenerRastreo(numeroGuia);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error al obtener rastreo: {ex.Message}");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        private string GenerarCodigoRastreo()
        {
            return "TRACK-" + DateTime.UtcNow.Ticks.ToString().Substring(0, 10) + "-" + Random.Shared.Next(1000, 9999);
        }
    }

    public class CreateDespachoRequest
    {
        public string OrdenId { get; set; } = string.Empty;
        public string DireccionDestino { get; set; } = string.Empty;
        public string? MetodoPago { get; set; }
    }

    public class UpdateEstadoRequest
    {
        public string NuevoEstado { get; set; } = string.Empty;
        public string? UbicacionActual { get; set; }
    }
}