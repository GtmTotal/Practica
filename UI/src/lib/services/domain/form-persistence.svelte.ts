import { databaseService } from '../api/database.svelte';
import { navService } from '../stores/navigation.svelte';
import { configCentrosService } from '../stores/config-centros.svelte';
import { obtenerTemplateCuadroElectrico } from './template-service';
import type { CuadroSeccionTemplate, CuadroTareaTemplate, CuadroSubTareaTemplate } from './template-service';
import { pdfDataBuilder } from './form-persistence/pdf-data-builder.svelte';
import { pdfReportService } from './form-persistence/pdf-report.svelte';
import { formInitService } from './form-initialization.svelte';
import { progresoFormulario } from '$lib/utils/informe-utils';
import { ui } from '../stores/ui.svelte';
import type { InformeGuardado } from '$lib/types/informe.interface';
import type { Foto } from '$lib/types/foto.interface';
import type { FormState, SeccionState, TareaState, SubTareaState, CampoState, BombaState } from './form-initialization.svelte';
import type { ConfigSeccion, TareaConfig, CampoMedicion } from '$lib/types/config.interface';

interface TareaTemplate extends TareaConfig {
  titulo?: string;
  subtareas?: { descripcion: string; sinCheck?: boolean }[];
  indice?: string;
  sinCheck?: boolean;
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

  private validarUnicidadCuadro(obraForm: FormState): { valido: boolean; error?: string } {
    if (obraForm.tipo !== 'cuadro_electrico') return { valido: true };

    const id = obraForm.id;
    const nProy = obraForm.nProy?.trim();
    const nOrdenCuadro = obraForm.nOrdenCuadro?.trim();
    const nOrdenInstalacion = obraForm.nOrdenInstalacion?.trim();

    const duplicados = this.informesGuardados.filter(inf => {
      if (inf.id === id) return false;
      if (inf.tipo !== 'cuadro_electrico') return false;

      if (nProy && inf.nProy?.trim() === nProy) return true;
      if (nOrdenCuadro && inf.nOrdenCuadro?.trim() === nOrdenCuadro) return true;
      if (nOrdenInstalacion && inf.nOrdenInstalacion?.trim() === nOrdenInstalacion) return true;

      return false;
    });

    if (duplicados.length > 0) {
      const inf = duplicados[0];
      let campo = '';
      if (nProy && inf.nProy?.trim() === nProy) campo = 'el Nº de proyecto';
      else if (nOrdenCuadro && inf.nOrdenCuadro?.trim() === nOrdenCuadro) campo = 'el Nº de orden del cuadro';
      else if (nOrdenInstalacion && inf.nOrdenInstalacion?.trim() === nOrdenInstalacion) campo = 'el Nº de orden de instalación';

      return { 
        valido: false, 
        error: `Ya existe un informe de cuadro eléctrico con ${campo} "${campo === 'el Nº de proyecto' ? nProy : campo === 'el Nº de orden del cuadro' ? nOrdenCuadro : nOrdenInstalacion}" (Obra: ${inf.nombreObra})` 
      };
    }

    return { valido: true };
  }

