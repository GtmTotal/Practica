import { Component, input, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { GaleriaFotosComponent } from './galeria-fotos/galeria-fotos';
import { Foto } from '../../../foto.interface';
import { ListaTareasComponent } from './lista-tareas/lista-tareas';


@Component({
  selector: 'app-seccion-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ListaTareasComponent, GaleriaFotosComponent],
  templateUrl: './seccion-item.html',
  styleUrls: ['./seccion-item.css']
})
export class SeccionItemComponent {
  seccionGroup = input.required<FormGroup>();
  idxSeccion = input.required<number>();
  colapsada = input(false);
  fotosSignal = input.required<WritableSignal<Foto[]>>();
  toggle = output<number>();
  agregarFoto = output<Event>();
  eliminarFoto = output<{ secIdx: number; fotoIdx: number }>();
  descargarFoto = output<Foto>();
  actualizarDescripcion = output<{secIdx: number; fotoIdx: number; descripcion: string}>();

  onToggle() { this.toggle.emit(this.idxSeccion()); }
  onAgregarFoto(event: Event) { this.agregarFoto.emit(event); }
  onEliminarFoto(fotoIdx: number) { this.eliminarFoto.emit({ secIdx: this.idxSeccion(), fotoIdx }); }
  onActualizarDescripcion(e: {index: number, descripcion: string}) {
    this.actualizarDescripcion.emit({ secIdx: this.idxSeccion(), fotoIdx: e.index, descripcion: e.descripcion });
  }

  getTareasArray() { return this.seccionGroup().get('tareas') as FormArray; }
  getPrefijo() { return this.seccionGroup().get('prefijo')?.value; }
}
