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
    var dbContext = scope.ServiceProvider.GetRequiredService<LogisticaDbContext>();
    dbContext.Database.Migrate();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => new { servicio = "Servicio de Logística y Despacho (.NET 8 C#)", estado = "OPERATIVO", puerto = 8085 });

app.Run("http://0.0.0.0:8085"); 