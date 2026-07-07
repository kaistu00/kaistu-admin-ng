import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div class="page universe-page">
      <h1>Universos</h1>
      <p>Gestión de universos narrativos.</p>
    </div>
  `,
  styles: [`
    .universe-page { padding: 2rem; }
    h1 { margin: 0 0 1rem; font-size: 1.75rem; font-weight: 600; }
    p { color: var(--text-secondary); font-size: 1rem; }
  `]
})
export default class UniverseListComponent {}
