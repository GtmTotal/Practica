import { Injectable, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, map } from 'rxjs';
import { Foto } from '../foto.interface';
import { InformeGuardado } from '../../informe.interface';
import { ServicioBaseDeDatos } from '../../main-page/services/database.service';
import { ServicioNavegacion } from '../../main-page/services/navigation.service';
import { ServicioConfiguracionCentros } from '../../services/config-centros.service';
import { ServicioConstruccionDatosDocumento } from './form-persistence/pdf-data-builder.service';
import { ServicioReporteDocumento } from './form-persistence/pdf-report.service';

function calcularProgresoFormulario(form: FormGroup): number {
  const secciones = form.get('secciones') as FormArray;
  if (!secciones || secciones.length === 0) return 0;

  let totalTareas = 0;
  let tareasCompletadas = 0;

  secciones.controls.forEach(sec => {
    const tareas = sec.get('tareas') as FormArray;
    if (tareas) {
      tareas.controls.forEach(tarea => {
        totalTareas++;
        const ok = tarea.get('ok')?.value;
        const noOk = tarea.get('noOk')?.value;
        if (ok || noOk) {
          tareasCompletadas++;
        }
      });
    }
  });

  return totalTareas === 0 ? 0 : Math.round((tareasCompletadas / totalTareas) * 100);
}

@Injectable({ providedIn: 'root' })
export class ServicioPersistenciaFormulario {
  private informesGuardadosSignal = signal<InformeGuardado[]>([]);

  constructor(
    private fb: FormBuilder,
    private dbService: ServicioBaseDeDatos,
    private http: HttpClient,
    private navService: ServicioNavegacion,
    private servicioConfiguracionCentros: ServicioConfiguracionCentros,
    private pdfDataBuilder: ServicioConstruccionDatosDocumento,
    private pdfService: ServicioReporteDocumento
  ) {}

  get informesGuardados() {
    return this.informesGuardadosSignal;
  }

  cargarHistorial(): Observable<InformeGuardado[]> {
    return this.dbService.obtenerTodos$().pipe(
      map(informes => {
        const ordenados = informes.sort((a, b) => {
          const dateA = a.ultimaModificacion ? new Date(a.ultimaModificacion).getTime() : 0;
          const dateB = b.ultimaModificacion ? new Date(b.ultimaModificacion).getTime() : 0;
          return dateB - dateA;
        });
        this.informesGuardadosSignal.set(ordenados);
        return ordenados;
      })
    );
  }

  async guardar(obraForm: FormGroup, fotosSecciones: WritableSignal<Foto[]>[]): Promise<void> {
    if (!obraForm) return;

    const rawData = obraForm.value;
    const informeCompleto: any = {
      ...rawData,
      secciones: rawData.secciones.map((sec: any, idx: number) => ({
        ...sec,
        fotos: fotosSecciones[idx]()
      })),
      ultimaModificacion: new Date().toLocaleString(),
      progreso: calcularProgresoFormulario(obraForm)
    };

    await this.dbService.guardar(informeCompleto);
    await firstValueFrom(this.cargarHistorial());
  }

  async soloGuardar(obraForm: FormGroup, fotosSecciones: WritableSignal<Foto[]>[]): Promise<void> {
    if (!obraForm) return;

    const rawData = obraForm.value;
    const informeCompleto: any = {
      ...rawData,
      secciones: rawData.secciones.map((sec: any, idx: number) => ({
        ...sec,
        fotos: fotosSecciones[idx]()
      })),
      ultimaModificacion: new Date().toLocaleString(),
      progreso: calcularProgresoFormulario(obraForm)
    };
    
    await this.dbService.guardar(informeCompleto);
    await firstValueFrom(this.cargarHistorial());
  }

