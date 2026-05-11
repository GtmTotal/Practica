import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-header-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './header-form.html',
  styleUrls: ['./header-form.css']
})
export class HeaderFormComponent {
  centro = input('');
  progreso = input(0);
  formGroup = input.required<FormGroup>();
  onCerrar = input<() => void>();

  cerrar() {
    const cerrarFn = this.onCerrar();
    if (cerrarFn) cerrarFn();
  }
}
