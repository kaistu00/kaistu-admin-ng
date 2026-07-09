import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActiveUniverseService } from '../../services/active-universe.service';

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  color: string;
}

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export default class HomeComponent {
  protected readonly universeService = inject(ActiveUniverseService);

  protected readonly activity = signal<ActivityItem[]>([
    {
      id: '1',
      text: 'Personaje "Lyra" creado en universo Ethereal',
      time: 'Hace 2 horas',
      color: 'var(--purple)',
    },
    {
      id: '2',
      text: 'Escena "El Despertar" actualizada con nuevo diálogo',
      time: 'Hace 5 horas',
      color: 'var(--green)',
    },
    {
      id: '3',
      text: 'Universo "Neon Genesis" añadido al catálogo',
      time: 'Hace 1 día',
      color: 'var(--accent)',
    },
    {
      id: '4',
      text: '3 nuevos assets subidos al universo Starlight',
      time: 'Hace 2 días',
      color: 'var(--orange)',
    },
  ]);
}
