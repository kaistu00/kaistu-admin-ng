import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(c => c.default),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home').then(c => c.default),
  },
  {
    path: 'worlds',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/worlds/world-list').then(c => c.default),
  },
  {
    path: 'worlds/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/worlds/world-form').then(c => c.default),
  },
  {
    path: 'worlds/:slug',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/worlds/world-form').then(c => c.default),
  },
  {
    path: 'worlds/:slug/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/worlds/world-form').then(c => c.default),
  },
  {
    path: 'universes',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/universes/universe-list').then(c => c.default),
  },
  {
    path: 'universes/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/universes/universe-form').then(c => c.default),
  },
  {
    path: 'universes/:slug',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/universes/universe-form').then(c => c.default),
  },
  {
    path: 'universes/:slug/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/universes/universe-form').then(c => c.default),
  },
  {
    path: 'characters',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/characters/character-crud').then(c => c.default),
  },
  {
    path: 'tools',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/local-tools/local-tools').then(c => c.default),
  },
  {
    path: 'tools/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/local-tools/local-tools-new').then(c => c.default),
  },
  {
    path: 'tools/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/local-tools/local-tools-new').then(c => c.default),
  },
  {
    path: 'tools/:id/n8n-dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/local-tools/n8n-dashboard').then(c => c.default),
  },
  {
    path: 'tools/:id/comfyui-dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/local-tools/comfyui-dashboard').then(c => c.default),
  },
  {
    path: 'studio-workers',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/studio-workers/workers-list').then(c => c.default),
  },
  {
    path: 'studio-workers/new',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/studio-workers/worker-form').then(c => c.default),
  },
  {
    path: 'studio-workers/:slug',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/studio-workers/worker-detail').then(c => c.default),
  },
  {
    path: 'studio-workers/:slug/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/studio-workers/worker-form').then(c => c.default),
  },
];
