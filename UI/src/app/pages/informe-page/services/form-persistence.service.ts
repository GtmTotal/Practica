// form-persistence.service.ts (completo)
import { Injectable, WritableSignal, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ServicioBaseDeDatos } from '../../main-page/services/database.service';
import { ServicioReporteDocumento } from './form-persistence/pdf-report.service';
import { ServicioGestionFotografias } from './foto-manager.service';
import { ServicioConstruccionDatosDocumento } from './form-persistence/pdf-data-builder.service';
import { ServicioNavegacion } from '../../main-page/services/navigation.service';
import { Foto } from '../foto.interface';
import { InformeGuardado } from '../../informe.interface';
import { ServicioConfiguracionCentros } from '../../services/config-centros.service';
import { catchError, map, Observable, of, tap, firstValueFrom } from 'rxjs';
import { calcularProgresoFormulario } from '../utils/progreso.util';

@Injectable({ providedIn: 'root' })
export class ServicioPersistenciaFormulario {
  // Propiedad que necesita el componente
  informesGuardados = signal<InformeGuardado[]>([]);

  constructor(
    private fb: FormBuilder,
    private dbService: ServicioBaseDeDatos,
    private pdfService: ServicioReporteDocumento,
    private fotoManager: ServicioGestionFotografias,
    private pdfDataBuilder: ServicioConstruccionDatosDocumento,
    private navService: ServicioNavegacion,
    private servicioConfiguracionCentros: ServicioConfiguracionCentros,
  ) {}

  // Metodo que necesita el componente
  cargarHistorial(): Observable<void> {
    return this.dbService.obtenerTodos$().pipe(
      map((lista) => [...lista].sort((a, b) => b.id - a.id)),
      tap((listaOrdenada) => this.informesGuardados.set(listaOrdenada)),
      map(() => void 0),
      catchError((err) => {
        console.warn('No se pudo cargar historial:', err);
        this.informesGuardados.set([]);
        return of(void 0);
      })
    );
  }

  // Metodo que necesita el componente
  async eliminarInforme(id: number): Promise<void> {
    const informesActuales = this.informesGuardados();
    const inf = informesActuales.find((i) => i.id === id);
    if (inf?.protegido) {
      alert('Este informe pertenece a un cuatrimestre y no se puede borrar individualmente. Puedes eliminar el cuatrimestre completo desde su cabecera.');
      return;
    }

    if (!confirm('Seguro que quieres borrar este informe?')) return;

    await this.dbService.eliminar(id);
    await firstValueFrom(this.cargarHistorial());
  }

  async soloGuardar(obraForm: FormGroup, fotosPorSeccion: WritableSignal<Foto[]>[]): Promise<void> {
    const v = obraForm.value;
    const idActual = v.id || Date.now();
    const seccionesConUrls = await Promise.all(
      (v.secciones || []).map(async (sec: any, idx: number) => {
        const fotosActuales = fotosPorSeccion[idx]() || [];
        const urls = await Promise.all(
          fotosActuales.map(async (foto: Foto) => {
            if (foto.url) return { url: foto.url, nombre: foto.nombre };
            if (foto.file) {
              const url = await this.fotoManager.subirFoto(foto.file, foto.nombre);
              return { url, nombre: foto.nombre };
            }
            return null;
          })
        );
        return { ...sec, fotos: urls.filter(u => u) };
      })
    );
    const informeCompleto = {
      ...v, id: idActual, secciones: seccionesConUrls,
      ultimaModificacion: new Date().toLocaleString(),
      progreso: calcularProgresoFormulario(obraForm)
    };
    delete informeCompleto.fotosSeccionesGuardadas;
    await this.dbService.guardar(informeCompleto);
    // Actualizar el historial despues de guardar (opcional)
    await firstValueFrom(this.cargarHistorial());
  }

