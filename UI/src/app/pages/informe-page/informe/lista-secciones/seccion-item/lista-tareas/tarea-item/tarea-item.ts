import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatosMotorComponent } from './datos-motor/datos-motor';
import { FormArray } from '@angular/forms';


@Component({
  selector: 'app-tarea-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatosMotorComponent],
  templateUrl: './tarea-item.html',
  styleUrls: ['./tarea-item.css']
})
export class TareaItemComponent {
  tareaGroup = input.required<FormGroup>();
  idxTarea = input.required<number>();
  prefijo = input.required<number>();
  idxSeccion = input.required<number>();
  eliminarFoto = output<number>();

  // Método para pasar al componente de bombas
getBombasQuimicas(): FormArray | null {
  const bombas = this.tareaGroup().get('bombasQuimicas');
  return bombas instanceof FormArray ? bombas : null;
}

  // Método para obtener campos de medición (si existen)
  getCamposArray() { return this.tareaGroup().get('campos') as any; }
}
