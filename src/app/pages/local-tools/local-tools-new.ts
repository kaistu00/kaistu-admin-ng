import { Component, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { maskApiKey } from '../../services/crypto-utils';
import {
  addTool, updateTool, getToolById, generateId, ToolType,
  ConnectionStatus, healthPath, buildUrl,
} from './tool-store';

export interface FormData {
  name: string;
  type: ToolType;
  mode: 'local' | 'cloud';
  localUrl: string;
  localPort: string;
  cloudUrl: string;
  apiKey: string;
}

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './local-tools-new.html',
  styleUrl: './local-tools.scss',
})
export default class ToolsNewComponent {
  protected readonly editId = signal<string | null>(null);
  protected readonly formData = signal<FormData>({
    name: '', type: 'n8n', mode: 'local',
    localUrl: 'localhost', localPort: '5678', cloudUrl: '', apiKey: '',
  });
  protected readonly testStatus = signal<ConnectionStatus>('unknown');
  protected readonly testText = signal('');
  protected readonly testing = signal(false);
  protected readonly showKeyInput = signal(false);
  protected readonly existingKey = signal('');

  protected get hasExistingKey(): boolean {
    return this.isEdit && !!this.existingKey();
  }

  protected get maskedKey(): string {
    return maskApiKey(this.existingKey());
  }

  protected readonly toolTypes: { value: ToolType; label: string }[] = [
    { value: 'n8n', label: 'n8n' },
    { value: 'comfyui', label: 'ComfyUI' },
    { value: 'openclaw', label: 'OpenClaw' },
    { value: 'opencode', label: 'OpenCode' },
    { value: 'hermes', label: 'Hermes' },
    { value: 'custom', label: 'Custom' },
  ];

  protected defaultPorts: Record<ToolType, string> = {
    n8n: '5678', comfyui: '8188', openclaw: '3000',
    opencode: '3001', hermes: '3002', custom: '8080',
  };

  constructor(private router: Router, private route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const tool = getToolById(id);
      if (tool) {
        this.editId.set(id);
        this.existingKey.set(tool.apiKey ?? '');
        this.formData.set({
          name: tool.name,
          type: tool.type,
          mode: tool.mode,
          localUrl: tool.localUrl,
          localPort: tool.localPort,
          cloudUrl: tool.cloudUrl,
          apiKey: tool.apiKey ?? '',
        });
        if (tool.lastStatus !== 'unknown') {
          this.testStatus.set(tool.lastStatus);
          this.testText.set(tool.lastStatusText);
        }
      }
    }
  }

  protected get isEdit(): boolean {
    return this.editId() !== null;
  }

  protected onInput(field: keyof FormData, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.formData.update((d) => ({ ...d, [field]: value }));
  }

  protected onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ToolType;
    this.formData.update((d) => ({ ...d, type: value, localPort: this.defaultPorts[value] }));
  }

  private buildTargetUrl(): string {
    const f = this.formData();
    return `${buildUrl(f)}${healthPath(f.type)}`;
  }

  protected async testConnection(): Promise<void> {
    this.testing.set(true);
    this.testStatus.set('unknown');
    this.testText.set('Comprobando...');
    const url = this.buildTargetUrl();
    try {
      const res = await fetch(`/api/integrations/test?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.ok && data.status === 200) {
        this.testStatus.set('green');
        this.testText.set(`✓ Conectado (${data.status})`);
      } else if (data.ok) {
        this.testStatus.set('orange');
        this.testText.set(`● Servidor responde (${data.status})`);
      } else {
        this.testStatus.set('red');
        this.testText.set(`✗ ${data.error}`);
      }
    } catch {
      this.testStatus.set('red');
      this.testText.set('✗ No se pudo conectar');
    }
    this.testing.set(false);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const f = this.formData();
    if (!f.name.trim()) return;

    const apiKeyToSave = f.apiKey || this.existingKey();

    const toolData = {
      name: f.name.trim(),
      type: f.type,
      mode: f.mode,
      localUrl: f.localUrl,
      localPort: f.localPort,
      cloudUrl: f.cloudUrl,
      apiKey: apiKeyToSave,
      lastStatus: this.testStatus(),
      lastStatusText: this.testText(),
      lastCheckedAt: this.testStatus() !== 'unknown' ? Date.now() : 0,
    };

    if (this.isEdit) {
      const existing = getToolById(this.editId()!);
      if (existing) {
        updateTool({ ...existing, ...toolData });
      }
    } else {
      addTool({ id: generateId(), createdAt: Date.now(), ...toolData });
    }
    this.router.navigate(['/tools']);
  }
}
