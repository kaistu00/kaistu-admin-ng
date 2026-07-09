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

## Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/auth/google` | Redirige a Google OAuth (producción). Configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en entorno |
| `GET` | `/api/auth/callback` | Callback de Google OAuth — canjea code por tokens, crea cookie, redirige al dashboard |
| `POST` | `/api/auth/dev-login` | **Solo LOCAL**. Crea sesión con un email `@kaistu.com` usando el emulador de Auth |
| `POST` | `/api/auth/logout` | Elimina la cookie de sesión |
| `GET` | `/api/auth/me` | Verifica la cookie de sesión y devuelve el perfil del usuario (`uid`, `email`, `name`, `picture`) o 401 |

## Debug

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/debug` | Test Firebase init + entorno |

## Seguridad

- Todas las rutas `/api/*` (excepto `/api/auth/*` y `/api/debug`) están protegidas por **middleware de sesión** que verifica la cookie httpOnly
- El email debe pertenecer al dominio `@kaistu.com` — validación server-side
- La cookie de sesión es `httpOnly`, `sameSite: lax`, y `secure` en producción
- No hay Firebase SDK en el cliente — toda la comunicación con Firebase es server-side

## Convenciones

- **Soft delete**: los registros no se borran, se marcan con `status: 'deleted'`
- **Timestamps**: `createdAt` y `updatedAt` se añaden automáticamente
- **Doc ID**: siempre es el `slug`
- **Errores**: formato `{ error: string }` con status code apropiado
