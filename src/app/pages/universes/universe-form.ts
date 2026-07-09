import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UniverseService } from '../../services/universe.service';

export interface ChipOption {
  label: string;
  description: string;
}

export interface DemographicOption {
  value: string;
  label: string;
  description: string;
}

export interface SubgenreOption {
  label: string;
  description: string;
  category: string;
}

export interface AestheticOption {
  label: string;
  description: string;
  category: string;
}

export interface UniverseFormData {
  name: string;
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
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const EXPLICIT_RATING_MAP: Record<string, string[]> = {
  Ecchi: ['Contenido sexual', 'Desnudez'],
  Erotica: ['Contenido sexual', 'Sexo explícito', 'Desnudez'],
  Hentai: ['Sexo explícito', 'Desnudez', 'Contenido sexual'],
};

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './universe-form.html',
  styleUrl: './universe-form.scss',
})
export default class UniverseFormComponent {
  private readonly universeService = inject(UniverseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly editSlug = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly toastMessage = signal('');

  protected readonly showModal = signal(false);
  protected readonly activeTab = signal<'basico' | 'demografia' | 'generos' | 'narrativa'>('basico');
  protected readonly mode = computed<'create' | 'edit' | 'view'>(() => {
    const slug = this.route.snapshot.params['slug'];
    if (!slug) return 'create';
    return this.router.url.endsWith('/edit') ? 'edit' : 'view';
  });
  protected readonly readonly = computed(() => this.mode() === 'view');
  protected readonly formData = signal<UniverseFormData>({
    name: '',
    prompt: '',
    demographic: '',
    genres: [],
    explicitGenres: [],
    subgenres: [],
    themes: [],
    aesthetics: [],
    contentWarnings: [],
    decisionIdeas: '',
    influenceIdeas: '',
  });

  protected readonly slug = computed(() => toSlug(this.formData().name));

  protected readonly demographicOptions: DemographicOption[] = [
    { value: 'shonen', label: 'Shōnen', description: 'Optimismo, superación, amistad — apto para jóvenes' },
    { value: 'seinen', label: 'Seinen', description: 'Temas adultos, ambigüedad moral, política — violencia permitida' },
    { value: 'shojo', label: 'Shōjo', description: 'Enfoque emocional, desarrollo de relaciones y monólogos internos' },
    { value: 'josei', label: 'Josei', description: 'Realismo maduro y cotidiano en relaciones humanas, sin idealizar' },
  ];

  protected readonly genreOptions: ChipOption[] = [
    { label: 'Action', description: 'Escenas dinámicas de combate y persecuciones' },
    { label: 'Adventure', description: 'Viajes, exploración y descubrimiento' },
    { label: 'Avant Garde', description: 'Experimental, abstracto y rompedor' },
    { label: 'Boys Love', description: 'Relaciones románticas entre hombres' },
    { label: 'Comedy', description: 'Humor y situaciones divertidas' },
    { label: 'Crime', description: 'Actividades delictivas, investigación criminal y mafia' },
    { label: 'Drama', description: 'Conflictos emocionales y tensión narrativa' },
    { label: 'Fantasy', description: 'Mundos mágicos, criaturas y elementos fantásticos' },
    { label: 'Girls Love', description: 'Relaciones románticas entre mujeres' },
    { label: 'Gourmet', description: 'Gastronomía, cocina y cultura culinaria' },
    { label: 'Historical', description: 'Ambientado en épocas pasadas reales' },
    { label: 'Horror', description: 'Suspenso, miedo y elementos perturbadores' },
    { label: 'Isekai', description: 'Transporte o reencarnación a otro mundo' },
    { label: 'Martial Arts', description: 'Artes marciales y combate cuerpo a cuerpo' },
    { label: 'Mecha', description: 'Robots gigantes y tecnología mecanizada' },
    { label: 'Military', description: 'Jerarquías castrenses, tácticas y guerra' },
    { label: 'Music', description: 'Música como elemento central de la trama' },
    { label: 'Mystery', description: 'Acertijos, investigación y revelaciones' },
    { label: 'Parody', description: 'Sátira y parodia de otras obras o géneros' },
    { label: 'Post-Apocalyptic', description: 'Supervivencia tras una catástrofe global' },
    { label: 'Psychological', description: 'Profundidad mental, traumas y conflictos internos' },
    { label: 'Romance', description: 'Relaciones sentimentales entre personajes' },
    { label: 'School', description: 'Ambientado en entornos escolares y académicos' },
    { label: 'Sci-Fi', description: 'Ciencia ficción, tecnología y futuros alternativos' },
    { label: 'Slice of Life', description: 'Situaciones cotidianas y realistas' },
    { label: 'Space Opera', description: 'Aventuras épicas interestelares con conflictos galácticos' },
    { label: 'Sports', description: 'Competencias atléticas y superación personal' },
    { label: 'Supernatural', description: 'Fenómenos más allá de lo natural' },
    { label: 'Suspense', description: 'Tensión mantenida e incertidumbre constante' },
    { label: 'Thriller', description: 'Suspenso intenso con giros y peligro constante' },
  ];

  protected readonly explicitGenreOptions: ChipOption[] = [
    { label: 'Ecchi', description: 'Sugerencia sexual ligera, fanservice sin desnudo explícito' },
    { label: 'Erotica', description: 'Contenido erótico con escenas sexuales implícitas o explícitas' },
    { label: 'Hentai', description: 'Contenido pornográfico explícito sin censura' },
  ];

  protected readonly subgenreOptions: SubgenreOption[] = [
    { label: 'Isekai clásico', description: 'Transporte a otro mundo por medios tradicionales', category: 'Isekai' },
    { label: 'Isekai inverso', description: 'Seres de otro mundo llegan al nuestro', category: 'Isekai' },
    { label: 'Isekai RPG', description: 'Isekai con mecánicas y estadísticas de RPG', category: 'Isekai' },
    { label: 'Reencarnación', description: 'Reencarnar en otro cuerpo tras la muerte', category: 'Isekai' },
    { label: 'Sistema / HUD / Stats', description: 'Interfaz de sistema visible con stats y niveles', category: 'Isekai' },
    { label: 'Mundo paralelo tecnológico', description: 'Mundo paralelo con tecnología avanzada', category: 'Isekai' },
    { label: 'Dark Fantasy', description: 'Fantasía oscura con tono sombrío y moral ambigua', category: 'Fantasía' },
    { label: 'High Fantasy', description: 'Épica fantástica con mundos grandiosos y magia poderosa', category: 'Fantasía' },
    { label: 'Low Fantasy', description: 'Fantasía de baja intensidad, mágia sutil y mundos realistas', category: 'Fantasía' },
    { label: 'Urban Fantasy', description: 'Elementos fantásticos en entornos urbanos modernos', category: 'Fantasía' },
    { label: 'Medieval Fantasy', description: 'Fantasía ambientada en época medieval', category: 'Fantasía' },
    { label: 'Cyberpunk', description: 'Alta tecnología y sociedad decadente', category: 'Sci-Fi' },
    { label: 'Biopunk', description: 'Tecnología basada en biología y genética', category: 'Sci-Fi' },
    { label: 'Space Exploration', description: 'Exploración del espacio exterior y nuevos mundos', category: 'Sci-Fi' },
    { label: 'Mecha Militar', description: 'Robots de combate con enfoque militar realista', category: 'Sci-Fi' },
    { label: 'Inteligencia Artificial', description: 'IA como elemento central de la trama', category: 'Sci-Fi' },
    { label: 'Distopía tecnológica', description: 'Sociedad futura opresiva dominada por la tecnología', category: 'Sci-Fi' },
    { label: 'Battle Royale', description: 'Combate a muerte entre participantes en un entorno cerrado', category: 'Acción / Aventura' },
    { label: 'Survival Game', description: 'Juegos de supervivencia con reglas y desafíos', category: 'Acción / Aventura' },
    { label: 'Dungeon Crawl', description: 'Exploración de mazmorras y mazmorras generadas', category: 'Acción / Aventura' },
    { label: 'Treasure Hunt', description: 'Búsqueda de tesoros y reliquias', category: 'Acción / Aventura' },
    { label: 'Mercenarios', description: 'Grupos de mercenarios y misiones', category: 'Acción / Aventura' },
    { label: 'Kaiju', description: 'Monstruos gigantes que amenazan la civilización', category: 'Acción / Aventura' },
    { label: 'Romance escolar', description: 'Romance ambientado en el instituto', category: 'Romance' },
    { label: 'Romance adulto', description: 'Relaciones románticas entre adultos', category: 'Romance' },
    { label: 'Romance dramático', description: 'Romance con conflictos emocionales intensos', category: 'Romance' },
    { label: 'Romance cómico', description: 'Romance ligero con situaciones cómicas', category: 'Romance' },
    { label: 'Boys Love', description: 'Relaciones románticas entre hombres', category: 'Romance' },
    { label: 'Girls Love', description: 'Relaciones románticas entre mujeres', category: 'Romance' },
    { label: 'Gore', description: 'Violencia gráfica y desmembramientos explícitos', category: 'Horror' },
    { label: 'Terror psicológico', description: 'Angustia mental y manipulación psicológica', category: 'Horror' },
    { label: 'Monstruos', description: 'Criaturas monstruosas como fuente de terror', category: 'Horror' },
    { label: 'Paranormal', description: 'Fenómenos paranormales y actividad sobrenatural', category: 'Horror' },
    { label: 'Slasher', description: 'Asesinos en serie y persecuciones mortales', category: 'Horror' },
    { label: 'Slice of School Life', description: 'Vida cotidiana en el instituto', category: 'School' },
    { label: 'Battle Academy', description: 'Academia donde se entrena para el combate', category: 'School' },
    { label: 'Club Activities', description: 'Actividades de clubes escolares', category: 'School' },
    { label: 'School Drama', description: 'Dramas y conflictos en el entorno escolar', category: 'School' },
    { label: 'Team Sports', description: 'Deportes de equipo como fútbol o baloncesto', category: 'Sports' },
    { label: 'Solo Sports', description: 'Deportes individuales como tenis o natación', category: 'Sports' },
    { label: 'High Stakes Competition', description: 'Competiciones de alto riesgo y gran presión', category: 'Sports' },
  ];

  protected readonly themeOptions: ChipOption[] = [
    { label: 'Adult Cast', description: 'Personajes principales adultos' },
    { label: 'Anthropomorphic', description: 'Animales humanizados o criaturas antropomorfas' },
    { label: 'CGDCT', description: 'Chicas lindas haciendo cosas lindas (Cute Girls Doing Cute Things)' },
    { label: 'Childcare', description: 'Crianza o cuidado de niños como eje narrativo' },
    { label: 'Combat Sports', description: 'Deportes de combate como boxeo, MMA o esgrima' },
    { label: 'Crossdressing', description: 'Personajes que visten ropa del género opuesto' },
    { label: 'Delinquents', description: 'Protagonistas o antagonistas con actitud rebelde o delincuente' },
    { label: 'Detective', description: 'Investigación de crímenes, misterios y casos' },
    { label: 'Educational', description: 'Contenido didáctico o de aprendizaje' },
    { label: 'Gag Humor', description: 'Comedia absurda, sketches y bromas rápidas' },
    { label: 'Gore', description: 'Violencia gráfica, desmembramientos y sangre explícita' },
    { label: 'Harem', description: 'Múltiples personajes interesados románticamente en uno central' },
    { label: 'High Stakes Game', description: 'Juegos mortales o de alto riesgo con reglas definidas' },
    { label: 'Historical', description: 'Ambientado en épocas pasadas reales' },
    { label: 'Idols (Female)', description: 'Industria del entretenimiento femenino, ídolos y conciertos' },
    { label: 'Idols (Male)', description: 'Industria del entretenimiento masculino, ídolos y conciertos' },
    { label: 'Isekai', description: 'Transporte o reencarnación a otro mundo' },
    { label: 'Iyashikei', description: 'Contenido sanador y relajante para aliviar el estrés' },
    { label: 'Love Polygon', description: 'Triángulos o polígonos amorosos complejos' },
    { label: 'Love Status Quo', description: 'Relaciones que avanzan lentamente sin confirmación' },
    { label: 'Magical Sex Shift', description: 'Cambio de género mágico o transformación corporal' },
    { label: 'Mahou Shoujo', description: 'Chicas mágicas con transformaciones y poderes especiales' },
    { label: 'Martial Arts', description: 'Artes marciales y combate cuerpo a cuerpo' },
    { label: 'Mecha', description: 'Robots gigantes y tecnología mecanizada' },
    { label: 'Medical', description: 'Entorno hospitalario, cirugías y drama médico' },
    { label: 'Military', description: 'Jerarquías castrenses, tácticas y guerra' },
    { label: 'Music', description: 'Música como elemento central de la trama' },
    { label: 'Mythology', description: 'Dioses, leyendas y mitos de diversas culturas' },
    { label: 'Organized Crime', description: 'Mafia, yakuza, carteles y crimen organizado' },
    { label: 'Otaku Culture', description: 'Referencias a la cultura friki, anime y manga' },
    { label: 'Parody', description: 'Sátira y parodia de otras obras o géneros' },
    { label: 'Performing Arts', description: 'Artes escénicas como teatro, danza o circo' },
    { label: 'Pets', description: 'Mascotas y animales como parte central de la historia' },
    { label: 'Psychological', description: 'Profundidad mental, traumas y conflictos internos' },
    { label: 'Racing', description: 'Carreras de vehículos y competiciones de velocidad' },
    { label: 'Reincarnation', description: 'Reencarnación en otro cuerpo o mundo' },
    { label: 'Reverse Harem', description: 'Múltiples personajes masculinos interesados en una protagonista' },
    { label: 'Samurai', description: 'Guerreros samurái y código bushido' },
    { label: 'School', description: 'Ambientado en entornos escolares y académicos' },
    { label: 'Showbiz', description: 'Industria del espectáculo, fama y entretenimiento' },
    { label: 'Space', description: 'Viajes interestelares, colonias y exploración cósmica' },
    { label: 'Strategy Game', description: 'Juegos de estrategia, táctica y planificación' },
    { label: 'Super Power', description: 'Personajes con habilidades sobrehumanas' },
    { label: 'Survival', description: 'Supervivencia en condiciones extremas o hostiles' },
    { label: 'Team Sports', description: 'Deportes de equipo como fútbol, baloncesto o voleibol' },
    { label: 'Time Travel', description: 'Viajes en el tiempo y paradojas temporales' },
    { label: 'Urban Fantasy', description: 'Fantasía ambientada en entornos urbanos modernos' },
    { label: 'Vampire', description: 'Vampiros, chupasangres y criaturas de la noche' },
    { label: 'Video Game', description: 'Mundos inspirados en videojuegos o game-like' },
    { label: 'Villainess', description: 'Protagonista antagonista o villana redimible' },
    { label: 'Visual Arts', description: 'Arte visual, pintura, diseño y creatividad' },
    { label: 'Workplace', description: 'Entorno laboral y dinámicas de oficina' },
  ];

  protected readonly aestheticOptions: AestheticOption[] = [
    { label: 'Romper la cuarta pared', description: 'Los personajes interactúan directamente con la audiencia', category: 'Estéticas narrativas' },
    { label: 'Meta-narrativa', description: 'La historia reflexiona sobre sí misma como obra ficticia', category: 'Estéticas narrativas' },
    { label: 'Narrador poco fiable', description: 'El narrador distorsiona u oculta la verdad', category: 'Estéticas narrativas' },
    { label: 'Found Footage', description: 'Material grabado como si fuera real y encontrado', category: 'Estéticas narrativas' },
    { label: 'Mockumentary', description: 'Falso documental con tono humorístico o crítico', category: 'Estéticas narrativas' },
    { label: 'Surrealismo', description: 'Elementos oníricos e irreales que desafían la lógica', category: 'Estéticas narrativas' },
    { label: 'Absurdismo', description: 'Situaciones ilógicas que exploran el sinsentido', category: 'Estéticas narrativas' },
    { label: 'Sátira', description: 'Crítica mordaz mediante humor e ironía', category: 'Estéticas narrativas' },
    { label: 'Parodia visual', description: 'Imitación humorística de estilos visuales conocidos', category: 'Estéticas narrativas' },
    { label: 'Minimalismo', description: 'Estilo visual y narrativo reducido a lo esencial', category: 'Estéticas narrativas' },
    { label: 'Estética teatral', description: 'Puesta en escena que evoca el teatro', category: 'Estéticas narrativas' },
    { label: 'Estética cinematográfica', description: 'Composición visual inspirada en el cine clásico', category: 'Estéticas narrativas' },
    { label: 'Estética retro (80s, 90s, Y2K)', description: 'Nostalgia visual de décadas pasadas', category: 'Estéticas narrativas' },
    { label: 'Estética VHS / CRT', description: 'Grano y distorsión de cintas VHS o monitores CRT', category: 'Estéticas narrativas' },
    { label: 'Estética glitch', description: 'Errores digitales y distorsión de píxeles', category: 'Estéticas narrativas' },
    { label: 'Estética analógica', description: 'Texturas y calidez de lo analógico frente a lo digital', category: 'Estéticas narrativas' },
    { label: 'Estética collage', description: 'Composición visual a base de recortes y superposiciones', category: 'Estéticas narrativas' },
    { label: 'Cyberpunk', description: 'Alta tecnología en un entorno decadente y oscuro', category: 'Estéticas visuales' },
    { label: 'Steampunk', description: 'Tecnología victoriana con engranajes y vapor', category: 'Estéticas visuales' },
    { label: 'Dieselpunk', description: 'Estética de entreguerras con motores y metal', category: 'Estéticas visuales' },
    { label: 'Biopunk', description: 'Tecnología orgánica y manipulación genética', category: 'Estéticas visuales' },
    { label: 'Solarpunk', description: 'Futuro sostenible con energías renovables y naturaleza', category: 'Estéticas visuales' },
    { label: 'Post-apocalíptico', description: 'Ruinas y supervivencia tras el colapso', category: 'Estéticas visuales' },
    { label: 'Medieval', description: 'Castillos, caballeros y estética feudal', category: 'Estéticas visuales' },
    { label: 'Feudal japonés', description: 'Ambientación en el Japón de samuráis y shogunes', category: 'Estéticas visuales' },
    { label: 'Futurista', description: 'Arquitectura limpia y tecnología avanzada', category: 'Estéticas visuales' },
    { label: 'Espacial', description: 'Naves estelares y paisajes cósmicos', category: 'Estéticas visuales' },
    { label: 'Dark Fantasy', description: 'Fantasía sombría con tono lúgubre', category: 'Estéticas visuales' },
    { label: 'High Fantasy', description: 'Fantasía épica y grandiosa', category: 'Estéticas visuales' },
    { label: 'Urban Fantasy', description: 'Magia y criaturas en ciudades modernas', category: 'Estéticas visuales' },
    { label: 'Gótico', description: 'Arquitectura oscura, catedrales y ambientes lúgubres', category: 'Estéticas visuales' },
    { label: 'Noir', description: 'Sombras marcadas, detective y cine negro', category: 'Estéticas visuales' },
    { label: 'Paleta pastel', description: 'Colores suaves y tonos apastelados', category: 'Estéticas visuales' },
    { label: 'Paleta neón', description: 'Colores fluorescentes y luces de neón', category: 'Estéticas visuales' },
    { label: 'Monocromo', description: 'Un solo color dominante o escala de grises', category: 'Estéticas visuales' },
    { label: 'Sepia', description: 'Tono marrón antiguo que evoca fotografía vintage', category: 'Estéticas visuales' },
    { label: 'Cute / Kawaii', description: 'Estilo adorable y tierno con formas redondeadas', category: 'Estéticas visuales' },
    { label: 'Chibi', description: 'Personajes deformados y súper expresivos', category: 'Estéticas visuales' },
    { label: 'Super-deformed', description: 'Estilo de personajes con cabezas grandes y cuerpos pequeños', category: 'Estéticas visuales' },
    { label: 'Realista', description: 'Proporciones y detalles realistas', category: 'Estéticas visuales' },
    { label: 'Semi-realista', description: 'Realismo estilizado con toques artísticos', category: 'Estéticas visuales' },
    { label: 'Cartoon', description: 'Estilo caricaturesco y exagerado', category: 'Estéticas visuales' },
    { label: 'Pixel art', description: 'Gráficos basados en píxeles visibles', category: 'Estéticas visuales' },
    { label: 'Comic-style', description: 'Estilo de cómic con viñetas y tramas', category: 'Estéticas visuales' },

    { label: 'Episódico', description: 'Historia contada en episodios autoconclusivos', category: 'Estéticas de estructura narrativa' },
    { label: 'Antología', description: 'Colección de historias independientes con tema común', category: 'Estéticas de estructura narrativa' },
    { label: 'Narrativa circular', description: 'La historia termina donde empezó', category: 'Estéticas de estructura narrativa' },
    { label: 'Narrativa fragmentada', description: 'Historia contada en piezas desordenadas temporalmente', category: 'Estéticas de estructura narrativa' },
    { label: 'Narrativa no lineal', description: 'Saltos temporales sin orden cronológico', category: 'Estéticas de estructura narrativa' },
    { label: 'Flashback-driven', description: 'Impulsada principalmente por flashbacks', category: 'Estéticas de estructura narrativa' },
    { label: 'Narrativa coral', description: 'Múltiples protagonistas con historias entrelazadas', category: 'Estéticas de estructura narrativa' },
    { label: 'POV múltiple', description: 'La historia se cuenta desde varios puntos de vista', category: 'Estéticas de estructura narrativa' },
    { label: 'Narrativa silenciosa', description: 'Historia contada sin diálogos apenas', category: 'Estéticas de estructura narrativa' },
    { label: 'Narrativa contemplativa', description: 'Ritmo pausado que invita a la reflexión', category: 'Estéticas de estructura narrativa' },
  ];

  protected readonly contentWarningOptions: ChipOption[] = [
    { label: 'Lenguaje soez', description: 'Vocabulario grosero o insultos frecuentes' },
    { label: 'Violencia', description: 'Peleas, agresiones y conflicto físico' },
    { label: 'Violencia extrema', description: 'Gore, desmembramientos y escenas explícitas' },
    { label: 'Contenido sexual', description: 'Sugerencia sexual, insinuaciones o escenas suaves' },
    { label: 'Sexo explícito', description: 'Actos sexuales mostrados directamente' },
    { label: 'Desnudez', description: 'Cuerpos desnudos sin contexto sexual' },
    { label: 'Drogas y alcohol', description: 'Consumo de sustancias o embriaguez' },
    { label: 'Terror psicológico', description: 'Angustia mental, paranoia y manipulación' },
    { label: 'Discriminación', description: 'Prejuicios raciales, sociales o de género' },
  ];

  async ngOnInit() {
    const slug = this.route.snapshot.params['slug'];
    if (slug) {
      this.editSlug.set(slug);
      this.loading.set(true);
      try {
        const universe = await firstValueFrom(this.universeService.getBySlug(slug));
        if (universe) {
          const form = universe.idea_form;
          this.formData.set({
            name: universe.name,
            prompt: form?.prompt ?? '',
            demographic: form?.demographic ?? '',
            genres: form?.genres ?? [],
            explicitGenres: form?.explicitGenres ?? [],
            subgenres: form?.subgenres ?? [],
            themes: form?.themes ?? [],
            aesthetics: form?.aesthetics ?? [],
            contentWarnings: form?.contentWarnings ?? [],
            decisionIdeas: form?.decisionIdeas ?? '',
            influenceIdeas: form?.influenceIdeas ?? '',
          });
        }
      } catch {
        this.error.set('Error al cargar el universo');
      } finally {
        this.loading.set(false);
      }
    }
  }

  protected toggleGenre(genre: string): void {
    this.formData.update((d) => {
      const genres = d.genres.includes(genre)
        ? d.genres.filter((g) => g !== genre)
        : [...d.genres, genre];
      return { ...d, genres };
    });
  }

  protected toggleExplicitGenre(explicit: string): void {
    this.formData.update((d) => {
      const explicitGenres = d.explicitGenres.includes(explicit)
        ? d.explicitGenres.filter((e) => e !== explicit)
        : [...d.explicitGenres, explicit];
      const autoWarnings = EXPLICIT_RATING_MAP[explicit] ?? [];
      let contentWarnings = [...d.contentWarnings];
      if (explicitGenres.includes(explicit)) {
        for (const w of autoWarnings) {
          if (!contentWarnings.includes(w)) contentWarnings.push(w);
        }
      } else {
        const stillSelected = new Set(
          Object.entries(EXPLICIT_RATING_MAP)
            .filter(([k]) => explicitGenres.includes(k))
            .flatMap(([, v]) => v),
        );
        const manualWarnings = d.contentWarnings.filter(
          (w) => !autoWarnings.includes(w) || stillSelected.has(w),
        );
        contentWarnings = [...new Set(manualWarnings)];
      }
      return { ...d, explicitGenres, contentWarnings };
    });
  }

  protected toggleSubgenre(subgenre: string): void {
    this.formData.update((d) => {
      const subgenres = d.subgenres.includes(subgenre)
        ? d.subgenres.filter((s) => s !== subgenre)
        : [...d.subgenres, subgenre];
      return { ...d, subgenres };
    });
  }

  protected toggleTheme(theme: string): void {
    this.formData.update((d) => {
      const themes = d.themes.includes(theme)
        ? d.themes.filter((t) => t !== theme)
        : [...d.themes, theme];
      return { ...d, themes };
    });
  }

  protected toggleAesthetic(aesthetic: string): void {
    this.formData.update((d) => {
      const aesthetics = d.aesthetics.includes(aesthetic)
        ? d.aesthetics.filter((a) => a !== aesthetic)
        : [...d.aesthetics, aesthetic];
      return { ...d, aesthetics };
    });
  }

  protected onInput(field: keyof UniverseFormData, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.formData.update((d) => ({ ...d, [field]: value }));
  }

  protected setDemographic(value: string): void {
    this.formData.update((d) => ({ ...d, demographic: value }));
  }

  protected toggleContentWarning(warning: string): void {
    this.formData.update((d) => {
      const contentWarnings = d.contentWarnings.includes(warning)
        ? d.contentWarnings.filter((w) => w !== warning)
        : [...d.contentWarnings, warning];
      return { ...d, contentWarnings };
    });
  }

  protected getRatingLabel(): string {
    const explicit = this.formData().explicitGenres;
    if (explicit.includes('Hentai')) return '+18';
    if (explicit.includes('Erotica')) return '+18';
    if (explicit.includes('Ecchi')) return '+16';
    const w = this.formData().contentWarnings;
    if (w.includes('Sexo explícito') || w.includes('Violencia extrema')) return '+18';
    if (w.includes('Contenido sexual') || w.includes('Violencia') || w.includes('Drogas y alcohol')) return '+16';
    if (w.includes('Lenguaje soez') || w.includes('Terror psicológico') || w.includes('Discriminación')) return '+13';
    if (w.length === 0) return 'Todos los públicos';
    return '+13';
  }

  protected readonly subgenreCategories: string[] = [
    'Isekai', 'Fantasía', 'Sci-Fi', 'Acción / Aventura', 'Romance', 'Horror', 'School', 'Sports',
  ];

  protected readonly aestheticCategories: string[] = [
    'Estéticas narrativas', 'Estéticas visuales', 'Estéticas de estructura narrativa',
  ];

  protected subgenresByCategory(category: string): SubgenreOption[] {
    return this.subgenreOptions.filter((s) => s.category === category);
  }

  protected aestheticsByCategory(category: string): AestheticOption[] {
    return this.aestheticOptions.filter((a) => a.category === category);
  }

  protected readonly payloadJson = computed(() =>
    JSON.stringify(
      { ...this.formData(), slug: this.slug(), rating: this.getRatingLabel() },
      null,
      2,
    ),
  );

  protected goToEdit(): void {
    const slug = this.editSlug();
    if (slug) this.router.navigate(['/universes', slug, 'edit']);
  }

  protected async deleteUniverse(): Promise<void> {
    const slug = this.editSlug();
    if (!slug || !confirm('¿Mover este universo a la papelera?')) return;
    try {
      await firstValueFrom(this.universeService.delete(slug));
      this.router.navigate(['/universes']);
    } catch {
      this.error.set('Error al eliminar');
    }
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.showModal.set(true);
  }

  protected async confirmSave(): Promise<void> {
    await this.doSubmit();
  }

  private async doSubmit(): Promise<void> {
    const data = this.formData();
    const slug = this.slug();
    if (!data.name.trim()) return;

    this.saving.set(true);
    this.error.set('');

    try {
      const payload = {
        slug,
        name: data.name.trim(),
        status: 'idea_draft',
        idea_form: {
          prompt: data.prompt,
          demographic: data.demographic,
          genres: data.genres,
          explicitGenres: data.explicitGenres,
          subgenres: data.subgenres,
          themes: data.themes,
          aesthetics: data.aesthetics,
          contentWarnings: data.contentWarnings,
          decisionIdeas: data.decisionIdeas,
          influenceIdeas: data.influenceIdeas,
          rating: this.getRatingLabel(),
        },
      };

      const editSlug = this.editSlug();
      if (editSlug) {
        await firstValueFrom(this.universeService.update(editSlug, payload));
      } else {
        await firstValueFrom(this.universeService.create(payload));
      }

      this.showModal.set(false);
      this.toastMessage.set(editSlug ? 'Universo actualizado correctamente' : 'Universo creado correctamente');
      setTimeout(() => this.router.navigate(['/universes']), 1200);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }

  protected closeModal(): void {
    this.showModal.set(false);
  }
}
