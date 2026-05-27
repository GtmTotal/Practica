using System.Text.Json;

namespace InformeObras.Infraestructura.Helpers;

public sealed class SolicitudGuardarInforme
{
    public long? Id { get; set; }
    public string? Tipo { get; set; }
    public string? NombreObra { get; set; }
    public string? Tecnico { get; set; }
    public string? Fecha { get; set; }
    public string? Cuatrimestre { get; set; }
    public bool Protegido { get; set; }
    public string? Conclusiones { get; set; }
    public string? UltimaModificacion { get; set; }
    public string? NProy { get; set; }
    public string? NOrdenCuadro { get; set; }
    public string? NOrdenInstalacion { get; set; }
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

public static class EndpointHelpers
{
    public static string ExtraerObjectKey(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return string.Empty;
        var clean = url.Split('?', 2)[0];
        var lastSlash = clean.LastIndexOf('/');
        return lastSlash >= 0 ? clean[(lastSlash + 1)..] : clean;
    }

    public static string? ObtenerString(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        if (!root.TryGetProperty(nombre, out var value)) return null;
        return value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    public static bool? ObtenerBool(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        if (!root.TryGetProperty(nombre, out var value)) return null;
        return value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False ? value.GetBoolean() : null;
    }

    public static int? ObtenerInt(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return null;
        if (!root.TryGetProperty(nombre, out var value)) return null;
        return value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var n) ? n : null;
    }

    public static List<JsonElement> ObtenerArray(JsonElement root, string nombre)
    {
        if (root.ValueKind != JsonValueKind.Object) return [];
        if (!root.TryGetProperty(nombre, out var value)) return [];
        if (value.ValueKind != JsonValueKind.Array) return [];
        return value.EnumerateArray().ToList();
    }
}
