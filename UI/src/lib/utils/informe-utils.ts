import type { InformeGuardado } from '$lib/types/informe.interface';

export function progresoDe(informe: InformeGuardado): number {
  if (informe.progreso !== undefined) return informe.progreso;
  
  const secciones = informe.secciones;
  if (!secciones?.length) return 0;
  
  let total = 0;
  let hechas = 0;
  
  for (const sec of secciones) {
    for (const t of sec.tareas || []) {
      total++;
      if (t.rev || t.ok || t.noOk) hechas++;
    }
  }
  
  return total > 0 ? Math.round((hechas / total) * 100) : 0;
}

export function estadoDe(informe: InformeGuardado): 'completado' | 'en-progreso' | 'pendiente' {
  const prog = progresoDe(informe);
  if (prog >= 100) return 'completado';
  if (prog > 0) return 'en-progreso';
  return 'pendiente';
}

export function colorEstado(informe: InformeGuardado): string {
  const estado = estadoDe(informe);
  if (estado === 'completado') return '#059669';
  if (estado === 'en-progreso') return '#d97706';
  return '#64748b ';
}

export function labelEstado(informe: InformeGuardado): string {
  const estado = estadoDe(informe);
  if (estado === 'completado') return 'COMPLETADO';
  if (estado === 'en-progreso') return 'EN PROGRESO';
  return 'PENDIENTE';
}
