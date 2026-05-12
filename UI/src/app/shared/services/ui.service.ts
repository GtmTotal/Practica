import { Injectable, signal } from '@angular/core';

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'prompt';
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

@Injectable({
  providedIn: 'root'
})
export class UIService {
  dialogState = signal<DialogOptions | null>(null);
  toastState = signal<ToastOptions[]>([]);
  private toastIdCounter = 0;

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

  prompt(title: string, message: string, placeholder = '', okText = 'Aceptar', cancelText = 'Cancelar', inputType: 'text' | 'password' = 'text'): Promise<string | null> {
    return new Promise((resolve) => {
      this.dialogState.set({
        title,
        message,
        type: 'prompt',
        okText,
        cancelText,
        placeholder,
        inputType,
        resolve: (val) => {
          this.dialogState.set(null);
          if (typeof val === 'string') resolve(val);
          else resolve(val === true ? '' : null);
        }
      });
    });
  }

  // Sistema de Toasts
  toast(message: string, type: ToastType = 'info', duration = 4000): void {
    const id = ++this.toastIdCounter;
    const toast: ToastOptions = { id, message, type, duration };
    
    this.toastState.update(toasts => [...toasts, toast]);
    
    // Auto-dismiss
    setTimeout(() => {
      this.dismissToast(id);
    }, duration);
  }

  dismissToast(id: number): void {
    this.toastState.update(toasts => toasts.filter(t => t.id !== id));
  }

  // Helper methods para toasts comunes
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
