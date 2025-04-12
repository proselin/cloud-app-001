import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path:'search',
    loadComponent: () => import('./pages/search').then((m) => m.SearchComponent),
  },
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.HomeComponent),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
