using Amazon.S3;
using Microsoft.EntityFrameworkCore;
using InformeObras.Infraestructura.Persistencia;
using InformeObras.Infraestructura.Archivos;
using InformeObras.Infraestructura;

var builder = WebApplication.CreateBuilder(args);

// 1. OpenAPI: Se queda activo para que Dokploy lo muestre aunque no sea "Development"
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

// 2. CORS: Modificado para permitir conexiones desde cualquier IP (la de la oficina)
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.AllowAnyOrigin() // Cambiado de localhost:4200 a Permitir Todo
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// 3. Documentación: Quitamos el IF para que sea visible en Dokploy/Producción
// if (app.Environment.IsDevelopment()) 
// {
    app.MapOpenApi();
// }

app.UseCors("frontend");

// 4. HTTPS: Comentado porque por IP local (192.168...) no tienes certificado SSL
// if (!app.Environment.IsDevelopment())
// {
//     app.UseHttpsRedirection(); 
// }

app.MapEndpoints();

app.Run();