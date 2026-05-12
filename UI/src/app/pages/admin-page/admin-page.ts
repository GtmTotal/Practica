import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAdmin } from '../services/admin.service';
import { ServicioCuatrimestre } from '../main-page/services/cuatrimestre.service';
import { ServicioPersistenciaFormulario } from '../informe-page/services/form-persistence.service';
import { ListaCuatrimestresComponent } from '../main-page/main/lista-cuatrimestres/lista-cuatrimestres';
import { InformeGuardado } from '../informe.interface';
import { ServicioInicializacionFormulario } from '../informe-page/services/form-initialization.service';
import { ServicioNavegacion } from '../main-page/services/navigation.service';
import { UIService } from '../../shared/services/ui.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, ListaCuatrimestresComponent],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css'],
})
export class AdminPageComponent {
  private adminService = inject(ServicioAdmin);
  private cuatriService = inject(ServicioCuatrimestre);
  private persistService = inject(ServicioPersistenciaFormulario);
  private initService = inject(ServicioInicializacionFormulario);
  private navService = inject(ServicioNavegacion);
  private ui = inject(UIService);
  private router = inject(Router);

  isAdmin = this.adminService.isAdmin;
  isSyncing = signal(false);

  get informesGuardados() {
    return this.persistService.informesGuardados;
  }

  get informesPorCuatrimestre() {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  }

  constructor() {
    // Si no es admin, redirigir al inicio
    if (!this.isAdmin()) {
      this.router.navigate(['/']);
    }
  }

  async sincronizarExcel() {
    if (this.isSyncing()) return;
    this.isSyncing.set(true);
    try {
      const res = await this.adminService.sincronizarExcel();
      this.ui.success(res.message || 'Sincronización completada');
    } catch (err: any) {
      this.ui.error('Error sincronizando: ' + (err.error?.detail || err.message));
    } finally {
      this.isSyncing.set(false);
    }
  }

  async onSubirExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isSyncing.set(true);
    try {
      const res = await this.adminService.sincronizarExcelDesdeArchivo(file);
      this.ui.success(res.message || 'Excel sincronizado correctamente');
    } catch (err: any) {
      this.ui.error('Error subiendo Excel: ' + (err.error?.detail || err.message));
    } finally {
      this.isSyncing.set(false);
      input.value = '';
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

  async editarInforme(inf: InformeGuardado) {
    const result = await this.persistService.editarInforme(inf);
    if (result) {
      this.initService.setFormData(
        result.obraForm,
        result.fotosPorSeccionBase64,
        result.seccionesColapsadas,
      );
      await this.navService.irAFormulario(inf.cuatrimestre, inf.nombreObra);
    }
  }

  volver() {
    this.router.navigate(['/']);
  }

  cerrarSesion() {
    this.adminService.setAdmin(false);
    this.router.navigate(['/']);
  }
}
