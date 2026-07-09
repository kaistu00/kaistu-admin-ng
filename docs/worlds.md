# Mundos

CRUD para gestionar mundos y escenarios, vinculados a universos narrativos.

## Rutas

| Ruta | Componente | Modo |
|------|-----------|------|
| `/worlds` | `world-list` | Listado |
| `/worlds/new` | `world-form` | Creación |
| `/worlds/:slug/edit` | `world-form` | Edición |

## Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre del mundo (texto libre) |
| `slug` | string | Auto-generado desde el nombre. **No modificable tras crear** |
| `universeId` | string | ID del universo relacionado (dropdown) |
| `worldTypes` | string[] | Tipos de mundo (chips multiselección) |

## Tipos de mundo

Lista completa de tipos seleccionables:

| Tipo | Descripción |
|------|-------------|
| Mundo paralelo | Realidad alternativa coexistiendo con la nuestra |
| Mundo virtual / VRMMO | Mundo digital inmersivo tipo MMO |
| Mundo RPG | Mundo con mecánicas de juego de rol |
| Mundo con sistema / HUD / stats | Interfaz visible con estadísticas y habilidades |
| Mundo de reencarnación | Mundo al que se llega tras reencarnar |
| Mundo tecnológico avanzado | Sociedad con tecnología muy superior a la actual |
| Mundo decadente | Civilización en declive moral o material |
| Mundo utópico | Sociedad perfecta e idealizada |
| Mundo distópico | Sociedad opresiva y totalitaria |
| Mundo alienígena | Planeta habitado por formas de vida extraterrestre |
| Mundo submarino | Civilizaciones y ecosistemas bajo el mar |
| Mundo celestial | Reinos divinos o angelicales en las alturas |
| Mundo demoníaco | Infiernos y reinos de demonios |
| Mundo escolar | Institutos y universidades como entorno central |
| Mundo laboral | Oficinas y entornos profesionales |
| Mundo idol | Industria del entretenimiento y cultura idol |
| Mundo gourmet | Gastronomía y cultura culinaria |
| Mundo militar | Entorno castrense y operaciones militares |
| Mundo deportivo | Competiciones y cultura deportiva |

## Relación con Universos

Cada mundo pertenece a un universo (`universeId`). La relación es:

```
Universo (1) ──► Mundos (N)
```

El `universeId` se selecciona desde un dropdown que lista todos los universos disponibles.

## API

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/api/worlds` | Listar todos |
| GET | `/api/worlds/:slug` | Obtener uno |
| POST | `/api/worlds` | Crear |
| PUT | `/api/worlds/:slug` | Actualizar |
| DELETE | `/api/worlds/:slug` | Soft delete |
