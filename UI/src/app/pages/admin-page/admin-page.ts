import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServicioAdmin } from '../services/admin.service';
import { ServicioCuatrimestre } from '../main-page/services/cuatrimestre.service';
import { ServicioPersistenciaFormulario } from '../informe-page/services/form-persistence.service';
import { InformeGuardado, GrupoCuatrimestre } from '../informe.interface';
import { ServicioInicializacionFormulario } from '../informe-page/services/form-initialization.service';
import { ServicioNavegacion } from '../main-page/services/navigation.service';
import { UIService } from '../../shared/services/ui.service';
import { ServicioConfiguracionCentros } from '../services/config-centros.service';

type EstadoInforme = 'completado' | 'en-progreso' | 'pendiente';

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
  private initService = inject(ServicioInicializacionFormulario);
  private navService = inject(ServicioNavegacion);
  private ui = inject(UIService);
  private router = inject(Router);
  private configCentros = inject(ServicioConfiguracionCentros);

  isAdmin = this.adminService.isAdmin;
  isSyncing = signal(false);
  vistaPanel = signal(true);
  cuatrimestreSeleccionado = signal<string>('');

  get informesGuardados() {
    return this.persistService.informesGuardados;
  }

  get informesPorCuatrimestre(): GrupoCuatrimestre[] {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  }

  cuatrimestres = computed(() => {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  });

  grupoSeleccionado = computed(() => {
    const grupos = this.cuatrimestres();
    const sel = this.cuatrimestreSeleccionado();
    return grupos.find(g => g.clave === sel) || grupos[0];
  });

  metricas = computed(() => {
    const grupo = this.grupoSeleccionado();
    if (!grupo) return { total: 0, completados: 0, enProgreso: 0, pendientes: 0 };
    const informes = grupo.informes;
    const total = informes.length;
    const completados = informes.filter(i => this.estadoDe(i) === 'completado').length;
    const enProgreso = informes.filter(i => this.estadoDe(i) === 'en-progreso').length;
    const pendientes = total - completados - enProgreso;
    return { total, completados, enProgreso, pendientes };
  });

  informesActuales = computed(() => {
    const grupo = this.grupoSeleccionado();
    return grupo?.informes || [];
  });

  constructor() {
    if (!this.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }
    // Seleccionar el primer cuatrimestre cuando carguen los datos
    effect(() => {
      const grupos = this.cuatrimestres();
      const sel = this.cuatrimestreSeleccionado();
      if (grupos.length > 0 && !sel) {
        this.cuatrimestreSeleccionado.set(grupos[0].clave);
      }
    });
  }

  seleccionarCuatrimestre(clave: string) {
    this.cuatrimestreSeleccionado.set(clave);
    this.vistaPanel.set(false);
  }

  estadoDe(informe: InformeGuardado): EstadoInforme {
    const prog = this.progresoDe(informe);
    if (prog >= 100) return 'completado';
    if (prog > 0) return 'en-progreso';
    return 'pendiente';
  }

  progresoDe(informe: InformeGuardado): number {
    if (informe.progreso !== undefined) return informe.progreso;
    return this.calcularProgreso(informe);
  }

  private calcularProgreso(informe: InformeGuardado): number {
    const secciones = informe.secciones;
    if (!secciones?.length) return 0;
    let total = 0, hechas = 0;
    for (const sec of secciones) {
      for (const t of sec.tareas || []) {
        total++;
        if (t.rev || t.ok || t.noOk) hechas++;
      }
    }
    return total > 0 ? Math.round((hechas / total) * 100) : 0;
  }

  colorEstado(informe: InformeGuardado): string {
    const estado = this.estadoDe(informe);
    if (estado === 'completado') return '#059669';
    if (estado === 'en-progreso') return '#d97706';
    return '#94a3b8';
  }

  labelEstado(informe: InformeGuardado): string {
    const estado = this.estadoDe(informe);
    if (estado === 'completado') return 'COMPLETADO';
    if (estado === 'en-progreso') return 'EN PROGRESO';
    return 'PENDIENTE';
  }

  async onSubirExcel(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.isSyncing.set(true);
    try {
      const res = await this.adminService.sincronizarExcelDesdeArchivo(file);
      const msg = res.message || 'Excel sincronizado correctamente';
      if (res.log) console.log('[Sync log]\n', res.log);
      this.ui.success(msg);

      // Invalidar cache de centros para que los nuevos puntos estén disponibles inmediatamente
      this.configCentros.invalidateCache();
      // Recargar historial por si la sincronización afectó datos existentes
      this.persistService.cargarHistorial().subscribe();
    } catch (err: any) {
      this.ui.error('Error subiendo Excel: ' + (err.error?.detail || err.message));
    } finally {
      this.isSyncing.set(false);
      input.value = '';
    }
  }

  async descargarExcel() {
    try {
      const blob = await this.adminService.descargarExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_GTM_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      this.ui.success('Excel descargado correctamente');
    } catch (err: any) {
      this.ui.error('Error descargando Excel: ' + (err.error?.detail || err.message));
    }
  }

  async crearCuatrimestre() {
    await this.cuatriService.crearCuatrimestreConUI(this.informesGuardados());
    this.persistService.cargarHistorial().subscribe();
  }

  async eliminarCuatrimestre(cuatrimestre: string) {
    const ok = await this.cuatriService.eliminarCuatrimestreConUI(cuatrimestre);
    if (ok) {
      this.cuatrimestreSeleccionado.set('');
      this.vistaPanel.set(true);
      this.navService.cuatrimestreSeleccionado.set('');
      this.persistService.cargarHistorial().subscribe();
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
      await this.navService.irAFormulario(inf.cuatrimestre, inf.nombreObra, 'admin');
    }
  }

  cerrarSesion() {
    this.adminService.setAdmin(false);
    this.router.navigate(['/']);
  }
}
