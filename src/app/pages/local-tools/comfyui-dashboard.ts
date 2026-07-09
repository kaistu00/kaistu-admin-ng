import { Component, signal, computed, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { getToolById, buildUrl, type ToolConnection } from './tool-store';

interface SystemStats {
  system: { os: string; python_version: string };
  devices: { name: string; vram_total: number; vram_free: number; torch_version: string; cuda_version: string }[];
}
interface QueueItem { id: string; prompt: any; }
interface HistoryItem { prompt_id: string; workflow: any; outputs: Record<string, { images: { filename: string; subfolder: string; type: string }[] }>; timestamp: number; }
interface ModelFile { name: string; }
interface WorkflowEntry { name: string; user: string; path?: string; }
interface WsEvent { type: string; data: string; time: number; }

type TabId = 'status' | 'queue' | 'history' | 'modelos' | 'workflows' | 'websocket';

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe],
  host: { '(window:beforeunload)': 'disconnectWs()' },
  template: `
    @if (toastMessage()) {
      <div class="toast-overlay" (click)="toastMessage.set('')">
        <div class="toast">{{ toastMessage() }}</div>
      </div>
    }
    <div class="n8n-page">
      <header class="n8n-header">
        <a class="btn-back" routerLink="/tools">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </a>
        <div class="n8n-header-text">
          <h1 class="n8n-title">{{ tool()?.name ?? 'ComfyUI Dashboard' }}</h1>
          <span class="n8n-url">{{ tool() ? buildUrl(tool()!) : '' }}</span>
        </div>
      </header>

      <nav class="tabs">
        <button class="tab" [class.active]="activeTab() === 'status'" (click)="activeTab.set('status'); loadSystemStats()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Sistema
        </button>
        <button class="tab" [class.active]="activeTab() === 'queue'" (click)="activeTab.set('queue'); loadQueue()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          Cola
        </button>
        <button class="tab" [class.active]="activeTab() === 'history'" (click)="activeTab.set('history'); loadHistory()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Historial
        </button>
        <button class="tab" [class.active]="activeTab() === 'modelos'" (click)="activeTab.set('modelos'); loadModelFolders()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Modelos
        </button>
        <button class="tab" [class.active]="activeTab() === 'workflows'" (click)="activeTab.set('workflows'); loadWorkflowHistory()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Workflows
        </button>
        <button class="tab" [class.active]="activeTab() === 'websocket'" (click)="activeTab.set('websocket'); connectWs()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"/></svg>
          WS
        </button>
      </nav>

      <div class="tab-content">
        @if (loading()) { <div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div> }
        @else if (error()) { <div class="error-banner">{{ error() }}</div> }
        @else {
          @switch (activeTab()) {

            @case ('status') {
              <div class="section-header"><h2>Estado del servidor</h2></div>
              @if (systemStats(); as s) {
                <div class="stats-grid">
                  <div class="stat-card">
                    <span class="stat-label">Sistema</span>
                    <span class="stat-value">{{ s.system?.os ?? '—' }}</span>
                  </div>
                  <div class="stat-card">
                    <span class="stat-label">Python</span>
                    <span class="stat-value">{{ s.system?.python_version ?? '—' }}</span>
                  </div>
                  @for (d of s.devices; track d.name) {
                    <div class="stat-card">
                      <span class="stat-label">GPU — {{ d.name }}</span>
                      <span class="stat-value">{{ formatBytes(d.vram_total) }} total</span>
                      <span class="stat-value accent">{{ formatBytes(d.vram_free) }} libre</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">VRAM usada</span>
                      <span class="stat-value">{{ vramUsagePercent(d) }}%</span>
                    </div>
                  }
                </div>
                @if (s.devices?.length === 0) {
                  <div class="empty-state">Sin GPU detectada (modo CPU)</div>
                }
              } @else {
                <div class="empty-state"><p>No se pudo obtener información del sistema</p></div>
              }
              <div class="actions-row" style="margin-top:1rem">
                <button class="btn-action btn-warn" (click)="interrupt()" [disabled]="toggling()">Interrumpir</button>
                <button class="btn-action btn-ok" (click)="freeMemory()" [disabled]="toggling()">Liberar VRAM</button>
              </div>
            }

            @case ('queue') {
              <div class="section-header">
                <h2>Cola de ejecución</h2>
                <button class="btn-action btn-warn" (click)="clearQueue()" [disabled]="toggling()">Limpiar cola</button>
              </div>
              <div class="queue-lanes">
                <div class="queue-lane">
                  <h3 class="lane-title">Ejecutándose</h3>
                  @if (queueRunning().length === 0) { <div class="empty-state-sm">Nada en ejecución</div> }
                  @for (item of queueRunning(); track $index) {
                    <div class="queue-item running">
                      <span class="queue-item-id">{{ item.id?.slice(0,12) }}…</span>
                      <span class="status-badge-sm exec-running">Ejecutando</span>
                    </div>
                  }
                </div>
                <div class="queue-lane">
                  <h3 class="lane-title">En espera ({{ queuePending().length }})</h3>
                  @if (queuePending().length === 0) { <div class="empty-state-sm">Cola vacía</div> }
                  @for (item of queuePending(); track $index) {
                    <div class="queue-item pending">
                      <span class="queue-item-id">{{ item?.id?.slice(0,12) ?? '—' }}…</span>
                      <span class="status-badge-sm exec-waiting">Esperando</span>
                    </div>
                  }
                </div>
              </div>
            }

            @case ('history') {
              <div class="section-header"><h2>Historial ({{ historyKeys().length }})</h2></div>
              @if (historyKeys().length === 0) { <div class="empty-state">No hay generaciones</div> }
              @else {
                <div class="history-grid">
                  @for (key of historyKeys(); track key) {
                    @let item = historyMap()[key];
                    <div class="history-card">
                      <div class="history-thumb-wrap">
                        @if (firstImage(item)) {
                          <img class="history-thumb" [src]="imageUrl(firstImage(item)!)" alt="preview"/>
                        } @else {
                          <div class="history-no-thumb">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          </div>
                        }
                      </div>
                      <div class="history-info">
                        <span class="history-id">{{ key.slice(0,12) }}…</span>
                        <span class="history-date">{{ item.timestamp ? formatDate(item.timestamp) : '' }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @case ('modelos') {
              <div class="section-header"><h2>Modelos instalados</h2></div>
              @if (modelFolders().length === 0 && !modelsLoading()) { <div class="empty-state">No se pudieron cargar los modelos</div> }
              @for (folder of modelFolders(); track folder) {
                <details class="model-group" [open]="modelOpen()[folder]">
                  <summary class="model-group-title" (click)="toggleModelFolder(folder)">
                    <span>{{ folder }}</span>
                    <span class="model-count">{{ modelFiles()[folder]?.length ?? '...' }}</span>
                  </summary>
                  @if (modelFiles()[folder]; as files) {
                    <div class="model-list">
                      @for (f of files; track f.name) {
                        <div class="model-file">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="file-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span class="model-file-name">{{ f.name }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="loading-inline"><div class="spinner-sm"></div> Cargando...</div>
                  }
                </details>
              }
            }

            @case ('workflows') {
              <div class="section-header">
                <h2>Workflows guardados</h2>
                <button class="btn-action btn-ok" (click)="loadAllWorkflows()" [disabled]="savedWorkflowsLoading()">Recargar</button>
              </div>
              @if (savedWorkflowsLoading()) {
                <div class="loading-inline"><div class="spinner-sm"></div> Cargando...</div>
              } @else if (savedWorkflows().length === 0) {
                <div class="empty-state-sm">No se encontraron workflows guardados</div>
              } @else {
                @let grouped = workflowsByInstall();
                @for (inst of installations(); track inst.name) {
                  @let wfs = grouped[inst.name];
                  @if (wfs?.length) {
                    <details class="model-group" open>
                      <summary class="model-group-title">
                        <span>{{ inst.name }}</span>
                        <span class="model-count">{{ wfs.length }} workflows</span>
                      </summary>
                      <div class="model-list wf-list">
                        @for (wf of wfs; track wf.name) {
                          <div class="wf-list-item" [class.active]="loadedWorkflowEntry()?.name === wf.name && loadedWorkflowEntry()?.user === wf.user">
                            <div class="wf-list-info">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="file-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              <span class="model-file-name">{{ wf.name.replace('.json','') }}</span>
                            </div>
                            <div class="wf-list-actions">
                              <button class="btn-xs btn-ghost" (click)="loadSavedWorkflowFile(wf)" title="Ver JSON del workflow">View</button>
                              <button class="btn-xs btn-ghost" (click)="showWorkflowPath(wf)" title="Copiar ruta completa">Ruta</button>
                            </div>
                          </div>
                          @if (routeInfo()?.name === wf.name && routeInfo()?.user === wf.user) {
                            <div class="route-path">{{ routeInfo()?.path }}</div>
                          }
                        }
                      </div>
                    </details>
                  }
                }
              }
              <details class="wf-manual-section">
                <summary class="model-group-title">Ruta personalizada</summary>
                <div class="wf-path-input-row" style="padding:0.5rem">
                  <input class="wf-path-input" [value]="installPath()" (input)="installPath.set($any($event.target).value); saveInstallPath()" placeholder="C:\\...\\ComfyUI (ruta de instalación)" spellcheck="false"/>
                  <button class="btn-action btn-ok" (click)="loadWorkflowsFromFs(installPath())" [disabled]="!installPath() || savedWorkflowsLoading()">Listar</button>
                </div>
                <div class="wf-path-input-row" style="padding:0 0.5rem 0.5rem">
                  <input class="wf-path-input" [value]="manualWfPath()" (input)="manualWfPath.set($any($event.target).value)" placeholder="user/default/workflows (ruta relativa)" spellcheck="false"/>
                  <button class="btn-action btn-ok" (click)="loadSavedWorkflows(manualWfPath())" [disabled]="!manualWfPath() || savedWorkflowsLoading()">Probar</button>
                </div>
              </details>
              @if (loadedWorkflowError()) {
                <div class="error-banner">{{ loadedWorkflowError() }}</div>
              }
              @if (loadedWorkflowContent(); as wfContent) {
                <div class="loaded-wf-box">
                  <div class="section-header">
                    <h3>{{ loadedWorkflowEntry()?.name }}</h3>
                    <button class="btn-action btn-ok" (click)="rerunLoadedWorkflow()" [disabled]="toggling()">Re-ejecutar</button>
                  </div>
                  <pre class="wf-json">{{ formatJson(wfContent) }}</pre>
                </div>
              }
              @if (lastRunResult()) {
                <div class="result-box">
                  <strong>Última ejecución:</strong>
                  <code>{{ lastRunResult() }}</code>
                </div>
              }
              <div class="section-header" style="margin-top:1.5rem">
                <h2>Workflows del historial ({{ workflowHistory().length }})</h2>
              </div>
              @if (workflowHistory().length === 0) {
                <div class="empty-state">
                  <p>No hay workflows en el historial de ejecuciones.</p>
                  <p class="list-item-meta">Los workflows aparecen aquí después de ejecutarlos en ComfyUI.</p>
                </div>
              } @else {
                <div class="list">
                  @for (wf of workflowHistory(); track wf.prompt_id) {
                    <div class="list-item">
                      <div class="list-item-info">
                        <span class="list-item-name">Workflow {{ $index + 1 }}</span>
                        <span class="list-item-meta">{{ formatSize(wf.workflow) }} nodos · {{ wf.prompt_id?.slice(0,12) }}… · {{ wf.timestamp ? formatDate(wf.timestamp) : '' }}</span>
                        <div class="wf-preview">
                          <code class="wf-snippet">{{ wf.prompt }}</code>
                        </div>
                      </div>
                      <button class="btn-action btn-ok" (click)="rerunWorkflow(wf)" [disabled]="toggling()" title="Re-ejecutar este workflow">Re-ejecutar</button>
                    </div>
                  }
                </div>
              }
            }

            @case ('websocket') {
              <div class="section-header">
                <h2>Monitor en tiempo real</h2>
                <div class="ws-controls">
                  @if (!wsConnected()) {
                    <button class="btn-action btn-ok" (click)="connectWs()" [disabled]="wsConnecting()">Conectar WS</button>
                  } @else {
                    <button class="btn-action btn-warn" (click)="disconnectWs()">Desconectar</button>
                    <button class="btn-action" (click)="clearWsLog()">Limpiar</button>
                  }
                </div>
              </div>
              @if (wsError()) {
                <div class="error-banner">{{ wsError() }}</div>
              }
              <div class="ws-url-info">
                Conectando a: <code>{{ wsUrl() || '—' }}</code>
              </div>
              <div class="ws-log">
                @if (wsEvents().length === 0) {
                  <div class="empty-state-sm">Conéctate para ver eventos en tiempo real</div>
                }
                @for (evt of wsEvents(); track $index) {
                  <div class="ws-entry" [class]="'ws-' + evt.type">
                    <span class="ws-time">{{ evt.time | date:'HH:mm:ss' }}</span>
                    <span class="ws-type">{{ evt.type }}</span>
                    <span class="ws-msg">{{ evt.data }}</span>
                  </div>
                }
              </div>
              @if (wsConnected()) {
                <div class="ws-indicator connected">● Conectado</div>
              } @else if (wsConnecting()) {
                <div class="ws-indicator connecting">⟳ Conectando...</div>
              } @else {
                <div class="ws-indicator disconnected">○ Desconectado</div>
              }
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .n8n-page { max-width: 960px; margin: 0 auto; padding: 2rem; }
    .n8n-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
    .btn-back { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); color: var(--text-secondary); text-decoration: none; flex-shrink: 0; transition: all 0.2s ease; }
    .btn-back:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-tertiary); }
    .btn-back svg { width: 18px; height: 18px; }
    .n8n-header-text { flex: 1; }
    .n8n-title { margin: 0; font-size: 1.35rem; font-weight: 700; }
    .n8n-url { font-size: 0.8rem; color: var(--text-muted); font-family: monospace; display: block; margin-top: 0.2rem; }
    .tabs { display: flex; gap: 0.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
    .tab { display: flex; align-items: center; gap: 0.35rem; padding: 0.55rem 0.85rem; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); font-size: 0.8rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 0.2s ease; margin-bottom: -1px; white-space: nowrap; }
    .tab:hover { color: var(--text-primary); }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab-icon { width: 16px; height: 16px; }
    .tab-content { min-height: 300px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
    .section-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: var(--text-secondary); }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; }
    .loading-inline { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; color: var(--text-muted); font-size: 0.8rem; }
    .error-banner { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #ef4444; font-size: 0.85rem; margin-bottom: 1rem; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-size: 0.9rem; }
    .empty-state-sm { padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; background: var(--bg-tertiary); border-radius: var(--radius-md); }
    .accent { color: var(--accent); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
    .stat-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; flex-direction: column; gap: 0.15rem; }
    .stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .stat-value { font-size: 0.85rem; font-weight: 600; }
    .queue-lanes { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .queue-lane { display: flex; flex-direction: column; gap: 0.5rem; }
    .lane-title { margin: 0; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .queue-item { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .queue-item.running { border-left: 3px solid var(--accent); }
    .queue-item.pending { border-left: 3px solid #eab308; }
    .queue-item-id { font-family: monospace; font-size: 0.78rem; color: var(--text-secondary); }
    .status-badge-sm { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: var(--radius-sm); text-transform: uppercase; }
    .status-badge-sm.exec-running { background: rgba(0,210,255,0.15); color: var(--accent); }
    .status-badge-sm.exec-waiting { background: rgba(234,179,8,0.15); color: #eab308; }
    .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
    .history-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .history-card:hover { border-color: var(--border-hover); }
    .history-thumb-wrap { width: 100%; aspect-ratio: 1; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .history-thumb { width: 100%; height: 100%; object-fit: cover; }
    .history-no-thumb { width: 32px; height: 32px; color: var(--text-muted); opacity: 0.4; }
    .history-no-thumb svg { width: 100%; height: 100%; }
    .history-info { display: flex; flex-direction: column; gap: 0.1rem; padding: 0.5rem 0.65rem; }
    .history-id { font-family: monospace; font-size: 0.7rem; color: var(--text-muted); }
    .history-date { font-size: 0.7rem; color: var(--text-muted); }
    .list { display: flex; flex-direction: column; gap: 0.5rem; }
    .list-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .list-item-info { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; min-width: 0; }
    .list-item-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
    .list-item-meta { font-size: 0.75rem; color: var(--text-muted); }
    .actions-row { display: flex; gap: 0.5rem; }
    .btn-action { padding: 0.45rem 0.9rem; border-radius: var(--radius-sm); font-size: 0.78rem; font-weight: 500; font-family: inherit; cursor: pointer; border: none; }
    .btn-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
    .btn-ok:hover { background: rgba(34,197,94,0.25); }
    .btn-warn { background: rgba(234,179,8,0.15); color: #eab308; }
    .btn-warn:hover { background: rgba(234,179,8,0.25); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .model-group { border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.5rem; overflow: hidden; }
    .model-group-title { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.85rem; background: var(--bg-tertiary); font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .model-group-title:hover { background: var(--bg-elevated); }
    .model-count { font-size: 0.72rem; color: var(--text-muted); }
    .model-list { padding: 0.25rem 0.5rem; }
    .model-file { display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.4rem; font-size: 0.78rem; color: var(--text-secondary); }
    .file-icon { width: 14px; height: 14px; flex-shrink: 0; color: var(--text-muted); }
    .model-file-name { word-break: break-all; }
    .wf-list { display: flex; flex-direction: column; gap: 2px; }
    .wf-list-item { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; padding: 0.35rem 0.5rem; font-size: 0.78rem; color: var(--text-secondary); border-radius: var(--radius-sm); transition: background 0.15s; }
    .wf-list-item:hover { background: var(--bg-elevated); }
    .wf-list-item.active { background: rgba(0,210,255,0.08); }
    .wf-list-info { display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0; }
    .wf-list-actions { display: flex; gap: 0.2rem; flex-shrink: 0; }
    .btn-xs { font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 3px; border: 1px solid var(--border); background: transparent; color: var(--text-muted); cursor: pointer; font-family: inherit; transition: all 0.15s; }
    .btn-xs:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-tertiary); }
    .route-path { font-size: 0.65rem; color: var(--accent); padding: 0.2rem 0.5rem 0.4rem; word-break: break-all; font-family: monospace; }
    .toast-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: flex-start; justify-content: center; padding-top: 2rem; pointer-events: none; }
    .toast { background: rgba(0,210,255,0.15); border: 1px solid rgba(0,210,255,0.3); color: var(--accent); padding: 0.6rem 1.2rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 500; pointer-events: auto; animation: toastFadeIn 0.2s ease; }
    @keyframes toastFadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .saved-wf-list { display: flex; flex-direction: column; gap: 2px; margin-bottom: 1rem; }
    .wf-path-input-row { display: flex; gap: 0.35rem; margin-bottom: 0.6rem; }
    .wf-path-input { flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.4rem 0.6rem; color: var(--text-primary); font-family: monospace; font-size: 0.78rem; outline: none; }
    .wf-path-input:focus { border-color: var(--accent); }
    .wf-manual-section { border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.5rem; overflow: hidden; }
    .wf-manual-section > .model-group-title { font-size: 0.75rem; color: var(--text-muted); }
    .wf-user-badge { font-size: 0.6rem; background: var(--bg-elevated); color: var(--text-muted); padding: 0.1rem 0.35rem; border-radius: 3px; margin-left: auto; }
    .discovered-path { font-size: 0.7rem; color: var(--text-muted); padding: 0.25rem 0.5rem; }
    .discovered-path code { background: var(--bg-elevated); padding: 0.1rem 0.3rem; border-radius: 3px; }
    .loaded-wf-box { margin-bottom: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .loaded-wf-box .section-header { padding: 0.5rem 0.85rem; background: var(--bg-tertiary); margin-bottom: 0; }
    .loaded-wf-box .section-header h3 { font-size: 0.85rem; }
    .wf-json { font-size: 0.65rem; max-height: 300px; overflow: auto; margin: 0; padding: 0.75rem; background: var(--bg-elevated); color: var(--text-secondary); white-space: pre-wrap; word-break: break-all; }
    .result-box { margin-top: 1rem; padding: 0.75rem 1rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 0.78rem; }
    .result-box code { display: block; margin-top: 0.3rem; word-break: break-all; color: var(--accent); }
    .wf-preview { margin-top: 0.2rem; }
    .wf-snippet { font-size: 0.65rem; color: var(--text-muted); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 500px; }
    .ws-url-info { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem; }
    .ws-url-info code { background: var(--bg-elevated); padding: 0.15rem 0.35rem; border-radius: 3px; font-size: 0.72rem; }
    .ws-log { max-height: 400px; overflow-y: auto; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.5rem; font-family: monospace; font-size: 0.72rem; margin-bottom: 0.5rem; }
    .ws-entry { display: flex; gap: 0.5rem; padding: 0.2rem 0.3rem; border-bottom: 1px solid var(--border); }
    .ws-time { color: var(--text-muted); flex-shrink: 0; }
    .ws-type { font-weight: 600; flex-shrink: 0; }
    .ws-entry.ws-connected .ws-type { color: var(--accent); }
    .ws-entry.ws-execution_start .ws-type { color: var(--accent); }
    .ws-entry.ws-executing .ws-type { color: #eab308; }
    .ws-entry.ws-progress .ws-type { color: #22c55e; }
    .ws-entry.ws-executed .ws-type { color: #22c55e; }
    .ws-entry.ws-execution_error .ws-type { color: #ef4444; }
    .ws-entry.ws-disconnected .ws-type { color: var(--text-muted); }
    .ws-entry.ws-error .ws-type { color: #ef4444; }
    .ws-msg { color: var(--text-secondary); word-break: break-all; }
    .ws-controls { display: flex; gap: 0.35rem; }
    .ws-indicator { font-size: 0.75rem; font-weight: 500; padding: 0.3rem 0.6rem; border-radius: var(--radius-sm); }
    .ws-indicator.connected { color: #22c55e; }
    .ws-indicator.connecting { color: #eab308; }
    .ws-indicator.disconnected { color: var(--text-muted); }
  `],
})
export default class ComfyuiDashboardComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private ws: WebSocket | null = null;
  private readonly wsClientId = (typeof crypto !== 'undefined' && crypto.randomUUID?.()) || Math.random().toString(36).slice(2) + Date.now().toString(36);

  protected readonly tool = signal<ToolConnection | null>(null);
  protected readonly activeTab = signal<TabId>('status');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly toggling = signal(false);

  protected readonly systemStats = signal<SystemStats | null>(null);
  protected readonly queueRunning = signal<QueueItem[]>([]);
  protected readonly queuePending = signal<QueueItem[]>([]);
  protected readonly historyMap = signal<Record<string, HistoryItem>>({});
  protected readonly historyKeys = signal<string[]>([]);

  protected readonly modelFolders = signal<string[]>([]);
  protected readonly modelFiles = signal<Record<string, ModelFile[]>>({});
  protected readonly modelOpen = signal<Record<string, boolean>>({});
  protected readonly modelsLoading = signal(false);

  protected readonly workflowHistory = signal<{ prompt_id: string; workflow: any; prompt: string; timestamp: number }[]>([]);
  protected readonly lastRunResult = signal('');
  protected readonly savedWorkflows = signal<WorkflowEntry[]>([]);
  protected readonly savedWorkflowsLoading = signal(false);
  protected readonly discoveredWorkflowPath = signal('');
  protected readonly manualWfPath = signal('');
  protected readonly installPath = signal('');
  protected readonly installations = signal<{name: string; path: string}[]>([]);
  protected readonly loadedWorkflowEntry = signal<WorkflowEntry | null>(null);
  protected readonly loadedWorkflowContent = signal<any>(null);
  protected readonly loadedWorkflowError = signal('');
  protected readonly routeInfo = signal<{name: string; user: string; path: string} | null>(null);
  protected readonly toastMessage = signal('');

  protected readonly wsEvents = signal<WsEvent[]>([]);
  protected readonly wsConnected = signal(false);
  protected readonly wsConnecting = signal(false);
  protected readonly wsError = signal('');
  protected readonly wsUrl = signal('');
  protected readonly wsStatus = computed(() => {
    if (this.wsConnected()) return 'Conectado';
    if (this.wsConnecting()) return 'Conectando';
    return '';
  });
  protected readonly workflowsByInstall = computed(() => {
    const groups: Record<string, WorkflowEntry[]> = {};
    for (const wf of this.savedWorkflows()) {
      const key = wf.user;
      if (!groups[key]) groups[key] = [];
      groups[key].push(wf);
    }
    return groups;
  });

  protected buildUrl = buildUrl;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID no proporcionado'); return; }
    const tool = getToolById(id);
    if (!tool) { this.error.set('Herramienta no encontrada'); return; }
    if (tool.type !== 'comfyui') { this.error.set('Esta herramienta no es ComfyUI'); return; }
    this.tool.set(tool);
    this.loadSystemStats();
    // Restore or auto-discover installations
    const storedInsts = localStorage.getItem(`kaistu:comfyui-installs:${id}`);
    if (storedInsts) {
      try {
        const insts = JSON.parse(storedInsts);
        this.installations.set(insts);
        if (insts.length > 0) this.installPath.set(insts[0].path);
        this.loadAllWorkflows();
        return;
      } catch { /* corrupted storage, re-discover */ }
    }
    this.discoverComfyuiInstall();
  }

  private async discoverComfyuiInstall() {
    console.log('[ComfyUI] discoverComfyuiInstall...');
    try {
      const res = await fetch('/api/comfyui/discover');
      if (!res.ok) { console.log('[ComfyUI] discover FAILED:', res.status); return; }
      const data = await res.json();
      if (data.installations?.length > 0) {
        const insts = data.installations.map((i: any) => ({ name: i.name, path: i.path }));
        this.installations.set(insts);
        // Auto-select the primary installation path for the input
        const t = this.tool();
        const primary = insts.find((i: any) => t?.name.includes(i.name) || i.name === 'default') || insts[0];
        this.installPath.set(primary.path);
        this.saveInstallPath();
        // Auto-load workflows from ALL installations
        this.loadAllWorkflows();
      }
    } catch { /* silent */ }
  }

  protected saveInstallPath() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.installPath()) localStorage.setItem(`kaistu:comfyui-path:${id}`, this.installPath());
    if (this.installations().length > 0) localStorage.setItem(`kaistu:comfyui-installs:${id}`, JSON.stringify(this.installations()));
  }

  ngOnDestroy() {
    this.disconnectWs();
  }

  private baseUrl(tool: ToolConnection): string {
    return `http://${tool.localUrl}:${tool.localPort}`;
  }

  private async fetch(path: string, method = 'GET', body?: any): Promise<any> {
    const t = this.tool();
    if (!t) throw new Error('Tool not found');
    const params = new URLSearchParams({ baseUrl: this.baseUrl(t), path, apiKey: '' });
    const res = await fetch(`/api/n8n/proxy?${params}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ComfyUI error (${res.status}): ${text}`);
    }
    return res.json();
  }

  protected async loadSystemStats() {
    this.loading.set(true); this.error.set('');
    try { this.systemStats.set(await this.fetch('system_stats')); }
    catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async loadQueue() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.fetch('queue');
      this.queueRunning.set((data.queue_running ?? []).map((q: any) => ({ id: q[0] ?? q.prompt_id ?? '', prompt: q[1] ?? q })));
      this.queuePending.set((data.queue_pending ?? []).map((q: any) => ({ id: q[0] ?? q.prompt_id ?? '', prompt: q[1] ?? q })));
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async loadHistory() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.fetch('history');
      const keys = Object.keys(data).reverse();
      this.historyMap.set(data);
      this.historyKeys.set(keys);
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async loadWorkflowHistory() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.fetch('history');
      const items: { prompt_id: string; workflow: any; prompt: string; timestamp: number }[] = [];
      for (const [promptId, item] of Object.entries(data)) {
        const h = item as HistoryItem;
        const promptStr = h.workflow ? JSON.stringify(h.workflow).slice(0, 200) : '';
        items.push({
          prompt_id: promptId,
          workflow: h.workflow ?? {},
          prompt: promptStr,
          timestamp: h.timestamp ?? 0,
        });
      }
      items.reverse();
      this.workflowHistory.set(items);
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async rerunWorkflow(wf: { prompt_id: string; workflow: any }) {
    this.toggling.set(true); this.lastRunResult.set('');
    try {
      const result = await this.fetch('prompt', 'POST', wf.workflow ?? {});
      this.lastRunResult.set(JSON.stringify(result, null, 2));
    } catch (err: any) { this.lastRunResult.set(`Error: ${err.message}`); }
    finally { this.toggling.set(false); }
  }

  protected async loadSavedWorkflows(customPath?: string) {
    this.savedWorkflowsLoading.set(true);
    this.loadedWorkflowError.set('');
    this.discoveredWorkflowPath.set('');
    try {
      let all: WorkflowEntry[] = [];

      if (customPath) {
        console.log('[ComfyUI] Trying custom path via view:', customPath);
        try {
          const data = await this.fetch(`workflows?folder=${encodeURIComponent(customPath)}`);
          const names: string[] = (data ?? []).map((f: any) => typeof f === 'string' ? f : (f.name ?? f.filename ?? ''));
          const jsonFiles = names.filter((n: string) => n.endsWith('.json') || n.endsWith('.JSON'));
          jsonFiles.forEach((n) => all.push({ name: n, user: customPath }));
          if (jsonFiles.length > 0) this.discoveredWorkflowPath.set(customPath);
          console.log(`[ComfyUI] Custom path returned ${jsonFiles.length} workflows`);
        } catch (err: any) {
          console.log('[ComfyUI] Custom path failed:', err.message);
        }
        this.savedWorkflows.set(all);
        this.savedWorkflowsLoading.set(false);
        return;
      }

      try {
        console.log('[ComfyUI] Trying GET /api/workflows ...');
        const data = await this.fetch('workflows');
        console.log('[ComfyUI] /api/workflows response:', JSON.stringify(data));
        let names: string[] = [];
        if (Array.isArray(data)) {
          names = data.map((f: any) => typeof f === 'string' ? f : (f.name ?? f.filename ?? ''));
        } else if (data && typeof data === 'object') {
          names = Object.keys(data).filter((k) => data[k] && typeof data[k] !== 'function');
        }
        const jsonFiles = names.filter((n: string) => n.endsWith('.json') || n.endsWith('.JSON') || (!n.includes('.') && n.length > 0));
        jsonFiles.forEach((n) => all.push({ name: n, user: 'default' }));
        if (jsonFiles.length > 0) {
          this.discoveredWorkflowPath.set('/api/workflows');
          console.log(`[ComfyUI] Found ${jsonFiles.length} workflows via /api/workflows`);
        }
      } catch (err: any) {
        console.log('[ComfyUI] /api/workflows FAILED:', err.message);
      }

      console.log('[ComfyUI] Total workflows discovered:', all);
      this.savedWorkflows.set(all);
    } catch (err: any) {
      console.log('[ComfyUI] Discovery error:', err.message);
      this.savedWorkflows.set([]);
    } finally {
      this.savedWorkflowsLoading.set(false);
    }
  }

  protected showWorkflowPath(wf: WorkflowEntry) {
    const base = wf.path || this.installPath();
    const fullPath = base ? `${base}\\user\\default\\workflows\\${wf.name}` : wf.name;
    this.routeInfo.set({ name: wf.name, user: wf.user, path: fullPath });
    navigator.clipboard.writeText(fullPath).then(() => {
      this.toastMessage.set('Ruta copiada al portapapeles');
      setTimeout(() => this.toastMessage.set(''), 2500);
    }).catch(() => {
      this.toastMessage.set('No se pudo copiar la ruta');
      setTimeout(() => this.toastMessage.set(''), 2500);
    });
  }

  protected async loadSavedWorkflowFile(entry: WorkflowEntry) {
    this.loadedWorkflowEntry.set(entry);
    this.loadedWorkflowContent.set(null);
    this.loadedWorkflowError.set('');
    try {
      if (entry.path) {
        const params = new URLSearchParams({ installPath: entry.path, filename: entry.name.replace(/\.json$/i, '') });
        const res = await fetch(`/api/comfyui/read-workflow?${params}`);
        if (!res.ok) throw new Error(await res.text());
        this.loadedWorkflowContent.set(await res.json());
      } else {
        const content = await this.fetch(`view?filename=${encodeURIComponent(entry.name)}&type=workflows&subfolder=${encodeURIComponent(entry.user)}`);
        this.loadedWorkflowContent.set(content);
      }
    } catch (err: any) {
      this.loadedWorkflowError.set(`No se pudo cargar "${entry.name}": ${err.message}`);
    }
  }

  protected async rerunLoadedWorkflow() {
    const content = this.loadedWorkflowContent();
    if (!content) return;
    this.toggling.set(true);
    this.lastRunResult.set('');
    try {
      const result = await this.fetch('prompt', 'POST', content);
      this.lastRunResult.set(JSON.stringify(result, null, 2));
    } catch (err: any) {
      this.lastRunResult.set(`Error: ${err.message}`);
    } finally {
      this.toggling.set(false);
    }
  }

  protected async loadWorkflowsFromFs(installPath: string, installName?: string) {
    if (!installPath) return;
    this.savedWorkflowsLoading.set(true);
    this.loadedWorkflowError.set('');
    this.discoveredWorkflowPath.set('');
    try {
      const params = new URLSearchParams({ installPath });
      const res = await fetch(`/api/comfyui/list-workflows?${params}`);
      if (!res.ok) {
        const err = await res.json();
        this.loadedWorkflowError.set(err.error || 'Error al leer el directorio');
        this.savedWorkflows.set([]);
        return;
      }
      const data = await res.json();
      const displayName = installName || installPath;
      const all: WorkflowEntry[] = (data.files ?? []).map((name: string) => ({ name: `${name}.json`, user: displayName, path: installPath }));
      this.savedWorkflows.set(all);
      if (all.length > 0) this.discoveredWorkflowPath.set(data.path);
      console.log(`[ComfyUI] FS listing: ${all.length} workflows in ${installName || installPath}`);
    } catch (err: any) {
      this.loadedWorkflowError.set(`Error: ${err.message}`);
      this.savedWorkflows.set([]);
    } finally {
      this.savedWorkflowsLoading.set(false);
    }
  }

  protected async loadAllWorkflows() {
    const insts = this.installations();
    console.log('[ComfyUI] loadAllWorkflows:', insts.length, 'installations');
    if (insts.length === 0) return;
    this.savedWorkflowsLoading.set(true);
    this.loadedWorkflowError.set('');
    this.discoveredWorkflowPath.set('');
    try {
      const all: WorkflowEntry[] = [];
      for (const inst of insts) {
        try {
          const params = new URLSearchParams({ installPath: inst.path });
          const res = await fetch(`/api/comfyui/list-workflows?${params}`);
          if (!res.ok) continue;
          const data = await res.json();
          (data.files ?? []).forEach((name: string) => all.push({ name: `${name}.json`, user: inst.name, path: inst.path }));
          if (data.files?.length > 0 && !this.discoveredWorkflowPath()) {
            this.discoveredWorkflowPath.set(data.path);
          }
        } catch { /* skip */ }
      }
      this.savedWorkflows.set(all);
      console.log(`[ComfyUI] Auto-loaded ${all.length} workflows from ${insts.length} installation(s)`);
    } catch { this.savedWorkflows.set([]); }
    finally { this.savedWorkflowsLoading.set(false); }
  }

  protected async loadModelFolders() {
    this.error.set(''); this.modelsLoading.set(true);
    try { this.modelFolders.set(await this.fetch('models')); }
    catch (err: any) { this.error.set(err.message); }
    finally { this.modelsLoading.set(false); }
  }

  protected async toggleModelFolder(folder: string) {
    const open = this.modelOpen();
    if (open[folder]) {
      this.modelOpen.set({ ...open, [folder]: false });
      return;
    }
    this.modelOpen.set({ ...open, [folder]: true });
    if (this.modelFiles()[folder]) return;
    try {
      const files = await this.fetch(`models/${encodeURIComponent(folder)}`);
      this.modelFiles.set({ ...this.modelFiles(), [folder]: (files ?? []).map((f: any) => ({ name: typeof f === 'string' ? f : (f.name ?? f) })) });
    } catch { }
  }

  protected async interrupt() {
    this.toggling.set(true);
    try { await this.fetch('interrupt', 'POST'); } catch (err: any) { this.error.set(err.message); }
    finally { this.toggling.set(false); }
  }

  protected async freeMemory() {
    this.toggling.set(true);
    try { await this.fetch('free', 'POST', { unload_models: true, free_memory: true }); } catch (err: any) { this.error.set(err.message); }
    finally { this.toggling.set(false); }
  }

  protected async clearQueue() {
    this.toggling.set(true);
    try { await this.fetch('queue', 'POST', { clear: true }); this.loadQueue(); } catch (err: any) { this.error.set(err.message); }
    finally { this.toggling.set(false); }
  }

  protected connectWs() {
    if (!isPlatformBrowser(this.platformId)) return;
    const t = this.tool();
    if (!t) return;
    this.disconnectWs();
    this.wsConnecting.set(true);
    this.wsError.set('');
    const proxyUrl = `ws://${window.location.host}/api/n8n/ws-proxy?host=${t.localUrl}&port=${t.localPort}&clientId=${this.wsClientId}`;
    this.wsUrl.set(proxyUrl);
    try {
      const sock = new WebSocket(proxyUrl);
      sock.onopen = () => {
        this.wsConnected.set(true);
        this.wsConnecting.set(false);
        this.wsError.set('');
        this.addWsEvent('connected', 'Proxy WS conectado');
      };
      sock.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const dataStr = JSON.stringify(msg.data ?? msg).slice(0, 300);
          this.addWsEvent(msg.type ?? 'message', dataStr);
        } catch {
          this.addWsEvent('message', evt.data.slice(0, 300));
        }
      };
      sock.onclose = (evt) => {
        this.wsConnected.set(false);
        this.wsConnecting.set(false);
        const reason = evt.code ? ` (código ${evt.code}${evt.reason ? ': ' + evt.reason : ''})` : '';
        this.addWsEvent('disconnected', `WS desconectado${reason}`);
        this.ws = null;
      };
      sock.onerror = () => {
        this.wsError.set('No se pudo conectar — Comprueba que ComfyUI está corriendo, el puerto es correcto y el servidor Node.js puede alcanzarlo');
        this.wsConnecting.set(false);
        this.addWsEvent('error', 'Error de conexión');
      };
      this.ws = sock;
    } catch (err: any) {
      this.wsConnecting.set(false);
      this.wsError.set(`Error al crear WebSocket: ${err.message}`);
    }
  }

  protected disconnectWs() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.wsConnected.set(false);
    this.wsConnecting.set(false);
  }

  protected clearWsLog() {
    this.wsEvents.set([]);
    this.wsError.set('');
  }

  private addWsEvent(type: string, data: string) {
    this.wsEvents.update(prev => {
      const next = [...prev, { type, data, time: Date.now() }];
      if (next.length > 200) next.splice(0, next.length - 200);
      return next;
    });
  }

  protected formatJson(obj: any): string {
    if (!obj) return '';
    try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
  }

  protected formatSize(obj: any): string {
    if (!obj) return '0';
    try { return Object.keys(obj).length.toString(); } catch { return '?'; }
  }

  protected vramUsagePercent(d: { vram_total: number; vram_free: number }): string {
    if (!d.vram_total) return '0';
    return ((1 - d.vram_free / d.vram_total) * 100).toFixed(1);
  }

  protected formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0; let val = bytes;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(1)} ${units[i]}`;
  }

  protected firstImage(item: HistoryItem): { filename: string; subfolder: string; type: string } | null {
    if (!item.outputs) return null;
    for (const nodeId of Object.keys(item.outputs)) {
      const imgs = item.outputs[nodeId]?.images;
      if (imgs?.length) return imgs[0];
    }
    return null;
  }

  protected imageUrl(img: { filename: string; subfolder: string; type: string }): string {
    const t = this.tool();
    if (!t) return '';
    const params = new URLSearchParams({
      baseUrl: this.baseUrl(t),
      path: `view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder)}&type=${encodeURIComponent(img.type)}`,
      apiKey: '',
    });
    return `/api/n8n/proxy?${params}`;
  }

  protected formatDate(ts: number): string {
    if (!ts) return '';
    try { return new Date(ts * 1000).toLocaleString(); } catch { return ''; }
  }
}
