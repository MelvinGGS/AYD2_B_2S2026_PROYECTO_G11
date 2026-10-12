using LogisticaService;
using LogisticaService.Data;
using LogisticaService.Services;
using LogisticaService.Consumers;
using Microsoft.EntityFrameworkCore;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<LogisticaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQL") 
        ?? "Host=localhost;Port=5432;Database=sgologic;Username=sgologic;Password=sgologic2026"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddScoped<LogisticaManagerService>();
//para los mocklogi
builder.Services.AddScoped<MockLogiExpressService>();
builder.Services.AddHostedService<DespachoSolicitadoConsumer>();
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<LogisticaDbContext>();
        dbContext.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS ""Despachos"" (
                ""Id"" text PRIMARY KEY,
                ""OrdenId"" text NOT NULL,
                ""UbicacionOrigen"" text NOT NULL,
                ""DireccionDestino"" text NOT NULL,
                ""CodigoRastreo"" text NOT NULL,
                ""Estado"" text NOT NULL,
                ""MetodoPago"" text NOT NULL DEFAULT 'PAYKLIK',
                ""FechaCreacion"" timestamp with time zone NOT NULL,
                ""FechaEntrega"" timestamp with time zone
            );
            CREATE TABLE IF NOT EXISTS ""Rastreos"" (
                ""Id"" text PRIMARY KEY,
                ""CodigoRastreo"" text NOT NULL,
                ""Estado"" text NOT NULL,
                ""UbicacionActual"" text NOT NULL,
                ""Timestamp"" timestamp with time zone NOT NULL
            );
            ALTER TABLE ""Despachos"" ADD COLUMN IF NOT EXISTS ""MetodoPago"" text NOT NULL DEFAULT 'PAYKLIK';
        ");
        Console.WriteLine("[LOGISTICA DB] Tablas Despachos y Rastreos verificadas/creadas con exito.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[LOGISTICA DB] Inicializacion: {ex.Message}");
    }
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => new { servicio = "Servicio de Logística y Despacho (.NET 8 C#)", estado = "OPERATIVO", puerto = 8085 });

app.Run("http://0.0.0.0:8085"); 