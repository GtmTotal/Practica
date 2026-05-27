import { databaseService } from './database.svelte';
import { navService } from './navigation.svelte';
import { configCentrosService } from './config-centros.svelte';
import { CUADRO_ELECTRICO_TEMPLATE } from '$lib/templates/cuadroElectrico';
import { pdfDataBuilder } from './form-persistence/pdf-data-builder.svelte';
import { pdfReportService } from './form-persistence/pdf-report.svelte';
import { formInitService } from './form-initialization.svelte';
import { progresoFormulario } from '$lib/utils/informe-utils';
import { ui } from './ui.svelte';
import type { InformeGuardado } from '$lib/types/informe.interface';
import type { Foto } from '$lib/types/foto.interface';
import type { FormState, SeccionState, TareaState } from './form-initialization.svelte';

class ServicioPersistenciaFormulario {
  informesGuardados = $state<InformeGuardado[]>([]);

  async cargarHistorial(): Promise<InformeGuardado[]> {
    const informes = await databaseService.obtenerTodos();
    const ordenados = informes.sort((a, b) => {
      const dateA = a.ultimaModificacion ? new Date(a.ultimaModificacion).getTime() : 0;
      const dateB = b.ultimaModificacion ? new Date(b.ultimaModificacion).getTime() : 0;
      return dateB - dateA;
    });
    this.informesGuardados = ordenados;
    return ordenados;
  }

  async guardar(obraForm: FormState | null, fotosSecciones: Foto[][]): Promise<void> {
    if (!obraForm) return;

    if ((!obraForm.tipo || obraForm.tipo === 'mantenimiento') && (!obraForm.cuatrimestre || !obraForm.cuatrimestre.trim())) {
      ui.error('El informe debe tener un cuatrimestre asignado');
      return;
    }
    const informeCompleto = {
      ...obraForm,
      secciones: obraForm.secciones.map((sec, idx) => ({
        ...sec,
        fotos: fotosSecciones[idx] || []
      })),
      ultimaModificacion: new Date().toLocaleString(),
      progreso: progresoFormulario(obraForm)
    };

    await databaseService.guardar(informeCompleto);
    await this.cargarHistorial();
  }

  async soloGuardar(obraForm: FormState | null, fotosSecciones: Foto[][]): Promise<void> {
    if (!obraForm) return;

    if ((!obraForm.tipo || obraForm.tipo === 'mantenimiento') && (!obraForm.cuatrimestre || !obraForm.cuatrimestre.trim())) {
      return; // Silently fail for auto-save if cuatrimestre is missing
    }
    const informeCompleto = {
      ...obraForm,
      secciones: obraForm.secciones.map((sec, idx) => ({
        ...sec,
        fotos: fotosSecciones[idx] || []
      })),
      ultimaModificacion: new Date().toLocaleString(),
      progreso: progresoFormulario(obraForm)
    };
    
    await databaseService.guardar(informeCompleto);
  }

  async patchMetadata(id: number, obraForm: FormState): Promise<void> {
    await databaseService.patchMetadata(id, {
      tecnico: obraForm.tecnico,
      conclusiones: obraForm.conclusiones,
      protegido: obraForm.protegido,
      fecha: obraForm.fecha
    });
  }

  async patchSeccion(id: number, seccion: SeccionState): Promise<void> {
    await databaseService.patchSeccion(id, Number(seccion.prefijo), {
      observaciones: seccion.observaciones,
      titulo: seccion.titulo
    });
  }

  async patchTarea(id: number, prefijo: number, orden: number, tarea: TareaState): Promise<void> {
    await databaseService.patchTarea(id, prefijo, orden, {
      ok: tarea.ok,
      noOk: tarea.noOk,
      rev: tarea.rev,
      notaTarea: tarea.notaTarea
    });
  }

