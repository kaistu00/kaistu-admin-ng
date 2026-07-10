import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tools',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tools/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tools/:id/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tools/:id/n8n-dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'tools/:id/comfyui-dashboard',
    renderMode: RenderMode.Client,
  },
  {
    path: 'worlds/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'worlds/:slug',
    renderMode: RenderMode.Client,
  },
  {
    path: 'worlds/:slug/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: 'universes/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'universes/:slug',
    renderMode: RenderMode.Client,
  },
  {
    path: 'universes/:slug/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: 'studio-workers',
    renderMode: RenderMode.Client,
  },
  {
    path: 'studio-workers/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'studio-workers/:slug',
    renderMode: RenderMode.Client,
  },
  {
    path: 'studio-workers/:slug/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
