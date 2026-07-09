---
name: firebase-bff-angular
description: "Patrón BFF para Angular SSR: nunca Firebase SDK en cliente, usar Server Routes (*.server.ts) para Firestore, HttpClient en cliente."
version: 1.0.0
---

# Firebase BFF con Angular SSR

## Regla Fundamental
- **No importar Firebase SDK en el cliente** (nunca en componentes, servicios del cliente)
- Todo acceso a Firestore va en **Server Routes** (`*.server.ts`)
- Cliente usa **solo `HttpClient`** hacia `/api/...`

## Configuración
```ts
// app.config.ts
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
  ],
};
```

## Estructura
```
src/
├── server.ts              # Express server con API routes
├── app/
│   ├── server/            # Server routes (Firebase)
│   │   └── universes.server.ts
│   └── services/          # Client services (HttpClient)
│       └── universe.service.ts
```

## Ejemplo Server Route
```ts
// src/app/server/universes.server.ts
import { defineRoute } from '@angular/ssr';
import { Firestore } from '@google-cloud/firestore';

export default defineRoute((req, res) => {
  // Acceso directo a Firestore aquí
});
```
