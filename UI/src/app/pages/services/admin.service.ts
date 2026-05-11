import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServicioAdmin {
  private readonly apiBase = `http://${window.location.hostname}:5000/api/admin`;
  private readonly tokenKey = 'gtm_admin_token';
  
  // Estado persistente en la sesión
  isAdmin = signal(!!sessionStorage.getItem(this.tokenKey));

  constructor(private http: HttpClient) {}

  setAdmin(val: boolean) {
    this.isAdmin.set(val);
    if (!val) sessionStorage.removeItem(this.tokenKey);
  }

  getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem(this.tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async login(password: string): Promise<boolean> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiBase}/login`, { password })
      );
      if (res.success && res.token) {
        sessionStorage.setItem(this.tokenKey, res.token);
        this.setAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async sincronizarExcel(): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiBase}/sync`, {}, { headers: this.getAuthHeaders() }));
  }
}
