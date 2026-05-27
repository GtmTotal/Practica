namespace InformeObras.Infraestructura;

public static class Endpoints
{
    internal static bool EsAdmin(HttpRequest request, ServicioAutenticacionAdmin auth)
    {
        return auth.ValidarToken(request.Headers.Authorization.FirstOrDefault());
    }
}
