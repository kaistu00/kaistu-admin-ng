import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { UniverseService, UniverseListItem, type IdeaForm } from '../../services/universe.service';

interface ChipOption { label: string; description: string }
interface DemographicOption { value: string; label: string; description: string }
interface SubgenreOption { label: string; description: string; category: string }
interface AestheticOption { label: string; description: string; category: string }

const demographicOptions: DemographicOption[] = [
  { value: 'shonen', label: 'Shōnen', description: 'Optimismo, superación, amistad — apto para jóvenes' },
  { value: 'seinen', label: 'Seinen', description: 'Temas adultos, ambigüedad moral, política — violencia permitida' },
  { value: 'shojo', label: 'Shōjo', description: 'Enfoque emocional, desarrollo de relaciones y monólogos internos' },
  { value: 'josei', label: 'Josei', description: 'Realismo maduro y cotidiano en relaciones humanas, sin idealizar' },
];
const genreOptions: ChipOption[] = [
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
const explicitGenreOptions: ChipOption[] = [
  { label: 'Ecchi', description: 'Sugerencia sexual ligera, fanservice sin desnudo explícito' },
  { label: 'Erotica', description: 'Contenido erótico con escenas sexuales implícitas o explícitas' },
  { label: 'Hentai', description: 'Contenido pornográfico explícito sin censura' },
];
const subgenreOptions: SubgenreOption[] = [
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
const themeOptions: ChipOption[] = [
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
const aestheticOptions: AestheticOption[] = [
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
  { label: 'Mundo paralelo', description: 'Realidad alternativa coexistiendo con la nuestra', category: 'Estéticas de mundo' },
  { label: 'Mundo virtual / VRMMO', description: 'Mundo digital inmersivo tipo MMO', category: 'Estéticas de mundo' },
  { label: 'Mundo RPG', description: 'Mundo con mecánicas de juego de rol', category: 'Estéticas de mundo' },
  { label: 'Mundo con sistema / HUD / stats', description: 'Interfaz visible con estadísticas y habilidades', category: 'Estéticas de mundo' },
  { label: 'Mundo de reencarnación', description: 'Mundo al que se llega tras reencarnar', category: 'Estéticas de mundo' },
  { label: 'Mundo tecnológico avanzado', description: 'Sociedad con tecnología muy superior a la actual', category: 'Estéticas de mundo' },
  { label: 'Mundo decadente', description: 'Civilización en declive moral o material', category: 'Estéticas de mundo' },
  { label: 'Mundo utópico', description: 'Sociedad perfecta e idealizada', category: 'Estéticas de mundo' },
  { label: 'Mundo distópico', description: 'Sociedad opresiva y totalitaria', category: 'Estéticas de mundo' },
  { label: 'Mundo alienígena', description: 'Planeta habitado por formas de vida extraterrestre', category: 'Estéticas de mundo' },
  { label: 'Mundo submarino', description: 'Civilizaciones y ecosistemas bajo el mar', category: 'Estéticas de mundo' },
  { label: 'Mundo celestial', description: 'Reinos divinos o angelicales en las alturas', category: 'Estéticas de mundo' },
  { label: 'Mundo demoníaco', description: 'Infiernos y reinos de demonios', category: 'Estéticas de mundo' },
  { label: 'Mundo escolar', description: 'Institutos y universidades como entorno central', category: 'Estéticas de mundo' },
  { label: 'Mundo laboral', description: 'Oficinas y entornos profesionales', category: 'Estéticas de mundo' },
  { label: 'Mundo idol', description: 'Industria del entretenimiento y cultura idol', category: 'Estéticas de mundo' },
  { label: 'Mundo gourmet', description: 'Gastronomía y cultura culinaria', category: 'Estéticas de mundo' },
  { label: 'Mundo militar', description: 'Entorno castrense y operaciones militares', category: 'Estéticas de mundo' },
  { label: 'Mundo deportivo', description: 'Competiciones y cultura deportiva', category: 'Estéticas de mundo' },
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
const contentWarningOptions: ChipOption[] = [
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

const EXPLICIT_RATING_MAP: Record<string, string[]> = {
  Ecchi: ['Contenido sexual', 'Desnudez'],
  Erotica: ['Contenido sexual', 'Sexo explícito', 'Desnudez'],
  Hentai: ['Sexo explícito', 'Desnudez', 'Contenido sexual'],
};

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="editor-page">
      <header class="editor-header">
        <a class="btn-back" routerLink="/universes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Volver
        </a>
        <div class="editor-header-text">
          <h1 class="editor-title">{{ universe()?.name ?? 'Cargando...' }}</h1>
          <span class="status-badge" [class]="statusClass(universe()?.status ?? '')">{{ universe()?.status?.replace('_', ' ') ?? '' }}</span>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-state"><div class="spinner"></div><p>Cargando...</p></div>
      } @else if (error()) {
        <div class="error-banner">{{ error() }}</div>
      } @else {
        <nav class="tabs">
          <button class="tab" [class.active]="activeTab() === 'idea'" (click)="activeTab.set('idea')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="tab-icon">
              <path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
            </svg>
            Idea Inicial
          </button>
          <button class="tab" disabled>Configuración</button>
          <button class="tab" disabled>Personajes</button>
          <button class="tab" disabled>Más...</button>
        </nav>

        <div class="tab-content">
          @if (editable()) {
            <form class="editor-form" (submit)="onSave($event)">
              @if (toastMessage()) {
                <div class="toast-overlay" (click)="toastMessage.set('')">
                  <div class="toast">{{ toastMessage() }}</div>
                </div>
              }
              @if (saveError()) {
                <div class="error-banner">{{ saveError() }}</div>
              }

              <section class="form-card">
                <h2 class="card-title">Premisa <span class="card-subtitle">Idea base del universo</span></h2>
                <div class="field">
                  <textarea class="field-textarea" rows="4" [value]="formData().prompt" (input)="onInput('prompt', $event)"></textarea>
                </div>
              </section>

              <section class="form-card">
                <h2 class="card-title">Demografía <span class="card-subtitle">Público objetivo</span></h2>
                <div class="radio-group">
                  @for (demo of demographicOptions; track demo.value) {
                    <label class="radio-option" [class.active]="formData().demographic === demo.value">
                      <input type="radio" name="demo" class="radio-input" [value]="demo.value" [checked]="formData().demographic === demo.value" (change)="setDemographic(demo.value)"/>
                      <div class="radio-content">
                        <span class="radio-label">{{ demo.label }}</span>
                        <span class="radio-desc">{{ demo.description }}</span>
                      </div>
                    </label>
                  }
                </div>
              </section>

              <section class="form-card">
                <h2 class="card-title">Géneros <span class="card-subtitle">Macro-géneros</span></h2>
                <div class="chips-grid">
                  @for (g of genreOptions; track g.label) {
                    <button type="button" class="chip" [class.selected]="formData().genres.includes(g.label)" (click)="toggleGenre(g.label)">{{ g.label }}</button>
                  }
                </div>
                <p class="card-desc" style="margin-top: 1rem;">Géneros explícitos</p>
                <div class="chips-grid">
                  @for (e of explicitGenreOptions; track e.label) {
                    <button type="button" class="chip chip--explicit" [class.selected]="formData().explicitGenres.includes(e.label)" (click)="toggleExplicitGenre(e.label)">{{ e.label }}</button>
                  }
                </div>
              </section>

              <section class="form-card">
                <h2 class="card-title">Subgéneros</h2>
                @for (cat of subgenreCategories; track cat) {
                  <h3 class="subcategory-title">{{ cat }}</h3>
                  <div class="chips-grid">
                    @for (s of subgenresByCategory(cat); track s.label) {
                      <button type="button" class="chip" [class.selected]="formData().subgenres.includes(s.label)" (click)="toggleSubgenre(s.label)">{{ s.label }}</button>
                    }
                  </div>
                }
              </section>

              <section class="form-card">
                <h2 class="card-title">Tropos / Temas</h2>
                <div class="chips-grid">
                  @for (t of themeOptions; track t.label) {
                    <button type="button" class="chip" [class.selected]="formData().themes.includes(t.label)" (click)="toggleTheme(t.label)">{{ t.label }}</button>
                  }
                </div>
              </section>

              <section class="form-card">
                <h2 class="card-title">Estéticas</h2>
                @for (cat of aestheticCategories; track cat) {
                  <h3 class="subcategory-title">{{ cat }}</h3>
                  <div class="chips-grid">
                    @for (a of aestheticsByCategory(cat); track a.label) {
                      <button type="button" class="chip" [class.selected]="formData().aesthetics.includes(a.label)" (click)="toggleAesthetic(a.label)">{{ a.label }}</button>
                    }
                  </div>
                }
              </section>

              <section class="form-card">
                <h2 class="card-title">Advertencias de contenido</h2>
                <div class="chips-grid">
                  @for (w of contentWarningOptions; track w.label) {
                    <button type="button" class="chip" [class.selected]="formData().contentWarnings.includes(w.label)" (click)="toggleContentWarning(w.label)">{{ w.label }}</button>
                  }
                </div>
                <div class="rating-badge">
                  <span class="rating-label">Clasificación</span>
                  <span class="rating-value">{{ getRatingLabel() }}</span>
                </div>
              </section>

              <section class="form-card">
                <h2 class="card-title">Directrices de dinámica</h2>
                <div class="field">
                  <label class="field-label">Ideas para Sistema de Decisiones</label>
                  <textarea class="field-textarea" rows="3" [value]="formData().decisionIdeas" (input)="onInput('decisionIdeas', $event)"></textarea>
                </div>
                <div class="field">
                  <label class="field-label">Ideas para Influencias Externas</label>
                  <textarea class="field-textarea" rows="3" [value]="formData().influenceIdeas" (input)="onInput('influenceIdeas', $event)"></textarea>
                </div>
              </section>

              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-sm"></span> }
                  {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </form>
          } @else {
            <div class="readonly-banner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lock-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>El universo ya no está en estado <strong>idea_draft</strong>. La idea inicial es readonly.</span>
            </div>

            <section class="form-card">
              <h2 class="card-title">Premisa</h2>
              <p class="readonly-text">{{ ideaForm()?.prompt ?? '—' }}</p>
            </section>

            <section class="form-card">
              <h2 class="card-title">Demografía</h2>
              <span class="readonly-chip">{{ ideaForm()?.demographic ?? '—' }}</span>
            </section>

            <section class="form-card">
              <h2 class="card-title">Géneros</h2>
              <div class="chip-list-readonly">@for (g of ideaForm()?.genres; track g) { <span class="chip-static">{{ g }}</span> }</div>
              @if (ideaForm()?.explicitGenres?.length) {
                <p class="card-desc" style="margin-top:0.75rem">Explícitos</p>
                <div class="chip-list-readonly">@for (e of ideaForm()?.explicitGenres; track e) { <span class="chip-static chip-static--explicit">{{ e }}</span> }</div>
              }
            </section>

            <section class="form-card">
              <h2 class="card-title">Subgéneros</h2>
              <div class="chip-list-readonly">@for (s of ideaForm()?.subgenres; track s) { <span class="chip-static">{{ s }}</span> }</div>
            </section>

            <section class="form-card">
              <h2 class="card-title">Tropos / Temas</h2>
              <div class="chip-list-readonly">@for (t of ideaForm()?.themes; track t) { <span class="chip-static">{{ t }}</span> }</div>
            </section>

            <section class="form-card">
              <h2 class="card-title">Estéticas</h2>
              <div class="chip-list-readonly">@for (a of ideaForm()?.aesthetics; track a) { <span class="chip-static">{{ a }}</span> }</div>
            </section>

            <section class="form-card">
              <h2 class="card-title">Advertencias de contenido</h2>
              <div class="chip-list-readonly">@for (w of ideaForm()?.contentWarnings; track w) { <span class="chip-static chip-static--warn">{{ w }}</span> }</div>
              <div class="rating-badge" style="margin-top:0.75rem">
                <span class="rating-label">Clasificación</span>
                <span class="rating-value">{{ ideaForm()?.rating ?? '—' }}</span>
              </div>
            </section>

            <section class="form-card">
              <h2 class="card-title">Directrices de dinámica</h2>
              @if (ideaForm()?.decisionIdeas) {
                <div class="field"><label class="field-label">Sistema de Decisiones</label><p class="readonly-text">{{ ideaForm()?.decisionIdeas }}</p></div>
              }
              @if (ideaForm()?.influenceIdeas) {
                <div class="field"><label class="field-label">Influencias Externas</label><p class="readonly-text">{{ ideaForm()?.influenceIdeas }}</p></div>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .editor-page { max-width: 720px; margin: 0 auto; padding: 2rem; }
    .editor-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1.5rem; }
    .btn-back { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); color: var(--text-secondary); text-decoration: none; flex-shrink: 0; margin-top: 0.15rem; transition: all 0.2s ease; }
    .btn-back:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-tertiary); }
    .btn-back svg { width: 18px; height: 18px; }
    .editor-header-text { flex: 1; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .editor-title { margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; }
    .status-badge { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.2rem 0.5rem; border-radius: var(--radius-sm); }
    .status-badge.draft { background: rgba(234,179,8,0.15); color: #eab308; }
    .status-badge.progress { background: rgba(0,210,255,0.15); color: var(--accent); }
    .status-badge.done { background: rgba(34,197,94,0.15); color: #22c55e; }
    .status-badge.deleted { background: rgba(239,68,68,0.15); color: #ef4444; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: var(--text-secondary); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-banner { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #ef4444; font-size: 0.85rem; font-weight: 500; margin-bottom: 1rem; }
    .toast-overlay { position: fixed; inset: 0; display: flex; align-items: flex-start; justify-content: center; z-index: 9999; pointer-events: none; padding-top: 5rem; }
    .toast { background: rgba(34,197,94,0.95); color: #fff; padding: 0.75rem 1.5rem; border-radius: var(--radius-md); font-size: 0.9rem; font-weight: 600; box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: toastIn 0.3s ease; pointer-events: auto; cursor: pointer; }
    @keyframes toastIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

    .tabs { display: flex; gap: 0.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0; }
    .tab { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); font-size: 0.85rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 0.2s ease; margin-bottom: -1px; }
    .tab:hover { color: var(--text-primary); }
    .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab:disabled { opacity: 0.4; cursor: not-allowed; }
    .tab-icon { width: 18px; height: 18px; }

    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .editor-form { display: flex; flex-direction: column; gap: 1.25rem; }

    .readonly-banner { display: flex; align-items: center; gap: 0.6rem; background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.25); border-radius: var(--radius-md); padding: 0.75rem 1rem; color: #eab308; font-size: 0.85rem; }
    .lock-icon { width: 18px; height: 18px; flex-shrink: 0; }

    .form-card { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; }
    .card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; letter-spacing: -0.01em; }
    .card-subtitle { font-size: 0.75rem; font-weight: 400; color: var(--text-muted); letter-spacing: normal; }
    .card-desc { margin: 0 0 1rem; font-size: 0.8rem; color: var(--text-muted); }
    .subcategory-title { margin: 1rem 0 0.5rem; font-size: 0.78rem; font-weight: 600; color: var(--accent); letter-spacing: 0.04em; text-transform: uppercase; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field + .field { margin-top: 1rem; }
    .field-label { font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); }
    .field-textarea { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; color: var(--text-primary); font-size: 0.875rem; font-family: inherit; outline: none; resize: vertical; min-height: 80px; transition: border-color 0.2s ease; line-height: 1.5; }
    .field-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }

    .radio-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .radio-option { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.85rem 1rem; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; }
    .radio-option:hover { border-color: var(--border-hover); }
    .radio-option.active { border-color: var(--accent); background: var(--accent-dim); }
    .radio-input { appearance: none; -webkit-appearance: none; width: 18px; height: 18px; border: 2px solid var(--text-muted); border-radius: 50%; margin-top: 0.1rem; flex-shrink: 0; cursor: pointer; transition: all 0.2s ease; position: relative; }
    .radio-input:checked { border-color: var(--accent); }
    .radio-input:checked::after { content: ''; position: absolute; top: 3px; left: 3px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent-glow); }
    .radio-content { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; }
    .radio-label { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .radio-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; }

    .chips-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip { padding: 0.4rem 0.85rem; border-radius: var(--radius-xl); border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-size: 0.8rem; font-weight: 500; font-family: inherit; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
    .chip:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .chip.selected { background: var(--accent-dim); border-color: var(--border-accent); color: var(--accent); }
    .chip--explicit { border-color: #8b2252; color: #e04090; }
    .chip--explicit:hover { border-color: #e04090; color: #ff6bb5; }
    .chip--explicit.selected { background: rgba(224,64,144,0.15); border-color: #e04090; color: #ff6bb5; box-shadow: 0 0 12px rgba(224,64,144,0.2); }

    .chip-list-readonly { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .chip-static { font-size: 0.78rem; padding: 0.25rem 0.55rem; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius-sm); }
    .chip-static--explicit { background: rgba(224,64,144,0.15); color: #ff6bb5; }
    .chip-static--warn { background: rgba(234,179,8,0.12); color: #eab308; }

    .readonly-text { white-space: pre-wrap; line-height: 1.6; color: var(--text-primary); font-size: 0.9rem; margin: 0.5rem 0 0; }
    .readonly-chip { font-size: 0.8rem; padding: 0.3rem 0.6rem; background: var(--accent-dim); color: var(--accent); border-radius: var(--radius-sm); display: inline-block; margin-top: 0.5rem; }

    .rating-badge { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1rem; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .rating-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    .rating-value { font-size: 0.85rem; font-weight: 700; color: var(--accent); padding: 0.15rem 0.6rem; border: 1px solid var(--border-accent); border-radius: var(--radius-sm); background: var(--accent-dim); }

    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
    .btn-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: var(--accent-gradient); border: none; border-radius: var(--radius-md); color: #fff; font-size: 0.85rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
    .btn-primary:hover { box-shadow: 0 0 20px var(--accent-glow); transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .spinner-sm { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
  `],
})
export default class UniverseEditorComponent {
  private readonly universeService = inject(UniverseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly universe = signal<UniverseListItem | null>(null);
  protected readonly activeTab = signal<'idea'>('idea');
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected readonly toastMessage = signal('');

  protected readonly formData = signal<IdeaForm>({
    prompt: '', demographic: '', genres: [], explicitGenres: [],
    subgenres: [], themes: [], aesthetics: [], contentWarnings: [],
    decisionIdeas: '', influenceIdeas: '', rating: '+13',
  });

  protected readonly ideaForm = computed(() => this.universe()?.idea_form);
  protected readonly editable = computed(() => this.universe()?.status === 'idea_draft');

  protected readonly demographicOptions = demographicOptions;
  protected readonly genreOptions = genreOptions;
  protected readonly explicitGenreOptions = explicitGenreOptions;
  protected readonly subgenreOptions = subgenreOptions;
  protected readonly themeOptions = themeOptions;
  protected readonly aestheticOptions = aestheticOptions;
  protected readonly contentWarningOptions = contentWarningOptions;

  protected readonly subgenreCategories = ['Isekai', 'Fantasía', 'Sci-Fi', 'Acción / Aventura', 'Romance', 'Horror', 'School', 'Sports'];
  protected readonly aestheticCategories = ['Estéticas narrativas', 'Estéticas visuales', 'Estéticas de mundo', 'Estéticas de estructura narrativa'];

  async ngOnInit() {
    const slug = this.route.snapshot.params['slug'];
    if (!slug) { this.error.set('Slug no proporcionado'); this.loading.set(false); return; }
    try {
      const u = await firstValueFrom(this.universeService.getBySlug(slug));
      this.universe.set(u);
      if (u.idea_form) {
        this.formData.set({ ...u.idea_form });
      }
    } catch {
      this.error.set('No se pudo cargar el universo');
    } finally {
      this.loading.set(false);
    }
  }

  protected onInput(field: keyof IdeaForm, event: Event) {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.formData.update(d => ({ ...d, [field]: value }));
  }

  protected setDemographic(value: string) {
    this.formData.update(d => ({ ...d, demographic: value }));
  }

  protected toggleGenre(genre: string) {
    this.formData.update(d => {
      const genres = d.genres.includes(genre) ? d.genres.filter(g => g !== genre) : [...d.genres, genre];
      return { ...d, genres };
    });
  }

  protected toggleExplicitGenre(explicit: string) {
    this.formData.update(d => {
      const explicitGenres = d.explicitGenres.includes(explicit) ? d.explicitGenres.filter(e => e !== explicit) : [...d.explicitGenres, explicit];
      const autoWarnings = EXPLICIT_RATING_MAP[explicit] ?? [];
      let contentWarnings = [...d.contentWarnings];
      if (explicitGenres.includes(explicit)) {
        for (const w of autoWarnings) { if (!contentWarnings.includes(w)) contentWarnings.push(w); }
      } else {
        const stillSelected = new Set(Object.entries(EXPLICIT_RATING_MAP).filter(([k]) => explicitGenres.includes(k)).flatMap(([, v]) => v));
        contentWarnings = [...new Set(d.contentWarnings.filter(w => !autoWarnings.includes(w) || stillSelected.has(w)))];
      }
      return { ...d, explicitGenres, contentWarnings };
    });
  }

  protected toggleSubgenre(subgenre: string) {
    this.formData.update(d => {
      const subgenres = d.subgenres.includes(subgenre) ? d.subgenres.filter(s => s !== subgenre) : [...d.subgenres, subgenre];
      return { ...d, subgenres };
    });
  }

  protected toggleTheme(theme: string) {
    this.formData.update(d => {
      const themes = d.themes.includes(theme) ? d.themes.filter(t => t !== theme) : [...d.themes, theme];
      return { ...d, themes };
    });
  }

  protected toggleAesthetic(aesthetic: string) {
    this.formData.update(d => {
      const aesthetics = d.aesthetics.includes(aesthetic) ? d.aesthetics.filter(a => a !== aesthetic) : [...d.aesthetics, aesthetic];
      return { ...d, aesthetics };
    });
  }

  protected toggleContentWarning(warning: string) {
    this.formData.update(d => {
      const contentWarnings = d.contentWarnings.includes(warning) ? d.contentWarnings.filter(w => w !== warning) : [...d.contentWarnings, warning];
      return { ...d, contentWarnings };
    });
  }

  protected getRatingLabel(): string {
    const explicit = this.formData().explicitGenres;
    if (explicit.includes('Hentai') || explicit.includes('Erotica')) return '+18';
    if (explicit.includes('Ecchi')) return '+16';
    const w = this.formData().contentWarnings;
    if (w.includes('Sexo explícito') || w.includes('Violencia extrema')) return '+18';
    if (w.includes('Contenido sexual') || w.includes('Violencia') || w.includes('Drogas y alcohol')) return '+16';
    if (w.includes('Lenguaje soez') || w.includes('Terror psicológico') || w.includes('Discriminación')) return '+13';
    if (w.length === 0) return 'Todos los públicos';
    return '+13';
  }

  protected subgenresByCategory(category: string) {
    return this.subgenreOptions.filter(s => s.category === category);
  }

  protected aestheticsByCategory(category: string) {
    return this.aestheticOptions.filter(a => a.category === category);
  }

  protected statusClass(status: string): string {
    const map: Record<string, string> = { idea_draft: 'draft', in_progress: 'progress', completed: 'done', deleted: 'deleted' };
    return map[status] ?? 'draft';
  }

  protected async onSave(event: Event) {
    event.preventDefault();
    const slug = this.route.snapshot.params['slug'];
    const data = this.formData();
    this.saving.set(true);
    this.saveError.set('');
    this.toastMessage.set('');
    try {
      await firstValueFrom(this.universeService.update(slug, {
        idea_form: {
          ...data,
          rating: this.getRatingLabel(),
        },
      }));
      this.toastMessage.set('Idea inicial guardada correctamente');
      setTimeout(() => this.toastMessage.set(''), 3000);
    } catch (err) {
      this.saveError.set(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }
}
