import { Component, WritableSignal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HeaderFormComponent } from './header-form/header-form';
import { ListaSeccionesComponent } from './lista-secciones/lista-secciones';
import { Foto } from '../foto.interface';
import { InformeFooterComponent } from './informe-footer/informe-footer';

@Component({
  selector: 'app-informe',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderFormComponent,
    ListaSeccionesComponent,
    InformeFooterComponent,
  ],
  templateUrl: './informe.html',
})
export class InformeComponent {
  formGroup = input<FormGroup | null>(null);
  centro = input('');
  progreso = input(0);
  seccionesGroups = input<FormGroup[]>([]);
  seccionesColapsadas = input<boolean[]>([]);
  fotosPorSeccionBase64 = input<WritableSignal<Foto[]>[]>([]);
  guardando = input(false);
  onCerrar = input<() => void>();

  generarPDF = output<void>();
  guardarYSalir = output<void>();
  toggleSeccion = output<number>();
  agregarFoto = output<{ event: Event; secIdx: number }>();
  eliminarFoto = output<{ secIdx: number; fotoIdx: number }>();
  descargarFoto = output<Foto>();
  actualizarDescripcion = output<{secIdx: number; fotoIdx: number; descripcion: string}>();
}
