import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-informe-footer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './informe-footer.html',
  styleUrls: ['./informe-footer.css']
})
export class InformeFooterComponent {
  formGroup = input.required<FormGroup>();
  guardando = input(false);
  generarPDF = output<void>();
  guardarYSalir = output<void>();
}
