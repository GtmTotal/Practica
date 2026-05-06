import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GrupoCuatrimestre, InformeGuardado } from '../../../../informe.interface';
import { ListaInformesComponent } from './lista-informes/lista-informes';

@Component({
  selector: 'app-cuatrimestre',
  standalone: true,
  imports: [CommonModule, ListaInformesComponent],
  templateUrl: './cuatrimestre.html',
  styleUrls: ['./cuatrimestre.css'],
})
export class CuatrimestreComponent {
  grupo = input.required<GrupoCuatrimestre>();
  colapsado = input(false);
  toggle = output<string>();
  eliminarCuatrimestre = output<string>();
  editarInforme = output<InformeGuardado>();
}
