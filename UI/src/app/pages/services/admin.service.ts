import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServicioAdmin {
  private readonly apiBase = `http://${window.location.hostname}:5000/api/admin`;
  
  // Estado persistente en la sesión
  isAdmin = signal(sessionStorage.getItem('gtm_admin') === 'true');

  constructor(private http: HttpClient) {}

  setAdmin(val: boolean) {
    this.isAdmin.set(val);
    sessionStorage.setItem('gtm_admin', val.toString());
  }

  async login(password: string): Promise<boolean> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiBase}/login?password=${password}`, {})
      );
      if (res.success) {
        this.setAdmin(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async sincronizarExcel(): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiBase}/sync`, {}));
  }
}
