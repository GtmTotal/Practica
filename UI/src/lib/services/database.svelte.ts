import { getApiBaseUrl } from '../api-config';
import { adminService } from './admin.svelte';
import type { InformeGuardado } from '$lib/types/informe.interface';

class ServicioBaseDeDatos {
  private get apiBase() { return getApiBaseUrl(); }

  async guardar(informe: any) {
    if (!informe.cuatrimestre || !informe.cuatrimestre.trim()) {
      throw new Error('El informe debe tener un cuatrimestre asignado');
    }

    const payload = {
      id: informe.id,
      nombreObra: informe.nombreObra || 'Sin nombre',
      fecha: informe.fecha || null,
      cuatrimestre: informe.cuatrimestre.trim(),
      ultimaModificacion: informe.ultimaModificacion || new Date().toLocaleString(),
      datos: informe,
    };
    
    const res = await fetch(`${this.apiBase}/informes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...adminService.getAuthHeaders()
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error al guardar en BD');
    return res.json();
  }

  async obtenerTodos(): Promise<InformeGuardado[]> {
    const res = await fetch(`${this.apiBase}/informes`);
    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => ({
      id: item.id,
      nombreObra: item.nombre_obra,
      fecha: item.fecha,
      cuatrimestre: item.cuatrimestre,
      protegido: item.datos?.protegido === true,
      progreso: item.datos?.progreso ?? 0,
      ultimaModificacion: item.modificado,
    }));
  }

  async eliminarCuatrimestre(cuatrimestre: string) {
    if (!cuatrimestre || cuatrimestre === 'sin-cuatri') {
      throw new Error('Cuatrimestre inválido para eliminación');
    }
    const res = await fetch(`${this.apiBase}/informes/cuatrimestre/${encodeURIComponent(cuatrimestre)}`, {
      method: 'DELETE',
      headers: adminService.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al eliminar cuatrimestre');
    return res.json();
  }

  async obtenerSinCuatrimestre(): Promise<InformeGuardado[]> {
    try {
      const informes = await this.obtenerTodos();
      return informes.filter(i => !i.cuatrimestre || i.cuatrimestre === 'sin-cuatri');
    } catch {
      return [];
    }
  }

  async obtenerPorId(id: number): Promise<any | null> {
    try {
      const res = await fetch(`${this.apiBase}/informes/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.datos ?? null;
    } catch {
      return null;
    }
  }

  async eliminar(id: number) {
    const res = await fetch(`${this.apiBase}/informes/${id}`, {
      method: 'DELETE',
      headers: adminService.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Error al eliminar informe');
    return res.json();
  }

  async existeCuatrimestre(cuatrimestre: string): Promise<boolean> {
    try {
      const informes = await this.obtenerTodos();
      return informes.some(i => i.cuatrimestre === cuatrimestre);
    } catch {
      return false;
    }
  }
}

export const databaseService = new ServicioBaseDeDatos();
