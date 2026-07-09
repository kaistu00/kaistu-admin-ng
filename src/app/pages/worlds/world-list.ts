import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WorldsService, WorldItem } from './worlds.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <header class="page-header">
        <div>
          <h1 class="page-title">Mundos</h1>
          <p class="page-sub">Gestiona los mundos y escenarios de tus universos narrativos</p>
        </div>
        <a class="btn-primary" routerLink="/worlds/new">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Mundo
        </a>
      </header>

      @if (error()) {
        <div class="error-banner">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando mundos...</p>
        </div>
      } @else if (worlds().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h2 class="empty-title">No hay mundos creados</h2>
          <p class="empty-desc">Crea un mundo para definir los escenarios de tus historias.</p>
          <a class="btn-primary" routerLink="/worlds/new">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Crear primer mundo
          </a>
        </div>
      } @else {
        <div class="worlds-grid">
          @for (w of worlds(); track w.id) {
            <div class="world-card" (click)="viewWorld(w.slug)">
              <div class="card-header">
                <div class="card-actions">
                  <button class="action-btn" (click)="editWorld(w.slug, $event)" title="Editar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" (click)="deleteWorld(w.slug, $event)" title="Eliminar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <h3 class="card-title">{{ w.name }}</h3>
              <div class="card-meta">
                <span class="meta-item">{{ w.universeId }}</span>
              </div>
              @if (w.worldTypes?.length) {
                <div class="card-genres">
                  @for (t of w.worldTypes.slice(0, 4); track t) {
                    <span class="genre-chip">{{ t }}</span>
                  }
                  @if (w.worldTypes.length > 4) {
                    <span class="genre-chip more">+{{ w.worldTypes.length - 4 }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; margin-bottom: 2rem; }
    .page-title { margin: 0 0 0.25rem; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .page-sub { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: var(--accent-gradient); border: none; border-radius: var(--radius-md); color: #fff; font-size: 0.85rem; font-weight: 600; font-family: inherit; cursor: pointer; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; }
    .btn-primary:hover { box-shadow: 0 0 20px var(--accent-glow); transform: translateY(-1px); }
    .btn-icon { width: 16px; height: 16px; }
    .btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; font-family: inherit; cursor: pointer; text-decoration: none; transition: all 0.2s ease; }
    .btn-secondary:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .error-banner { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #ef4444; font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--text-secondary); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { width: 64px; height: 64px; margin: 0 auto 1rem; color: var(--text-muted); opacity: 0.5; }
    .empty-title { margin: 0 0 0.5rem; font-size: 1.2rem; font-weight: 600; }
    .empty-desc { margin: 0 0 1.5rem; font-size: 0.85rem; color: var(--text-muted); }
    .worlds-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    .world-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; cursor: pointer; transition: all 0.2s ease; }
    .world-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .card-header { display: flex; justify-content: flex-end; margin-bottom: 0.5rem; }
    .card-actions { display: flex; gap: 0.25rem; }
    .action-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--radius-sm); border: none; background: transparent; color: var(--text-muted); cursor: pointer; transition: all 0.15s ease; }
    .action-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
    .action-btn.danger:hover { background: rgba(239,68,68,0.15); color: #ef4444; }
    .card-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; }
    .card-meta { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-muted); }
    .card-genres { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .genre-chip { font-size: 0.72rem; padding: 0.2rem 0.45rem; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius-sm); }
    .genre-chip.more { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
  `]
})
export default class WorldListComponent {
  private readonly worldsService = inject(WorldsService);
  private readonly router = inject(Router);

  protected readonly worlds = signal<WorldItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const list = await firstValueFrom(this.worldsService.getAll());
      this.worlds.set(list);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al cargar mundos');
    } finally {
      this.loading.set(false);
    }
  }

  protected async deleteWorld(slug: string, event: Event) {
    event.stopPropagation();
    if (!confirm('¿Eliminar este mundo?')) return;
    try {
      await firstValueFrom(this.worldsService.delete(slug));
      await this.load();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  protected editWorld(slug: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/worlds', slug, 'edit']);
  }

  protected viewWorld(slug: string) {
    this.router.navigate(['/worlds', slug]);
  }
}
