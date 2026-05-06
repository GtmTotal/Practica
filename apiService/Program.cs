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

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
        policy.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("frontend");
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapEndpoints();

app.Run();
