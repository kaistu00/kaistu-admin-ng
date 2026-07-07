import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div class="page character-page">
      <h1>Personajes</h1>
      <p>Gestión de personajes y sus atributos.</p>
    </div>
  `,
  styles: [`
    .character-page { padding: 2rem; }
    h1 { margin: 0 0 1rem; font-size: 1.75rem; font-weight: 600; }
    p { color: var(--text-secondary); font-size: 1rem; }
  `]
})
export default class CharacterCrudComponent {}
