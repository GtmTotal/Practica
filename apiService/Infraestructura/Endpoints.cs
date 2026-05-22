using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Text;
using InformeObras.Infraestructura.Persistencia;
using InformeObras.Infraestructura;
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
        static bool EsAdmin(HttpRequest request, ServicioAutenticacionAdmin auth)
        {
            return auth.ValidarToken(request.Headers.Authorization.FirstOrDefault());
        }

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
                    datos = new
                    {
                        protegido = x.Protegido,
                        progreso = x.Sistemas.SelectMany(s => s.Tareas).Any()
                            ? (int)((double)x.Sistemas.SelectMany(s => s.Tareas).Count(t => t.Ok || t.NoOk) / x.Sistemas.SelectMany(s => s.Tareas).Count() * 100)
                            : 0
                    }
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
                            base64 = f.Base64,
                            nombre = f.Nombre,
                            descripcion = f.Descripcion
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
            if (string.IsNullOrWhiteSpace(entity.Cuatrimestre))
            {
                return Results.BadRequest(new { message = "El informe debe tener un cuatrimestre asignado." });
            }
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
                    Base64 = ObtenerString(f, "base64"),
                    ObjectKey = ExtraerObjectKey(ObtenerString(f, "url")),
                    Nombre = ObtenerString(f, "nombre") ?? string.Empty,
                    Descripcion = ObtenerString(f, "descripcion"),
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

        groupInformes.MapPatch("/{id:long}/metadata", async (long id, JsonElement req, ContextoBaseDatos db) =>
        {
            var entity = await db.Informes.FirstOrDefaultAsync(x => x.Id == id);
            if (entity is null) return Results.NotFound();

            if (req.TryGetProperty("tecnico", out var t)) entity.Tecnico = t.GetString();
            if (req.TryGetProperty("conclusiones", out var c)) entity.Conclusiones = c.GetString();
            if (req.TryGetProperty("protegido", out var p)) entity.Protegido = p.GetBoolean();
            if (req.TryGetProperty("fecha", out var f) && DateOnly.TryParse(f.GetString(), out var fecha)) entity.Fecha = fecha;
            
            entity.Modificado = DateTime.Now.ToString("s");
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        groupInformes.MapPatch("/{id:long}/seccion/{prefijo:int}", async (long id, int prefijo, JsonElement req, ContextoBaseDatos db) =>
        {
            var seccion = await db.Sistemas.FirstOrDefaultAsync(x => x.InformeId == id && x.Prefijo == prefijo);
            if (seccion is null) return Results.NotFound();

            if (req.TryGetProperty("observaciones", out var obs)) seccion.Observaciones = obs.GetString();
            if (req.TryGetProperty("titulo", out var tit)) seccion.Titulo = tit.GetString();

            await db.SaveChangesAsync();
            return Results.Ok();
        });

        groupInformes.MapPatch("/{id:long}/seccion/{prefijo:int}/tarea/{orden:int}", async (long id, int prefijo, int orden, JsonElement req, ContextoBaseDatos db) =>
        {
            var tarea = await db.Tareas
                .Include(t => t.Sistema)
                .FirstOrDefaultAsync(x => x.Sistema.InformeId == id && x.Sistema.Prefijo == prefijo && x.Orden == orden);
            if (tarea is null) return Results.NotFound();

            if (req.TryGetProperty("ok", out var ok)) tarea.Ok = ok.GetBoolean();
            if (req.TryGetProperty("noOk", out var noOk)) tarea.NoOk = noOk.GetBoolean();
            if (req.TryGetProperty("rev", out var rev)) tarea.Rev = rev.GetBoolean();
            if (req.TryGetProperty("notaTarea", out var nota)) tarea.NotaTarea = nota.GetString();

            await db.SaveChangesAsync();
            return Results.Ok();
        });

        groupInformes.MapDelete("/{id:long}", async (long id, ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var entity = await db.Informes.FirstOrDefaultAsync(x => x.Id == id);
            if (entity is null) return Results.NotFound();

            db.Informes.Remove(entity);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        groupInformes.MapDelete("/cuatrimestre/{cuatrimestre}", async (string cuatrimestre, ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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

        groupArchivos.MapPost("/upload", async (IFormFile file, IServicioAlmacenamientoArchivos storage, HttpRequest httpRequest, ServicioAutenticacionAdmin auth, CancellationToken ct) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            if (file.Length == 0) return Results.BadRequest("File is empty.");

            await using var stream = file.OpenReadStream();
            var url = await storage.UploadAsync(stream, file.FileName, file.ContentType, ct);

            return Results.Ok(new { url, nombre = file.FileName });
        });

        groupArchivos.MapDelete("/", async (string objectKey, IServicioAlmacenamientoArchivos storage, HttpRequest httpRequest, ServicioAutenticacionAdmin auth, CancellationToken ct) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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

        app.MapPost("/api/admin/login", (SolicitudLoginAdmin req, IConfiguration config, ServicioAutenticacionAdmin auth) =>
        {
            var adminPass = config["Admin:Password"];
            if (!string.IsNullOrWhiteSpace(adminPass) && req.Password == adminPass)
            {
                return Results.Ok(new { success = true, token = auth.CrearToken() });
            }
            return Results.Json(new { success = false }, statusCode: 401);
        });

        app.MapPost("/api/admin/sync/upload", async (HttpRequest request, IHostEnvironment env, ServicioSincronizacionExcel syncService, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var form = await request.ReadFormAsync();
            var file = form.Files.GetFile("file");

            if (file == null || file.Length == 0)
                return Results.BadRequest(new { message = "Debes seleccionar un archivo Excel." });

            if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { message = "El archivo debe ser un Excel (.xlsx)." });

            try
            {
                await using var uploadStream = file.OpenReadStream();
                using var memoryStream = new MemoryStream();
                await uploadStream.CopyToAsync(memoryStream);

                // 1. Guardar el Excel subido como Plantilla-modelo.xlsx para persistencia
                var excelPath = Path.Combine(env.ContentRootPath, "Plantilla-modelo.xlsx");
                await File.WriteAllBytesAsync(excelPath, memoryStream.ToArray());

                // 2. Sincronizar desde el stream hacia los JSONs de config-centros
                memoryStream.Position = 0;
                var log = await syncService.SincronizarAsync(memoryStream);
                return Results.Ok(new { message = "Sincronización completada con éxito", log });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Error en la sincronización: {ex.Message}");
            }
        }).DisableAntiforgery();

        app.MapPost("/api/admin/sync", async (ServicioSincronizacionExcel syncService, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            try
            {
                var log = await syncService.SincronizarAsync();
                return Results.Ok(new { message = "Sincronización completada con éxito", log });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Error en la sincronización: {ex.Message}");
            }
        });

        app.MapGet("/api/admin/export", (IHostEnvironment env, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var excelPath = Path.Combine(env.ContentRootPath, "Plantilla-modelo.xlsx");
            if (!File.Exists(excelPath))
                return Results.NotFound(new { message = "No hay ningún Excel almacenado en el servidor." });

            var fileName = $"Reporte_GTM_{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
            var fileBytes = File.ReadAllBytes(excelPath);
            return Results.File(
                fileBytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName
            );
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


        var groupDocs = app.MapGroup("/api/documents");

        // List all documents (admin only)
        groupDocs.MapGet("/", async (ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var informes = await db.Informes.ToListAsync();
            var items = informes.Select(i => new DocumentDto
            {
                Id = i.Id,
                NombreObra = i.NombreObra,
                Tecnico = i.Tecnico,
                Fecha = i.Fecha?.ToString("yyyy-MM-dd"),
                Cuatrimestre = i.Cuatrimestre,
                Protegido = i.Protegido,
                Conclusiones = i.Conclusiones,
                UltimaModificacion = i.Modificado,
                Datos = i.Datos
            }).ToList();

            return Results.Ok(items);
        });

        // Get single document by id (admin only)
        groupDocs.MapGet("/{id:long}", async (long id, ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var item = await db.Informes.FindAsync(id);
            if (item == null) return Results.NotFound();

            var dto = new DocumentDto
            {
                Id = item.Id,
                NombreObra = item.NombreObra,
                Tecnico = item.Tecnico,
                Fecha = item.Fecha?.ToString("yyyy-MM-dd"),
                Cuatrimestre = item.Cuatrimestre,
                Protegido = item.Protegido,
                Conclusiones = item.Conclusiones,
                UltimaModificacion = item.Modificado,
                Datos = item.Datos
            };
            return Results.Ok(dto);
        });

        // Create new document (admin only)
        groupDocs.MapPost("/", async (DocumentDto req, ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(req.NombreObra)) return Results.BadRequest(new { message = "El nombre de la obra es obligatorio." });

            var entity = new Informe
            {
                Id = req.Id != 0 ? req.Id : DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                NombreObra = req.NombreObra,
                Tecnico = req.Tecnico,
                Fecha = string.IsNullOrWhiteSpace(req.Fecha) ? null : DateOnly.Parse(req.Fecha),
                Cuatrimestre = req.Cuatrimestre,
                Protegido = req.Protegido,
                Conclusiones = req.Conclusiones,
                Modificado = req.UltimaModificacion ?? DateTime.Now.ToString("s"),
                Datos = req.Datos
            };
            db.Informes.Add(entity);
            await db.SaveChangesAsync();
            return Results.Created($"/api/documents/{entity.Id}", entity);
        });

        // Update existing document (admin only)
        groupDocs.MapPut("/{id:long}", async (long id, UpdateDocumentDto req, ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var entity = await db.Informes.FindAsync(id);
            if (entity == null) return Results.NotFound();

            if (req.Tecnico != null) entity.Tecnico = req.Tecnico;
            if (req.Fecha != null) entity.Fecha = DateOnly.Parse(req.Fecha);
            if (req.Cuatrimestre != null) entity.Cuatrimestre = req.Cuatrimestre;
            if (req.Protegido.HasValue) entity.Protegido = req.Protegido.Value;
            if (req.Conclusiones != null) entity.Conclusiones = req.Conclusiones;
            if (req.Datos.HasValue) entity.Datos = req.Datos.Value;

            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // Delete document (admin only)
        groupDocs.MapDelete("/{id:long}", async (long id, ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var entity = await db.Informes.FindAsync(id);
            if (entity == null) return Results.NotFound();

            db.Informes.Remove(entity);
            await db.SaveChangesAsync();
            return Results.NoContent();
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
