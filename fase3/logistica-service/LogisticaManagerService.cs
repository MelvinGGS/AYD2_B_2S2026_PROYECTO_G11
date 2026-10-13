using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace LogisticaService
{
    public class LogisticaManagerService
    {
        public const string MetodoPayKlik = "PAYKLIK";
        public const string MetodoCreditoPropio = "CREDITO_PROPIO_30D";

        // Unifica los nombres que usan
        // Si no viene el dato se asume PAYKLIK para no romper los eventos 
        public static string NormalizarMetodoPago(string? metodoPago)
        {
            if (string.IsNullOrWhiteSpace(metodoPago))
            {
                return MetodoPayKlik;
            }

            var valor = metodoPago.Trim();
            if (valor.Equals("credito_propio", StringComparison.OrdinalIgnoreCase) ||
                valor.Equals(MetodoCreditoPropio, StringComparison.OrdinalIgnoreCase) ||
                valor.Equals("BNPL", StringComparison.OrdinalIgnoreCase))
            {
                return MetodoCreditoPropio;
            }

            return MetodoPayKlik;
        }

        public static string DeterminarOrigenOptimo(string direccionDestino)
        {
            if (string.IsNullOrWhiteSpace(direccionDestino))
            {
                return "CD_NORTE"; // es su orgine por defecto
            }

            if (direccionDestino.Contains("Sur", StringComparison.OrdinalIgnoreCase) ||
                direccionDestino.Contains("Costa", StringComparison.OrdinalIgnoreCase) ||
                direccionDestino.Contains("Escuintla", StringComparison.OrdinalIgnoreCase))
            {
                return "CD_SUR";
            }

            if (direccionDestino.Contains("Tienda", StringComparison.OrdinalIgnoreCase) ||
                direccionDestino.Contains("Pickup", StringComparison.OrdinalIgnoreCase))
            {
                return "TIENDA_CENTRAL_01";
            }

            return "CD_NORTE";
        }

        // se hace el rastreo: PENDIENTE -> PREPARADO -> EN_TRANSITO -> ENTREGADO.
        private static readonly Dictionary<string, List<string>> TransicionesValidas = new()
        {
            { "PENDIENTE", new List<string> { "PREPARADO", "CANCELADO" } },
            { "PREPARADO", new List<string> { "EN_TRANSITO" } },
            { "EN_TRANSITO", new List<string> { "ENTREGADO", "INCIDENCIA" } },
            { "ENTREGADO", new List<string>() },
            { "CANCELADO", new List<string>() },
            { "INCIDENCIA", new List<string>() }
        };

        public static bool ValidarTransicionEstado(string? estadoActual, string? nuevoEstado)
        {
            if (string.IsNullOrWhiteSpace(estadoActual) || string.IsNullOrWhiteSpace(nuevoEstado))
            {
                return false;
            }

            if (TransicionesValidas.TryGetValue(estadoActual.ToUpper(), out var permitidos))
            {
                return permitidos.Contains(nuevoEstado.ToUpper());
            }
            return false;
        }

        public static void PublicarEventoDespacho(IConfiguration? configuration, Despacho despacho, string ubicacionActual)
        {
            _ = Task.Run(() =>
            {
                try
                {
                    var host = configuration?["RabbitMQ:Host"] ?? "localhost";
                    var port = int.Parse(configuration?["RabbitMQ:Port"] ?? "5672");
                    var username = configuration?["RabbitMQ:Username"] ?? "guest";
                    var password = configuration?["RabbitMQ:Password"] ?? "guest";

                    var factory = new ConnectionFactory
                    {
                        HostName = host,
                        Port = port,
                        UserName = username,
                        Password = password,
                        RequestedConnectionTimeout = TimeSpan.FromMilliseconds(500)
                    };

                    using var connection = factory.CreateConnection();
                    using var channel = connection.CreateModel();
                    channel.ExchangeDeclare(exchange: "sgologic.exchange", type: ExchangeType.Topic, durable: true);

                    var payload = JsonSerializer.Serialize(new
                    {
                        ordenId = despacho.OrdenId,
                        despachoId = despacho.Id,
                        codigoRastreo = despacho.CodigoRastreo,
                        estado = despacho.Estado,
                        metodoPago = despacho.MetodoPago,
                        ubicacionActual = ubicacionActual,
                        fecha = DateTime.UtcNow.ToString("O")
                    });

                    var body = Encoding.UTF8.GetBytes(payload);
                    channel.BasicPublish(
                        exchange: "sgologic.exchange",
                        routingKey: "despacho.estado",
                        basicProperties: null,
                        body: body
                    );
                }
                catch
                {
                    // Tolerancia a fallos cuando RabbitMQ no esta activo (ej. pruebas en memoria)
                }
            });
        }
    }
}
