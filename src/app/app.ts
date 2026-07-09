import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { ActiveUniverseService } from './services/active-universe.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly universeService = inject(ActiveUniverseService);
  protected readonly pageTitle = signal('Dashboard');
  protected readonly showScrollTop = signal(false);

  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.pageTitle.set(this.getTitleFromUrl(e.urlAfterRedirects));
        this.showScrollTop.set(false);
      });
  }

  protected onScroll(event: Event): void {
    const el = event.currentTarget as HTMLElement;
    this.showScrollTop.set(el.scrollTop > 300);
  }

  protected scrollToTop(): void {
    document.querySelector('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  private getTitleFromUrl(url: string): string {
    if (url === '/' || url === '') return 'Dashboard';
    if (url.startsWith('/universes')) return 'Universos';
    if (url.startsWith('/worlds')) return 'Mundos';
    if (url.startsWith('/characters')) return 'Personajes';
    if (url.startsWith('/studio-workers')) return 'Trabajadores IA';
    return 'Dashboard';
  }
}
