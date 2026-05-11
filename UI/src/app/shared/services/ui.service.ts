import { Injectable, signal } from '@angular/core';

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'prompt';

export interface DialogOptions {
  title: string;
  message: string;
  type: DialogType;
  okText?: string;
  cancelText?: string;
  placeholder?: string;
  resolve?: (value: boolean | string | null) => void;
}

@Injectable({
  providedIn: 'root'
})
export class UIService {
  dialogState = signal<DialogOptions | null>(null);

  alert(title: string, message: string, type: DialogType = 'info'): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogState.set({
        title,
        message,
        type,
        okText: 'Aceptar',
        resolve: () => {
          this.dialogState.set(null);
          resolve(true);
        }
      });
    });
  }

  confirm(title: string, message: string, okText = 'Confirmar', cancelText = 'Cancelar'): Promise<boolean> {
    return new Promise((resolve) => {
      this.dialogState.set({
        title,
        message,
        type: 'confirm',
        okText,
        cancelText,
        resolve: (val) => {
          this.dialogState.set(null);
          resolve(val === true);
        }
      });
    });
  }

  prompt(title: string, message: string, placeholder = '', okText = 'Aceptar', cancelText = 'Cancelar'): Promise<string | null> {
    return new Promise((resolve) => {
      this.dialogState.set({
        title,
        message,
        type: 'prompt',
        okText,
        cancelText,
        placeholder,
        resolve: (val) => {
          this.dialogState.set(null);
          if (typeof val === 'string') resolve(val);
          else resolve(val === true ? '' : null);
        }
      });
    });
  }
}
