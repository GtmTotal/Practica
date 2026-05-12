import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
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
    private route: ActivatedRoute,
  ) { }

  async ngOnInit() {
    this.persistService.cargarHistorial().subscribe();

    // 1. Prioridad: Parámetros en la URL (BOSS requirements)
    const cuatriParam = this.route.snapshot.paramMap.get('cuatrimestre');
    const centroParam = this.route.snapshot.paramMap.get('centro');

    if (cuatriParam && centroParam) {
      // Forzar scroll al principio al cargar un informe
      window.scrollTo(0, 0);
      try {
        console.log(`[DEBUG] Parámetros URL detectados: ${cuatriParam} - ${centroParam}`);
        
        this.navService.centroSeleccionado.set(centroParam);
        
        console.log(`[DEBUG] Buscando en DB local...`);
        const informeExistente = await this.persistService.buscarPorCuatrimestreYCentro(cuatriParam, centroParam);
        
        if (informeExistente) {
          console.log('[DEBUG] Informe ENCONTRADO en DB. Abriendo para editar...', informeExistente);
          await this.editarInforme(informeExistente);
          console.log('[DEBUG] Edición inicializada con éxito.');
        } else {
          console.log('[DEBUG] Informe NO encontrado en DB. Creando uno nuevo desde plantilla...');
          await this.seleccionarCentro(centroParam, cuatriParam);
          console.log('[DEBUG] Nuevo informe creado con éxito.');
        }
      } catch (error) {
        console.error('[ERROR] Fallo crítico al inicializar desde URL:', error);
        alert(`Error: El centro '${centroParam}' no existe o no se ha podido cargar.`);
        this.irASeleccion();
      }
      return;
    }

    // 2. Segunda prioridad: Estado persistido en navService (Refresh)
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
    this.configurarAutoGuardado(() => {
      const form = this.obraForm;
      if (form) {
        this.persistService.soloGuardar(form, this.fotosPorSeccionBase64);
      }
    });
  }

  async agregarFotos(event: Event, secIdx: number) {
    const form = this.obraForm;
    if (!form) return;
    await this.fotoManager.agregarFotosDesdeInput(event, this.fotosPorSeccionBase64[secIdx], () =>
      this.persistService.soloGuardar(form, this.fotosPorSeccionBase64),
    );
  }

  async eliminarFoto(secIdx: number, fotoIdx: number) {
    const form = this.obraForm;
    if (!form) return;
    await this.fotoManager.eliminarFoto(this.fotosPorSeccionBase64[secIdx], fotoIdx, () =>
      this.persistService.soloGuardar(form, this.fotosPorSeccionBase64),
    );
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
    }
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
      this.configurarAutoGuardado(() => {
        const form = this.obraForm;
        if (form) {
          this.persistService.soloGuardar(form, this.fotosPorSeccionBase64);
        }
      });
      await this.navService.irAFormulario(inf.cuatrimestre, inf.nombreObra);
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
      await this.persistService.soloGuardar(form, this.fotosPorSeccionBase64);
      this.volver();
    }
  }

  toggleSeccion(idx: number) {
    if (idx >= 0 && idx < this.seccionesColapsadas.length) {
      this.seccionesColapsadas[idx] = !this.seccionesColapsadas[idx];
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

  private configurarAutoGuardado(onSave: () => void, delay = 2000) {
    this.autoSaveSub?.unsubscribe();
    const form = this.obraForm;
    if (!form) return;

    this.autoSaveSub = form.valueChanges
      .pipe(debounceTime(delay))
      .subscribe(() => onSave());
  }

  ngOnDestroy() {
    this.autoSaveSub?.unsubscribe();
    this.progressSub?.unsubscribe();
  }
}

