using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using InformeObras.Infraestructura;

namespace InformeObras.Infraestructura.Archivos;

public sealed class ServicioAlmacenamientoMinio(IAmazonS3 s3, IOptions<OpcionesAlmacenamiento> options) : IServicioAlmacenamientoArchivos
{
    private readonly OpcionesAlmacenamiento _options = options.Value;

    public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        await EnsureBucketExists(ct);

        var objectKey = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Guid.NewGuid():N}_{fileName}";

        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            InputStream = stream,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType
        };

        await s3.PutObjectAsync(request, ct);

        return BuildPublicUrl(objectKey);
    }

    public Task DeleteAsync(string objectKey, CancellationToken ct = default)
    {
        return s3.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey
        }, ct);
    }

    private async Task EnsureBucketExists(CancellationToken ct)
    {
        try
        {
            await s3.GetBucketLocationAsync(new GetBucketLocationRequest
            {
                BucketName = _options.BucketName
            }, ct);
            return;
        }
        catch (AmazonS3Exception)
        {
            await s3.PutBucketAsync(new PutBucketRequest
            {
                BucketName = _options.BucketName
            }, ct);
        }
    }

    private string BuildPublicUrl(string objectKey)
    {
        var baseUrl = _options.ServiceUrl.TrimEnd('/');
        return $"{baseUrl}/{_options.BucketName}/{objectKey}";
    }
}
