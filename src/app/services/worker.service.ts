import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface WorkerPayload {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  systemPrompt: string;
  userPrompt?: string;
  skills?: string[];
  status?: string;
  tags?: string[];
  version?: string;
}

export interface WorkerItem extends WorkerPayload {
  id: string;
  createdAt: number;
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class WorkerService {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<WorkerItem[]>('/api/studio-workers');
  }

  getBySlug(slug: string) {
    return this.http.get<WorkerItem>(`/api/studio-workers/${encodeURIComponent(slug)}`);
  }

  create(payload: WorkerPayload) {
    return this.http.post<{ id: string }>('/api/studio-workers', payload);
  }

  update(slug: string, payload: Partial<WorkerPayload>) {
    return this.http.put<{ ok: boolean }>(`/api/studio-workers/${encodeURIComponent(slug)}`, payload);
  }

  delete(slug: string) {
    return this.http.delete<{ ok: boolean }>(`/api/studio-workers/${encodeURIComponent(slug)}`);
  }
}
