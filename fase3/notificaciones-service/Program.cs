using NotificacionesService;

var builder = WebApplication.CreateBuilder(args);

// Configuración de servicios
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Hub y Broadcaster Reactivos Singleton para WebSockets y SSE
builder.Services.AddSingleton<WebSocketNotificationHub>();
builder.Services.AddSingleton<NotificationBroadcaster>();

// Consumidor en background de RabbitMQ
builder.Services.AddHostedService<RabbitMQConsumerService>();

// Configuración CORS permisiva para Frontend omnicanal
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// Habilitar middleware de WebSockets nativo
var webSocketOptions = new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(30)
};
app.UseWebSockets(webSocketOptions);

// Endpoint 1: WebSocket general para notificaciones
app.Map("/ws/notificaciones", async (HttpContext context) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var ordenIdFilter = context.Request.Query["ordenId"].FirstOrDefault();
        var hub = context.RequestServices.GetRequiredService<WebSocketNotificationHub>();
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        await hub.HandleWebSocketAsync(webSocket, ordenIdFilter, context.RequestAborted);
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsync("Se requiere conexión WebSocket (Upgrade: websocket).");
    }
});

// Endpoint 2: WebSocket dedicado al tracking reactivo de una orden específica
app.Map("/ws/tracking", async (HttpContext context) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        var path = context.Request.Path.Value?.Trim('/');
        var ordenId = !string.IsNullOrEmpty(path) ? path : context.Request.Query["ordenId"].FirstOrDefault();
        var hub = context.RequestServices.GetRequiredService<WebSocketNotificationHub>();
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        await hub.HandleWebSocketAsync(webSocket, ordenId, context.RequestAborted);
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsync("Se requiere conexión WebSocket (Upgrade: websocket).");
    }
});

app.UseAuthorization();
app.MapControllers();

app.MapGet("/", (WebSocketNotificationHub hub) => new
{
    servicio = "Notificaciones Service (.NET 8 C#)",
    estado = "OPERATIVO",
    puerto = 8086,
    estilo = "Reactivo (Push en Tiempo Real)",
    protocolos = new[] { "WebSockets (ws://localhost:8086/ws/notificaciones)", "SSE (http://localhost:8086/api/notificaciones/stream)" },
    clientesWebSocketActivos = hub.ConnectedClientsCount,
    fecha = DateTime.UtcNow
});

app.Run("http://0.0.0.0:8086");
