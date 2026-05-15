import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Foto } from '../../../../foto.interface';


@Component({
  selector: 'app-galeria-fotos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './galeria-fotos.html',  
  styleUrls: ['./galeria-fotos.css']     
})
export class GaleriaFotosComponent {
  fotos = input.required<Foto[]>();
  idxSeccion = input.required<number>();
  eliminarFoto = output<number>();
  descargarFoto = output<Foto>();
  actualizarDescripcion = output<{index: number, descripcion: string}>();
}
