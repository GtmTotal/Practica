namespace InformeObras.Infraestructura.Persistencia.Entidades;

public class Foto
{
    public long Id { get; set; }
    public long SistemaId { get; set; }
    public string ObjectKey { get; set; } = string.Empty;
    public string? UrlPublica { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }

    public Sistema Sistema { get; set; } = null!;
}
