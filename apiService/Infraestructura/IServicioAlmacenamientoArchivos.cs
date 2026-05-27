namespace InformeObras.Infraestructura;

public interface IServicioAlmacenamientoArchivos
{
    Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string objectKey, CancellationToken ct = default);
}
