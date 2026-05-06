import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Foto } from '../../../../foto.interface';


@Component({
  selector: 'app-galeria-fotos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria-fotos.html',   // ← sin .component
  styleUrls: ['./galeria-fotos.css']      // (opcional)
})
export class GaleriaFotosComponent {
  fotos = input.required<Foto[]>();
  idxSeccion = input.required<number>();
  eliminarFoto = output<number>();
  descargarFoto = output<Foto>();
}
