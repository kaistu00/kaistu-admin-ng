import { Component, signal, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { getToolById, buildUrl, n8nApiBase, type ToolConnection } from './tool-store';

interface Workflow { id: string; name: string; active: boolean; updatedAt: string; webhookIds?: string[]; }
interface Execution { id: string; workflowId: string; workflowName: string; status: string; startedAt: string; finishedAt?: string; }
interface Credential { id: string; name: string; type: string; }
interface Package { packageName: string; version: string; installedVersion: string; authorName?: string; }
interface Webhook { workflowId: string; workflowName: string; webhookId: string; webhookUrl: string; method: string; path: string; }
interface AuditIssue { severity: string; title: string; recommendation: string; }

type TabId = 'workflows' | 'webhooks' | 'executions' | 'credentials' | 'packages' | 'audit';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
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
          <h1 class="n8n-title">{{ tool()?.name ?? 'n8n Dashboard' }}</h1>
          <span class="n8n-url">{{ tool() ? buildUrl(tool()!) : '' }}</span>
        </div>
      </header>

      <nav class="tabs">
        <button class="tab" [class.active]="activeTab() === 'workflows'" (click)="activeTab.set('workflows'); loadWorkflows()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Workflows
        </button>
        <button class="tab" [class.active]="activeTab() === 'webhooks'" (click)="activeTab.set('webhooks'); loadWebhooks()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Webhooks
        </button>
        <button class="tab" [class.active]="activeTab() === 'executions'" (click)="activeTab.set('executions'); loadExecutions()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Ejecuciones
        </button>
        <button class="tab" [class.active]="activeTab() === 'credentials'" (click)="activeTab.set('credentials'); loadCredentials()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Credenciales
        </button>
        <button class="tab" [class.active]="activeTab() === 'packages'" (click)="activeTab.set('packages'); loadPackages()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          Paquetes
        </button>
        <button class="tab" [class.active]="activeTab() === 'audit'" (click)="activeTab.set('audit')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Auditoría
        </button>
      </nav>

      <div class="tab-content">
        @if (loading()) { <div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div> }
        @else if (error()) { <div class="error-banner">{{ error() }}</div> }
        @else {

          @switch (activeTab()) {
            @case ('workflows') {
              <div class="section-header"><h2>Workflows ({{ workflows().length }})</h2></div>
              @if (workflows().length === 0) { <div class="empty-state">No hay workflows</div> }
              @else {
                <div class="list">
                  @for (w of workflows(); track w.id) {
                    <div class="list-item">
                      <div class="list-item-info">
                        <span class="list-item-name">{{ w.name }}</span>
                        <span class="list-item-meta">ID: {{ w.id }} · Actualizado: {{ formatDate(w.updatedAt) }}</span>
                      </div>
                      <div class="list-item-actions">
                        <span class="status-badge-sm" [class.active]="w.active" [class.inactive]="!w.active">{{ w.active ? 'Activo' : 'Inactivo' }}</span>
                        @if (w.active) {
                          <button class="btn-action btn-warn" (click)="deactivateWorkflow(w.id)" [disabled]="toggling()">Desactivar</button>
                        } @else {
                          <button class="btn-action btn-ok" (click)="activateWorkflow(w.id)" [disabled]="toggling()">Activar</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @case ('webhooks') {
              <div class="section-header"><h2>Webhooks detectados ({{ webhooks().length }})</h2></div>
              @if (webhooks().length === 0) { <div class="empty-state">No se detectaron webhooks</div> }
              @else {
                <div class="list">
                  @for (wh of webhooks(); track wh.webhookId) {
                    <div class="list-item">
                      <div class="list-item-info">
                        <span class="list-item-name">{{ wh.workflowName }}</span>
                        <span class="list-item-meta">{{ wh.method }} {{ wh.path }}</span>
                        <code class="webhook-url">{{ wh.webhookUrl }}</code>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @case ('executions') {
              <div class="section-header"><h2>Ejecuciones recientes ({{ executions().length }})</h2></div>
              @if (executions().length === 0) { <div class="empty-state">No hay ejecuciones</div> }
              @else {
                <div class="list">
                  @for (e of executions(); track e.id) {
                    <div class="list-item">
                      <div class="list-item-info">
                        <span class="list-item-name">{{ e.workflowName || 'ID: ' + e.workflowId }}</span>
                        <span class="list-item-meta">{{ e.startedAt ? formatDate(e.startedAt) : '—' }}</span>
                      </div>
                      <div class="list-item-actions">
                        <span class="status-badge-sm" [class]="'exec-' + e.status">{{ statusLabel(e.status) }}</span>
                        @if (e.status === 'error' || e.status === 'crashed') {
                          <button class="btn-action btn-ok" (click)="retryExecution(e.id)" [disabled]="toggling()">Reintentar</button>
                        }
                        @if (e.status === 'running' || e.status === 'waiting') {
                          <button class="btn-action btn-warn" (click)="stopExecution(e.id)" [disabled]="toggling()">Detener</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @case ('credentials') {
              <div class="section-header"><h2>Credenciales ({{ credentials().length }})</h2></div>
              @if (credentials().length === 0) { <div class="empty-state">No hay credenciales</div> }
              @else {
                <div class="list">
                  @for (c of credentials(); track c.id) {
                    <div class="list-item">
                      <div class="list-item-info">
                        <span class="list-item-name">{{ c.name }}</span>
                        <span class="list-item-meta">{{ c.type }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @case ('packages') {
              <div class="section-header"><h2>Paquetes instalados ({{ packages().length }})</h2></div>
              @if (packages().length === 0) { <div class="empty-state">No hay paquetes comunitarios</div> }
              @else {
                <div class="list">
                  @for (p of packages(); track p.packageName) {
                    <div class="list-item">
                      <div class="list-item-info">
                        <span class="list-item-name">{{ p.packageName }}</span>
                        <span class="list-item-meta">v{{ p.installedVersion }}{{ p.authorName ? ' por ' + p.authorName : '' }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            }

            @case ('audit') {
              <div class="section-header"><h2>Auditoría de seguridad</h2></div>
              @if (auditIssues().length === 0 && !auditDone()) {
                <div class="empty-state">
                  <p>Ejecuta una auditoría para detectar problemas de seguridad en tu instancia n8n.</p>
                  <button class="btn-action btn-ok" (click)="runAudit()" [disabled]="toggling()">Ejecutar auditoría</button>
                </div>
              }
              @if (auditRunning()) { <div class="loading-state"><div class="spinner"></div><p>Auditando...</p></div> }
              @if (auditDone() && auditIssues().length === 0) {
                <div class="success-banner">✓ No se encontraron problemas de seguridad</div>
              }
              @if (auditIssues().length > 0) {
                <div class="list">
                  @for (issue of auditIssues(); track $index) {
                    <div class="list-item">
                      <div class="list-item-info">
                        <span class="list-item-name audit-severity" [class]="'sev-' + issue.severity">{{ issue.severity }}</span>
                        <span>{{ issue.title }}</span>
                        <span class="list-item-meta">{{ issue.recommendation }}</span>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .n8n-page { max-width: 900px; margin: 0 auto; padding: 2rem; }
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
    .section-header { margin-bottom: 1rem; }
    .section-header h2 { margin: 0; font-size: 1rem; font-weight: 600; }

    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: var(--text-secondary); }
    .spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #ef4444; font-size: 0.85rem; margin-bottom: 1rem; }
    .success-banner { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #22c55e; font-size: 0.85rem; margin-bottom: 1rem; }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-size: 0.9rem; }

    .list { display: flex; flex-direction: column; gap: 0.5rem; }
    .list-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.75rem 1rem; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .list-item-info { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; min-width: 0; }
    .list-item-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
    .list-item-meta { font-size: 0.75rem; color: var(--text-muted); }
    .list-item-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

    .status-badge-sm { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: var(--radius-sm); text-transform: uppercase; }
    .status-badge-sm.active { background: rgba(34,197,94,0.15); color: #22c55e; }
    .status-badge-sm.inactive { background: rgba(107,114,128,0.15); color: #9ca3af; }
    .status-badge-sm.exec-success { background: rgba(34,197,94,0.15); color: #22c55e; }
    .status-badge-sm.exec-error { background: rgba(239,68,68,0.15); color: #ef4444; }
    .status-badge-sm.exec-running { background: rgba(0,210,255,0.15); color: var(--accent); }
    .status-badge-sm.exec-waiting { background: rgba(234,179,8,0.15); color: #eab308; }
    .status-badge-sm.exec-crashed { background: rgba(239,68,68,0.15); color: #ef4444; }
    .status-badge-sm.exec-canceled { background: rgba(107,114,128,0.15); color: #9ca3af; }

    .btn-action { padding: 0.35rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 500; font-family: inherit; cursor: pointer; border: none; }
    .btn-ok { background: rgba(34,197,94,0.15); color: #22c55e; }
    .btn-ok:hover { background: rgba(34,197,94,0.25); }
    .btn-warn { background: rgba(234,179,8,0.15); color: #eab308; }
    .btn-warn:hover { background: rgba(234,179,8,0.25); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

    .webhook-url { font-size: 0.75rem; background: var(--bg-elevated); padding: 0.2rem 0.4rem; border-radius: 3px; color: var(--accent); font-family: monospace; word-break: break-all; }
    .audit-severity { text-transform: uppercase; font-size: 0.7rem; }
    .sev-critical { color: #ef4444; }
    .sev-high { color: #eab308; }
    .sev-medium { color: var(--accent); }
    .sev-low { color: var(--text-muted); }
  `],
})
export default class N8nDashboardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly tool = signal<ToolConnection | null>(null);
  protected readonly activeTab = signal<TabId>('workflows');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly toggling = signal(false);

  protected readonly workflows = signal<Workflow[]>([]);
  protected readonly webhooks = signal<Webhook[]>([]);
  protected readonly executions = signal<Execution[]>([]);
  protected readonly credentials = signal<Credential[]>([]);
  protected readonly packages = signal<Package[]>([]);
  protected readonly auditIssues = signal<AuditIssue[]>([]);
  protected readonly auditRunning = signal(false);
  protected readonly auditDone = signal(false);

  protected buildUrl = buildUrl;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID de herramienta no proporcionado'); return; }
    const tool = getToolById(id);
    if (!tool) { this.error.set('Herramienta no encontrada'); return; }
    if (tool.type !== 'n8n') { this.error.set('Esta herramienta no es n8n'); return; }
    this.tool.set(tool);
    this.loadWorkflows();
  }

  private async n8nFetch(path: string): Promise<any> {
    const t = this.tool();
    if (!t) throw new Error('Tool not found');
    const baseUrl = buildUrl(t);
    const params = new URLSearchParams({ baseUrl: n8nApiBase(t), path, apiKey: t.apiKey || '' });
    const res = await fetch(`/api/n8n/proxy?${params}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`n8n API error (${res.status}): ${text}`);
    }
    return res.json();
  }

  protected async loadWorkflows() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.n8nFetch('workflows');
      this.workflows.set((data.data ?? data.results ?? []).map((w: any) => ({
        id: w.id?.toString() ?? '',
        name: w.name ?? 'Sin nombre',
        active: w.active ?? false,
        updatedAt: w.updatedAt ?? w.updated_at ?? '',
        webhookIds: w.webhookIds ?? [],
      })));
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async loadWebhooks() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.n8nFetch('workflows');
      const all: Webhook[] = [];
      for (const w of (data.data ?? data.results ?? [])) {
        if (w.webhookIds?.length) {
          for (const whId of w.webhookIds) {
            all.push({
              workflowId: w.id?.toString() ?? '',
              workflowName: w.name ?? '',
              webhookId: whId,
              webhookUrl: `${buildUrl(this.tool()!)}/webhook/${whId}`,
              method: 'POST',
              path: `/webhook/${whId}`,
            });
          }
        }
      }
      this.webhooks.set(all);
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async loadExecutions() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.n8nFetch('executions?limit=20');
      this.executions.set((data.data ?? data.results ?? []).map((e: any) => ({
        id: e.id?.toString() ?? '',
        workflowId: e.workflowId?.toString() ?? e.workflow_id?.toString() ?? '',
        workflowName: e.workflowName ?? e.workflow_name ?? '',
        status: e.status ?? 'unknown',
        startedAt: e.startedAt ?? e.started_at ?? '',
        finishedAt: e.finishedAt ?? e.finished_at ?? '',
      })));
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async loadCredentials() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.n8nFetch('credentials');
      this.credentials.set((data.data ?? data.results ?? []).map((c: any) => ({
        id: c.id?.toString() ?? '',
        name: c.name ?? 'Sin nombre',
        type: c.type ?? c.credentialType ?? 'unknown',
      })));
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async loadPackages() {
    this.loading.set(true); this.error.set('');
    try {
      const data = await this.n8nFetch('community-packages');
      this.packages.set((data.data ?? data.results ?? []).map((p: any) => ({
        packageName: p.packageName ?? p.package_name ?? 'unknown',
        version: p.version ?? '',
        installedVersion: p.installedVersion ?? p.installed_version ?? '',
        authorName: p.authorName ?? p.author_name ?? '',
      })));
    } catch (err: any) { this.error.set(err.message); }
    finally { this.loading.set(false); }
  }

  protected async activateWorkflow(id: string) {
    this.toggling.set(true);
    try {
      await this.n8nFetch(`workflows/${id}/activate`);
      await this.loadWorkflows();
    } catch (err: any) { this.error.set(err.message); }
    finally { this.toggling.set(false); }
  }

  protected async deactivateWorkflow(id: string) {
    this.toggling.set(true);
    try {
      await this.n8nFetch(`workflows/${id}/deactivate`);
      await this.loadWorkflows();
    } catch (err: any) { this.error.set(err.message); }
    finally { this.toggling.set(false); }
  }

  protected async retryExecution(id: string) {
    this.toggling.set(true);
    try {
      await this.n8nFetch(`executions/${id}/retry`);
      await this.loadExecutions();
    } catch (err: any) { this.error.set(err.message); }
    finally { this.toggling.set(false); }
  }

  protected async stopExecution(id: string) {
    this.toggling.set(true);
    try {
      await this.n8nFetch(`executions/${id}/stop`);
      await this.loadExecutions();
    } catch (err: any) { this.error.set(err.message); }
    finally { this.toggling.set(false); }
  }

  protected async runAudit() {
    this.auditRunning.set(true); this.auditDone.set(false); this.auditIssues.set([]);
    try {
      const data = await this.n8nFetch('audit');
      this.auditIssues.set((data.data ?? data ?? []).map((issue: any) => ({
        severity: issue.severity ?? 'low',
        title: issue.title ?? '',
        recommendation: issue.recommendation ?? '',
      })));
      this.auditDone.set(true);
    } catch (err: any) { this.error.set(err.message); }
    finally { this.auditRunning.set(false); }
  }

  protected formatDate(date: string): string {
    if (!date) return '—';
    try { return new Date(date).toLocaleDateString(); } catch { return date; }
  }

  protected statusLabel(status: string): string {
    const labels: Record<string, string> = {
      success: 'Éxito', error: 'Error', running: 'Ejecutando',
      waiting: 'Esperando', crashed: 'Crash', canceled: 'Cancelado',
      new: 'Nuevo', unknown: 'Desconocido',
    };
    return labels[status] ?? status;
  }
}
