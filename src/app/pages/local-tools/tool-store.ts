import { encrypt, decrypt, tryOldDecrypt } from '../../services/crypto-utils';

export type ToolType = 'n8n' | 'comfyui' | 'openclaw' | 'opencode' | 'hermes' | 'custom';
export type ConnectionStatus = 'unknown' | 'checking' | 'green' | 'orange' | 'red';

export interface ToolConnection {
  id: string;
  name: string;
  type: ToolType;
  mode: 'local' | 'cloud';
  localUrl: string;
  localPort: string;
  cloudUrl: string;
  apiKey: string;
  createdAt: number;
  lastStatus: ConnectionStatus;
  lastStatusText: string;
  lastCheckedAt: number;
}

export interface ToolsStore {
  activeProfile: string;
  profiles: Record<string, ToolConnection[]>;
}

const STORAGE_KEY = 'kaistu:tools-store';
const DEFAULT_PROFILE = 'Default';

function readStore(): ToolsStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const store = JSON.parse(raw) as ToolsStore;
      let needsSave = false;
      for (const profileName of Object.keys(store.profiles)) {
        store.profiles[profileName] = store.profiles[profileName].map(t => {
          const newFormat = decrypt(t.apiKey);
          if (newFormat !== t.apiKey) {
            needsSave = true;
            return { ...t, apiKey: newFormat };
          }
          const oldDecrypted = tryOldDecrypt(t.apiKey);
          if (oldDecrypted !== null) {
            needsSave = true;
            return { ...t, apiKey: oldDecrypted };
          }
          return { ...t, apiKey: t.apiKey };
        });
      }
      if (needsSave) writeStore(store);
      return store;
    }
  } catch { }
  return { activeProfile: DEFAULT_PROFILE, profiles: { [DEFAULT_PROFILE]: [] } };
}

function writeStore(store: ToolsStore): void {
  const toStore = {
    ...store,
    profiles: Object.fromEntries(
      Object.entries(store.profiles).map(([name, tools]) => [
        name,
        tools.map(t => ({
          ...t,
          apiKey: encrypt(t.apiKey),
        })),
      ])
    ),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

export function getActiveProfile(): string {
  return readStore().activeProfile;
}

export function getProfiles(): string[] {
  return Object.keys(readStore().profiles);
}

export function setActiveProfile(name: string): void {
  const store = readStore();
  if (!store.profiles[name]) store.profiles[name] = [];
  store.activeProfile = name;
  writeStore(store);
}

export function addProfile(name: string): void {
  const store = readStore();
  if (!store.profiles[name]) store.profiles[name] = [];
  writeStore(store);
}

export function deleteProfile(name: string): void {
  const store = readStore();
  delete store.profiles[name];
  if (store.activeProfile === name) {
    const keys = Object.keys(store.profiles);
    store.activeProfile = keys.length ? keys[0] : DEFAULT_PROFILE;
    if (!store.profiles[store.activeProfile]) store.profiles[store.activeProfile] = [];
  }
  writeStore(store);
}

export function loadTools(profile?: string): ToolConnection[] {
  const store = readStore();
  return store.profiles[profile ?? store.activeProfile] ?? [];
}

export function saveTools(tools: ToolConnection[], profile?: string): void {
  const store = readStore();
  store.profiles[profile ?? store.activeProfile] = tools;
  writeStore(store);
}

export function addTool(tool: ToolConnection): void {
  const store = readStore();
  store.profiles[store.activeProfile].push(tool);
  writeStore(store);
}

export function updateTool(updated: ToolConnection): void {
  const store = readStore();
  for (const name of Object.keys(store.profiles)) {
    const idx = store.profiles[name].findIndex((t) => t.id === updated.id);
    if (idx !== -1) {
      store.profiles[name][idx] = updated;
      break;
    }
  }
  writeStore(store);
}

export function removeTool(id: string): void {
  const store = readStore();
  store.profiles[store.activeProfile] = store.profiles[store.activeProfile].filter((t) => t.id !== id);
  writeStore(store);
}

export function getToolById(id: string): ToolConnection | undefined {
  const store = readStore();
  for (const tools of Object.values(store.profiles)) {
    const found = tools.find((t) => t.id === id);
    if (found) return found;
  }
  return;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function toolTypeLabel(type: ToolType): string {
  const labels: Record<ToolType, string> = {
    n8n: 'n8n', comfyui: 'ComfyUI', openclaw: 'OpenClaw',
    opencode: 'OpenCode', hermes: 'Hermes', custom: 'Custom',
  };
  return labels[type];
}

export function healthPath(type: ToolType): string {
  const paths: Record<ToolType, string> = {
    n8n: '/healthz', comfyui: '/', openclaw: '/',
    opencode: '/', hermes: '/', custom: '/',
  };
  return paths[type];
}

export function buildUrl(tool: { mode: string; localUrl: string; localPort: string; cloudUrl: string; apiKey?: string }): string {
  return tool.mode === 'cloud'
    ? tool.cloudUrl.replace(/\/+$/, '')
    : `http://${tool.localUrl}:${tool.localPort}`;
}

export function n8nApiBase(tool: ToolConnection): string {
  return `${buildUrl(tool)}/api/v1`;
}

export function exportStore(): string {
  return JSON.stringify(readStore(), null, 2);
}

export function importStore(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object' || !data.profiles) return false;
    writeStore(data);
    return true;
  } catch { return false; }
}
