import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WorldsService } from './worlds.service';
import { UniverseService, UniverseListItem } from '../../services/universe.service';

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface WorldTypeOption {
  label: string;
  description: string;
}

const worldTypeOptions: WorldTypeOption[] = [
  { label: 'Mundo paralelo', description: 'Realidad alternativa coexistiendo con la nuestra' },
  { label: 'Mundo virtual / VRMMO', description: 'Mundo digital inmersivo tipo MMO' },
  { label: 'Mundo RPG', description: 'Mundo con mecánicas de juego de rol' },
  { label: 'Mundo con sistema / HUD / stats', description: 'Interfaz visible con estadísticas y habilidades' },
  { label: 'Mundo de reencarnación', description: 'Mundo al que se llega tras reencarnar' },
  { label: 'Mundo tecnológico avanzado', description: 'Sociedad con tecnología muy superior a la actual' },
  { label: 'Mundo decadente', description: 'Civilización en declive moral o material' },
  { label: 'Mundo utópico', description: 'Sociedad perfecta e idealizada' },
  { label: 'Mundo distópico', description: 'Sociedad opresiva y totalitaria' },
  { label: 'Mundo alienígena', description: 'Planeta habitado por formas de vida extraterrestre' },
  { label: 'Mundo submarino', description: 'Civilizaciones y ecosistemas bajo el mar' },
  { label: 'Mundo celestial', description: 'Reinos divinos o angelicales en las alturas' },
  { label: 'Mundo demoníaco', description: 'Infiernos y reinos de demonios' },
  { label: 'Mundo escolar', description: 'Institutos y universidades como entorno central' },
  { label: 'Mundo laboral', description: 'Oficinas y entornos profesionales' },
  { label: 'Mundo idol', description: 'Industria del entretenimiento y cultura idol' },
  { label: 'Mundo gourmet', description: 'Gastronomía y cultura culinaria' },
  { label: 'Mundo militar', description: 'Entorno castrense y operaciones militares' },
  { label: 'Mundo deportivo', description: 'Competiciones y cultura deportiva' },
];

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="form-page">
      <header class="form-header">
        <a class="btn-back" routerLink="/worlds">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </a>
        <div class="form-header-text">
          @if (editSlug()) {
            <h1 class="form-title">{{ formData().name || 'Editar Mundo' }}</h1>
            <p class="form-sub">Modifica los detalles de este mundo</p>
          } @else {
            <h1 class="form-title">Nuevo Mundo</h1>
            <p class="form-sub">Define un nuevo mundo o escenario para tu universo</p>
          }
        </div>
      </header>

      <form class="form-body" (submit)="onSubmit($event)">
        @if (error()) {
          <div class="error-banner">{{ error() }}</div>
        }

        <section class="form-card">
          <h2 class="card-title">Información del mundo</h2>

          <div class="field">
            <label class="field-label" for="name">Nombre del mundo</label>
            <input
              id="name"
              class="field-input"
              type="text"
              placeholder="Ej: Neo Tokyo, Terre d'Espoir..."
              [value]="formData().name"
              (input)="onInput('name', $event)"
            />
          </div>

          <div class="field">
            <label class="field-label" for="slug">Slug <span class="label-note">(se genera automáticamente, no modificable tras guardar)</span></label>
            <input
              id="slug"
              class="field-input field-input--slug"
              type="text"
              [value]="slug()"
              [readonly]="true"
            />
          </div>

          <div class="field">
            <label class="field-label" for="universe">Universo</label>
            <select
              id="universe"
              class="field-input"
              [value]="formData().universeId"
              (change)="onUniverseChange($event)"
            >
              <option value="">Selecciona un universo...</option>
              @for (u of universes(); track u.id) {
                <option [value]="u.id">{{ u.name }}</option>
              }
            </select>
          </div>
        </section>

        <section class="form-card">
          <h2 class="card-title">Tipo de mundo <span class="card-subtitle">Define las características de este escenario</span></h2>
          <p class="card-desc">Selecciona los tipos que describen este mundo</p>
          <div class="chips-grid">
            @for (wt of worldTypes; track wt.label) {
              <div class="chip-wrapper">
                <button
                  type="button"
                  class="chip"
                  [class.selected]="formData().worldTypes.includes(wt.label)"
                  (click)="toggleWorldType(wt.label)"
                >
                  {{ wt.label }}
                </button>
                <div class="chip-info">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="8" cy="8" r="6"/>
                    <line x1="8" y1="6" x2="8" y2="6"/>
                    <line x1="8" y1="8" x2="8" y2="11"/>
                  </svg>
                  <span class="tooltip">{{ wt.description }}</span>
                </div>
              </div>
            }
          </div>
        </section>

        <div class="form-actions">
          <a class="btn-secondary" routerLink="/worlds">Cancelar</a>
          <button type="submit" class="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Guardar Mundo
          </button>
        </div>
      </form>

      @if (toastMessage()) {
        <div class="toast-overlay" (click)="toastMessage.set('')">
          <div class="toast">{{ toastMessage() }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .form-page { max-width: 720px; margin: 0 auto; padding: 2rem; }
    .form-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; }
    .btn-back { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); color: var(--text-secondary); text-decoration: none; flex-shrink: 0; transition: all 0.2s ease; margin-top: 0.15rem; }
    .btn-back:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-tertiary); }
    .btn-back svg { width: 18px; height: 18px; }
    .form-header-text { flex: 1; }
    .form-title { margin: 0 0 0.25rem; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .form-sub { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }
    .form-body { display: flex; flex-direction: column; gap: 1.25rem; }
    .error-banner { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #ef4444; font-size: 0.85rem; font-weight: 500; }
    .form-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; }
    .card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; letter-spacing: -0.01em; }
    .card-subtitle { font-size: 0.75rem; font-weight: 400; color: var(--text-muted); letter-spacing: normal; }
    .card-desc { margin: 0 0 1rem; font-size: 0.8rem; color: var(--text-muted); }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field + .field { margin-top: 1rem; }
    .field-label { font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); }
    .label-note { font-weight: 400; color: var(--text-muted); }
    .field-input { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; color: var(--text-primary); font-size: 0.875rem; font-family: inherit; outline: none; transition: border-color 0.2s ease; }
    .field-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }
    .field-input::placeholder { color: var(--text-muted); }
    .field-input--slug { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 0.8rem; color: var(--accent); opacity: 0.8; }
    select.field-input { cursor: pointer; appearance: auto; }
    .chips-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip-wrapper { display: flex; align-items: center; gap: 0; }
    .chip { padding: 0.4rem 0.85rem; border-radius: var(--radius-xl) 0 0 var(--radius-xl); border: 1px solid var(--border); border-right: none; background: transparent; color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
    .chip:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .chip.selected { background: var(--accent-dim); border-color: var(--border-accent); color: var(--accent); }
    .chip-info { display: flex; align-items: center; justify-content: center; width: 24px; height: 28px; padding: 0 6px; border: 1px solid var(--border); border-radius: 0 var(--radius-xl) var(--radius-xl) 0; background: transparent; color: var(--text-muted); cursor: help; transition: all 0.2s ease; position: relative; flex-shrink: 0; }
    .chip.selected + .chip-info { border-color: var(--border-accent); background: var(--accent-dim); color: var(--accent); }
    .chip-info:hover { color: var(--text-primary); border-color: var(--border-hover); }
    .chip-info svg { width: 14px; height: 14px; }
    .tooltip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: var(--bg-elevated); color: var(--text-primary); font-size: 0.7rem; font-weight: 400; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border); white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.4); line-height: 1.3; max-width: 260px; white-space: normal; }
    .chip-info:hover .tooltip { opacity: 1; }
    .form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
    .btn-secondary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: transparent; border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; font-family: inherit; cursor: pointer; text-decoration: none; transition: all 0.2s ease; }
    .btn-secondary:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: var(--accent-gradient); border: none; border-radius: var(--radius-md); color: #fff; font-size: 0.85rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
    .btn-primary:hover { box-shadow: 0 0 20px var(--accent-glow); transform: translateY(-1px); }
    .btn-icon { width: 16px; height: 16px; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .toast-overlay { position: fixed; inset: 0; display: flex; align-items: flex-start; justify-content: center; z-index: 9999; pointer-events: none; padding-top: 5rem; }
    .toast { background: rgba(34,197,94,0.95); color: #fff; padding: 0.75rem 1.5rem; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 600; box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: toastIn 0.3s ease; pointer-events: auto; cursor: pointer; }
    @keyframes toastIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]
})
export default class WorldFormComponent {
  private readonly worldsService = inject(WorldsService);
  private readonly universeService = inject(UniverseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly worldTypes = worldTypeOptions;
  protected readonly editSlug = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly toastMessage = signal('');
  protected readonly universes = signal<UniverseListItem[]>([]);

  protected readonly formData = signal({
    name: '',
    universeId: '',
    worldTypes: [] as string[],
  });

  protected readonly slug = computed(() => toSlug(this.formData().name));

  async ngOnInit() {
    try {
      const list = await firstValueFrom(this.universeService.getAll());
      this.universes.set(list);
    } catch { /* ignore */ }

    const slugParam = this.route.snapshot.params['slug'];
    if (slugParam) {
      this.editSlug.set(slugParam);
      try {
        const world = await firstValueFrom(this.worldsService.getBySlug(slugParam));
        if (world) {
          this.formData.set({
            name: world.name,
            universeId: world.universeId,
            worldTypes: world.worldTypes ?? [],
          });
        }
      } catch {
        this.error.set('Error al cargar el mundo');
      }
    }
  }

  protected onInput(field: 'name', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.formData.update((d) => ({ ...d, [field]: value }));
  }

  protected onUniverseChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.formData.update((d) => ({ ...d, universeId: value }));
  }

  protected toggleWorldType(label: string): void {
    this.formData.update((d) => {
      const worldTypes = d.worldTypes.includes(label)
        ? d.worldTypes.filter((t) => t !== label)
        : [...d.worldTypes, label];
      return { ...d, worldTypes };
    });
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const data = this.formData();
    if (!data.name.trim()) return;

    this.saving.set(true);
    this.error.set('');

    try {
      const payload = {
        slug: this.slug(),
        name: data.name.trim(),
        universeId: data.universeId,
        worldTypes: data.worldTypes,
      };

      const editSlug = this.editSlug();
      if (editSlug) {
        await firstValueFrom(this.worldsService.update(editSlug, payload));
      } else {
        await firstValueFrom(this.worldsService.create(payload));
      }

      this.toastMessage.set(editSlug ? 'Mundo actualizado correctamente' : 'Mundo creado correctamente');
      setTimeout(() => this.router.navigate(['/worlds']), 1200);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }
}
