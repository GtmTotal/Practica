import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TareaItemComponent } from './tarea-item/tarea-item';

@Component({
  selector: 'app-lista-tareas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TareaItemComponent],
  templateUrl: './lista-tareas.html',
})
export class ListaTareasComponent {
  tareasArray = input.required<FormArray>();
  prefijo = input.required<number>();
  idxSeccion = input.required<number>();
  eliminarFoto = output<number>();

  get tareasGroups(): FormGroup[] {
    return this.tareasArray().controls as FormGroup[];
  }
}
