using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using InformeObras.Infraestructura.Persistencia;
using InformeObras.Infraestructura.Persistencia.Entidades;
using InformeObras.Infraestructura.Helpers;

namespace InformeObras.Infraestructura;

public static class InformesEndpoints
{
    public static IEndpointRouteBuilder MapInformesEndpoints(this IEndpointRouteBuilder app)
    {
        var groupInformes = app.MapGroup("/api/informes");

        groupInformes.MapGet("/", async (ContextoBaseDatos db) =>
        {
            var items = await db.Informes
                .OrderByDescending(x => x.Id)
                .Select(x => new
                {
                    id = x.Id,
                    tipo = x.Tipo,
                    nombre_obra = x.NombreObra,
                    tecnico = x.Tecnico,
                    fecha = x.Fecha,
                    cuatrimestre = x.Cuatrimestre,
                    protegido = x.Protegido,
                    conclusiones = x.Conclusiones,
                    modificado = x.Modificado,
                    n_proy = x.NProy,
                    n_orden_cuadro = x.NOrdenCuadro,
                    n_orden_instalacion = x.NOrdenInstalacion,
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
                tipo = item.Tipo,
                nProy = item.NProy,
                nOrdenCuadro = item.NOrdenCuadro,
                nOrdenInstalacion = item.NOrdenInstalacion,
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
                entity = new Informe { Id = id, Datos = JsonDocument.Parse("{}").RootElement };
                db.Informes.Add(entity);
            }

            var datos = req.Datos.ValueKind == JsonValueKind.Object ? req.Datos : JsonDocument.Parse("{}").RootElement;

            entity.NombreObra = EndpointHelpers.ObtenerString(datos, "nombreObra") ?? req.NombreObra ?? "Sin nombre";
            entity.Tipo = req.Tipo ?? "mantenimiento";
            entity.Tecnico = EndpointHelpers.ObtenerString(datos, "tecnico") ?? req.Tecnico;
            entity.Cuatrimestre = EndpointHelpers.ObtenerString(datos, "cuatrimestre") ?? req.Cuatrimestre;
            if (entity.Tipo != "cuadro_electrico" && string.IsNullOrWhiteSpace(entity.Cuatrimestre))
            {
                return Results.BadRequest(new { message = "El informe debe tener un cuatrimestre asignado." });
            }
            entity.Protegido = EndpointHelpers.ObtenerBool(datos, "protegido") ?? req.Protegido;
            entity.Conclusiones = EndpointHelpers.ObtenerString(datos, "conclusiones") ?? req.Conclusiones;
            entity.NProy = req.NProy ?? EndpointHelpers.ObtenerString(datos, "nProy");
            entity.NOrdenCuadro = req.NOrdenCuadro ?? EndpointHelpers.ObtenerString(datos, "nOrdenCuadro");
            entity.NOrdenInstalacion = req.NOrdenInstalacion ?? EndpointHelpers.ObtenerString(datos, "nOrdenInstalacion");

            // Validar unicidad de nProy y nOrdenCuadro para informes de cuadro eléctrico
            if (entity.Tipo == "cuadro_electrico")
            {
                if (!string.IsNullOrWhiteSpace(entity.NProy))
                {
                    var existeNProy = await db.Informes
                        .AnyAsync(i => i.Id != entity.Id && i.Tipo == "cuadro_electrico" && i.NProy == entity.NProy);
                    if (existeNProy)
                    {
                        return Results.BadRequest(new { message = $"Ya existe un informe con el número de proyecto '{entity.NProy}'." });
                    }
                }

                if (!string.IsNullOrWhiteSpace(entity.NOrdenCuadro))
                {
                    var existeNOrdenCuadro = await db.Informes
                        .AnyAsync(i => i.Id != entity.Id && i.Tipo == "cuadro_electrico" && i.NOrdenCuadro == entity.NOrdenCuadro);
                    if (existeNOrdenCuadro)
                    {
                        return Results.BadRequest(new { message = $"Ya existe un informe con el número de orden de cuadro '{entity.NOrdenCuadro}'." });
                    }
                }
            }
            entity.Modificado = req.UltimaModificacion ?? DateTime.Now.ToString("s");
            var fechaTexto = EndpointHelpers.ObtenerString(datos, "fecha") ?? req.Fecha;
            entity.Fecha = DateOnly.TryParse(fechaTexto, out var fecha) ? fecha : null;

            if (entity.Sistemas.Count > 0)
            {
                db.Sistemas.RemoveRange(entity.Sistemas);
            }

            var secciones = EndpointHelpers.ObtenerArray(datos, "secciones");
            entity.Sistemas = secciones.Select((s, idxSistema) => new Sistema
            {
                Titulo = EndpointHelpers.ObtenerString(s, "titulo") ?? string.Empty,
                Tipo = EndpointHelpers.ObtenerString(s, "tipo") ?? string.Empty,
                Prefijo = EndpointHelpers.ObtenerInt(s, "prefijo") ?? 0,
                Observaciones = EndpointHelpers.ObtenerString(s, "observaciones") ?? string.Empty,
                Orden = idxSistema,
                Tareas = EndpointHelpers.ObtenerArray(s, "tareas").Select((t, idxTarea) => new Tarea
                {
                    Descripcion = EndpointHelpers.ObtenerString(t, "descripcion") ?? string.Empty,
                    Rev = EndpointHelpers.ObtenerBool(t, "rev") ?? false,
                    Ok = EndpointHelpers.ObtenerBool(t, "ok") ?? false,
                    NoOk = EndpointHelpers.ObtenerBool(t, "noOk") ?? false,
                    NotaTarea = EndpointHelpers.ObtenerString(t, "notaTarea") ?? string.Empty,
                    Orden = idxTarea,
                }).ToList(),
                Fotos = EndpointHelpers.ObtenerArray(s, "fotos").Select((f, idxFoto) => new Foto
                {
                    UrlPublica = EndpointHelpers.ObtenerString(f, "url"),
                    Base64 = EndpointHelpers.ObtenerString(f, "base64"),
                    ObjectKey = EndpointHelpers.ExtraerObjectKey(EndpointHelpers.ObtenerString(f, "url")),
                    Nombre = EndpointHelpers.ObtenerString(f, "nombre") ?? string.Empty,
                    Descripcion = EndpointHelpers.ObtenerString(f, "descripcion"),
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
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

            var entity = await db.Informes.FirstOrDefaultAsync(x => x.Id == id);
            if (entity is null) return Results.NotFound();

            db.Informes.Remove(entity);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        groupInformes.MapDelete("/cuatrimestre/{cuatrimestre}", async (string cuatrimestre, ContextoBaseDatos db, HttpRequest httpRequest, ServicioAutenticacionAdmin auth) =>
        {
            if (!Endpoints.EsAdmin(httpRequest, auth)) return Results.Unauthorized();

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

        return app;
    }
}
