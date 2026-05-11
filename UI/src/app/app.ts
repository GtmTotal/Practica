// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiDialogComponent } from './shared/components/ui-dialog/ui-dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UiDialogComponent],
  template: `
    <router-outlet />
    <app-ui-dialog />
  `
})
export class App {}
