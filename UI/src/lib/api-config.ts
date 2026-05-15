/**
 * Devuelve la URL base de la API.
 * En producción (mismo host que el frontend), usa window.location.hostname.
 * En desarrollo local (localhost), apunta al servidor de producción.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return ''; // Safety check for SSR

  const hostname = window.location.hostname;

  // Si estamos en desarrollo local, apuntamos al backend de producción
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://192.168.1.135:5000/api';
  }

  // En producción o red local, el backend está en el mismo host
  return `http://${hostname}:5000/api`;
}
