// src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiDialogComponent } from './shared/components/ui-dialog/ui-dialog';
import { UiToastComponent } from './shared/components/ui-toast/ui-toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UiDialogComponent, UiToastComponent],
  template: `
    <router-outlet />
    <app-ui-dialog />
    <app-ui-toast />
  `
})
export class App {}
