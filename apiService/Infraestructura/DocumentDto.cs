using System.Text.Json;
namespace InformeObras.Infraestructura;
public class DocumentDto {
    public long Id { get; set; }
    public string NombreObra { get; set; } = string.Empty;
    // Todas las columnas del Excel excepto "nombreCentro"
    public string Tecnico { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string Cuatrimestre { get; set; } = string.Empty;
    public bool Protegido { get; set; }
    public string Conclusiones { get; set; } = string.Empty;
    public string UltimaModificacion { get; set; } = string.Empty;
    public JsonElement Datos { get; set; }
}
public class UpdateDocumentDto {
    public string? Tecnico { get; set; }
    public string? Fecha { get; set; }
    public string? Cuatrimestre { get; set; }
    public bool? Protegido { get; set; }
    public string? Conclusiones { get; set; }
    public JsonElement? Datos { get; set; }
}
