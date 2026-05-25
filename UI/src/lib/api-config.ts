/**
 * Devuelve la URL base de la API.
 * Detecta automáticamente si está en red local o externo.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return ''; // Safety check for SSR

  const hostname = window.location.hostname;

  // Función para detectar si es una IP privada
  const isPrivateIP = (ip: string): boolean => {
    return /^10\./.test(ip) ||
           /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
           /^192\.168\./.test(ip) ||
           /^127\./.test(ip) ||
           /^localhost$/.test(ip);
  };

  // Si estamos en localhost o red local → usar IP directa
  if (isPrivateIP(hostname)) {
    // Si estás en desarrollo local (localhost), conéctate a la API local de tu propia máquina
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Si estás en la oficina accediendo al servidor directamente por su IP local, usa esa misma IP dinámicamente
    return `http://${hostname}:5000/api`;
  }

  // Si estamos fuera de la red local → usar Dokploy
  return 'https://reporteobras-api-x6lbu1.dokploy.com/api';
}

/**
 * Devuelve los headers base para todas las peticiones a la API.
 */
export function getApiHeaders(): Record<string, string> {
  return {};
}
