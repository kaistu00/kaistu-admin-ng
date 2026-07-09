# Universos

CRUD completo para gestionar universos narrativos.

## Rutas

| Ruta | Componente | Modo |
|------|-----------|------|
| `/universes` | `universe-list` | Listado |
| `/universes/new` | `universe-form` | Creación |
| `/universes/:slug` | `universe-form` | Vista (readonly) |
| `/universes/:slug/edit` | `universe-form` | Edición |

## Formulario con pestañas

El formulario de creación/edición/visión se organiza en 4 pestañas:

### ✏ Básico
- Nombre del universo (texto libre, se guarda tal cual)
- Slug (auto-generado desde el nombre)
- Premisa / Idea base (textarea)
- Directrices de dinámica:
  - Sistema de Decisiones
  - Influencias Externas

### 🔒 Clasificación
- **Demografía**: Shōnen, Seinen, Shōjo, Josei
- **Advertencias de contenido**: chips multiselección
  - Las advertencias se auto-completan al seleccionar géneros explícitos
- **Rating**: calculado automáticamente según contenido

### 👥 Géneros
- **Macro-géneros**: 30 opciones (Action, Fantasy, Horror...)
- **Géneros explícitos**: Ecchi, Erotica, Hentai (auto-asignan advertencias)
- **Subgéneros**: organizados por categorías (Isekai, Fantasía, Sci-Fi...)

### 🌍 Narrativa
- **Tropos / Temas**: chips multiselección
- **Estéticas**: organizadas por subcategorías:
  - Estéticas narrativas
  - Estéticas visuales
  - Estéticas de estructura narrativa

> Los tipos de mundo (Mundo paralelo, Mundo RPG, etc.) se gestionan desde [Mundos](./worlds.md).

## Estados

- `idea_draft` — Borrador inicial (editable)
- `in_progress` — En desarrollo
- `completed` — Completado
- `deleted` — Papelera (soft delete)

## Vista detalle

En modo vista (`/:slug`) el formulario se muestra **read-only** con:
- Todos los campos deshabilitados
- Botón **Editar** → navega a `/:slug/edit`
- Botón **Eliminar** → soft delete con confirmación

## API

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/api/universes` | Listar todos |
| GET | `/api/universes/:slug` | Obtener uno |
| POST | `/api/universes` | Crear |
| PUT | `/api/universes/:slug` | Actualizar |
| DELETE | `/api/universes/:slug` | Soft delete |
