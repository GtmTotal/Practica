using System.Text.Json;
namespace InformeObras.Infraestructura.Persistencia.Entidades;

public class Informe
{
    public long Id { get; set; }
    public string NombreObra { get; set; } = string.Empty;
    public DateOnly? Fecha { get; set; }
    public string? Cuatrimestre { get; set; }
    public string? Modificado { get; set; }
    public string? Tecnico { get; set; }
    public string? Conclusiones { get; set; }
    public bool Protegido { get; set; }
    public JsonElement Datos { get; set; }

    public List<Sistema> Sistemas { get; set; } = [];
}
