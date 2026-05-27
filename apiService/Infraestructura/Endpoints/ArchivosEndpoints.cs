namespace InformeObras.Infraestructura;

public static class ArchivosEndpoints
{
    public static IEndpointRouteBuilder MapArchivosEndpoints(this IEndpointRouteBuilder app)
    {
        var groupArchivos = app.MapGroup("/api/files");

        groupArchivos.MapPost("/upload", async (IFormFile file, IServicioAlmacenamientoArchivos storage, HttpRequest httpRequest, ServicioAutenticacionAdmin auth, CancellationToken ct) =>
        {
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            if (file.Length == 0) return Results.BadRequest("File is empty.");

            await using var stream = file.OpenReadStream();
            var url = await storage.UploadAsync(stream, file.FileName, file.ContentType, ct);

            return Results.Ok(new { url, nombre = file.FileName });
        });

        groupArchivos.MapDelete("/", async (string objectKey, IServicioAlmacenamientoArchivos storage, HttpRequest httpRequest, ServicioAutenticacionAdmin auth, CancellationToken ct) =>
        {
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(objectKey)) return Results.BadRequest("objectKey is required.");
            await storage.DeleteAsync(objectKey, ct);
            return Results.NoContent();
        });

        return app;
    }
}
