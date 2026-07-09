import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WorldItem {
  id: string;
  slug: string;
  name: string;
  universeId: string;
  worldTypes: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateWorldPayload {
  slug: string;
  name: string;
  universeId: string;
  worldTypes: string[];
}

@Injectable({ providedIn: 'root' })
export class WorldsService {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<WorldItem[]>('/api/worlds');
  }

  getBySlug(slug: string) {
    return this.http.get<WorldItem>(`/api/worlds/${encodeURIComponent(slug)}`);
  }

  create(payload: CreateWorldPayload) {
    return this.http.post<{ id: string }>('/api/worlds', payload);
  }

  update(slug: string, payload: Partial<CreateWorldPayload>) {
    return this.http.put<{ ok: boolean }>(`/api/worlds/${encodeURIComponent(slug)}`, payload);
  }

  delete(slug: string) {
    return this.http.delete<{ ok: boolean }>(`/api/worlds/${encodeURIComponent(slug)}`);
  }
}
