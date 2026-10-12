using LogisticaService.Consumers;
using LogisticaService.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace LogisticaService.Tests
{
    // Levanta la API real de logistica en memoria
    public class LogisticaApiFactory : WebApplicationFactory<LogisticaManagerService>
    {
        private readonly string _nombreBd = "logistica-tests-" + Guid.NewGuid();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");

            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<DbContextOptions<LogisticaDbContext>>();
                services.AddDbContext<LogisticaDbContext>(options => options.UseInMemoryDatabase(_nombreBd));

                // se quita el consumer para que no intente conectarse
                var consumer = services.FirstOrDefault(d => d.ImplementationType == typeof(DespachoSolicitadoConsumer));
                if (consumer != null)
                {
                    services.Remove(consumer);
                }
            });
        }
    }
}
