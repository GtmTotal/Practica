import { Injectable, WritableSignal } from '@angular/core';
import { Foto } from '../../foto.interface';

@Injectable({ providedIn: 'root' })
export class ServicioConstruccionDatosDocumento {
  async buildDatosPDF(obraForm: any, fotosPorSeccionBase64: WritableSignal<Foto[]>[]) {
    const v = obraForm.value;
    const seccionesConFotosBase64 = await Promise.all(
      (v.secciones || []).map(async (s: any, idx: number) => {
        const fotos = fotosPorSeccionBase64[idx]() || [];
        const fotosBase64 = await Promise.all(
          fotos.map(async (foto: any) => {
            if (foto.base64) return foto.base64;
            if (foto.url) return await this.urlToBase64(foto.url);
            return '';
          })
        );
        return {
          tituloSeccion: s.titulo ?? '',
          tipoSeccion: s.tipo ?? '',
          observaciones: s.observaciones ?? '',
          fotosBase64: fotosBase64.filter(b64 => b64),
          puntos: (s.tareas ?? []).map((t: any, pIdx: number) => ({
            idManual: `${s.prefijo}.${pIdx + 1}`,
            descripcionManual: t.descripcion ?? '',
            revisado: t.rev ?? false,
            ok: t.ok ?? false,
            noOk: t.noOk ?? false,
            notaPunto: t.notaTarea ?? '',
            amperios: this.getValorCampo(t.campos, 'amperios'),
            hz: this.getValorCampo(t.campos, 'hz'),
            bar: this.getValorCampo(t.campos, 'bar'),
            porcentaje: this.getValorCampo(t.campos, 'porcentaje'),
            bombasQuimicas: t.bombasQuimicas && Array.isArray(t.bombasQuimicas)
              ? t.bombasQuimicas.map((b: any) => ({
                  nombre: b.nombre,
                  amperios: b.amperios,
                  porcentaje: b.porcentaje
                }))
              : []
          }))
        };
      })
    );
    return {
      nombreObra: v.nombreObra ?? '',
      tecnico: v.tecnico ?? '',
      fecha: v.fecha ?? '',
      conclusiones: v.conclusiones ?? '',
      secciones: seccionesConFotosBase64
    };
  }

  private async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error al convertir URL a base64:', error);
      return '';
    }
  }

  private getValorCampo(campos: any[], clave: string): string {
    const campo = campos?.find(c => c.clave === clave);
    return campo?.valor != null ? String(campo.valor) : '';
  }
}

