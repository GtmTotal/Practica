import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAdmin } from '../services/admin.service';
import { ServicioCuatrimestre } from '../main-page/services/cuatrimestre.service';
import { ServicioPersistenciaFormulario } from '../informe-page/services/form-persistence.service';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-page.html',
  styleUrls: ['./admin-page.css'],
})
export class AdminPageComponent {
  private adminService = inject(ServicioAdmin);
  private cuatriService = inject(ServicioCuatrimestre);
  private persistService = inject(ServicioPersistenciaFormulario);
  private router = inject(Router);

  isAdmin = this.adminService.isAdmin;
  isSyncing = signal(false);

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
      alert(res.message || 'Sincronización completada');
    } catch (err: any) {
      alert('Error sincronizando: ' + (err.error?.detail || err.message));
    } finally {
      this.isSyncing.set(false);
    }
  }

  async crearCuatrimestre() {
    await this.cuatriService.crearCuatrimestreConUI(this.persistService.informesGuardados());
    this.persistService.cargarHistorial().subscribe();
  }

  volver() {
    this.router.navigate(['/']);
  }
}
