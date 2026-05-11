import { describe, it, expect, beforeEach } from 'vitest';
import { UIService } from './ui.service';

describe('UIService', () => {
  let service: UIService;

  beforeEach(() => {
    service = new UIService();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
    expect(service.dialogState()).toBeNull();
  });

  describe('alert()', () => {
    it('debería mostrar un diálogo de alerta con título y mensaje', async () => {
      const promise = service.alert('Título Test', 'Mensaje de prueba', 'success');
      
      // Verificar que el estado del diálogo se actualizó
      const state = service.dialogState();
      expect(state).toBeTruthy();
      expect(state?.title).toBe('Título Test');
      expect(state?.message).toBe('Mensaje de prueba');
      expect(state?.type).toBe('success');
      expect(state?.okText).toBe('Aceptar');

      // Simular clic en OK
      state?.resolve?.(true);
      
      const result = await promise;
      expect(result).toBe(true);
      expect(service.dialogState()).toBeNull(); // Se cerró
    });
  });

  describe('confirm()', () => {
    it('debería mostrar un diálogo de confirmación con botones OK/Cancelar', async () => {
      const promise = service.confirm('¿Eliminar?', 'Esta acción no se puede deshacer', 'Eliminar', 'Cancelar');
      
      const state = service.dialogState();
      expect(state).toBeTruthy();
      expect(state?.type).toBe('confirm');
      expect(state?.okText).toBe('Eliminar');
      expect(state?.cancelText).toBe('Cancelar');

      // Simular confirmación
      state?.resolve?.(true);
      
      const result = await promise;
      expect(result).toBe(true);
    });

    it('debería retornar false al cancelar', async () => {
      const promise = service.confirm('¿Continuar?', 'Mensaje');
      
      const state = service.dialogState();
      state?.resolve?.(null); // Cancelar
      
      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('prompt()', () => {
    it('debería mostrar un diálogo con campo de entrada', async () => {
      const promise = service.prompt('Nombre', 'Introduce tu nombre:', 'Ej: Juan');
      
      const state = service.dialogState();
      expect(state).toBeTruthy();
      expect(state?.type).toBe('prompt');
      expect(state?.placeholder).toBe('Ej: Juan');

      // Simular entrada de usuario
      state?.resolve?.('Carlos');
      
      const result = await promise;
      expect(result).toBe('Carlos');
    });

    it('debería retornar null al cancelar', async () => {
      const promise = service.prompt('Dato', 'Mensaje');
      
      const state = service.dialogState();
      state?.resolve?.(null);
      
      const result = await promise;
      expect(result).toBeNull();
    });
  });

  describe('tipos de diálogo', () => {
    const tipos: Array<'info' | 'success' | 'warning' | 'error'> = ['info', 'success', 'warning', 'error'];
    
    tipos.forEach(tipo => {
      it(`debería soportar tipo '${tipo}'`, async () => {
        const promise = service.alert('Test', 'Mensaje', tipo);
        const state = service.dialogState();
        
        expect(state?.type).toBe(tipo);
        
        state?.resolve?.(true);
        await promise;
      });
    });
  });

  describe('toast()', () => {
    beforeEach(() => {
      // Limpiar toasts antes de cada test
      service.toastState().forEach(t => service.dismissToast(t.id));
    });

    it('debería agregar un toast al estado', () => {
      service.toast('Mensaje de prueba', 'success');
      
      const toasts = service.toastState();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Mensaje de prueba');
      expect(toasts[0].type).toBe('success');
    });

    it('debería agregar múltiples toasts', () => {
      service.toast('Primero', 'success');
      service.toast('Segundo', 'error');
      service.toast('Tercero', 'warning');
      
      const toasts = service.toastState();
      expect(toasts.length).toBe(3);
      expect(toasts[0].type).toBe('success');
      expect(toasts[1].type).toBe('error');
      expect(toasts[2].type).toBe('warning');
    });

    it('debería asignar IDs únicos a cada toast', () => {
      service.toast('Primero', 'info');
      service.toast('Segundo', 'info');
      
      const toasts = service.toastState();
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('dismissToast debería eliminar el toast específico', () => {
      service.toast('Toast 1', 'info');
      service.toast('Toast 2', 'info');
      
      const idToRemove = service.toastState()[0].id;
      service.dismissToast(idToRemove);
      
      const toasts = service.toastState();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Toast 2');
    });

    it('success() helper debería crear toast de éxito', () => {
      service.success('¡Guardado!');
      
      const toasts = service.toastState();
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('¡Guardado!');
    });

    it('error() helper debería crear toast de error', () => {
      service.error('Algo falló');
      
      const toasts = service.toastState();
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toBe('Algo falló');
    });

    it('warning() helper debería crear toast de advertencia', () => {
      service.warning('Atención');
      
      const toasts = service.toastState();
      expect(toasts[0].type).toBe('warning');
      expect(toasts[0].message).toBe('Atención');
    });

    it('toastState debería iniciar vacío', () => {
      expect(service.toastState().length).toBe(0);
    });
  });
});
