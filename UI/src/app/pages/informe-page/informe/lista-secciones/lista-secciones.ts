import { Component, WritableSignal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SeccionItemComponent } from './seccion-item/seccion-item';
import { Foto } from '../../foto.interface';

@Component({
  selector: 'app-lista-secciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SeccionItemComponent],
  templateUrl: './lista-secciones.html',
})
export class ListaSeccionesComponent {
  seccionesGroups = input<FormGroup[]>([]);
  seccionesColapsadas = input<boolean[]>([]);
  fotosPorSeccionBase64 = input<WritableSignal<Foto[]>[]>([]);

  toggle = output<number>();
  agregarFoto = output<{ event: Event; secIdx: number }>();
  eliminarFoto = output<{ secIdx: number; fotoIdx: number }>();
  descargarFoto = output<Foto>();

  onAgregarFoto(event: Event, secIdx: number) {
    this.agregarFoto.emit({ event, secIdx });
  }
}
