import { getApiBaseUrl } from '../api-config';
import { adminService } from './admin.svelte';
import { ui } from './ui.svelte';
import type { Foto } from '$lib/types/foto.interface';

class ServicioGestionFotografias {
  private get apiBase() { return getApiBaseUrl(); }

  async comprimirImagen(file: File, maxPx = 600, calidad = 0.45): Promise<string> {
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
    
    const res = await fetch(`${this.apiBase}/files/upload`, {
      method: 'POST',
      headers: adminService.getAuthHeaders(),
      body: formData
    });
    if (!res.ok) throw new Error('Error al subir foto');
    const data = await res.json();
    return data.url;
  }

  async eliminarFotoPorUrl(url: string): Promise<void> {
    const objectKey = this.extraerObjectKey(url);
    if (!objectKey) return;
    
    await fetch(`${this.apiBase}/files?objectKey=${encodeURIComponent(objectKey)}`, {
      method: 'DELETE',
      headers: adminService.getAuthHeaders()
    });
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
    fotosList: Foto[],
    onUpdate: (nuevasFotos: Foto[]) => void,
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
    
    // Auto‑download each new photo so it stays on the device even if upload fails
    nuevas.forEach(({ base64, nombre }) => {
      const a = document.createElement('a');
      a.href = base64;
      a.download = nombre;
      // Append temporarily to the DOM to make the click work on mobile browsers
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    // Merge with existing list and update UI
    const actuales = [...fotosList, ...nuevas];
    onUpdate(actuales);
    input.value = '';
    
    if (onGuardar) onGuardar();
    ui.success(`${nuevas.length} foto(s) añadida(s)`);
  }

  async eliminarFoto(
    fotosList: Foto[],
    index: number,
    onUpdate: (nuevasFotos: Foto[]) => void,
    onGuardar?: () => void
  ): Promise<void> {
    const foto = fotosList[index];
    if (foto.url) {
      await this.eliminarFotoPorUrl(foto.url);
    }
    
    const actuales = [...fotosList];
    actuales.splice(index, 1);
    onUpdate(actuales);
    
    if (onGuardar) onGuardar();
    ui.success('Foto eliminada');
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
      ui.error('No se pudo descargar. Intenta mantener pulsada la imagen');
    }
  }
}

export const fotoManagerService = new ServicioGestionFotografias();
