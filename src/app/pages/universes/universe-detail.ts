import { Component, signal, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UniverseService, UniverseListItem } from '../../services/universe.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>
      } @else if (error()) {
        <div class="error-state">
          <h2>Universo no encontrado</h2>
          <p>{{ error() }}</p>
          <a class="btn-primary" routerLink="/universes">Volver</a>
        </div>
      } @else {
        <header class="detail-header">
          <a class="back-link" routerLink="/universes">← Volver</a>
          <div class="header-actions">
            <button class="btn-secondary" (click)="edit()">Editar</button>
            <button class="btn-danger" (click)="deleteUniverse()">Eliminar</button>
          </div>
        </header>

        <div class="detail-content">
          <div class="detail-title-section">
            <h1>{{ universe()?.name }}</h1>
            <span class="status-badge" [class]="statusClass(universe()?.status ?? '')">
              {{ (universe()?.status ?? '').replace('_', ' ') }}
            </span>
          </div>

          <div class="detail-meta">
            <div class="meta-chip">Demografía: {{ universe()?.idea_form?.demographic ?? '—' }}</div>
            <div class="meta-chip">Rating: {{ universe()?.idea_form?.rating ?? '—' }}</div>
          </div>

          @if (universe()?.idea_form?.genres?.length) {
            <section class="detail-section">
              <h3>Géneros</h3>
              <div class="chip-list">@for (g of universe()?.idea_form?.genres; track g) {<span class="chip">{{ g }}</span>}</div>
            </section>
          }

          @if (universe()?.idea_form?.subgenres?.length) {
            <section class="detail-section">
              <h3>Subgéneros</h3>
              <div class="chip-list">@for (s of universe()?.idea_form?.subgenres; track s) {<span class="chip">{{ s }}</span>}</div>
            </section>
          }

          @if (universe()?.idea_form?.themes?.length) {
            <section class="detail-section">
              <h3>Temas / Tropos</h3>
              <div class="chip-list">@for (t of universe()?.idea_form?.themes; track t) {<span class="chip">{{ t }}</span>}</div>
            </section>
          }

          @if (universe()?.idea_form?.aesthetics?.length) {
            <section class="detail-section">
              <h3>Estéticas</h3>
              <div class="chip-list">@for (a of universe()?.idea_form?.aesthetics; track a) {<span class="chip">{{ a }}</span>}</div>
            </section>
          }

          @if (universe()?.idea_form?.contentWarnings?.length) {
            <section class="detail-section">
              <h3>Advertencias de contenido</h3>
              <div class="chip-list">@for (w of universe()?.idea_form?.contentWarnings; track w) {<span class="chip warning">{{ w }}</span>}</div>
            </section>
          }

          @if (universe()?.idea_form?.prompt) {
            <section class="detail-section">
              <h3>Prompt</h3>
              <p class="detail-text">{{ universe()?.idea_form?.prompt }}</p>
            </section>
          }

          @if (universe()?.idea_form?.decisionIdeas) {
            <section class="detail-section">
              <h3>Sistema de Decisiones</h3>
              <p class="detail-text">{{ universe()?.idea_form?.decisionIdeas }}</p>
            </section>
          }

          @if (universe()?.idea_form?.influenceIdeas) {
            <section class="detail-section">
              <h3>Influencias Externas</h3>
              <p class="detail-text">{{ universe()?.idea_form?.influenceIdeas }}</p>
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 900px; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--text-secondary); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-state { text-align: center; padding: 4rem 2rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: var(--accent-gradient); border: none; border-radius: var(--radius-md); color: #fff; font-size: 0.85rem; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn-secondary { padding: 0.5rem 1rem; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.85rem; font-weight: 500; cursor: pointer; }
    .btn-danger { padding: 0.5rem 1rem; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); color: #ef4444; font-size: 0.85rem; font-weight: 500; cursor: pointer; }
    .detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
    .back-link { color: var(--text-secondary); text-decoration: none; font-size: 0.875rem; }
    .back-link:hover { color: var(--accent); }
    .header-actions { display: flex; gap: 0.5rem; }
    .detail-title-section { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .detail-title-section h1 { margin: 0; font-size: 1.75rem; font-weight: 700; }
    .status-badge { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); }
    .status-badge.draft { background: rgba(234,179,8,0.15); color: #eab308; }
    .status-badge.progress { background: rgba(0,210,255,0.15); color: var(--accent); }
    .status-badge.done { background: rgba(34,197,94,0.15); color: #22c55e; }
    .detail-meta { display: flex; gap: 0.75rem; margin-bottom: 2rem; }
    .meta-chip { font-size: 0.8rem; padding: 0.3rem 0.6rem; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius-sm); }
    .detail-section { margin-bottom: 1.5rem; }
    .detail-section h3 { margin: 0 0 0.5rem; font-size: 0.95rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
    .chip-list { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .chip { font-size: 0.78rem; padding: 0.25rem 0.55rem; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius-sm); }
    .chip.warning { background: rgba(234,179,8,0.12); color: #eab308; }
    .detail-text { white-space: pre-wrap; line-height: 1.6; color: var(--text-primary); font-size: 0.9rem; }
  `]
})
export default class UniverseDetailComponent {
  private readonly universeService = inject(UniverseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly universe = signal<UniverseListItem | null>(null);

  async ngOnInit() {
    const slug = this.route.snapshot.params['slug'];
    try {
      const u = await firstValueFrom(this.universeService.getBySlug(slug));
      this.universe.set(u);
    } catch {
      this.error.set('No se pudo cargar el universo');
    } finally {
      this.loading.set(false);
    }
  }

  protected edit() {
    const u = this.universe();
    if (u) this.router.navigate(['/universes', u.slug, 'edit']);
  }

  protected async deleteUniverse() {
    const u = this.universe();
    if (!u || !confirm('¿Mover este universo a la papelera?')) return;
    try {
      await firstValueFrom(this.universeService.delete(u.slug));
      this.router.navigate(['/universes']);
    } catch {
      this.error.set('Error al eliminar');
    }
  }

  protected statusClass(status: string): string {
    const map: Record<string, string> = { idea_draft: 'draft', in_progress: 'progress', completed: 'done' };
    return map[status] ?? 'draft';
  }
}
