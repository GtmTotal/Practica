import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIService } from '../../services/ui.service';

@Component({
  selector: 'app-ui-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-toast.html',
  styleUrls: ['./ui-toast.css'],
})
export class UiToastComponent {
  ui = inject(UIService);
  toasts = this.ui.toastState;

  trackById(index: number, toast: any) {
    return toast.id;
  }
}
