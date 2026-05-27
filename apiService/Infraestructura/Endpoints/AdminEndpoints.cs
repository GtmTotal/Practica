using System.Text.Json;
using System.Text;

namespace InformeObras.Infraestructura;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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

        return app;
    }
}
