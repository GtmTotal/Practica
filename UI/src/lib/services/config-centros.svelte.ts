import { getApiBaseUrl, getApiHeaders } from '../api-config';
import type { ConfigCentro } from '$lib/types/config.interface';

class ServicioConfiguracionCentros {
  private get apiBase() { return getApiBaseUrl(); }
  private cache: Record<string, ConfigCentro> | null = null;
  private centroCache = new Map<string, ConfigCentro>();

  async getAll(): Promise<Record<string, ConfigCentro>> {
    if (this.cache) return this.cache;

    const res = await fetch(`${this.apiBase}/main-page/config-centros`, {
      headers: getApiHeaders()
    });
    if (!res.ok) throw new Error('Error getting config-centros');
    this.cache = await res.json();

    if (this.cache) {
      for (const [nombre, config] of Object.entries(this.cache)) {
        this.centroCache.set(nombre, config);
      }
    }

    return this.cache || {};
  }

  async getByCentro(nombre: string): Promise<ConfigCentro | undefined> {
    if (this.centroCache.has(nombre)) {
      return this.centroCache.get(nombre);
    }

    try {
      const res = await fetch(`${this.apiBase}/main-page/config-centros/${encodeURIComponent(nombre)}`, {
        headers: getApiHeaders()
      });
      if (!res.ok) throw new Error('Not found');
      const config = await res.json();
      this.centroCache.set(nombre, config);
      return config;
    } catch {
      const configs = await this.getAll();
      return configs[nombre];
    }
  }

  invalidateCache(): void {
    this.cache = null;
    this.centroCache.clear();
  }
}

export const configCentrosService = new ServicioConfiguracionCentros();
