using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using InformeObras.Infraestructura.Persistencia;
using InformeObras.Infraestructura.Archivos;
using InformeObras.Infraestructura;
using DotNetEnv;

// Cargar variables de entorno desde archivo .env
DotNetEnv.Env.Load();
DotNetEnv.Env.Load(Path.Combine("..", ".env"));

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddDbContext<ContextoBaseDatos>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.Configure<OpcionesAlmacenamiento>(builder.Configuration.GetSection(OpcionesAlmacenamiento.NombreSeccion));

builder.Services.AddSingleton<IAmazonS3>(_ =>
{
    var storage = builder.Configuration.GetSection(OpcionesAlmacenamiento.NombreSeccion).Get<OpcionesAlmacenamiento>()
        ?? throw new InvalidOperationException("Storage configuration is required.");

    var config = new AmazonS3Config
    {
        ServiceURL = storage.ServiceUrl,
        ForcePathStyle = true
    };

    return new AmazonS3Client(storage.AccessKey, storage.SecretKey, config);
});

builder.Services.AddScoped<IServicioAlmacenamientoArchivos, ServicioAlmacenamientoMinio>();
builder.Services.AddScoped<ServicioSincronizacionExcel>();
builder.Services.AddSingleton<ServicioAutenticacionAdmin>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://192.168.1.135:5173",
                "https://*.netlify.app",
                "https://earthly-discard-tarmac.ngrok-free.dev"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

// ✅ MIGRACIÓN AUTOMÁTICA AL ARRANCAR
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ContextoBaseDatos>();
    db.Database.Migrate();
}

app.MapOpenApi();
app.UseCors("frontend");
app.MapEndpoints();

app.Run();