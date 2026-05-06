import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InformeGuardado } from '../../../../../informe.interface';
import { InformesCardComponent } from './informes-card/informes-card';

@Component({
  selector: 'app-lista-informes',
  standalone: true,
  imports: [CommonModule, InformesCardComponent],
  templateUrl: './lista-informes.html',
})
export class ListaInformesComponent {
  informes = input<InformeGuardado[]>([]);
  editar = output<InformeGuardado>();
}
