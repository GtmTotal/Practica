import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, map } from 'rxjs';
import { InformeGuardado } from '../../informe.interface';

@Injectable({ providedIn: 'root' })
export class ServicioBaseDeDatos {
  private readonly apiBase = `http://${window.location.hostname}:5000/api`;

  constructor(private http: HttpClient) {}

  async guardar(informe: any) {
    const payload = {
      id: informe.id,
      nombreObra: informe.nombreObra || 'Sin nombre',
      fecha: informe.fecha || null,
      cuatrimestre: informe.cuatrimestre || null,
      ultimaModificacion: informe.ultimaModificacion || new Date().toLocaleString(),
      datos: informe,
    };
    return firstValueFrom(this.http.post(`${this.apiBase}/informes`, payload));
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
    return firstValueFrom(this.http.delete(`${this.apiBase}/informes/cuatrimestre/${encodeURIComponent(cuatrimestre)}`));
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
    return firstValueFrom(this.http.delete(`${this.apiBase}/informes/${id}`));
  }
}

