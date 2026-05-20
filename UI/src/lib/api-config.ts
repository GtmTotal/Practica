/**
 * Devuelve la URL base de la API.
 * En desarrollo local (localhost), apunta al servidor de producción local.
 * En producción (Netlify), usa la URL pública de la API en Dokploy.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return ''; // Safety check for SSR

  const hostname = window.location.hostname;

  // Si estamos en desarrollo local, apuntamos al backend de producción local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://192.168.1.135:5000/api';
  }

  // En producción (Netlify), usamos la URL pública de la API en Dokploy
  return 'https://api.dokploy.com/api';
}
