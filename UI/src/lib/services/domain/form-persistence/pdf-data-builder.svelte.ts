import type { FormState } from '../form-initialization.svelte';
import type { Foto } from '$lib/types/foto.interface';

class ServicioConstruccionDatosDocumento {
  async buildDatosPDF(obraForm: FormState, fotosPorSeccionBase64: Foto[][]) {
    const seccionesConFotosBase64 = await Promise.all(
      (obraForm.secciones || []).map(async (s: any, idx: number) => {
        const fotos = fotosPorSeccionBase64[idx] || [];
        const fotosPDF = await Promise.all(
          fotos.map(async (foto: any) => {
            const base64 = foto.base64 ? foto.base64 : foto.url ? await this.urlToBase64(foto.url) : '';
            return { base64, descripcion: foto.descripcion };
          })
        );
        return {
          tituloSeccion: s.titulo ?? '',
          tipoSeccion: s.tipo ?? '',
          observaciones: s.observaciones ?? '',
          fotos: fotosPDF.filter(f => f.base64),
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
      nombreObra: obraForm.nombreObra ?? '',
      tecnico: obraForm.tecnico ?? '',
      fecha: obraForm.fecha ?? '',
      conclusiones: obraForm.conclusiones ?? '',
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

export const pdfDataBuilder = new ServicioConstruccionDatosDocumento();
