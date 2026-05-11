using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using InformeObras.Infraestructura.Persistencia;
using InformeObras.Infraestructura.Archivos;
using InformeObras.Infraestructura;

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

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
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