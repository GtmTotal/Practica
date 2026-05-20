/**
 * Devuelve la URL base de la API.
 * En desarrollo local (localhost), apunta al servidor de producción local.
 * En producción (Netlify), usa la URL pública de la API en Dokply.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return ''; // Safety check for SSR

  const hostname = window.location.hostname;

  // Si estamos en desarrollo local, el backend de producción local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://192.168.1.135:5000/api';
  }

  // En producción (Netlify), usamos la URL pública de ngrok
  return 'https://earthly-discard-tarmac.ngrok-free.dev/api';
}

/**
 * Devuelve los headers base para todas las peticiones a la API.
 * Incluye el header para saltar el interstitial de ngrok.
 */
export function getApiHeaders(): Record<string, string> {
  return {
    'ngrok-skip-browser-warning': '1'
  };
}
