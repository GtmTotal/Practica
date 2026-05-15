import { Component, OnDestroy, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { Subscription, merge, Subject, firstValueFrom } from 'rxjs';
import { debounceTime, tap, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';

import { ServicioNavegacion } from '../main-page/services/navigation.service';
import { ServicioCuatrimestre } from '../main-page/services/cuatrimestre.service';
import { ServicioGestionFotografias } from './services/foto-manager.service';
import { ServicioInicializacionFormulario } from './services/form-initialization.service';
import { ServicioPersistenciaFormulario } from './services/form-persistence.service';
import { InformeGuardado } from '../informe.interface';
import { InformeComponent } from './informe/informe';
import { calcularProgresoFormulario } from './utils/progreso.util';

@Component({
  selector: 'app-informe-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InformeComponent,
  ],
  templateUrl: './informe-page.html',
  styleUrls: [],
})
export class InformePageComponent implements OnInit, OnDestroy {
  get vistaActual() {
    return this.navService.vistaActual;
  }
  get centroSeleccionado() {
    return this.navService.centroSeleccionado;
  }
  get progresoSignal() {
    return this.progresoSignalEstado;
  }
  get obraForm() {
    return this.initService.obraForm();
  }
  get informesGuardados() {
    return this.persistService.informesGuardados;
  }
  get fotosPorSeccionBase64() {
    return this.initService.fotosPorSeccionBase64;
  }
  get seccionesColapsadas() {
    return this.initService.seccionesColapsadas;
  }

  get secciones(): FormArray {
    const form = this.obraForm;
    const seccionesControl = form?.get('secciones');
    return seccionesControl instanceof FormArray ? seccionesControl : this.fb.array([]);
  }

  get seccionesGroups(): FormGroup[] {
    return this.secciones.controls as FormGroup[];
  }

  private _guardando = false;
  get guardando() {
    return this._guardando;
  }

  estadoAutoguardado = signal<'ocioso' | 'guardado' | 'guardando' | 'error'>('ocioso');

  private progresoSignalEstado = signal(0);
  private autoSaveSub?: Subscription;
  private progressSub?: Subscription;
  private manualSaveTrigger$ = new Subject<void>();
  private statusTimer?: any;

  constructor(
    private fb: FormBuilder,
    private navService: ServicioNavegacion,
    private cuatriService: ServicioCuatrimestre,
    private fotoManager: ServicioGestionFotografias,
    private initService: ServicioInicializacionFormulario,
    private persistService: ServicioPersistenciaFormulario,
    private route: ActivatedRoute,
  ) { }

  async ngOnInit() {
    this.persistService.cargarHistorial().subscribe();

    const cuatriParam = this.route.snapshot.paramMap.get('cuatrimestre');
    const centroParam = this.route.snapshot.paramMap.get('centro');
    const fromParam = this.route.snapshot.queryParamMap.get('from') || undefined;

    if (cuatriParam && centroParam) {
      this.navService.cuatrimestreSeleccionado.set(cuatriParam);
      this.navService.centroSeleccionado.set(centroParam);

      try {
        const informes = await firstValueFrom(this.persistService.cargarHistorial());
        const informeExistente = informes.find(
          (inf: InformeGuardado) => inf.cuatrimestre === cuatriParam && inf.nombreObra === centroParam,
        );

        if (informeExistente) {
          await this.editarInforme(informeExistente, fromParam);
        } else {
          await this.seleccionarCentro(centroParam, cuatriParam);
        }
      } catch (error) {
        console.error('[ERROR] Fallo crítico al inicializar desde URL:', error);
        alert(`Error: El centro '${centroParam}' no existe o no se ha podido cargar.`);
        this.irASeleccion();
      }
      return;
    }

    const centroPersistido = this.navService.centroSeleccionado();
    if (centroPersistido && !this.obraForm) {
      await this.seleccionarCentro(centroPersistido);
    }
  }

  get informesPorCuatrimestre() {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  }

  getSeccionAsFormGroup(seccion: any): FormGroup {
    return seccion as FormGroup;
  }

  irASeleccion() {
    this.navService.irASeleccion();
  }
  volver = () => {
    this.navService.volver();
  };

  async seleccionarCentro(nombre: string, cuatrimestre?: string) {
    await this.navService.seleccionarCentro(nombre, cuatrimestre);
    await this.initService.inicializarFormulario(nombre, cuatrimestre || null);
    this.configurarProgreso();
    this.configurarAutoGuardado();
  }

  async agregarFotos(event: Event, secIdx: number) {
    const form = this.obraForm;
    if (!form) return;
    this.setEstadoStatus('guardando');
    await this.fotoManager.agregarFotosDesdeInput(event, this.fotosPorSeccionBase64[secIdx], async () => {
      await this.persistService.soloGuardar(form, this.fotosPorSeccionBase64);
      this.setEstadoStatus('guardado');
    });
  }

  async eliminarFoto(secIdx: number, fotoIdx: number) {
    const form = this.obraForm;
    if (!form) return;
    this.setEstadoStatus('guardando');
    await this.fotoManager.eliminarFoto(this.fotosPorSeccionBase64[secIdx], fotoIdx, async () => {
      await this.persistService.soloGuardar(form, this.fotosPorSeccionBase64);
      this.setEstadoStatus('guardado');
    });
  }

  async descargarFoto(foto: any) {
    await this.fotoManager.descargarFoto(foto);
  }

  actualizarDescripcionFoto(secIdx: number, fotoIdx: number, descripcion: string) {
    const fotosSignal = this.fotosPorSeccionBase64[secIdx];
    if (!fotosSignal) return;
    const fotos = fotosSignal();
    if (fotoIdx >= 0 && fotoIdx < fotos.length) {
      const actualizadas = [...fotos];
      actualizadas[fotoIdx] = { ...actualizadas[fotoIdx], descripcion };
      fotosSignal.set(actualizadas);
      this.manualSaveTrigger$.next();
    }
  }

  async editarInforme(inf: InformeGuardado, from?: string) {
    const result = await this.persistService.editarInforme(inf);
    if (result) {
      this.initService.setFormData(
        result.obraForm,
        result.fotosPorSeccionBase64,
        result.seccionesColapsadas,
      );
      this.configurarProgreso();
      this.configurarAutoGuardado();
      
      // Solo navegamos (y sobreescribimos origen) si no estamos ya en la ruta correcta
      // o si necesitamos actualizar el estado del servicio.
      if (from) {
        this.navService.vistaOrigen.set(from);
      } else {
        // Si no viene origen, es una navegación normal desde el dashboard
        await this.navService.irAFormulario(inf.cuatrimestre, inf.nombreObra);
      }
    }
  }

  async eliminarInforme(id: number) {
    await this.persistService.eliminarInforme(id);
  }

  async crearCuatrimestre() {
    await this.cuatriService.crearCuatrimestreConUI(this.informesGuardados());
    this.persistService.cargarHistorial().subscribe();
  }

  async eliminarCuatrimestre(cuatrimestre: string) {
    const ok = await this.cuatriService.eliminarCuatrimestreConUI(cuatrimestre);
    if (ok) this.persistService.cargarHistorial().subscribe();
  }

  async generarPDF() {
    this._guardando = true;
    const form = this.obraForm;
    if (!form) return;
    try {
      await this.persistService.generarPDF(form, this.fotosPorSeccionBase64);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa la consola.');
    } finally {
      this._guardando = false;
    }
  }

  async guardarYSalir() {
    const form = this.obraForm;
    if (form) {
      this.setEstadoStatus('guardando');
      await this.persistService.soloGuardar(form, this.fotosPorSeccionBase64);
      this.setEstadoStatus('guardado');
      this.volver();
    }
  }

  toggleSeccion(idx: number) {
    if (idx >= 0 && idx < this.seccionesColapsadas.length) {
      this.seccionesColapsadas[idx] = !this.seccionesColapsadas[idx];
    }
  }

  private setEstadoStatus(nuevo: 'ocioso' | 'guardado' | 'guardando' | 'error') {
    clearTimeout(this.statusTimer);
    this.estadoAutoguardado.set(nuevo);
    if (nuevo === 'guardado') {
      this.statusTimer = setTimeout(() => {
        this.estadoAutoguardado.set('ocioso');
      }, 3000);
    }
  }

  private configurarProgreso() {
    this.progressSub?.unsubscribe();
    const form = this.obraForm;
    if (!form) return;

    this.progresoSignalEstado.set(calcularProgresoFormulario(form));

    this.progressSub = form.valueChanges.subscribe(() => {
      this.progresoSignalEstado.set(calcularProgresoFormulario(form));
    });
  }

  private configurarAutoGuardado(delay = 1000) {
    this.autoSaveSub?.unsubscribe();
    const form = this.obraForm;
    if (!form) return;

    this.autoSaveSub = merge(form.valueChanges, this.manualSaveTrigger$)
      .pipe(
        tap(() => this.setEstadoStatus('guardando')),
        debounceTime(delay),
        switchMap(async () => {
          try {
            await this.persistService.soloGuardar(form, this.fotosPorSeccionBase64);
            this.setEstadoStatus('guardado');
          } catch (e) {
            console.error('Error en autoguardado:', e);
            this.setEstadoStatus('error');
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.autoSaveSub?.unsubscribe();
    this.progressSub?.unsubscribe();
  }
}