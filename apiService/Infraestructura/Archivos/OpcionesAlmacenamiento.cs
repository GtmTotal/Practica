namespace InformeObras.Infraestructura.Archivos;

public sealed class OpcionesAlmacenamiento
{
    public const string NombreSeccion = "Storage";

    public string ServiceUrl { get; set; } = "http://localhost:9000";
    public string AccessKey { get; set; } = "minioadmin";
    public string SecretKey { get; set; } = "minioadmin";
    public string BucketName { get; set; } = "obras";
    public bool PublicRead { get; set; } = true;
}