  async editarInforme(inf: InformeGuardado): Promise<{
    obraForm: FormState;
    fotosPorSeccionBase64: Foto[][];
    seccionesColapsadas: boolean[];
  } | null> {
    try {
      const completo = await databaseService.obtenerPorId(inf.id!);
      
      if (!completo) return null;

      const nombreCentro = inf.nombreObra || completo.nombreObra || completo.nombre_obra;
      navService.centroSeleccionado = nombreCentro;
      navService.cuatrimestreSeleccionado = completo.cuatrimestre || inf.cuatrimestre || '';
      navService.persist();

      const obraForm: FormState = {
        id: completo.id,
        tipo: completo.tipo || 'mantenimiento',
        nombreObra: nombreCentro,
        tecnico: completo.tecnico || '',
        fecha: completo.fecha || '',
        cuatrimestre: completo.cuatrimestre || '',
        secciones: [],
        conclusiones: completo.conclusiones || '',
        protegido: completo.protegido || false,
        nProy: completo.nProy,
        nOrdenCuadro: completo.nOrdenCuadro,
        nOrdenInstalacion: completo.nOrdenInstalacion
      };

      const fotosPorSeccionBase64: Foto[][] = [];
      const seccionesColapsadas: boolean[] = [];

      let templateCuadro: any = null;
      if (completo.tipo === 'cuadro_electrico') {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('CUADRO_ELECTRICO_TEMPLATE_CUSTOM');
          if (saved) {
            try {
              templateCuadro = JSON.parse(saved);
            } catch (e) {
              console.error('Error parsing custom template', e);
            }
          }
        }
        if (!templateCuadro) {
          templateCuadro = CUADRO_ELECTRICO_TEMPLATE;
        }
      }

      if (completo.secciones?.length) {
        completo.secciones.forEach((sec: any) => {
          const { seccionGroup, fotos } = this.restaurarSeccionGuardada(sec, templateCuadro);
          obraForm.secciones.push(seccionGroup);
          fotosPorSeccionBase64.push(fotos);
          seccionesColapsadas.push(true);
        });
      } else {
        const centroConfig = await configCentrosService.getByCentro(nombreCentro);
        
        if (centroConfig) {
          centroConfig.secciones.forEach((template: any) => {
            const seccionGroup = this.crearSeccionDesdeTemplate(template);
            obraForm.secciones.push(seccionGroup);
            fotosPorSeccionBase64.push([]);
            seccionesColapsadas.push(true);
          });
        } else {
          console.error('[ERROR] No hay configuracion para', nombreCentro);
          return null;
        }
      }

      return { obraForm, fotosPorSeccionBase64, seccionesColapsadas };
    } catch (error) {
      console.error('Error crítico al editar informe:', error);
      return null;
    }
  }

  async generarPDF(obraForm: FormState, fotosPorSeccion: Foto[][]): Promise<void> {
    await this.soloGuardar(obraForm, fotosPorSeccion);
    const datos = await pdfDataBuilder.buildDatosPDF(obraForm, fotosPorSeccion);
    await pdfReportService.generarPDF(datos);
    await navService.reset();
    ui.success('PDF generado correctamente');
  }

  async buscarPorCuatrimestreYCentro(cuatrimestre: string, centro: string): Promise<InformeGuardado | null> {
    const informes = await databaseService.obtenerTodos();
    const cLow = centro.trim().toLowerCase();
    
    return informes.find(inf => {
      const infCuatri = (inf.cuatrimestre || '').trim();
      const infCentro = (inf.nombreObra || '').trim().toLowerCase();
      
      return infCuatri === cuatrimestre.trim() && 
             (infCentro === cLow || infCentro.startsWith(cLow));
    }) || null;
  }

  async eliminarInforme(id: number): Promise<void> {
    await databaseService.eliminar(id);
    await this.cargarHistorial();
  }

  private restaurarSeccionGuardada(sec: any, templateCuadro?: any): { seccionGroup: SeccionState; fotos: Foto[] } {
    const templateSec = templateCuadro?.secciones?.find((s: any) => String(s.prefijo) === String(sec.prefijo));

    const tareas = (sec.tareas || []).map((t: any, idx: number) => {

      let matchedTitulo = t.titulo;
      // Match template tarea by index first, then by description
      const templateTarea = templateSec?.tareas
        ? (templateSec.tareas[idx] || templateSec.tareas.find((tt: any) => tt.descripcion === t.descripcion))
        : null;
      if (!matchedTitulo && templateTarea) {
        matchedTitulo = templateTarea.titulo;
      }

      // Restore subtareas: use saved data if available, otherwise restore from template
      let subtareas: any[] = [];
      if (t.subtareas && t.subtareas.length > 0) {
        // Saved data has subtareas — use them
        subtareas = t.subtareas.map((st: any) => ({
          descripcion: st.descripcion,
          ok: st.ok || false,
          noOk: st.noOk || false,
          notaTarea: st.notaTarea || '',
          sinCheck: st.sinCheck
        }));
      } else if (templateTarea?.subtareas?.length) {
        // No saved subtareas — restore structure from template
        subtareas = templateTarea.subtareas.map((st: any) => ({
          descripcion: st.descripcion,
          ok: false,
          noOk: false,
          notaTarea: st.notaTarea || '',
          sinCheck: st.sinCheck
        }));
      }

      const tareaGroup: TareaState = {
        descripcion: t.descripcion,
        titulo: matchedTitulo,
        rev: t.rev || false,
        ok: t.ok || false,
        noOk: t.noOk || false,
        notaTarea: t.notaTarea || '',
        grupo: t.grupo,
        campos: (t.campos || []).map((c: any) => ({
          clave: c.clave,
          valor: c.valor,
          sufijo: c.sufijo
        })),
        subtareas,
        indice: t.indice || templateTarea?.indice,
        sinCheck: t.sinCheck !== undefined ? t.sinCheck : templateTarea?.sinCheck
      };

      if (t.bombasQuimicas) {
        tareaGroup.bombasQuimicas = (t.bombasQuimicas as any[]).map(b => ({
          nombre: b.nombre,
          amperios: b.amperios,
          porcentaje: b.porcentaje
        }));
      }

      return tareaGroup;
    });

    const seccionGroup: SeccionState = {
      titulo: sec.titulo,
      tipo: sec.tipo,
      prefijo: sec.prefijo,
      tareas: tareas,
      observaciones: sec.observaciones || ''
    };

    const fotos = (sec.fotos || []).map((f: any) => ({
      url: f.url,
      preview: f.url || f.base64,
      nombre: f.nombre,
      base64: f.base64,
      descripcion: f.descripcion || ''
    }));

    return { seccionGroup, fotos };
  }

  private crearSeccionDesdeTemplate(template: any): SeccionState {
    const tareas = template.tareas.map((tareaTemplate: any) => ({
      descripcion: tareaTemplate.descripcion,
      titulo: tareaTemplate.titulo,
      ok: false,
      noOk: false,
      notaTarea: '',
      campos: (tareaTemplate.campos || []).map((campo: any) => ({
        clave: campo.clave,
        valor: null,
        sufijo: campo.sufijo
      })),
      subtareas: (tareaTemplate.subtareas || []).map((st: any) => ({
        descripcion: st.descripcion,
        ok: false,
        noOk: false,
        notaTarea: '',
        sinCheck: st.sinCheck
      })),
      indice: tareaTemplate.indice,
      sinCheck: tareaTemplate.sinCheck
    }));

    return {
      titulo: template.titulo,
      tipo: template.tipo,
      prefijo: template.prefijo,
      tareas: tareas,
      observaciones: ''
    };
  }
}

export const formPersistenceService = new ServicioPersistenciaFormulario();
