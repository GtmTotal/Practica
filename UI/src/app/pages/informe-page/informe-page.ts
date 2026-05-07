import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
export class InformePageComponent implements OnDestroy {
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
    return this.initService.obraForm;
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
    const seccionesControl = this.initService.obraForm?.get('secciones');
    return seccionesControl instanceof FormArray ? seccionesControl : this.fb.array([]);
  }

  get seccionesGroups(): FormGroup[] {
    return this.secciones.controls as FormGroup[];
  }

  private _guardando = false;
  get guardando() {
    return this._guardando;
  }
  private progresoSignalEstado = signal(0);
  private autoSaveSub?: Subscription;
  private progressSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private navService: ServicioNavegacion,
    private cuatriService: ServicioCuatrimestre,
    private fotoManager: ServicioGestionFotografias,
    private initService: ServicioInicializacionFormulario,
    private persistService: ServicioPersistenciaFormulario,
  ) {}

  async ngOnInit() {
    this.persistService.cargarHistorial().subscribe();
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

  async seleccionarCentro(nombre: string) {
    await this.navService.seleccionarCentro(nombre);
    await this.initService.inicializarFormulario(nombre);
    this.configurarProgreso();
    this.configurarAutoGuardado(() =>
      this.persistService.soloGuardar(this.obraForm, this.fotosPorSeccionBase64),
    );
  }

  async agregarFotos(event: Event, secIdx: number) {
    await this.fotoManager.agregarFotosDesdeInput(event, this.fotosPorSeccionBase64[secIdx], () =>
      this.persistService.soloGuardar(this.obraForm, this.fotosPorSeccionBase64),
    );
  }

  async eliminarFoto(secIdx: number, fotoIdx: number) {
    await this.fotoManager.eliminarFoto(this.fotosPorSeccionBase64[secIdx], fotoIdx, () =>
      this.persistService.soloGuardar(this.obraForm, this.fotosPorSeccionBase64),
    );
  }

  async descargarFoto(foto: any) {
    await this.fotoManager.descargarFoto(foto);
  }

  async editarInforme(inf: InformeGuardado) {
    const result = await this.persistService.editarInforme(inf);
    if (result) {
      this.initService.setFormData(
        result.obraForm,
        result.fotosPorSeccionBase64,
        result.seccionesColapsadas,
      );
      this.configurarProgreso();
      this.configurarAutoGuardado(() =>
        this.persistService.soloGuardar(this.obraForm, this.fotosPorSeccionBase64),
      );
      await this.navService.irAFormulario();
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
    try {
      await this.persistService.generarPDF(this.obraForm, this.fotosPorSeccionBase64);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa la consola.');
    } finally {
      this._guardando = false;
    }
  }


  async generarPDF() {
    this._guardando = true;
    try {
      await this.persistService.generarPDF(this.obraForm, this.fotosPorSeccionBase64);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Revisa la consola.');
    } finally {
      this._guardando = false;
    }
  }

  toggleSeccion(idx: number) {
    if (idx >= 0 && idx < this.seccionesColapsadas.length) {
      this.seccionesColapsadas[idx] = !this.seccionesColapsadas[idx];
    }
  }

  private configurarProgreso() {
    this.progressSub?.unsubscribe();
    if (!this.obraForm) return;
    this.progresoSignalEstado.set(calcularProgresoFormulario(this.obraForm));
    this.progressSub = this.obraForm.valueChanges.pipe(debounceTime(100)).subscribe(() => {
      this.progresoSignalEstado.set(calcularProgresoFormulario(this.obraForm));
    });
  }

  private configurarAutoGuardado(onSave: () => void, delay = 2000) {
    this.autoSaveSub?.unsubscribe();
    if (!this.obraForm) return;
    this.autoSaveSub = this.obraForm.valueChanges.pipe(debounceTime(delay)).subscribe(() => onSave());
  }

  ngOnDestroy() {
    this.autoSaveSub?.unsubscribe();
    this.progressSub?.unsubscribe();
  }
}

