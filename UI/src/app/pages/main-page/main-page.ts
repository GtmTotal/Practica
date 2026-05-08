import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ListaCuatrimestresComponent } from './main/lista-cuatrimestres/lista-cuatrimestres';
import { ServicioCuatrimestre } from './services/cuatrimestre.service';
import { ServicioPersistenciaFormulario } from '../informe-page/services/form-persistence.service';
import { ServicioInicializacionFormulario } from '../informe-page/services/form-initialization.service';
import { ServicioNavegacion } from './services/navigation.service';
import { ServicioAdmin } from '../services/admin.service';
import { InformeGuardado } from '../informe.interface';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, ListaCuatrimestresComponent],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.css'],
})
export class MainPageComponent implements OnDestroy {
  private autoSaveSub?: Subscription;

  isAdmin = signal(false);
  isSyncing = signal(false);

  get informesGuardados() {
    return this.persistService.informesGuardados;
  }

  get informesPorCuatrimestre() {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  }

  constructor(
    private cuatriService: ServicioCuatrimestre,
    private persistService: ServicioPersistenciaFormulario,
    private initService: ServicioInicializacionFormulario,
    private navService: ServicioNavegacion,
    private adminService: ServicioAdmin,
  ) {}

  async ngOnInit() {
    this.persistService.cargarHistorial().subscribe();
  }

  toggleAdmin() {
    if (this.isAdmin()) {
      this.isAdmin.set(false);
    } else {
      const pass = window.prompt('Contraseña de administrador:');
      if (pass === 'gtm2024') { // Contraseña sencilla
        this.isAdmin.set(true);
      } else {
        alert('Contraseña incorrecta');
      }
    }
  }

  async sincronizarExcel() {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      const res = await this.adminService.sincronizarExcel();
      alert(res.message || 'Sincronización completada');
    } catch (err: any) {
      alert('Error sincronizando: ' + (err.error?.detail || err.message));
    } finally {
      this.isSyncing.set(false);
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
      this.configurarAutoGuardado(result.obraForm, () =>
        this.persistService.soloGuardar(result.obraForm, result.fotosPorSeccionBase64),
      );
      await this.navService.irAFormulario(inf.cuatrimestre, inf.nombreObra);
    }
  }

  async crearCuatrimestre() {
    await this.cuatriService.crearCuatrimestreConUI(this.informesGuardados());
    this.persistService.cargarHistorial().subscribe();
  }

  async eliminarCuatrimestre(cuatrimestre: string) {
    const ok = await this.cuatriService.eliminarCuatrimestreConUI(cuatrimestre);
    if (ok) this.persistService.cargarHistorial().subscribe();
  }

  private configurarAutoGuardado(obraForm: any, onSave: () => void, delay = 2000) {
    this.autoSaveSub?.unsubscribe();
    if (!obraForm) return;
    this.autoSaveSub = obraForm.valueChanges.pipe(debounceTime(delay)).subscribe(() => onSave());
  }

  ngOnDestroy() {
    this.autoSaveSub?.unsubscribe();
  }
}

