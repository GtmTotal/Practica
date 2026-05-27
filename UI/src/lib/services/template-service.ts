import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';
import { browser } from '$app/environment';

export interface CuadroSeccionTemplate {
  titulo: string;
  tipo: string;
  prefijo: number;
  tareas: CuadroTareaTemplate[];
}

export interface CuadroTareaTemplate {
  descripcion: string;
  titulo?: string;
  indice?: string;
  sinCheck?: boolean;
  subtareas?: CuadroSubTareaTemplate[];
}

export interface CuadroSubTareaTemplate {
  descripcion: string;
  notaTarea?: string;
}

export function obtenerTemplateCuadroElectrico() {
  if (!browser) return structuredClone(CUADRO_ELECTRICO_TEMPLATE);
  try {
    const saved = localStorage.getItem('CUADRO_ELECTRICO_TEMPLATE_CUSTOM');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error parsing custom template', e);
  }
  return structuredClone(CUADRO_ELECTRICO_TEMPLATE);
}

export function guardarTemplateCuadroElectrico(template: typeof CUADRO_ELECTRICO_TEMPLATE) {
  localStorage.setItem('CUADRO_ELECTRICO_TEMPLATE_CUSTOM', JSON.stringify(template));
}
