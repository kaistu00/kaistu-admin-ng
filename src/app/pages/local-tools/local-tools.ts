import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  loadTools, removeTool, updateTool,
  getProfiles, getActiveProfile, setActiveProfile, addProfile, deleteProfile,
  exportStore, importStore,
  ToolConnection, toolTypeLabel, healthPath, buildUrl,
} from './tool-store';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './local-tools.html',
  styleUrl: './local-tools.scss',
})
export default class ToolsComponent {
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly tools = signal<ToolConnection[]>([]);
  protected readonly profiles = signal<string[]>([]);
  protected readonly activeProfile = signal<string>('');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.refresh();
    }
  }
  protected readonly testingId = signal<string | null>(null);
  protected readonly newProfileName = signal('');

  protected toolTypeLabel = toolTypeLabel;

  protected dashboardRoute(type: string, id: string): string[] | null {
    const routes: Record<string, string[]> = {
      n8n: ['/tools', id, 'n8n-dashboard'],
      comfyui: ['/tools', id, 'comfyui-dashboard'],
    };
    return routes[type] ?? null;
  }

  protected refresh(): void {
    this.tools.set(loadTools());
    this.profiles.set(getProfiles());
    this.activeProfile.set(getActiveProfile());
  }

  protected switchProfile(name: string): void {
    setActiveProfile(name);
    this.refresh();
  }

  protected addProfile(): void {
    const name = this.newProfileName().trim();
    if (!name || this.profiles().includes(name)) return;
    addProfile(name);
    this.newProfileName.set('');
    this.refresh();
  }

  protected removeProfile(name: string): void {
    if (this.profiles().length <= 1) return;
    deleteProfile(name);
    this.refresh();
  }

  protected deleteTool(id: string): void {
    removeTool(id);
    this.refresh();
  }

  protected toolIcon(type: string): string {
    const icons: Record<string, string> = {
      n8n: 'M4 17l6-6-6-6m8 14h8',
      comfyui: 'M3 3h18v18H3zm5.5 5.5h3v3h-3zm8 8l-5-5 5-5',
      openclaw: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
      opencode: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
      hermes: 'M12 2l4 8h6l-5 5 2 6-7-4-7 4 2-6-5-5h6z',
      custom: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z',
    };
    return icons[type] ?? icons['custom'];
  }

  protected async testTool(tool: ToolConnection): Promise<void> {
    this.testingId.set(tool.id);
    const url = `${buildUrl(tool)}${healthPath(tool.type)}`;
    try {
      const res = await fetch(`/api/integrations/test?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.ok && data.status === 200) {
        tool.lastStatus = 'green';
        tool.lastStatusText = `✓ ${data.status}`;
      } else if (data.ok) {
        tool.lastStatus = 'orange';
        tool.lastStatusText = `● ${data.status}`;
      } else {
        tool.lastStatus = 'red';
        tool.lastStatusText = `✗ ${data.error}`;
      }
    } catch {
      tool.lastStatus = 'red';
      tool.lastStatusText = '✗ Error';
    }
    tool.lastCheckedAt = Date.now();
    updateTool(tool);
    this.refresh();
    this.testingId.set(null);
  }

  protected exportData(): void {
    const blob = new Blob([exportStore()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tools-${this.activeProfile()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected importData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const ok = importStore(reader.result as string);
        if (ok) this.refresh();
        else alert('El archivo no tiene un formato válido.');
      };
      reader.readAsText(file);
    };
    input.click();
  }

  protected onProfileInput(event: Event): void {
    this.newProfileName.set((event.target as HTMLInputElement).value);
  }

  protected onProfileKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addProfile();
    }
  }
}
