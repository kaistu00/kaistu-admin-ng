import { Component, signal, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WorkerService, WorkerItem } from '../../services/worker.service';

type DetailTab = 'info' | 'system' | 'user' | 'skills';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="n8n-page">
      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>
      } @else if (error()) {
        <div class="error-banner">{{ error() }}</div>
      } @else if (worker(); as w) {
        <header class="n8n-header">
          <a class="btn-back" routerLink="/studio-workers">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Trabajadores
          </a>
          <div class="n8n-header-text">
            <div class="title-row">
              <span class="agent-icon">{{ w.icon || '🤖' }}</span>
              <h1 class="n8n-title">{{ w.name }}</h1>
              <span class="status-pill" [class]="(w.status || 'active') === 'active' ? 'active' : 'inactive'">{{ w.status || 'active' }}</span>
            </div>
            <span class="n8n-url">{{ w.description || 'Sin descripción' }}</span>
          </div>
          <div class="header-actions">
            <a class="btn-ghost" [routerLink]="['/studio-workers', w.slug, 'edit']">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </a>
            <button class="btn-danger" (click)="deleteWorker()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Eliminar
            </button>
          </div>
        </header>

        <nav class="tabs">
          <button class="tab" [class.active]="activeTab() === 'info'" (click)="activeTab.set('info')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Info
          </button>
          <button class="tab" [class.active]="activeTab() === 'system'" (click)="activeTab.set('system')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            System Prompt
          </button>
          <button class="tab" [class.active]="activeTab() === 'user'" (click)="activeTab.set('user')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            User Prompt
          </button>
          <button class="tab" [class.active]="activeTab() === 'skills'" (click)="activeTab.set('skills')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            Skills
          </button>
        </nav>

        <div class="tab-content">
          @switch (activeTab()) {

            @case ('info') {
              <div class="detail-grid">
                <div class="detail-card">
                  <h3 class="card-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Información
                  </h3>
                  <div class="detail-rows">
                    <div class="detail-row">
                      <span class="dr-label">Slug</span>
                      <code class="dr-value">{{ w.slug }}</code>
                    </div>
                    <div class="detail-row">
                      <span class="dr-label">Versión</span>
                      <span class="dr-value">{{ w.version || '1.0.0' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="dr-label">Creado</span>
                      <span class="dr-value">{{ formatDate(w.createdAt) }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="dr-label">Actualizado</span>
                      <span class="dr-value">{{ formatDate(w.updatedAt) }}</span>
                    </div>
                    @if (w.tags?.length) {
                      <div class="detail-row">
                        <span class="dr-label">Etiquetas</span>
                        <div class="tag-list">
                          @for (t of w.tags; track t) {
                            <span class="tag">{{ t }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            @case ('system') {
              <div class="prompt-card">
                <h3 class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  System Prompt
                </h3>
                <pre class="prompt-block">{{ w.systemPrompt }}</pre>
              </div>
            }

            @case ('user') {
              <div class="prompt-card">
                <h3 class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  User Prompt
                </h3>
                @if (w.userPrompt) {
                  <pre class="prompt-block">{{ w.userPrompt }}</pre>
                } @else {
                  <div class="empty-prompt">Sin user prompt definido</div>
                }
              </div>
            }

            @case ('skills') {
              <div class="prompt-card">
                <h3 class="card-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                  Skills del agente
                </h3>
                @if (w.skills?.length) {
                  <div class="skill-list-detailed">
                    @for (s of w.skills; track s) {
                      <div class="skill-item-detailed">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16" style="color:var(--accent);flex-shrink:0;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                        <span>{{ s }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-prompt">Sin skills definidas</div>
                }
              </div>
            }

          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }
    .n8n-page { padding: 1.5rem 2rem; }
    .n8n-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 0; }
    .btn-back {
      display: inline-flex; align-items: center; gap: 0.35rem; flex-shrink: 0;
      background: var(--bg-tertiary); border: 1px solid var(--border); color: var(--text-secondary);
      border-radius: var(--radius-md); padding: 0.45rem 0.75rem; font-size: 0.78rem; font-weight: 500;
      cursor: pointer; text-decoration: none; transition: all 0.15s;
      &:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-elevated); }
      svg { width: 16px; height: 16px; }
    }
    .n8n-header-text { flex: 1; }
    .title-row { display: flex; align-items: center; gap: 0.6rem; }
    .agent-icon { font-size: 1.8rem; line-height: 1; }
    .n8n-title { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
    .n8n-url { font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 0.15rem; }
    .header-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
    .status-pill {
      font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
      padding: 0.15rem 0.55rem; border-radius: 20px; border: 1px solid; flex-shrink: 0;
      &.active { color: var(--green); border-color: rgba(34,215,94,0.25); background: rgba(34,215,94,0.08); }
      &.inactive { color: var(--text-muted); border-color: var(--border); background: var(--bg-tertiary); }
    }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: transparent; border: 1px solid var(--border); color: var(--text-secondary);
      border-radius: var(--radius-md); padding: 0.5rem 0.9rem; font-size: 0.78rem; font-weight: 500;
      cursor: pointer; text-decoration: none; transition: all 0.15s; font-family: inherit;
      &:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-tertiary); }
    }
    .btn-danger {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: transparent; border: 1px solid rgba(239,68,68,0.2); color: var(--red);
      border-radius: var(--radius-md); padding: 0.5rem 0.9rem; font-size: 0.78rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
      &:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.4); }
    }

    .tabs { display: flex; gap: 2px; background: var(--bg-tertiary); border-radius: var(--radius-lg); padding: 3px; margin: 1.5rem 0; overflow-x: auto; }
    .tab {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: transparent; border: none; color: var(--text-muted); cursor: pointer;
      padding: 0.5rem 0.9rem; font-size: 0.8rem; font-weight: 500; border-radius: var(--radius-md);
      transition: all 0.15s; white-space: nowrap; font-family: inherit;
      &:hover { color: var(--text-secondary); background: rgba(255,255,255,0.03); }
      &.active { color: var(--accent); background: var(--bg-elevated); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    }
    .tab-icon { width: 16px; height: 16px; flex-shrink: 0; }

    .tab-content { }

    .detail-grid { display: grid; gap: 1rem; }
    .detail-card {
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg);
      padding: 1.3rem;
    }
    .card-title {
      display: flex; align-items: center; gap: 0.4rem;
      margin: 0 0 1rem; font-size: 0.75rem; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .detail-rows { display: flex; flex-direction: column; gap: 0; }
    .detail-row {
      display: flex; align-items: center; padding: 0.55rem 0;
      border-bottom: 1px solid var(--border); gap: 1rem;
      &:last-child { border-bottom: none; }
    }
    .dr-label { font-size: 0.82rem; color: var(--text-muted); min-width: 100px; flex-shrink: 0; }
    .dr-value { font-size: 0.85rem; color: var(--text-primary); }
    .dr-value code { font-family: monospace; font-size: 0.82rem; color: var(--accent); }

    .tag-list { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .tag { background: rgba(0,210,255,0.08); border: 1px solid rgba(0,210,255,0.15); border-radius: var(--radius-sm); padding: 0.2rem 0.55rem; font-size: 0.72rem; color: var(--accent); }

    .prompt-card {
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg);
      padding: 1.3rem;
    }
    .prompt-block {
      background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 1rem; margin: 0; font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.8rem; line-height: 1.6; color: var(--text-primary);
      white-space: pre-wrap; word-break: break-word; max-height: 500px; overflow-y: auto;
    }
    .empty-prompt { color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0; text-align: center; }

    .skill-list-detailed { display: flex; flex-direction: column; gap: 0.35rem; }
    .skill-item-detailed {
      display: flex; align-items: center; gap: 0.55rem;
      background: var(--bg-primary); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 0.6rem 0.8rem;
      font-size: 0.85rem; color: var(--text-primary);
    }

    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 2rem; color: var(--text-muted); }
    .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: var(--red); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; }
  `],
})
export default class WorkerDetailComponent {
  private readonly workerService = inject(WorkerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly worker = signal<WorkerItem | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly activeTab = signal<DetailTab>('info');

  async ngOnInit() {
    const slug = this.route.snapshot.params['slug'];
    if (!slug) { this.error.set('Slug no especificado'); this.loading.set(false); return; }
    try {
      const w = await firstValueFrom(this.workerService.getBySlug(slug));
      this.worker.set(w);
    } catch {
      this.error.set('Error al cargar el trabajador');
    } finally {
      this.loading.set(false);
    }
  }

  protected async deleteWorker() {
    const w = this.worker();
    if (!w || !confirm(`¿Eliminar "${w.name}"?`)) return;
    try {
      await firstValueFrom(this.workerService.delete(w.slug));
      this.router.navigate(['/studio-workers']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  protected formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString();
  }
}
