import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GrupoCuatrimestre, InformeGuardado } from '../../../informe.interface';
import { CuatrimestreComponent } from './cuatrimestre/cuatrimestre';

@Component({
  selector: 'app-lista-cuatrimestres',
  standalone: true,
  imports: [CommonModule, CuatrimestreComponent],
  templateUrl: './lista-cuatrimestres.html',
  styleUrls: ['./lista-cuatrimestres.css'],
})
export class ListaCuatrimestresComponent {
  private cuatrimestresExpandidos = new Set<string>();

  grupos = input<GrupoCuatrimestre[]>([]);
  isAdmin = input(false);
  eliminarCuatrimestre = output<string>();
  editarInforme = output<InformeGuardado>();

  toggleCuatrimestre(clave: string) {
    if (this.cuatrimestresExpandidos.has(clave)) {
      this.cuatrimestresExpandidos.delete(clave);
    } else {
      this.cuatrimestresExpandidos.add(clave);
    }
  }

  estaColapsado(clave: string) {
    return !this.cuatrimestresExpandidos.has(clave);
  }

  onToggle(clave: string) {
    this.toggleCuatrimestre(clave);
  }
}
