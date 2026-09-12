using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace LogisticaService
{
    public class LogisticaManagerService
    {
        public static string DeterminarOrigenOptimo(string direccionDestino)
        {
            if (string.IsNullOrWhiteSpace(direccionDestino))
            {
                return "CD_NORTE"; // Origen por defecto
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

        private static readonly Dictionary<string, List<string>> TransicionesValidas = new()
        {
            { "PENDIENTE", new List<string> { "PREPARADO", "CANCELADO" } },
            { "PREPARADO", new List<string> { "EN_TRANSITO" } },
            { "EN_TRANSITO", new List<string> { "ENTREGADO", "INCIDENCIA" } },
            { "ENTREGADO", new List<string>() }
        };

        public static bool ValidarTransicionEstado(string estadoActual, string nuevoEstado)
        {
            if (TransicionesValidas.TryGetValue(estadoActual.ToUpper(), out var permitidos))
            {
                return permitidos.Contains(nuevoEstado.ToUpper());
            }
            return false;
        }
    }
}
