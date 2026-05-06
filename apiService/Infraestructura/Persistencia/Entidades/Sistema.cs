namespace InformeObras.Infraestructura.Persistencia.Entidades;

public class Sistema
{
    public long Id { get; set; }
    public long InformeId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public int Prefijo { get; set; }
    public string Observaciones { get; set; } = string.Empty;
    public int Orden { get; set; }

    public Informe Informe { get; set; } = null!;
    public List<Tarea> Tareas { get; set; } = [];
    public List<Foto> Fotos { get; set; } = [];
}
