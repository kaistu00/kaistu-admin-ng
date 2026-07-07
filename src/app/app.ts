import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ActiveUniverseService } from './services/active-universe.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly universeService = inject(ActiveUniverseService);

  protected onUniverseChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const universeId = select.value;
    const universe = this.universeService
      .universes()
      .find((u) => u.id === universeId);
    if (universe) {
      this.universeService.setActiveUniverse(universe);
    }
  }
}
