import { Injectable, signal, effect, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Vista } from './vista.type';

@Injectable({ providedIn: 'root' })
export class ServicioNavegacion {
  vistaActual = signal<Vista>((localStorage.getItem('vistaActual') as Vista) || 'inicio');
  centroSeleccionado = signal<string>(localStorage.getItem('centroSeleccionado') || '');
  cuatrimestreSeleccionado = signal<string>(localStorage.getItem('cuatrimestreSeleccionado') || '');
  vistaOrigen = signal<string>(localStorage.getItem('vistaOrigen') || 'dashboard');

  private route = inject(ActivatedRoute);

  constructor(private router: Router) {
    // Persistencia automática del estado de navegación
    effect(() => {
      localStorage.setItem('vistaActual', this.vistaActual());
      localStorage.setItem('centroSeleccionado', this.centroSeleccionado());
      localStorage.setItem('cuatrimestreSeleccionado', this.cuatrimestreSeleccionado());
      localStorage.setItem('vistaOrigen', this.vistaOrigen());
    });
  }

  async irASeleccion(): Promise<void> {
    this.vistaActual.set('seleccion');
    await this.router.navigate(['/']);
  }

  async volver(): Promise<void> {
    const c = this.cuatrimestreSeleccionado();
    const origen = this.vistaOrigen();
    
    console.log('[NAV-SERVICE] Volviendo. Origen persistente:', origen);
    
    this.vistaActual.set('inicio');
    this.centroSeleccionado.set('');
    
    const target = origen === 'admin' ? '/admin' : '/';
    await this.router.navigate([target], { queryParams: c ? { c } : {} });
    
    // Limpiamos el origen después de volver para no quedarnos "atrapados" en modo admin siempre
    if (origen === 'admin') this.vistaOrigen.set('dashboard');
  }

  async seleccionarCentro(nombre: string, cuatrimestre?: string): Promise<void> {
    this.centroSeleccionado.set(nombre);
    if (cuatrimestre) this.cuatrimestreSeleccionado.set(cuatrimestre);
    this.vistaActual.set('formulario');
    if (cuatrimestre) {
      await this.router.navigate(['/informe', cuatrimestre, nombre]);
    } else {
      await this.router.navigate(['/informe']);
    }
  }

  async irAFormulario(cuatrimestre?: string, centro?: string, from?: string): Promise<void> {
    this.vistaActual.set('formulario');
    if (cuatrimestre) this.cuatrimestreSeleccionado.set(cuatrimestre);
    if (centro) this.centroSeleccionado.set(centro);
    
    // Guardamos el origen de forma persistente
    this.vistaOrigen.set(from || 'dashboard');
    
    const queryParams = from ? { from } : {};
    
    if (cuatrimestre && centro) {
      await this.router.navigate(['/informe', cuatrimestre, centro], { queryParams });
    } else {
      await this.router.navigate(['/informe'], { queryParams });
    }
  }

  async irAAdmin(): Promise<void> {
    await this.router.navigate(['/admin']);
  }

  async reset(): Promise<void> {
    this.vistaActual.set('inicio');
    this.centroSeleccionado.set('');
    localStorage.removeItem('vistaActual');
    localStorage.removeItem('centroSeleccionado');
    await this.router.navigate(['/']);
  }
}
