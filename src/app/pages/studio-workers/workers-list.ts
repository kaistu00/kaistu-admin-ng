import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WorkerService, WorkerItem } from '../../services/worker.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="n8n-page">
      <header class="n8n-header">
        <div class="n8n-header-text">
          <h1 class="n8n-title">Trabajadores IA</h1>
          <span class="n8n-url">Agentes del estudio — {{ workers().length }} registrados</span>
        </div>
        <a class="btn-primary" routerLink="/studio-workers/new">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo agente
        </a>
      </header>

      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>
      } @else if (error()) {
        <div class="error-banner">{{ error() }}</div>
      } @else if (workers().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <p>Aún no hay agentes. Crea tu primer trabajador IA.</p>
          <a class="btn-primary" routerLink="/studio-workers/new">Crear agente</a>
        </div>
      } @else {
        <div class="card-grid">
          @for (w of workers(); track w.slug) {
            <div class="worker-card" (click)="viewWorker(w.slug)">
              <div class="card-glow"></div>
              <div class="card-body">
                <div class="card-top">
                  <span class="card-icon">{{ w.icon || '🤖' }}</span>
                  <div class="card-info">
                    <h3>{{ w.name }}</h3>
                    @if (w.description) {
                      <p>{{ w.description }}</p>
                    }
                  </div>
                  <span class="status-pill" [class]="statusClass(w.status || 'active')">{{ w.status || 'active' }}</span>
                </div>
                <div class="card-meta">
                  @if (w.skills?.length) {
                    <span class="meta-chip">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      {{ w.skills.length }} skill{{ w.skills.length !== 1 ? 's' : '' }}
                    </span>
                  }
                  @if (w.tags?.length) {
                    <span class="meta-chip">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                      {{ w.tags.join(', ') }}
                    </span>
                  }
                  <span class="meta-chip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ formatDate(w.createdAt) }}
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-ghost" (click)="editWorker(w.slug, $event)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Editar
                </button>
                <button class="btn-ghost btn-ghost-danger" (click)="deleteWorker(w.slug, $event)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Eliminar
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .n8n-page { padding: 1.5rem 2rem; }
    .n8n-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; }
    .n8n-header-text { flex: 1; }
    .n8n-title { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
    .n8n-url { font-size: 0.78rem; color: var(--text-muted); }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.45rem;
      background: var(--accent-gradient); color: #fff; border: none; border-radius: var(--radius-md);
      padding: 0.55rem 1.1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      text-decoration: none; transition: opacity 0.2s, transform 0.15s;
      &:hover { opacity: 0.9; transform: translateY(-1px); }
    }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: transparent; border: 1px solid var(--border); color: var(--text-secondary);
      border-radius: var(--radius-sm); padding: 0.35rem 0.7rem; font-size: 0.75rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s;
      &:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-tertiary); }
    }
    .btn-ghost-danger:hover { border-color: rgba(239,68,68,0.3); color: var(--red); background: rgba(239,68,68,0.08); }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
    .worker-card {
      position: relative; background: var(--bg-secondary); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden; cursor: pointer;
      transition: border-color 0.2s, transform 0.2s;
      display: flex; flex-direction: column;
      &:hover { border-color: var(--border-accent); transform: translateY(-2px); }
      &:hover .card-glow { opacity: 1; }
    }
    .card-glow {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(0,210,255,0.04), transparent 60%);
      opacity: 0; transition: opacity 0.3s;
    }
    .card-body { padding: 1.2rem; flex: 1; position: relative; z-index: 1; }
    .card-top { display: flex; align-items: flex-start; gap: 0.75rem; }
    .card-icon { font-size: 1.8rem; line-height: 1; flex-shrink: 0; }
    .card-info { flex: 1; min-width: 0; }
    .card-info h3 { margin: 0 0 0.2rem; font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
    .card-info p { margin: 0; font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .status-pill {
      font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      padding: 0.15rem 0.55rem; border-radius: 20px; border: 1px solid; flex-shrink: 0;
      &.active { color: var(--green); border-color: rgba(34,215,94,0.25); background: rgba(34,215,94,0.08); }
      &.inactive { color: var(--text-muted); border-color: var(--border); background: var(--bg-tertiary); }
    }
    .card-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; }
    .meta-chip {
      display: inline-flex; align-items: center; gap: 0.25rem;
      font-size: 0.7rem; color: var(--text-muted);
      background: var(--bg-tertiary); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }
    .card-actions {
      display: flex; gap: 0.35rem; padding: 0 1.2rem 0.9rem; position: relative; z-index: 1;
    }
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-muted); }
    .empty-icon { margin-bottom: 1rem; opacity: 0.3; }
    .empty-state p { margin: 0 0 1.2rem; font-size: 0.9rem; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 2rem; color: var(--text-muted); }
    .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: var(--red); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; }
  `],
})
export default class WorkersListComponent {
  private readonly workerService = inject(WorkerService);
  private readonly router = inject(Router);

  protected readonly workers = signal<WorkerItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const list = await firstValueFrom(this.workerService.getAll());
      this.workers.set(list);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al cargar trabajadores');
    } finally {
      this.loading.set(false);
    }
  }

  protected async deleteWorker(slug: string, event: Event) {
    event.stopPropagation();
    if (!confirm('¿Eliminar este trabajador?')) return;
    try {
      await firstValueFrom(this.workerService.delete(slug));
      await this.load();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  protected editWorker(slug: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/studio-workers', slug, 'edit']);
  }

  protected viewWorker(slug: string) {
    this.router.navigate(['/studio-workers', slug]);
  }

  protected statusClass(status: string): string {
    return status === 'active' ? 'active' : 'inactive';
  }

  protected formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString();
  }
}
