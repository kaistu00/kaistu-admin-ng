import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface IdeaForm {
  prompt: string;
  demographic: string;
  genres: string[];
  explicitGenres: string[];
  subgenres: string[];
  themes: string[];
  aesthetics: string[];
  contentWarnings: string[];
  decisionIdeas: string;
  influenceIdeas: string;
  rating: string;
}

export interface UniverseListItem {
  id: string;
  slug: string;
  name: string;
  status: string;
  idea_form?: IdeaForm;
  createdAt: number;
  updatedAt: number;
}

export interface CreateUniversePayload {
  slug: string;
  name: string;
  status: string;
  idea_form: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class UniverseService {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<UniverseListItem[]>('/api/universes');
  }

  getBySlug(slug: string) {
    return this.http.get<UniverseListItem>(`/api/universes/${encodeURIComponent(slug)}`);
  }

  create(payload: CreateUniversePayload) {
    return this.http.post<{ id: string }>('/api/universes', payload);
  }

  update(slug: string, payload: Partial<CreateUniversePayload>) {
    return this.http.put<{ ok: boolean }>(`/api/universes/${encodeURIComponent(slug)}`, payload);
  }

  delete(slug: string) {
    return this.http.delete<{ ok: boolean }>(`/api/universes/${encodeURIComponent(slug)}`);
  }
}
