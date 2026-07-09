import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UniverseService, UniverseListItem } from '../../services/universe.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './universe-list.html',
  styleUrl: './universe-list.scss',
})
export default class UniverseListComponent {
  private readonly universeService = inject(UniverseService);
  private readonly router = inject(Router);

  protected readonly universes = signal<UniverseListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const list = await firstValueFrom(this.universeService.getAll());
      this.universes.set(list);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al cargar universos');
    } finally {
      this.loading.set(false);
    }
  }

  protected async deleteUniverse(slug: string, event: Event) {
    event.stopPropagation();
    if (!confirm('¿Mover este universo a la papelera?')) return;
    try {
      await firstValueFrom(this.universeService.delete(slug));
      await this.load();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  protected editUniverse(slug: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/universes', slug, 'edit']);
  }

  protected viewUniverse(slug: string) {
    this.router.navigate(['/universes', slug]);
  }

  protected statusClass(status: string): string {
    const map: Record<string, string> = { idea_draft: 'draft', in_progress: 'progress', completed: 'done' };
    return map[status] ?? 'draft';
  }

  protected formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString();
  }
}
