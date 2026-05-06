namespace InformeObras.Infraestructura.Persistencia.Entidades;

public class Cuatrimestre
{
    public long Id { get; set; }
    public string Clave { get; set; } = string.Empty;
    public DateOnly? FechaBase { get; set; }
    public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
}
