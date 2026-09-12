using LogisticaService;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.MapGet("/", () => new { servicio = "Servicio de Logística y Despacho (.NET 8 C#)", estado = "OPERATIVO", puerto = 8085 });

app.Run("http://0.0.0.0:8085");
