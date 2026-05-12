import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ConfigCentro } from '../config.interface';
import { getApiBaseUrl } from '../../core/api-config';

@Injectable({ providedIn: 'root' })
export class ServicioConfiguracionCentros {
  private readonly apiBase = getApiBaseUrl();
  private cache: Record<string, ConfigCentro> | null = null;
  private centroCache = new Map<string, ConfigCentro>();

  constructor(private http: HttpClient) {}

  async getAll(): Promise<Record<string, ConfigCentro>> {
    if (this.cache) return this.cache;

    this.cache = await firstValueFrom(
      this.http.get<Record<string, ConfigCentro>>(`${this.apiBase}/main-page/config-centros`)
    );

    for (const [nombre, config] of Object.entries(this.cache)) {
      this.centroCache.set(nombre, config);
    }

    return this.cache;
  }

  async getByCentro(nombre: string): Promise<ConfigCentro | undefined> {
    if (this.centroCache.has(nombre)) {
      return this.centroCache.get(nombre);
    }

    try {
      const config = await firstValueFrom(
        this.http.get<ConfigCentro>(`${this.apiBase}/main-page/config-centros/${encodeURIComponent(nombre)}`)
      );
      this.centroCache.set(nombre, config);
      return config;
    } catch {
      const configs = await this.getAll();
      return configs[nombre];
    }
  }
}