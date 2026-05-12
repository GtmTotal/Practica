using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using ClosedXML.Excel;

namespace InformeObras.Infraestructura;

public sealed class ServicioSincronizacionExcel
{
    private readonly IHostEnvironment _env;
    private readonly string _excelPath;
    private readonly string _outFolder;

    private static readonly Dictionary<string, string[]> TipoKeywords = new(StringComparer.OrdinalIgnoreCase)
    {
        { "bombeo",   new[] { "BOMBEO", "ARQUETA" } },
        { "quimicos", new[] { "QUÍMICOS", "QUIMICOS", "QUÍMICO", "QUIMICO" } },
        { "soplante", new[] { "SOPLANTE" } },
        { "deposito", new[] { "DEPÓSITO", "DEPOSITO" } },
        { "cuadro",   new[] { "CUADRO ELÉCTRICO", "CUADRO ELECTRICO" } },
        { "filtro",   new[] { "FILTRO" } },
    };

    private static readonly (string Pattern, string Clave, string Sufijo)[] Patterns = new[]
    {
        (@"\d[\d,\.]*\s*A\b",           "amperios", "A"),
        (@"\d[\d,\.]*\s*HZ\b",          "hz",       "HZ"),
        (@"\d[\d,\.]*\s*BAR\b",         "bar",      "BAR"),
        (@"\d[\d,\.]*\s*%",             "porcentaje","%" ),
        (@"\bAMPERIOS\b",               "amperios", "A"),
        (@"\bHERTIOS\b|\bFRECUENCIA\b", "hz",       "HZ"),
        (@"\bPRESIÓN\b|\bPRESION\b",    "bar",      "BAR"),
        (@"\bPORCENTAJE\b",             "porcentaje","%"),
    };

    public ServicioSincronizacionExcel(IHostEnvironment env)
    {
        _env = env;
        _excelPath = Path.Combine(_env.ContentRootPath, "Plantilla-modelo.xlsx");
        _outFolder = Path.Combine(_env.ContentRootPath, "Infraestructura", "Datos", "config-centros");
    }

    public async Task<string> SincronizarAsync()
    {
        if (!File.Exists(_excelPath))
        {
            throw new FileNotFoundException($"No se encuentra el archivo Excel en: {_excelPath}");
        }

        using var stream = File.OpenRead(_excelPath);
        return await SincronizarAsync(stream);
    }

    public async Task<string> SincronizarAsync(Stream excelStream)
    {
        var sbLog = new StringBuilder();
        sbLog.AppendLine("Iniciando sincronización desde archivo...");

        using var workbook = new XLWorkbook(excelStream);
        var okCount = 0;
        var skippedCount = 0;

        foreach (var sheet in workbook.Worksheets)
        {
            var centerName = sheet.Name.Trim();
            var secciones = ParseSheet(sheet);

            if (secciones.Count == 0)
            {
                skippedCount++;
                continue;
            }

            var jsonPath = Path.Combine(_outFolder, $"{centerName}.json");
            var existingData = await LoadExistingAsync(jsonPath);

            var newData = new Dictionary<string, object>(existingData);
            newData["nombre"] = centerName;
            newData["secciones"] = secciones;

            await SaveJsonAsync(newData, jsonPath);
            okCount++;
            sbLog.AppendLine($"  ✅ {centerName}");
        }

        sbLog.AppendLine($"\nSincronización completada:");
        sbLog.AppendLine($"  Generados: {okCount}");
        sbLog.AppendLine($"  Saltados: {skippedCount}");

        return sbLog.ToString();
    }

    private List<object> ParseSheet(IXLWorksheet sheet)
    {
        var secciones = new List<object>();
        Dictionary<string, object>? currentSeccion = null;

        // Recorrer filas (usando UsedRange para eficiencia)
        foreach (var row in sheet.RowsUsed())
        {
            var colA = row.Cell(1).GetValue<string>().Trim().ToUpper();
            var colD = Clean(row.Cell(4).GetValue<string>());

            if (string.IsNullOrEmpty(colD)) continue;

            // Cabecera de sección
            if (colA == "REVISADO")
            {
                var prefijoMatch = Regex.Match(colD, @"(\d+)");
                var prefijo = prefijoMatch.Success ? int.Parse(prefijoMatch.Value) : secciones.Count + 1;

                currentSeccion = new Dictionary<string, object>
                {
                    { "titulo", colD },
                    { "tipo", InferTipo(colD) },
                    { "prefijo", prefijo },
                    { "tareas", new List<object>() }
                };
                secciones.Add(currentSeccion);
                continue;
            }

            // Tarea
            if (currentSeccion != null && string.IsNullOrEmpty(colA))
            {
                var desc = StripNumbering(colD);
                var tarea = new Dictionary<string, object> { { "descripcion", desc } };
                
                var fields = ExtractFields(colD);
                if (fields.Count > 0)
                {
                    tarea["campos"] = fields;
                }

                ((List<object>)currentSeccion["tareas"]).Add(tarea);
            }
        }

        return secciones;
    }

    private string Clean(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return Regex.Replace(text, @"\s+", " ").Trim();
    }

    private string InferTipo(string title)
    {
        var titleUp = title.ToUpper();
        foreach (var kvp in TipoKeywords)
        {
            if (kvp.Value.Any(k => titleUp.Contains(k))) return kvp.Key;
        }
        return "simple";
    }

    private List<object> ExtractFields(string text)
    {
        var fields = new List<object>();
        var seen = new HashSet<string>();
        var upper = text.ToUpper();

        foreach (var pattern in Patterns)
        {
            if (Regex.IsMatch(upper, pattern.Pattern) && !seen.Contains(pattern.Clave))
            {
                fields.Add(new { clave = pattern.Clave, sufijo = pattern.Sufijo });
                seen.Add(pattern.Clave);
            }
        }
        return fields;
    }

    private string StripNumbering(string text)
    {
        return Regex.Replace(text, @"^\d+[\.\-]\d+\s*", "").Trim();
    }

    private async Task<Dictionary<string, object>> LoadExistingAsync(string path)
    {
        if (!File.Exists(path)) return new Dictionary<string, object>();
        try
        {
            var json = await File.ReadAllTextAsync(path);
            return JsonSerializer.Deserialize<Dictionary<string, object>>(json) ?? new Dictionary<string, object>();
        }
        catch { return new Dictionary<string, object>(); }
    }

    private async Task SaveJsonAsync(object data, string path)
    {
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

        var options = new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping };
        var json = JsonSerializer.Serialize(data, options);
        await File.WriteAllTextAsync(path, json, Encoding.UTF8);
    }
}
