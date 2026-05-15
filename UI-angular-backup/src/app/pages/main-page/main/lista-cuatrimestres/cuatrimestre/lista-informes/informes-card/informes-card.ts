import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InformeGuardado } from '../../../../../../informe.interface';

@Component({
  selector: 'app-informes-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './informes-card.html',
  styleUrls: ['./informes-card.css'],
})
export class InformesCardComponent {
  informe = input.required<InformeGuardado>();
  editar = output<InformeGuardado>();
}
