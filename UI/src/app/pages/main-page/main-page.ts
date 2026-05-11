import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ListaCuatrimestresComponent } from './main/lista-cuatrimestres/lista-cuatrimestres';
import { ServicioCuatrimestre } from './services/cuatrimestre.service';
import { ServicioPersistenciaFormulario } from '../informe-page/services/form-persistence.service';
import { ServicioInicializacionFormulario } from '../informe-page/services/form-initialization.service';
import { ServicioNavegacion } from './services/navigation.service';
import { ServicioAdmin } from '../services/admin.service';
import { UIService } from '../../shared/services/ui.service';
import { InformeGuardado } from '../informe.interface';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule, ListaCuatrimestresComponent, FormsModule],
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

  get informesGuardados() {
    return this.persistService.informesGuardados;
  }

  get informesPorCuatrimestre() {
    return this.cuatriService.getInformesPorCuatrimestre(this.informesGuardados());
  }

  constructor() {}

  async ngOnInit() {
    this.persistService.cargarHistorial().subscribe();
  }

  async toggleAdmin() {
    if (this.isAdmin()) {
      await this.navService.irAAdmin();
    } else {
      const pass = await this.ui.prompt('Acceso Admin', 'Introduce la contraseña de administrador:', 'Contraseña');
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
