// navigation.service.ts
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Vista } from './vista.type';

@Injectable({ providedIn: 'root' })
export class ServicioNavegacion {
  vistaActual = signal<Vista>('inicio');
  centroSeleccionado = signal<string>('');

  constructor(private router: Router) {}

  async irASeleccion(): Promise<void> {
    this.vistaActual.set('seleccion');
    await this.router.navigate(['/']);
  }

  async volver(): Promise<void> {
    this.vistaActual.set('inicio');
    await this.router.navigate(['/']);
  }

  async seleccionarCentro(nombre: string): Promise<void> {
    this.centroSeleccionado.set(nombre);
    this.vistaActual.set('formulario');
    await this.router.navigate(['/informe']);
  }

  async irAFormulario(): Promise<void> {
    this.vistaActual.set('formulario');
    await this.router.navigate(['/informe']);
  }

  async reset(): Promise<void> {
    this.vistaActual.set('inicio');
    this.centroSeleccionado.set('');
    await this.router.navigate(['/']);
  }
}

