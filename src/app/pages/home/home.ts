import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div class="page home-page">
      <h1>Dashboard</h1>
      <p>Bienvenido al panel de administración de KAISTU Studio.</p>
    </div>
  `,
  styles: [`
    .home-page { padding: 2rem; }
    h1 { margin: 0 0 1rem; font-size: 1.75rem; font-weight: 600; }
    p { color: var(--text-secondary); font-size: 1rem; }
  `]
})
export default class HomeComponent {}
