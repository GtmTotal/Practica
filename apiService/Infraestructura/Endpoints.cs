using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Text;
using InformeObras.Infraestructura.Persistencia;
using InformeObras.Infraestructura.Persistencia.Entidades;

namespace InformeObras.Infraestructura;

public interface IServicioAlmacenamientoArchivos
{
    Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string objectKey, CancellationToken ct = default);
}

public sealed class SolicitudGuardarInforme
{
    public long? Id { get; set; }
    public string? NombreObra { get; set; }
    public string? Tecnico { get; set; }
    public string? Fecha { get; set; }
    public string? Cuatrimestre { get; set; }
    public bool Protegido { get; set; }
    public string? Conclusiones { get; set; }
    public string? UltimaModificacion { get; set; }
    public JsonElement Datos { get; set; }
}

public sealed class SolicitudGuardarSistema
{
    public string Titulo { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public int Prefijo { get; set; }
    public string Observaciones { get; set; } = string.Empty;
    public List<SolicitudGuardarTarea> Tareas { get; set; } = [];
    public List<SolicitudGuardarFoto> Fotos { get; set; } = [];
}

public sealed class SolicitudGuardarTarea
{
    public string Descripcion { get; set; } = string.Empty;
    public bool Rev { get; set; }
    public bool Ok { get; set; }
    public bool NoOk { get; set; }
    public string NotaTarea { get; set; } = string.Empty;
}

public sealed class SolicitudGuardarFoto
{
    public string? Url { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

public static class Endpoints
{
    public static IEndpointRouteBuilder MapEndpoints(this IEndpointRouteBuilder app)
    {
        var groupInformes = app.MapGroup("/api/informes");

        groupInformes.MapGet("/", async (ContextoBaseDatos db) =>
        {
            var items = await db.Informes
                .OrderByDescending(x => x.Id)
                .Select(x => new
                {
                    id = x.Id,
                    nombre_obra = x.NombreObra,
                    tecnico = x.Tecnico,
                    fecha = x.Fecha,
                    cuatrimestre = x.Cuatrimestre,
                    protegido = x.Protegido,
                    conclusiones = x.Conclusiones,
                    modificado = x.Modificado,
                    datos = new { protegido = x.Protegido }
                })
                .ToListAsync();

            return Results.Ok(items);
        });

        groupInformes.MapGet("/{id:long}", async (long id, ContextoBaseDatos db) =>
        {
            var item = await db.Informes
                .Include(x => x.Sistemas)
                    .ThenInclude(s => s.Tareas)
                .Include(x => x.Sistemas)
                    .ThenInclude(s => s.Fotos)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (item is null) return Results.NotFound();

            var datos = new
            {
                id = item.Id,
                nombreObra = item.NombreObra,
                tecnico = item.Tecnico,
                fecha = item.Fecha?.ToString("yyyy-MM-dd"),
                cuatrimestre = item.Cuatrimestre,
                protegido = item.Protegido,
                conclusiones = item.Conclusiones,
                secciones = item.Sistemas
                    .OrderBy(s => s.Orden)
                    .Select(s => new
                    {
                        titulo = s.Titulo,
                        tipo = s.Tipo,
                        prefijo = s.Prefijo,
                        observaciones = s.Observaciones,
                        tareas = s.Tareas.OrderBy(t => t.Orden).Select(t => new
                        {
                            descripcion = t.Descripcion,
                            rev = t.Rev,
                            ok = t.Ok,
                            noOk = t.NoOk,
                            notaTarea = t.NotaTarea
                        }),
                        fotos = s.Fotos.OrderBy(f => f.Orden).Select(f => new
                        {
                            url = f.UrlPublica,
                            nombre = f.Nombre
                        })
                    })
            };

            return Results.Ok(new { datos });
        });

        groupInformes.MapPost("/", async (SolicitudGuardarInforme req, ContextoBaseDatos db) =>
        {
            var id = req.Id ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var entity = await db.Informes
                .Include(x => x.Sistemas)
                    .ThenInclude(s => s.Tareas)
                .Include(x => x.Sistemas)
                    .ThenInclude(s => s.Fotos)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (entity is null)
            {
                entity = new Informe { Id = id };
                db.Informes.Add(entity);
            }

            var datos = req.Datos.ValueKind == JsonValueKind.Object ? req.Datos : default;

            entity.NombreObra = ObtenerString(datos, "nombreObra") ?? req.NombreObra ?? "Sin nombre";
            entity.Tecnico = ObtenerString(datos, "tecnico") ?? req.Tecnico;
            entity.Cuatrimestre = ObtenerString(datos, "cuatrimestre") ?? req.Cuatrimestre;
            entity.Protegido = ObtenerBool(datos, "protegido") ?? req.Protegido;
            entity.Conclusiones = ObtenerString(datos, "conclusiones") ?? req.Conclusiones;
            entity.Modificado = req.UltimaModificacion ?? DateTime.Now.ToString("s");
            var fechaTexto = ObtenerString(datos, "fecha") ?? req.Fecha;
            entity.Fecha = DateOnly.TryParse(fechaTexto, out var fecha) ? fecha : null;

            if (entity.Sistemas.Count > 0)
            {
                db.Sistemas.RemoveRange(entity.Sistemas);
            }

            var secciones = ObtenerArray(datos, "secciones");
            entity.Sistemas = secciones.Select((s, idxSistema) => new Sistema
            {
                Titulo = ObtenerString(s, "titulo") ?? string.Empty,
                Tipo = ObtenerString(s, "tipo") ?? string.Empty,
                Prefijo = ObtenerInt(s, "prefijo") ?? 0,
                Observaciones = ObtenerString(s, "observaciones") ?? string.Empty,
                Orden = idxSistema,
                Tareas = ObtenerArray(s, "tareas").Select((t, idxTarea) => new Tarea
                {
                    Descripcion = ObtenerString(t, "descripcion") ?? string.Empty,
                    Rev = ObtenerBool(t, "rev") ?? false,
                    Ok = ObtenerBool(t, "ok") ?? false,
                    NoOk = ObtenerBool(t, "noOk") ?? false,
                    NotaTarea = ObtenerString(t, "notaTarea") ?? string.Empty,
                    Orden = idxTarea,
                }).ToList(),
                Fotos = ObtenerArray(s, "fotos").Select((f, idxFoto) => new Foto
                {
                    UrlPublica = ObtenerString(f, "url"),
                    ObjectKey = ExtraerObjectKey(ObtenerString(f, "url")),
                    Nombre = ObtenerString(f, "nombre") ?? string.Empty,
                    Orden = idxFoto,
                }).ToList()
            }).ToList();

            if (!string.IsNullOrWhiteSpace(entity.Cuatrimestre))
            {
                var existeCuatrimestre = await db.Cuatrimestres.AnyAsync(x => x.Clave == entity.Cuatrimestre);
                if (!existeCuatrimestre)
                {
                    db.Cuatrimestres.Add(new Cuatrimestre
                    {
                        Clave = entity.Cuatrimestre,
                        FechaBase = entity.Fecha,
                        CreadoEn = DateTime.UtcNow,
                    });
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { id = entity.Id });
        });

        groupInformes.MapDelete("/{id:long}", async (long id, ContextoBaseDatos db) =>
        {
            var entity = await db.Informes.FirstOrDefaultAsync(x => x.Id == id);
            if (entity is null) return Results.NotFound();

            db.Informes.Remove(entity);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        groupInformes.MapDelete("/cuatrimestre/{cuatrimestre}", async (string cuatrimestre, ContextoBaseDatos db) =>
        {
            var rows = await db.Informes.Where(x => x.Cuatrimestre == cuatrimestre).ExecuteDeleteAsync();
            await db.Cuatrimestres.Where(x => x.Clave == cuatrimestre).ExecuteDeleteAsync();
            return Results.Ok(new { deleted = rows });
        });

        app.MapGet("/api/cuatrimestres", async (ContextoBaseDatos db) =>
        {
            var items = await db.Cuatrimestres
                .OrderByDescending(x => x.Clave)
                .Select(x => new
                {
                    id = x.Id,
                    clave = x.Clave,
                    fechaBase = x.FechaBase,
                    creadoEn = x.CreadoEn
                })
                .ToListAsync();

            return Results.Ok(items);
        });

        var groupArchivos = app.MapGroup("/api/files");

        groupArchivos.MapPost("/upload", async (IFormFile file, IServicioAlmacenamientoArchivos storage, CancellationToken ct) =>
        {
            if (file.Length == 0) return Results.BadRequest("File is empty.");

            await using var stream = file.OpenReadStream();
            var url = await storage.UploadAsync(stream, file.FileName, file.ContentType, ct);

            return Results.Ok(new { url, nombre = file.FileName });
        });

        groupArchivos.MapDelete("/", async (string objectKey, IServicioAlmacenamientoArchivos storage, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(objectKey)) return Results.BadRequest("objectKey is required.");
            await storage.DeleteAsync(objectKey, ct);
            return Results.NoContent();
        });

        app.MapGet("/api/main-page/config-centros", async (IHostEnvironment env) =>
        {
            var folderPath = Path.Combine(env.ContentRootPath, "Infraestructura", "Datos", "config-centros");
            if (!Directory.Exists(folderPath))
            {
                return Results.NotFound(new { message = "Config folder not found." });
            }

            var result = new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);
            var files = Directory.GetFiles(folderPath, "*.json");

            foreach (var file in files)
            {
                var key = Path.GetFileNameWithoutExtension(file);
                var content = await File.ReadAllTextAsync(file, Encoding.UTF8);
                using var doc = JsonDocument.Parse(content);
                result[key] = doc.RootElement.Clone();
            }

            return Results.Ok(result);
        });

        app.MapGet("/api/main-page/config-centros/{centro}", async (string centro, IHostEnvironment env) =>
        {
            var folderPath = Path.Combine(env.ContentRootPath, "Infraestructura", "Datos", "config-centros");
            
            // Búsqueda inteligente: Exacta o el primero que empiece por el nombre
            var files = Directory.GetFiles(folderPath, "*.json");
            var filePath = files.FirstOrDefault(f => 
                Path.GetFileNameWithoutExtension(f).Equals(centro, StringComparison.OrdinalIgnoreCase))
                ?? files.FirstOrDefault(f => 
                Path.GetFileNameWithoutExtension(f).StartsWith(centro, StringComparison.OrdinalIgnoreCase));

            if (filePath == null || !File.Exists(filePath))
            {
                return Results.NotFound(new { message = $"Center config '{centro}' not found." });
            }

            var content = await File.ReadAllTextAsync(filePath, Encoding.UTF8);
            using var doc = JsonDocument.Parse(content);
            return Results.Ok(doc.RootElement.Clone());
        });

        return app;
    }

    private static string ExtraerObjectKey(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return string.Empty;
        var clean = url.Split('?', 2)[0];
        var lastSlash = clean.LastIndexOf('/');
        return lastSlash >= 0 ? clean[(lastSlash + 1)..] : clean;
    }

    private static string? ObtenerString(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        if (!root.TryGetProperty(nombre, out var value)) return null;
        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    private static bool? ObtenerBool(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        if (!root.TryGetProperty(nombre, out var value)) return null;
        return value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False ? value.GetBoolean() : null;
    }

    private static int? ObtenerInt(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        if (!root.TryGetProperty(nombre, out var value)) return null;
        return value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var n) ? n : null;
    }

    private static List<JsonElement> ObtenerArray(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return [];
        if (!root.TryGetProperty(nombre, out var value)) return [];
        if (value.ValueKind != JsonValueKind.Array) return [];
        return value.EnumerateArray().ToList();
    }
}