  async editarInforme(inf: InformeGuardado): Promise<{
    obraForm: FormGroup;
    fotosPorSeccionBase64: WritableSignal<Foto[]>[];
    seccionesColapsadas: boolean[];
  } | null> {
    try {
      console.log('[DEBUG-DEEP] Iniciando editarInforme para ID:', inf.id);
      const completo = await this.dbService.obtenerPorId(inf.id);
      console.log('[DEBUG-DEEP] Resultado de obtenerPorId:', completo ? 'ENCONTRADO' : 'NULL');
      
      if (!completo) return null;

      const nombreCentro = inf.nombreObra || completo.nombreObra || completo.nombre_obra;
      console.log('[DEBUG-DEEP] Nombre del centro:', nombreCentro);
      this.navService.centroSeleccionado.set(nombreCentro);

      console.log('[DEBUG-DEEP] Construyendo FormGroup inicial...');
      const obraForm = this.fb.group({
        id: [completo.id],
        nombreObra: [nombreCentro],
        tecnico: [completo.tecnico || ''],
        fecha: [completo.fecha || ''],
        cuatrimestre: [completo.cuatrimestre || ''],
        secciones: this.fb.array([]),
        conclusiones: [completo.conclusiones || '']
      });

    const fotosPorSeccionBase64: WritableSignal<Foto[]>[] = [];
    const seccionesColapsadas: boolean[] = [];

    if (completo.secciones?.length) {
      console.log(`[DEBUG-DEEP] Restaurando ${completo.secciones.length} secciones guardadas...`);
      completo.secciones.forEach((sec: any, idx: number) => {
        console.log(`[DEBUG-DEEP] Restaurando sección ${idx + 1}: ${sec.titulo}`);
        const { seccionGroup, fotos } = this.restaurarSeccionGuardada(sec);
        (obraForm.get('secciones') as FormArray).push(seccionGroup);
        fotosPorSeccionBase64.push(signal(fotos));
        seccionesColapsadas.push(false);
      });
      console.log('[DEBUG-DEEP] Secciones restauradas con éxito.');
    } else {
      console.log('[DEBUG-DEEP] No hay secciones guardadas. Buscando plantilla oficial...');
      const centroConfig = await this.servicioConfiguracionCentros.getByCentro(nombreCentro);
      
      if (centroConfig) {
        console.log('[DEBUG-DEEP] Plantilla encontrada. Creando secciones desde template...');
        centroConfig.secciones.forEach((template: any, idx: number) => {
          console.log(`[DEBUG-DEEP] Creando sección ${idx + 1} desde template: ${template.titulo}`);
          const seccionGroup = this.crearSeccionDesdeTemplate(template);
          (obraForm.get('secciones') as FormArray).push(seccionGroup);
          fotosPorSeccionBase64.push(signal([]));
          seccionesColapsadas.push(false);
        });
        console.log('[DEBUG-DEEP] Formulario inicializado desde plantilla.');
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

  async generarPDF(obraForm: FormGroup, fotosPorSeccion: WritableSignal<Foto[]>[]): Promise<void> {
    await this.soloGuardar(obraForm, fotosPorSeccion);
    const datos = await this.pdfDataBuilder.buildDatosPDF(obraForm, fotosPorSeccion);
    await this.pdfService.generarPDF(datos);
    await this.navService.reset();
    alert('PDF generado y guardado correctamente');
  }

  async buscarPorCuatrimestreYCentro(cuatrimestre: string, centro: string): Promise<InformeGuardado | null> {
    const informes = await firstValueFrom(this.dbService.obtenerTodos$());
    const cLow = centro.trim().toLowerCase();
    
    return informes.find(inf => {
      const infCuatri = (inf.cuatrimestre || '').trim();
      const infCentro = (inf.nombreObra || '').trim().toLowerCase();
      
      return infCuatri === cuatrimestre.trim() && 
             (infCentro === cLow || infCentro.startsWith(cLow));
    }) || null;
  }

  async eliminarInforme(id: number): Promise<void> {
    await this.dbService.eliminar(id);
    await firstValueFrom(this.cargarHistorial());
  }

  private restaurarSeccionGuardada(sec: any): { seccionGroup: FormGroup; fotos: Foto[] } {
    const seccionGroup = this.fb.group({
      titulo: [sec.titulo],
      tipo: [sec.tipo],
      prefijo: [sec.prefijo],
      tareas: this.fb.array([]),
      observaciones: [sec.observaciones || '']
    });

    const tareasArray = seccionGroup.get('tareas') as FormArray;
    (sec.tareas || []).forEach((t: any) => {
      const tareaGroup: FormGroup = this.fb.group({
        descripcion: [t.descripcion],
        rev: [t.rev || false],
        ok: [t.ok || false],
        noOk: [t.noOk || false],
        notaTarea: [t.notaTarea || ''],
        campos: this.fb.array((t.campos || []).map((c: any) => this.fb.group({
          clave: [c.clave],
          valor: [c.valor],
          sufijo: [c.sufijo]
        })))
      });

      // Restaurar bombas químicas si existen
      if (t.bombasQuimicas) {
        tareaGroup.addControl('bombasQuimicas', this.fb.array(
          (t.bombasQuimicas as any[]).map(b => this.fb.group({
            nombre: [b.nombre],
            amperios: [b.amperios],
            porcentaje: [b.porcentaje]
          }))
        ));
      }

      tareasArray.push(tareaGroup);
    });

    const fotos = (sec.fotos || []).map((f: any) => ({
      url: f.url,
      preview: f.url || f.base64,
      nombre: f.nombre,
      base64: f.base64
    }));

    return { seccionGroup, fotos };
  }

  private crearSeccionDesdeTemplate(template: any): FormGroup {
    const seccionGroup = this.fb.group({
      titulo: [template.titulo],
      tipo: [template.tipo],
      prefijo: [template.prefijo],
      tareas: this.fb.array([]),
      observaciones: ['']
    });

    const tareasArray = seccionGroup.get('tareas') as FormArray;
    template.tareas.forEach((tareaTemplate: any) => {
      const tareaGroup = this.fb.group({
        descripcion: [tareaTemplate.descripcion],
        rev: [false],
        ok: [false],
        noOk: [false],
        notaTarea: [''],
        campos: this.fb.array((tareaTemplate.campos || []).map((campo: any) => this.fb.group({
          clave: [campo.clave],
          valor: [null],
          sufijo: [campo.sufijo]
        })))
      });
      tareasArray.push(tareaGroup);
    });

    return seccionGroup;
  }
}