  async editarInforme(inf: InformeGuardado): Promise<{
    obraForm: FormGroup;
    fotosPorSeccionBase64: WritableSignal<Foto[]>[];
    seccionesColapsadas: boolean[];
  } | null> {
    const completo = await this.dbService.obtenerPorId(inf.id);
    if (!completo) return null;

    this.navService.centroSeleccionado.set(completo.nombreObra || completo.nombre_obra);

    const obraForm = this.fb.group({
      id: [completo.id],
      nombreObra: [completo.nombreObra || completo.nombre_obra],
      tecnico: [completo.tecnico || ''],
      fecha: [completo.fecha || ''],
      cuatrimestre: [completo.cuatrimestre || ''],
      secciones: this.fb.array([]),
      conclusiones: [completo.conclusiones || '']
    });

    const fotosPorSeccionBase64: WritableSignal<Foto[]>[] = [];
    const seccionesColapsadas: boolean[] = [];

    if (completo.secciones?.length) {
      completo.secciones.forEach((sec: any, idx: number) => {
        const { seccionGroup, fotos } = this.restaurarSeccionGuardada(sec);
        (obraForm.get('secciones') as FormArray).push(seccionGroup);
        fotosPorSeccionBase64.push(signal(fotos));
        seccionesColapsadas.push(false);
      });
    } else {
      const centroConfig = await this.servicioConfiguracionCentros.getByCentro(this.navService.centroSeleccionado());
      if (centroConfig) {
        centroConfig.secciones.forEach((template: any) => {
          const seccionGroup = this.crearSeccionDesdeTemplate(template);
          (obraForm.get('secciones') as FormArray).push(seccionGroup);
          fotosPorSeccionBase64.push(signal([]));
          seccionesColapsadas.push(false);
        });
      } else {
        console.error('No hay configuracion para', this.navService.centroSeleccionado());
        return null;
      }
    }

    return { obraForm, fotosPorSeccionBase64, seccionesColapsadas };
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
    return informes.find(inf =>
      inf.cuatrimestre === cuatrimestre &&
      inf.nombreObra.toLowerCase() === centro.toLowerCase()
    ) || null;
  }

  private restaurarSeccionGuardada(seccionGuardada: any): { seccionGroup: FormGroup; fotos: Foto[] } {
    const seccionGroup = this.fb.group({
      titulo: [seccionGuardada.titulo],
      tipo: [seccionGuardada.tipo],
      prefijo: [seccionGuardada.prefijo],
      tareas: this.fb.array([]),
      observaciones: [seccionGuardada.observaciones || '']
    });

    const tareasArray = seccionGroup.get('tareas') as FormArray;
    const tareasGuardadas = seccionGuardada.tareas || [];

    tareasGuardadas.forEach((tareaGuardada: any) => {
      const camposArray = this.fb.array(
        (tareaGuardada.campos || []).map((campo: any) =>
          this.fb.group({
            clave: [campo.clave],
            valor: [campo.valor],
            sufijo: [campo.sufijo]
          })
        )
      );

      const tareaControls: any = {
        descripcion: [tareaGuardada.descripcion],
        rev: [tareaGuardada.rev || false],
        ok: [tareaGuardada.ok || false],
        noOk: [tareaGuardada.noOk || false],
        notaTarea: [tareaGuardada.notaTarea || ''],
        campos: camposArray
      };

      if (tareaGuardada.bombasQuimicas && tareaGuardada.bombasQuimicas.length) {
        const primeraBomba = tareaGuardada.bombasQuimicas[0];
        const claves = Object.keys(primeraBomba).filter(k => k !== 'nombre');
        const bombasArray = this.fb.array(
          tareaGuardada.bombasQuimicas.map((b: any) => {
            const grupo: any = { nombre: [b.nombre] };
            claves.forEach(clave => (grupo[clave] = [b[clave]]));
            return this.fb.group(grupo);
          })
        );
        tareaControls.bombasQuimicas = bombasArray;
      }

      tareasArray.push(this.fb.group(tareaControls));
    });

    const fotosGuardadas = seccionGuardada.fotos || [];
    const fotos = fotosGuardadas.map((f: any) => ({
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
        campos: this.fb.array([])
      });
      const camposArray = tareaGroup.get('campos') as FormArray;
      (tareaTemplate.campos || []).forEach((campo: any) => {
        camposArray.push(
          this.fb.group({
            clave: [campo.clave],
            valor: [null],
            sufijo: [campo.sufijo]
          })
        );
      });
      tareasArray.push(tareaGroup);
    });

    return seccionGroup;
  }
}

