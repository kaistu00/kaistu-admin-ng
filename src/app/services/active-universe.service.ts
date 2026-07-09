import { Injectable, signal } from '@angular/core';

export interface Universe {
  id: string;
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ActiveUniverseService {
  readonly universes = signal<Universe[]>([
    { id: 'kaistu-prime', name: 'Kaistu Prime', description: 'Universo principal de Kaistu Studio' },
    { id: 'neon-genesis', name: 'Neon Genesis', description: 'Universo cyberpunk futurista' },
    { id: 'starlight', name: 'Starlight', description: 'Aventuras espaciales y fantasía' },
  ]);

  readonly activeUniverse = signal<Universe | null>(null);

  setActiveUniverse(universe: Universe): void {
    this.activeUniverse.set(universe);
  }
}
