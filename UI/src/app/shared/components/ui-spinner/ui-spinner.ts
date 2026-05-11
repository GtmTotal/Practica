import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-spinner.html',
  styleUrls: ['./ui-spinner.css'],
})
export class UiSpinnerComponent {
  size = input<'small' | 'medium' | 'large'>('medium');
  color = input<'primary' | 'white'>('primary');
  overlay = input(false); // Mostrar overlay semitransparente
}
