import { Component, OnInit, OnDestroy, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ServicioCuatrimestre } from './services/cuatrimestre.service';
import { ServicioPersistenciaFormulario } from '../informe-page/services/form-persistence.service';
import { ServicioInicializacionFormulario } from '../informe-page/services/form-initialization.service';
import { ServicioNavegacion } from './services/navigation.service';
import { ServicioAdmin } from '../services/admin.service';
import { UIService } from '../../shared/services/ui.service';
import { InformeGuardado } from '../informe.interface';

type EstadoInforme = 'completado' | 'en-progreso' | 'pendiente';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.css'],
})
export class MainPageComponent implements OnInit, OnDestroy {
  private autoSaveSub?: Subscription;

  private cuatriService = inject(ServicioCuatrimestre);
  private persistService = inject(ServicioPersistenciaFormulario);
  private initService = inject(ServicioInicializacionFormulario);
  private navService = inject(ServicioNavegacion);
  private adminService = inject(ServicioAdmin);
  private ui = inject(UIService);

  isAdmin = this.adminService.isAdmin;
  vistaPanel = signal(this.navService.cuatrimestreSeleccionado() === '');
  cuatrimestreSeleccionado = signal<string>(this.navService.cuatrimestreSeleccionado());

  get informesGuardados() {
    return this.persistService.informesGuardados;
  }

  get informesPorCuatrimestre() {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  }

  cuatrimestres = computed(() => {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  });

  grupoSeleccionado = computed(() => {
    const grupos = this.cuatrimestres();
    const sel = this.cuatrimestreSeleccionado();
    console.log('[MAIN-PAGE] Buscando grupo para:', sel);
    return grupos.find(g => g.clave === sel);
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

  informesActuales = computed(() => this.grupoSeleccionado()?.informes || []);

  seleccionarCuatrimestre(clave: string) {
    this.cuatrimestreSeleccionado.set(clave);
    this.navService.cuatrimestreSeleccionado.set(clave);
    this.vistaPanel.set(false);
  }

  cerrarDetalle() {
    this.vistaPanel.set(true);
    this.navService.cuatrimestreSeleccionado.set('');
  }

  estadoDe(informe: InformeGuardado): EstadoInforme {
    const prog = this.progresoDe(informe);
    if (prog >= 100) return 'completado';
    if (prog > 0) return 'en-progreso';
    return 'pendiente';
  }

  progresoDe(informe: InformeGuardado): number {
    if (informe.progreso !== undefined) return informe.progreso;
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

  private route = inject(ActivatedRoute);

  constructor() {
    // 1. Restauración inmediata por URL (Lo más fiable al volver con la X)
    const initC = this.route.snapshot.queryParamMap.get('c');
    if (initC) {
      this.cuatrimestreSeleccionado.set(initC);
      this.navService.cuatrimestreSeleccionado.set(initC);
      this.vistaPanel.set(false);
    }

    // 2. Escuchar cambios en la URL de forma continua
    this.route.queryParamMap.subscribe(params => {
      const c = params.get('c');
      if (c) {
        this.cuatrimestreSeleccionado.set(c);
        this.navService.cuatrimestreSeleccionado.set(c);
        this.vistaPanel.set(false);
      } else {
        const fallback = this.navService.cuatrimestreSeleccionado();
        if (fallback) {
          this.cuatrimestreSeleccionado.set(fallback);
          this.vistaPanel.set(false);
        } else {
          this.vistaPanel.set(true);
        }
      }
    });
  }

  async ngOnInit() {
    this.persistService.cargarHistorial().subscribe(() => {
      const sel = this.cuatrimestreSeleccionado();
      if (sel) {
        this.vistaPanel.set(false);
      }
    });
  }

  async toggleAdmin() {
    if (this.isAdmin()) {
      await this.navService.irAAdmin();
    } else {
      const pass = await this.ui.prompt('Acceso Admin', 'Introduce la contraseña de administrador:', 'Contraseña', 'Aceptar', 'Cancelar', 'password');
      if (pass) {
        const ok = await this.adminService.login(pass);
        if (ok) {
          await this.navService.irAAdmin();
        } else {
          await this.ui.alert('Acceso Denegado', 'Contraseña incorrecta', 'error');
        }
      }
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
