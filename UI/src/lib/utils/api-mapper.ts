import type { InformeGuardado } from '$lib/types/informe.interface';

const SNAKE_TO_CAMEL: Record<string, string> = {
  nombre_obra: 'nombreObra',
  n_proy: 'nProy',
  n_orden_cuadro: 'nOrdenCuadro',
  n_orden_instalacion: 'nOrdenInstalacion',
  ultima_modificacion: 'ultimaModificacion',
};

const CAMEL_TO_SNAKE: Record<string, string> = {
  nombreObra: 'nombre_obra',
  nProy: 'n_proy',
  nOrdenCuadro: 'n_orden_cuadro',
  nOrdenInstalacion: 'n_orden_instalacion',
  ultimaModificacion: 'ultima_modificacion',
};

function toCamelKey(key: string): string {
  return SNAKE_TO_CAMEL[key] ?? key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnakeKey(key: string): string {
  return CAMEL_TO_SNAKE[key] ?? key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

export function mapKeysToCamel<T = any>(obj: Record<string, any>): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toCamelKey(key)] = value;
  }
  return result as T;
}

export function mapKeysToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeKey(key)] = value;
  }
  return result;
}

export function mapInformeFromApi(item: Record<string, any>): InformeGuardado {
  const base = mapKeysToCamel<InformeGuardado>(item);
  return {
    ...base,
    ultimaModificacion: base.ultimaModificacion ?? item.modificado,
    protegido: item.datos?.protegido === true,
    progreso: item.datos?.progreso ?? 0,
  };
}

export function mapInformeToApi(informe: any): Record<string, any> {
  const payload = mapKeysToSnake(informe);
  return {
    ...payload,
    datos: informe,
  };
}
