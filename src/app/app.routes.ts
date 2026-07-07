import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then(c => c.default),
  },
  {
    path: 'universes',
    loadComponent: () => import('./pages/universes/universe-list').then(c => c.default),
  },
  {
    path: 'characters',
    loadComponent: () => import('./pages/characters/character-crud').then(c => c.default),
  },
];
