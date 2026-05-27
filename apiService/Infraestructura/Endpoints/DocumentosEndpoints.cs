using Microsoft.EntityFrameworkCore;
using InformeObras.Infraestructura.Persistencia;
using InformeObras.Infraestructura.Persistencia.Entidades;

namespace InformeObras.Infraestructura;

public static class DocumentosEndpoints
{
    public static IEndpointRouteBuilder MapDocumentosEndpoints(this IEndpointRouteBuilder app)
    {
        var groupDocs = app.MapGroup("/api/documents");

        // List all documents (admin only)
        groupDocs.MapGet("/", async (ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();
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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var entity = await db.Informes.FindAsync(id);
            if (entity == null) return Results.NotFound();

            if (req.Tipo != null) entity.Tipo = req.Tipo;
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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var entity = await db.Informes.FindAsync(id);
            if (entity == null) return Results.NotFound();

            db.Informes.Remove(entity);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return app;
    }
}
