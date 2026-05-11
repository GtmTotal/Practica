using System.Security.Cryptography;
using System.Text;

namespace InformeObras.Infraestructura;

public sealed class ServicioAutenticacionAdmin
{
    private readonly IConfiguration _config;

    public ServicioAutenticacionAdmin(IConfiguration config)
    {
        _config = config;
    }

    public string CrearToken()
    {
        var expires = DateTimeOffset.UtcNow.AddHours(ObtenerHorasExpiracion()).ToUnixTimeSeconds();
        var payload = $"admin|{expires}";
        var signature = Firmar(payload);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes($"{payload}|{signature}"));
    }

    public bool ValidarToken(string? authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader)) return false;
        if (!authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return false;

        var token = authorizationHeader["Bearer ".Length..].Trim();
        if (string.IsNullOrWhiteSpace(token)) return false;

        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = decoded.Split('|');
            if (parts.Length != 3) return false;
            if (parts[0] != "admin") return false;
            if (!long.TryParse(parts[1], out var expires)) return false;
            if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expires) return false;

            var payload = $"{parts[0]}|{parts[1]}";
            var expectedSignature = Firmar(payload);
            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(expectedSignature),
                Encoding.UTF8.GetBytes(parts[2])
            );
        }
        catch
        {
            return false;
        }
    }

    private string Firmar(string payload)
    {
        var secret = _config["Admin:TokenSecret"];
        if (string.IsNullOrWhiteSpace(secret))
        {
            throw new InvalidOperationException("Admin token secret is not configured.");
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash);
    }

    private int ObtenerHorasExpiracion()
    {
        return int.TryParse(_config["Admin:TokenExpirationHours"], out var hours) && hours > 0 ? hours : 8;
    }
}

public sealed class SolicitudLoginAdmin
{
    public string Password { get; set; } = string.Empty;
}
