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
  private cuatrimestresColapsados = new Set<string>();

  grupos = input<GrupoCuatrimestre[]>([]);
  eliminarCuatrimestre = output<string>();
  editarInforme = output<InformeGuardado>();

  toggleCuatrimestre(clave: string) {
    if (this.cuatrimestresColapsados.has(clave)) {
      this.cuatrimestresColapsados.delete(clave);
    } else {
      this.cuatrimestresColapsados.add(clave);
    }
  }

  estaColapsado(clave: string) {
    return this.cuatrimestresColapsados.has(clave);
  }

  onToggle(clave: string) {
    this.toggleCuatrimestre(clave);
  }
}
