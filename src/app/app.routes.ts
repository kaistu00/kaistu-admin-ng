import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home').then(c => c.default),
  },
  {
    path: 'worlds',
    loadComponent: () => import('./pages/worlds/world-list').then(c => c.default),
  },
  {
    path: 'worlds/new',
    loadComponent: () => import('./pages/worlds/world-form').then(c => c.default),
  },
  {
    path: 'worlds/:slug',
    loadComponent: () => import('./pages/worlds/world-form').then(c => c.default),
  },
  {
    path: 'worlds/:slug/edit',
    loadComponent: () => import('./pages/worlds/world-form').then(c => c.default),
  },
  {
    path: 'universes',
    loadComponent: () => import('./pages/universes/universe-list').then(c => c.default),
  },
  {
    path: 'universes/new',
    loadComponent: () => import('./pages/universes/universe-form').then(c => c.default),
  },
  {
    path: 'universes/:slug',
    loadComponent: () => import('./pages/universes/universe-form').then(c => c.default),
  },
  {
    path: 'universes/:slug/edit',
    loadComponent: () => import('./pages/universes/universe-form').then(c => c.default),
  },
  {
    path: 'characters',
    loadComponent: () => import('./pages/characters/character-crud').then(c => c.default),
  },
  {
    path: 'tools',
    loadComponent: () => import('./pages/local-tools/local-tools').then(c => c.default),
  },
  {
    path: 'tools/new',
    loadComponent: () => import('./pages/local-tools/local-tools-new').then(c => c.default),
  },
  {
    path: 'tools/:id/edit',
    loadComponent: () => import('./pages/local-tools/local-tools-new').then(c => c.default),
  },
  {
    path: 'tools/:id/n8n-dashboard',
    loadComponent: () => import('./pages/local-tools/n8n-dashboard').then(c => c.default),
  },
  {
    path: 'tools/:id/comfyui-dashboard',
    loadComponent: () => import('./pages/local-tools/comfyui-dashboard').then(c => c.default),
  },
  {
    path: 'studio-workers',
    loadComponent: () => import('./pages/studio-workers/workers-list').then(c => c.default),
  },
  {
    path: 'studio-workers/new',
    loadComponent: () => import('./pages/studio-workers/worker-form').then(c => c.default),
  },
  {
    path: 'studio-workers/:slug',
    loadComponent: () => import('./pages/studio-workers/worker-detail').then(c => c.default),
  },
  {
    path: 'studio-workers/:slug/edit',
    loadComponent: () => import('./pages/studio-workers/worker-form').then(c => c.default),
  },
];
