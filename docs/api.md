# API BFF

Todas las rutas BFF se sirven desde `server.ts` en el mismo servidor Express que Angular SSR.

## Universos

Colección Firestore: `universes`

```typescript
interface CreateUniversePayload {
  slug: string;
  name: string;
  status: string;
  idea_form: {
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
    rating: string;
  };
}
```

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/universes` | Lista todos (filtra deleted) |
| `GET` | `/api/universes/:slug` | Obtener por slug |
| `POST` | `/api/universes` | Crear (doc ID = slug) |
| `PUT` | `/api/universes/:slug` | Actualizar |
| `DELETE` | `/api/universes/:slug` | Soft delete (status → deleted) |

## Mundos

Colección Firestore: `worlds`

```typescript
interface CreateWorldPayload {
  slug: string;
  name: string;
  universeId: string;
  worldTypes: string[];
}
```

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/worlds` | Lista todos (filtra deleted) |
| `GET` | `/api/worlds/:slug` | Obtener por slug |
| `POST` | `/api/worlds` | Crear (doc ID = slug) |
| `PUT` | `/api/worlds/:slug` | Actualizar |
| `DELETE` | `/api/worlds/:slug` | Soft delete (status → deleted) |

## Studio Workers

Colección Firestore: `studio_workers`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/studio-workers` | Lista todos |
| `GET` | `/api/studio-workers/:slug` | Obtener por slug |
| `POST` | `/api/studio-workers` | Crear |
| `PUT` | `/api/studio-workers/:slug` | Actualizar |
| `DELETE` | `/api/studio-workers/:slug` | Soft delete |

## Herramientas

### Integrations

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/integrations/test?url=...` | Test de conectividad |

### n8n Proxy

| Método | Ruta | Descripción |
|--------|------|-------------|
| `ALL` | `/api/n8n/proxy?baseUrl=&path=&apiKey=` | Proxy a API de n8n |

### ComfyUI Proxy

| Método | Ruta | Descripción |
|--------|------|-------------|
| WebSocket | `/api/n8n/ws-proxy?host=&port=` | WebSocket proxy a ComfyUI |

## Debug

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/debug` | Test Firebase init + entorno |

## Convenciones

- **Soft delete**: los registros no se borran, se marcan con `status: 'deleted'`
- **Timestamps**: `createdAt` y `updatedAt` se añaden automáticamente
- **Doc ID**: siempre es el `slug`
- **Errores**: formato `{ error: string }` con status code apropiado
