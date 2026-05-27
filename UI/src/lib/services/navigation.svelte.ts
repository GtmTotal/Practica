import { goto } from '$app/navigation';
import { browser } from '$app/environment';

export type Vista = 'inicio' | 'seleccion' | 'formulario';

class ServicioNavegacion {
  vistaActual = $state<Vista>('inicio');
  centroSeleccionado = $state<string>('');
  cuatrimestreSeleccionado = $state<string>('');
  vistaOrigen = $state<string>('dashboard');

  constructor() {
    if (browser) {
      this.vistaActual = (localStorage.getItem('vistaActual') as Vista) || 'inicio';
      this.centroSeleccionado = localStorage.getItem('centroSeleccionado') || '';
      this.cuatrimestreSeleccionado = localStorage.getItem('cuatrimestreSeleccionado') || '';
      this.vistaOrigen = localStorage.getItem('vistaOrigen') || 'dashboard';
    }
  }

  // Se debe llamar a esta función en algún root layout con $effect
  persist() {
    if (browser) {
      localStorage.setItem('vistaActual', this.vistaActual);
      localStorage.setItem('centroSeleccionado', this.centroSeleccionado);
      localStorage.setItem('cuatrimestreSeleccionado', this.cuatrimestreSeleccionado);
      localStorage.setItem('vistaOrigen', this.vistaOrigen);
    }
  }

  async irASeleccion(): Promise<void> {
    this.vistaActual = 'seleccion';
    this.persist();
    await goto('/');
  }

  async volver(): Promise<void> {
    const c = this.cuatrimestreSeleccionado;
    const origen = this.vistaOrigen;
    
    this.vistaActual = 'inicio';
    this.centroSeleccionado = '';
    
    if (origen === 'admin_cuadro') {
      this.vistaOrigen = 'dashboard';
      this.persist();
      await goto('/admin?menu=cuadro_electrico');
    } else if (origen === 'admin') {
      const qs = c ? `?c=${encodeURIComponent(c)}` : '';
      this.vistaOrigen = 'dashboard';
      this.persist();
      await goto(`/admin${qs}`);
    } else {
      this.persist();
      await goto('/');
    }
  }

  async seleccionarCentro(nombre: string, cuatrimestre?: string): Promise<void> {
    this.centroSeleccionado = nombre;
    if (cuatrimestre) this.cuatrimestreSeleccionado = cuatrimestre;
    this.vistaActual = 'formulario';
    this.persist();

    if (cuatrimestre) {
      await goto(`/informe/${encodeURIComponent(cuatrimestre)}/${encodeURIComponent(nombre)}`);
    } else {
      await goto('/informe');
    }
  }

  async irAFormulario(cuatrimestre?: string, centro?: string, from?: string): Promise<void> {
    this.vistaActual = 'formulario';
    if (cuatrimestre) this.cuatrimestreSeleccionado = cuatrimestre;
    if (centro) this.centroSeleccionado = centro;
    
    this.vistaOrigen = from || 'dashboard';
    this.persist();
    
    const qs = from ? `?from=${encodeURIComponent(from)}` : '';
    
    if (cuatrimestre && centro) {
      await goto(`/informe/${encodeURIComponent(cuatrimestre)}/${encodeURIComponent(centro)}${qs}`);
    } else {
      await goto(`/informe${qs}`);
    }
  }

  async irAAdmin(): Promise<void> {
    await goto('/admin');
  }

  async reset(): Promise<void> {
    this.vistaActual = 'inicio';
    this.centroSeleccionado = '';
    if (browser) {
      localStorage.removeItem('vistaActual');
      localStorage.removeItem('centroSeleccionado');
    }
    await goto('/');
  }
}

export const navService = new ServicioNavegacion();
