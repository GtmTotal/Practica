import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UIService } from '../../services/ui.service';

@Component({
  selector: 'app-ui-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ui-dialog.html',
  styleUrls: ['./ui-dialog.css'],
})
export class UiDialogComponent {
  ui = inject(UIService);
  state = this.ui.dialogState;
  inputVal = signal('');

  onOk() {
    const s = this.state();
    if (s?.type === 'prompt') {
      s.resolve?.(this.inputVal());
    } else {
      s?.resolve?.(true);
    }
    this.inputVal.set('');
  }

  onCancel() {
    this.state()?.resolve?.(null);
    this.inputVal.set('');
  }
}
