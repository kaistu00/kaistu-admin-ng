import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WorkerService, WorkerPayload } from '../../services/worker.service';

type FormTab = 'info' | 'system' | 'user' | 'skills';

function toSlug(value: string): string {
  return value
    .toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="n8n-page">
      <header class="n8n-header">
        <a class="btn-back" routerLink="/studio-workers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Trabajadores
        </a>
        <div class="n8n-header-text">
          <h1 class="n8n-title">{{ editSlug() ? 'Editar' : 'Nuevo' }} agente</h1>
          <span class="n8n-url">{{ editSlug() ? 'Modifica la configuración del trabajador' : 'Define un nuevo trabajador de inteligencia artificial' }}</span>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>
      } @else {
        <form (submit)="onSubmit($event)">
          @if (error()) {
            <div class="error-banner">{{ error() }}</div>
          }

          <nav class="tabs">
            <button type="button" class="tab" [class.active]="activeTab() === 'info'" (click)="activeTab.set('info')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Info
            </button>
            <button type="button" class="tab" [class.active]="activeTab() === 'system'" (click)="activeTab.set('system')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              System Prompt
            </button>
            <button type="button" class="tab" [class.active]="activeTab() === 'user'" (click)="activeTab.set('user')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              User Prompt
            </button>
            <button type="button" class="tab" [class.active]="activeTab() === 'skills'" (click)="activeTab.set('skills')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              Skills
            </button>
          </nav>

          <div class="tab-content">
            @switch (activeTab()) {

              @case ('info') {
                <div class="form-section">
                  <div class="field-row name-row">
                    <div class="field emoji-field">
                      <label class="field-label">Icono</label>
                      <div class="emoji-selector">
                        <button type="button" class="emoji-btn" (click)="showEmojiPicker.set(!showEmojiPicker())">
                          <span class="selected-emoji">{{ icon() }}</span>
                        </button>
                        @if (showEmojiPicker()) {
                          <div class="emoji-picker" (click)="$event.stopPropagation()">
                            <button type="button" class="emoji-option" (click)="selectIcon('🤖')">🤖</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🧠')">🧠</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('⚡')">⚡</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🎯')">🎯</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🔍')">🔍</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('📚')">📚</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('💾')">💾</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🚀')">🚀</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('💡')">💡</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🎨')">🎨</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('👾')">👾</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🧙')">🧙</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🦊')">🦊</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🐉')">🐉</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🦉')">🦉</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🤝')">🤝</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🗣️')">🗣️</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('📝')">📝</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('📊')">📊</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🔧')">🔧</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('⚙️')">⚙️</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🌐')">🌐</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🎵')">🎵</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🎮')">🎮</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('📷')">📷</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🗺️')">🗺️</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🛡️')">🛡️</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('⚔️')">⚔️</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🔮')">🔮</button>
                            <button type="button" class="emoji-option" (click)="selectIcon('🧪')">🧪</button>
                          </div>
                        }
                      </div>
                    </div>
                    <div class="field" style="flex:1">
                      <label class="field-label" for="name">Nombre del agente</label>
                      <input id="name" class="field-input" [value]="name()" (input)="onInput('name', $event)" placeholder="Ej: Editor de guiones" required />
                      @if (name()) {
                        <span class="slug-preview">Slug: <code>{{ slug() }}</code></span>
                      }
                    </div>
                  </div>

                  <div class="field">
                    <label class="field-label" for="description">Descripción</label>
                    <textarea id="description" class="field-input field-textarea" rows="3" [value]="description()" (input)="onInput('description', $event)" placeholder="¿Qué hace este agente?"></textarea>
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label class="field-label">Estado</label>
                      <div class="chip-group">
                        <button type="button" class="chip" [class.active]="status() === 'active'" (click)="selectStatus('active')">Activo</button>
                        <button type="button" class="chip" [class.active]="status() === 'inactive'" (click)="selectStatus('inactive')">Inactivo</button>
                      </div>
                    </div>

                    <div class="field">
                      <label class="field-label" for="tags">Etiquetas</label>
                      <div class="tag-input">
                        <input id="tags" type="text" [value]="tagInput()" (input)="onInput('tagInput', $event)" (keydown.enter)="$event.preventDefault(); addTag()" placeholder="Añadir etiqueta" />
                        <button type="button" class="btn-tag-add" (click)="addTag()">+</button>
                      </div>
                      @if (tags().length) {
                        <div class="tag-list">
                          @for (t of tags(); track t) {
                            <span class="tag">{{ t }} <button type="button" class="tag-remove" (click)="removeTag(t)">&times;</button></span>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }

              @case ('system') {
                <div class="form-section prompt-section">
                  <div class="field">
                    <label class="field-label">System Prompt</label>
                    <p class="field-hint">Instrucciones base que definen la personalidad, conocimiento y límites del agente.</p>
                    <textarea class="prompt-editor" rows="16" [value]="systemPrompt()" (input)="onInput('systemPrompt', $event)" placeholder="Eres un asistente experto en..."></textarea>
                  </div>
                </div>
              }

              @case ('user') {
                <div class="form-section prompt-section">
                  <div class="field">
                    <label class="field-label">User Prompt</label>
                    <p class="field-hint">Mensaje por defecto que se enviará al agente al iniciar una conversación.</p>
                    <textarea class="prompt-editor" rows="12" [value]="userPrompt()" (input)="onInput('userPrompt', $event)" placeholder="Hola, necesito que..."></textarea>
                  </div>
                </div>
              }

              @case ('skills') {
                <div class="form-section">
                  <div class="field">
                    <label class="field-label">Skills del agente</label>
                    <p class="field-hint">Lista de skills o capabilities que este agente debe tener. Pueden ser referencias a archivos SKILL.md o descripciones.</p>
                    <div class="skill-input">
                      <input type="text" [value]="skillInput()" (input)="onInput('skillInput', $event)" (keydown.enter)="$event.preventDefault(); addSkill()" placeholder="Ej: skill-editor-guiones.md" />
                      <button type="button" class="btn-tag-add" (click)="addSkill()">Añadir skill</button>
                    </div>
                    @if (skills().length) {
                      <div class="skill-list">
                        @for (s of skills(); track s) {
                          <div class="skill-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                            <span>{{ s }}</span>
                            <button type="button" class="skill-remove" (click)="removeSkill(s)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="empty-skills">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="32" height="32" style="opacity:0.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                        <p>Aún no hay skills. Añade las primeras arriba.</p>
                      </div>
                    }
                  </div>
                </div>
              }

            }
          </div>

          <div class="form-footer">
            <a class="btn-ghost" routerLink="/studio-workers">Cancelar</a>
            <button type="submit" class="btn-primary" [disabled]="saving() || !name().trim()">
              @if (saving()) {
                <span class="spinner-sm"></span>
                Guardando...
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {{ editSlug() ? 'Actualizar agente' : 'Crear agente' }}
              }
            </button>
          </div>
        </form>
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
    .n8n-title { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
    .n8n-url { font-size: 0.78rem; color: var(--text-muted); }

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

    .tab-content { margin-bottom: 1.5rem; }

    .form-section {
      background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg);
      padding: 1.5rem;
    }
    .prompt-section { padding: 1.5rem; }

    .field { margin-bottom: 1rem; &:last-child { margin-bottom: 0; } }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    .field-label { display: block; font-size: 0.78rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .field-hint { font-size: 0.75rem; color: var(--text-muted); margin: -0.2rem 0 0.8rem; line-height: 1.4; }

    .field-input {
      width: 100%; background: var(--bg-primary); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 0.6rem 0.75rem; color: var(--text-primary);
      font-size: 0.85rem; font-family: inherit; outline: none; transition: border-color 0.2s;
      box-sizing: border-box;
      &:focus { border-color: var(--accent); }
    }
    .field-textarea { resize: vertical; line-height: 1.5; }

    .slug-preview { display: block; margin-top: 0.3rem; font-size: 0.72rem; color: var(--text-muted); code { color: var(--accent); } }

    .chip-group { display: flex; gap: 0.35rem; }
    .chip {
      background: var(--bg-primary); border: 1px solid var(--border); border-radius: 20px;
      padding: 0.3rem 0.8rem; font-size: 0.78rem; color: var(--text-muted); cursor: pointer;
      transition: all 0.15s; font-family: inherit;
      &:hover { border-color: var(--border-hover); color: var(--text-primary); }
      &.active { background: rgba(0,210,255,0.1); border-color: var(--accent); color: var(--accent); }
    }

    .tag-input { display: flex; gap: 0.3rem; input { flex: 1; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.45rem 0.6rem; color: var(--text-primary); font-size: 0.82rem; outline: none; &:focus { border-color: var(--accent); } } }
    .btn-tag-add { background: var(--accent-gradient); color: #fff; border: none; border-radius: var(--radius-sm); padding: 0.45rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .tag-list { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.5rem; }
    .tag { display: inline-flex; align-items: center; gap: 0.25rem; background: rgba(0,210,255,0.08); border: 1px solid rgba(0,210,255,0.15); border-radius: var(--radius-sm); padding: 0.2rem 0.55rem; font-size: 0.72rem; color: var(--accent); }
    .tag-remove { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.9rem; line-height: 1; padding: 0; &:hover { color: var(--red); } }

    .name-row { display: flex; gap: 1rem; align-items: flex-start; }
    .emoji-field { width: 80px; flex-shrink: 0; }
    .emoji-selector { position: relative; display: flex; flex-direction: column; }
    .emoji-btn {
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-md);
      width: 64px; height: 64px; cursor: pointer; transition: all 0.15s;
      &:hover { border-color: var(--accent); background: var(--accent-dim); }
    }
    .selected-emoji { font-size: 2rem; line-height: 1; }
    .emoji-picker {
      position: absolute; top: 72px; left: 0; z-index: 100;
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 0.5rem;
      display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px;
      width: 280px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    .emoji-option {
      background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm);
      padding: 0.3rem; font-size: 1rem; cursor: pointer; transition: all 0.1s;
      text-align: center; line-height: 1;
      &:hover { background: var(--accent-dim); border-color: var(--border-accent); transform: scale(1.2); }
    }

    .prompt-editor {
      width: 100%; background: var(--bg-primary); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 1rem; color: var(--text-primary);
      font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.82rem; line-height: 1.6;
      outline: none; resize: vertical; transition: border-color 0.2s;
      &:focus { border-color: var(--accent); }
    }

    .skill-input { display: flex; gap: 0.4rem; input { flex: 1; background: var(--bg-primary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.5rem 0.7rem; color: var(--text-primary); font-size: 0.82rem; outline: none; &:focus { border-color: var(--accent); } } }

    .skill-list { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.75rem; }
    .skill-item {
      display: flex; align-items: center; gap: 0.5rem;
      background: var(--bg-primary); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 0.5rem 0.7rem;
      font-size: 0.82rem; color: var(--text-primary);
      span { flex: 1; }
    }
    .skill-remove {
      background: none; border: none; color: var(--text-muted); cursor: pointer;
      padding: 2px; border-radius: 4px; display: flex; transition: all 0.15s;
      &:hover { color: var(--red); background: rgba(239,68,68,0.1); }
    }

    .empty-skills { text-align: center; padding: 2rem; color: var(--text-muted); p { margin: 0.5rem 0 0; font-size: 0.82rem; } }

    .form-footer {
      display: flex; justify-content: flex-end; align-items: center; gap: 0.6rem;
      padding: 1rem 0 2rem;
    }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.45rem;
      background: var(--accent-gradient); color: #fff; border: none; border-radius: var(--radius-md);
      padding: 0.6rem 1.3rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.2s, transform 0.15s; font-family: inherit;
      &:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 0.35rem;
      background: transparent; border: 1px solid var(--border); color: var(--text-secondary);
      border-radius: var(--radius-md); padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 500;
      cursor: pointer; text-decoration: none; transition: all 0.15s; font-family: inherit;
      &:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-tertiary); }
    }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 2rem; color: var(--text-muted); }
    .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    .error-banner { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: var(--red); padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.82rem; margin-bottom: 1rem; }
  `],
})
export default class WorkerFormComponent {
  private readonly workerService = inject(WorkerService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly editSlug = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly activeTab = signal<FormTab>('info');

  protected readonly name = signal('');
  protected readonly slug = computed(() => toSlug(this.name()));
  protected readonly description = signal('');
  protected readonly systemPrompt = signal('');
  protected readonly userPrompt = signal('');
  protected readonly skills = signal<string[]>([]);
  protected readonly skillInput = signal('');
  protected readonly status = signal('active');
  protected readonly tags = signal<string[]>([]);
  protected readonly tagInput = signal('');
  protected readonly icon = signal('🤖');
  protected readonly showEmojiPicker = signal(false);

  async ngOnInit() {
    const slug = this.route.snapshot.params['slug'];
    if (slug) {
      this.editSlug.set(slug);
      this.loading.set(true);
      try {
        const w = await firstValueFrom(this.workerService.getBySlug(slug));
        this.name.set(w.name);
        this.description.set(w.description || '');
        this.systemPrompt.set(w.systemPrompt);
        this.userPrompt.set(w.userPrompt || '');
        this.skills.set(w.skills || []);
        this.status.set(w.status || 'active');
        this.tags.set(w.tags || []);
        this.icon.set(w.icon || '🤖');
      } catch {
        this.error.set('Error al cargar el trabajador');
      } finally {
        this.loading.set(false);
      }
    }
  }

  protected onInput(field: string, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    if (field === 'name') this.name.set(value);
    else if (field === 'description') this.description.set(value);
    else if (field === 'systemPrompt') this.systemPrompt.set(value);
    else if (field === 'userPrompt') this.userPrompt.set(value);
    else if (field === 'tagInput') this.tagInput.set(value);
    else if (field === 'skillInput') this.skillInput.set(value);
  }

  protected selectStatus(value: string) { this.status.set(value); }

  protected addTag() {
    const tag = this.tagInput().trim();
    if (tag && !this.tags().includes(tag)) {
      this.tags.update(t => [...t, tag]);
    }
    this.tagInput.set('');
  }

  protected removeTag(tag: string) {
    this.tags.update(t => t.filter(x => x !== tag));
  }

  protected addSkill() {
    const skill = this.skillInput().trim();
    if (skill && !this.skills().includes(skill)) {
      this.skills.update(s => [...s, skill]);
    }
    this.skillInput.set('');
  }

  protected removeSkill(skill: string) {
    this.skills.update(s => s.filter(x => x !== skill));
  }

  protected selectIcon(emoji: string) {
    this.icon.set(emoji);
    this.showEmojiPicker.set(false);
  }

  protected async onSubmit(event: Event) {
    event.preventDefault();
    if (!this.name().trim()) return;

    this.saving.set(true);
    this.error.set('');

    try {
      const payload: WorkerPayload = {
        name: this.name().trim(),
        slug: this.slug(),
        icon: this.icon(),
        description: this.description().trim() || undefined,
        systemPrompt: this.systemPrompt(),
        userPrompt: this.userPrompt() || undefined,
        skills: this.skills().length ? this.skills() : undefined,
        status: this.status(),
        tags: this.tags().length ? this.tags() : undefined,
        version: '1.0.0',
      };

      const editSlug = this.editSlug();
      if (editSlug) {
        await firstValueFrom(this.workerService.update(editSlug, payload));
      } else {
        await firstValueFrom(this.workerService.create(payload));
      }

      this.router.navigate(['/studio-workers']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }
}