  async guardar(obraForm: FormState | null, fotosSecciones: Foto[][]): Promise<void> {
    if (!obraForm) return;

    const unicidad = this.validarUnicidadCuadro(obraForm);
    if (!unicidad.valido) {
      ui.error(unicidad.error || 'Error de unicidad');
      throw new Error(unicidad.error);
    }

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

    if (obraForm.tipo === 'cuadro_electrico') {
      const unicidad = this.validarUnicidadCuadro(obraForm);
      if (!unicidad.valido) {
        // For auto-save, we don't show a popup to avoid interrupting the user, 
        // but we don't save the data to prevent duplicates.
        return;
      }
    }

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

      const nombreCentro = inf.nombreObra || completo.nombreObra;
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

      let templateCuadro: { secciones: CuadroSeccionTemplate[] } | null = null;
      if (completo.tipo === 'cuadro_electrico') {
        templateCuadro = obtenerTemplateCuadroElectrico();
      }

      if (completo.secciones?.length) {
        completo.secciones.forEach((sec: SeccionState & { fotos?: Foto[] }) => {
          const { seccionGroup, fotos } = this.restaurarSeccionGuardada(sec, templateCuadro);
          obraForm.secciones.push(seccionGroup);
          fotosPorSeccionBase64.push(fotos);
          seccionesColapsadas.push(true);
        });
      } else {
        const centroConfig = await configCentrosService.getByCentro(nombreCentro);
        
        if (centroConfig) {
          centroConfig.secciones.forEach((template: ConfigSeccion) => {
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

  private restaurarSeccionGuardada(sec: SeccionState & { fotos?: Foto[] }, templateCuadro?: { secciones: CuadroSeccionTemplate[] } | null): { seccionGroup: SeccionState; fotos: Foto[] } {
    const templateSec = templateCuadro?.secciones?.find((s: CuadroSeccionTemplate) => String(s.prefijo) === String(sec.prefijo));

    const tareas = (sec.tareas || []).map((t: TareaState, idx: number) => {

      let matchedTitulo = t.titulo;
      const templateTarea = templateSec?.tareas
        ? (templateSec.tareas[idx] || templateSec.tareas.find((tt: CuadroTareaTemplate) => tt.descripcion === t.descripcion))
        : null;
      if (!matchedTitulo && templateTarea) {
        matchedTitulo = templateTarea.titulo;
      }

      let subtareas: SubTareaState[] = [];
      if (t.subtareas && t.subtareas.length > 0) {
        subtareas = t.subtareas.map((st: SubTareaState) => ({
          descripcion: st.descripcion,
          ok: st.ok || false,
          noOk: st.noOk || false,
          notaTarea: st.notaTarea || '',
          tecnico: (st as any).tecnico || '',
          sinCheck: st.sinCheck
        }));
      } else if (templateTarea?.subtareas?.length) {
        subtareas = templateTarea.subtareas.map((st: CuadroSubTareaTemplate) => ({
          descripcion: st.descripcion,
          ok: false,
          noOk: false,
          notaTarea: st.notaTarea || '',
          tecnico: '',
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
        tecnico: (t as any).tecnico || '',
        grupo: t.grupo,
        campos: (t.campos || []).map((c: CampoState) => ({
          clave: c.clave,
          valor: c.valor,
          sufijo: c.sufijo
        })),
        subtareas,
        indice: t.indice || templateTarea?.indice,
        sinCheck: t.sinCheck !== undefined ? t.sinCheck : templateTarea?.sinCheck
      };

      if (t.bombasQuimicas) {
        tareaGroup.bombasQuimicas = (t.bombasQuimicas as BombaState[]).map((b: BombaState) => ({
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

    const fotos = (sec.fotos || []).map((f: Foto) => ({
      url: f.url,
      preview: f.url || f.base64,
      nombre: f.nombre,
      base64: f.base64,
      descripcion: f.descripcion || ''
    }));

    return { seccionGroup, fotos };
  }

  private crearSeccionDesdeTemplate(template: ConfigSeccion): SeccionState {
    const tareas = template.tareas.map((tareaTemplate: TareaTemplate) => ({
      descripcion: tareaTemplate.descripcion,
      titulo: tareaTemplate.titulo,
      rev: false,
      ok: false,
      noOk: false,
      notaTarea: '',
      tecnico: '',
      campos: (tareaTemplate.campos || []).map((campo: CampoMedicion) => ({
        clave: campo.clave,
        valor: null,
        sufijo: campo.sufijo
      })),
      subtareas: (tareaTemplate.subtareas || []).map((st: { descripcion: string; sinCheck?: boolean }) => ({
        descripcion: st.descripcion,
        ok: false,
        noOk: false,
        notaTarea: '',
        tecnico: '',
        sinCheck: st.sinCheck
      })),
      indice: tareaTemplate.indice,
      sinCheck: tareaTemplate.sinCheck
    }));

    return {
      titulo: template.titulo,
      tipo: template.tipo,
      prefijo: template.prefijo.toString(),
      tareas: tareas,
      observaciones: ''
    };
  }
}

export const formPersistenceService = new ServicioPersistenciaFormulario();
