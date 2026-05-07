import { Injectable, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Vista } from './vista.type';

@Injectable({ providedIn: 'root' })
export class ServicioNavegacion {
  vistaActual = signal<Vista>((localStorage.getItem('vistaActual') as Vista) || 'inicio');
  centroSeleccionado = signal<string>(localStorage.getItem('centroSeleccionado') || '');

  constructor(private router: Router) {
    // Persistencia automática del estado de navegación
    effect(() => {
      localStorage.setItem('vistaActual', this.vistaActual());
      localStorage.setItem('centroSeleccionado', this.centroSeleccionado());
    });
  }

  async irASeleccion(): Promise<void> {
    this.vistaActual.set('seleccion');
    await this.router.navigate(['/']);
  }

  async volver(): Promise<void> {
    this.vistaActual.set('inicio');
    this.centroSeleccionado.set('');
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
    localStorage.removeItem('vistaActual');
    localStorage.removeItem('centroSeleccionado');
    await this.router.navigate(['/']);
  }
}
