import { Injectable, WritableSignal } from '@angular/core';
import { Foto } from '../../informe-page/foto.interface'; 
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { UIService } from '../../../shared/services/ui.service';

@Injectable({ providedIn: 'root' })
export class ServicioGestionFotografias {
  private http = inject(HttpClient);
  private ui = inject(UIService);
  private readonly apiBase = `http://${window.location.hostname}:5000/api`;

  async comprimirImagen(file: File, maxPx = 800, calidad = 0.6): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxPx || h > maxPx) {
            if (w > h) { h = Math.round(h * maxPx / w); w = maxPx; }
            else { w = Math.round(w * maxPx / h); h = maxPx; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async subirFoto(file: File, nombre: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, nombre);
    const response = await firstValueFrom(
      this.http.post<{ url: string }>(`${this.apiBase}/files/upload`, formData)
    );
    return response.url;
  }

  async eliminarFotoPorUrl(url: string): Promise<void> {
    const objectKey = this.extraerObjectKey(url);
    if (!objectKey) return;
    await firstValueFrom(this.http.delete(`${this.apiBase}/files`, {
      params: { objectKey }
    }));
  }

  private extraerObjectKey(url: string): string | null {
    try {
      const parsed = new URL(url);
      const marker = '/obras/';
      const idx = parsed.pathname.indexOf(marker);
      if (idx < 0) return null;
      return parsed.pathname.slice(idx + marker.length);
    } catch {
      return null;
    }
  }
  async agregarFotosDesdeInput(
    event: Event,
    fotosSignal: WritableSignal<Foto[]>,
    onGuardar?: () => void
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const archivos = Array.from(input.files);
    const nuevas = await Promise.all(
      archivos.map(async file => ({
        file,
        base64: await this.comprimirImagen(file),
        nombre: file.name
      }))
    );
    fotosSignal.set([...fotosSignal(), ...nuevas]);
    input.value = '';
    if (onGuardar) onGuardar();
  }

  async eliminarFoto(
    fotosSignal: WritableSignal<Foto[]>,
    index: number,
    onGuardar?: () => void
  ): Promise<void> {
    const foto = fotosSignal()[index];
    if (foto.url) {
      await this.eliminarFotoPorUrl(foto.url);
    }
    const actuales = [...fotosSignal()];
    actuales.splice(index, 1);
    fotosSignal.set(actuales);
    if (onGuardar) onGuardar();
  }

  async descargarFoto(foto: any): Promise<void> {
    const url = foto.url || foto.base64 || foto.preview;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = foto.nombre || 'imagen.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error al descargar la foto:', error);
      await this.ui.alert('Error', 'No se pudo descargar. Intenta mantener pulsada la imagen y elegir "Guardar imagen".', 'warning');
    }
  }
}

