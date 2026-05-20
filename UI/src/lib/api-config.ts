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
    return 'http://192.168.1.135:5000/api';
  }

  // Si estamos fuera de la red local → usar ngrok
  return 'https://earthly-discard-tarmac.ngrok-free.dev/api';
}

/**
 * Devuelve los headers base para todas las peticiones a la API.
 * Incluye el header para saltar el interstitial de ngrok solo cuando es necesario.
 */
export function getApiHeaders(): Record<string, string> {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Función para detectar si es una IP privada
  const isPrivateIP = (ip: string): boolean => {
    return /^10\./.test(ip) ||
           /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
           /^192\.168\./.test(ip) ||
           /^127\./.test(ip) ||
           /^localhost$/.test(ip);
  };

  // Solo agregar header ngrok si NO estamos en red local
  if (!isPrivateIP(hostname)) {
    return { 'ngrok-skip-browser-warning': '1' };
  }

  return {};
}
