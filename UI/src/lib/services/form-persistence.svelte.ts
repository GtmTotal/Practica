import { databaseService } from './database.svelte';
import { navService } from './navigation.svelte';
import { configCentrosService } from './config-centros.svelte';
import { pdfDataBuilder } from './form-persistence/pdf-data-builder.svelte';
import { pdfReportService } from './form-persistence/pdf-report.svelte';
import { formInitService } from './form-initialization.svelte';
import { ui } from './ui.svelte';
import type { InformeGuardado } from '$lib/types/informe.interface';
import type { Foto } from '$lib/types/foto.interface';
import type { FormState, SeccionState, TareaState } from './form-initialization.svelte';

function calcularProgresoFormulario(form: FormState): number {
  if (!form.secciones || form.secciones.length === 0) return 0;

  let totalTareas = 0;
  let tareasCompletadas = 0;

  form.secciones.forEach((sec: SeccionState) => {
    if (sec.tareas) {
      sec.tareas.forEach((tarea: TareaState) => {
        totalTareas++;
        if (tarea.ok || tarea.noOk) {
          tareasCompletadas++;
        }
      });
    }
  });

  return totalTareas === 0 ? 0 : Math.round((tareasCompletadas / totalTareas) * 100);
}

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
      progreso: calcularProgresoFormulario(obraForm)
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
      progreso: calcularProgresoFormulario(obraForm)
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

      if (completo.secciones?.length) {
        completo.secciones.forEach((sec: any) => {
          const { seccionGroup, fotos } = this.restaurarSeccionGuardada(sec);
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

  private restaurarSeccionGuardada(sec: any): { seccionGroup: SeccionState; fotos: Foto[] } {
    const tareas = (sec.tareas || []).map((t: any) => {
      const tareaGroup: TareaState = {
        descripcion: t.descripcion,
        ok: t.ok || false,
        noOk: t.noOk || false,
        notaTarea: t.notaTarea || '',
        campos: (t.campos || []).map((c: any) => ({
          clave: c.clave,
          valor: c.valor,
          sufijo: c.sufijo
        }))
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
      ok: false,
      noOk: false,
      notaTarea: '',
      campos: (tareaTemplate.campos || []).map((campo: any) => ({
        clave: campo.clave,
        valor: null,
        sufijo: campo.sufijo
      }))
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
