export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'prompt' | 'save-confirm' | 'danger-confirm';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface DialogOptions {
  title: string;
  message: string;
  type: DialogType;
  okText?: string;
  cancelText?: string;
  placeholder?: string;
  inputType?: 'text' | 'password';
  resolve?: (value: boolean | string | null) => void;
}

export interface ToastOptions {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

class UIService {
  dialogState = $state<DialogOptions | null>(null);
  private dialogQueue: DialogOptions[] = [];
  toastState = $state<ToastOptions[]>([]);
  private toastIdCounter = 0;

  private setOrQueue(opts: DialogOptions): void {
    if (this.dialogState) {
      this.dialogQueue.push(opts);
    } else {
      this.dialogState = opts;
    }
  }

  private processQueue(): void {
    if (!this.dialogState && this.dialogQueue.length > 0) {
      this.dialogState = this.dialogQueue.shift()!;
    }
  }

  alert(title: string, message: string, type: DialogType = 'info'): Promise<boolean> {
    return new Promise((resolve) => {
      this.setOrQueue({
        title,
        message,
        type,
        okText: 'Aceptar',
        resolve: () => {
          this.dialogState = null;
          resolve(true);
          this.processQueue();
        }
      });
    });
  }

  confirm(title: string, message: string, okText = 'Confirmar', cancelText = 'Cancelar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.setOrQueue({
        title,
        message,
        type: 'confirm',
        okText,
        cancelText,
        resolve: (val) => {
          this.dialogState = null;
          resolve(val === true);
          this.processQueue();
        }
      });
    });
  }

  confirmDanger(title: string, message: string, okText = 'Eliminar', cancelText = 'Cancelar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.setOrQueue({
        title,
        message,
        type: 'danger-confirm',
        okText,
        cancelText,
        resolve: (val) => {
          this.dialogState = null;
          resolve(val === true);
          this.processQueue();
        }
      });
    });
  }

  saveConfirm(): Promise<'save' | 'discard' | 'cancel'> {
    return new Promise((resolve) => {
      this.setOrQueue({
        title: '¿Guardar antes de salir?',
        message: 'Los cambios no guardados se perderán definitivamente.',
        type: 'save-confirm',
        resolve: (val) => {
          this.dialogState = null;
          resolve((val as 'save' | 'discard' | 'cancel') || 'cancel');
          this.processQueue();
        }
      });
    });
  }

  prompt(title: string, message: string, placeholder = '', okText = 'Aceptar', cancelText = 'Cancelar', inputType: 'text' | 'password' = 'text'): Promise<string | null> {
    return new Promise((resolve) => {
      this.setOrQueue({
        title,
        message,
        type: 'prompt',
        okText,
        cancelText,
        placeholder,
        inputType,
        resolve: (val) => {
          this.dialogState = null;
          if (typeof val === 'string') resolve(val);
          else resolve(val === true ? '' : null);
          this.processQueue();
        }
      });
    });
  }

  // Sistema de Toasts
  toast(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = ++this.toastIdCounter;
    const toast: ToastOptions = { id, message, type, duration };
    
    this.toastState.push(toast);
    
    // Auto-dismiss
    setTimeout(() => {
      this.dismissToast(id);
    }, duration);
  }

  dismissToast(id: number): void {
    this.toastState = this.toastState.filter(t => t.id !== id);
  }

  success(message: string, duration?: number): void {
    this.toast(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.toast(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.toast(message, 'warning', duration);
  }
}

export const ui = new UIService();
