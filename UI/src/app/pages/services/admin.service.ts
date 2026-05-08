import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServicioAdmin {
  private readonly apiBase = `http://${window.location.hostname}:5000/api/admin`;

  constructor(private http: HttpClient) {}

  async sincronizarExcel(): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiBase}/sync`, {}));
  }
}
