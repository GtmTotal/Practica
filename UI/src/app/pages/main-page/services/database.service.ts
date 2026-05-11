import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, map } from 'rxjs';
import { InformeGuardado } from '../../informe.interface';
import { ServicioAdmin } from '../../services/admin.service';

@Injectable({ providedIn: 'root' })
export class ServicioBaseDeDatos {
  private readonly apiBase = `http://${window.location.hostname}:5000/api`;

  constructor(private http: HttpClient, private adminService: ServicioAdmin) {}

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
    return firstValueFrom(this.http.post(`${this.apiBase}/informes`, payload, { headers: this.adminService.getAuthHeaders() }));
  }

  async obtenerTodos(): Promise<InformeGuardado[]> {
    const data = await firstValueFrom(this.http.get<any[]>(`${this.apiBase}/informes`));

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

  obtenerTodos$(): Observable<InformeGuardado[]> {
    return this.http.get<any[]>(`${this.apiBase}/informes`).pipe(
      map((data) => data.map((item: any) => ({
        id: item.id,
        nombreObra: item.nombre_obra,
        fecha: item.fecha,
        cuatrimestre: item.cuatrimestre,
        protegido: item.datos?.protegido === true,
        progreso: item.datos?.progreso ?? 0,
        ultimaModificacion: item.modificado,
      })))
    );
  }

  async eliminarCuatrimestre(cuatrimestre: string) {
    if (!cuatrimestre || cuatrimestre === 'sin-cuatri') {
      throw new Error('Cuatrimestre inválido para eliminación');
    }
    return firstValueFrom(this.http.delete(`${this.apiBase}/informes/cuatrimestre/${encodeURIComponent(cuatrimestre)}`, { headers: this.adminService.getAuthHeaders() }));
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
      const data = await firstValueFrom(this.http.get<any>(`${this.apiBase}/informes/${id}`));
      return data?.datos ?? null;
    } catch {
      return null;
    }
  }

  async eliminar(id: number) {
    return firstValueFrom(this.http.delete(`${this.apiBase}/informes/${id}`, { headers: this.adminService.getAuthHeaders() }));
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

