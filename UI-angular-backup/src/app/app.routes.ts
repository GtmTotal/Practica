// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { MainPageComponent } from './pages/main-page/main-page';
import { InformePageComponent } from './pages/informe-page/informe-page';
import { AdminPageComponent } from './pages/admin-page/admin-page';

export const routes: Routes = [
  { path: '', component: MainPageComponent },
  { path: 'informe', component: InformePageComponent },
  { path: 'informe/:cuatrimestre/:centro', component: InformePageComponent },
  { path: 'admin', component: AdminPageComponent },
  { path: '**', redirectTo: '' },
];
