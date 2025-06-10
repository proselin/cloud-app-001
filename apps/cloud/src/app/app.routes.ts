import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search').then((m) => m.SearchComponent),
  },
  {
    path: 'comic/:id',
    loadComponent: () =>
      import('./pages/comic').then((m) => m.ComicComponent),
  },
  {
    path: 'chapter/:comicId/:chapterId',
    loadComponent: () =>
      import('./pages/chapter').then((m) => m.ChapterComponent),
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
