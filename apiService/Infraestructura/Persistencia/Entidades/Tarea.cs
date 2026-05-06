namespace InformeObras.Infraestructura.Persistencia.Entidades;

public class Tarea
{
    public long Id { get; set; }
    public long SistemaId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public bool Rev { get; set; }
    public bool Ok { get; set; }
    public bool NoOk { get; set; }
    public string NotaTarea { get; set; } = string.Empty;
    public int Orden { get; set; }

    public Sistema Sistema { get; set; } = null!;
}
