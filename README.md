# KAISTU Studio Admin

Panel de administración para KAISTU Studio — gestión de universos narrativos, mundos, personajes y herramientas de IA.

## Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Angular 22 (standalone, signals, control flow `@if`/`@for`) |
| **SSR** | Angular SSR + Express 5.1 (`@angular/ssr`) |
| **Build** | Angular CLI 22 (`@angular/build` — esbuild/Vite) |
| **Testing** | Vitest 4.x (`ng test`) |
| **Backend** | Firebase Admin SDK (BFF via Express routes) |
| **Emuladores** | Firebase Emulator Suite (Auth, Firestore) |
| **Formato** | Prettier 3.8 |
| **Lenguaje** | TypeScript 6.0 |

## Estructura

```
src/
├── server.ts              # Express SSR + BFF API endpoints
├── main.ts                # Client bootstrap
├── app/
│   ├── app.ts             # Root component (standalone)
│   ├── app.html           # Layout: sidebar + topbar + router-outlet
│   ├── app.scss           # Dark theme (--accent: #00d2ff)
│   ├── app.routes.ts      # Lazy routes
│   ├── app.routes.server.ts  # RenderMode per route
│   ├── app.config.ts      # App bootstrap config
│   ├── app.spec.ts        # Root tests
│   ├── pages/
│   │   ├── home/          # Dashboard
│   │   ├── universes/     # Universos CRUD
│   │   ├── worlds/        # Mundos CRUD
│   │   ├── characters/    # Personajes CRUD
│   │   ├── local-tools/   # Tools (profiles, connections)
│   │   └── studio-workers/# Trabajadores IA CRUD
│   └── services/
│       ├── firebase.server.ts  # Firebase Admin (SSR only)
│       └── universe.service.ts  # Universos HTTP client
├── environments/
│   ├── environment.ts         # Dev (useEmulators: true)
│   └── environment.prod.ts    # Prod
└── docs/                  # Documentación
```

## Comandos

| Comando | Acción |
|---------|--------|
| `npm start` | `ng serve` (dev, no SSR) |
| `npm run build` | `ng build` (SSR, producción) |
| `npm test` | `ng test` (Vitest) |
| `npm run serve:ssr` | Node SSR server en puerto 4000 |
| `npm run emulators` | Firebase emulators (auto-import si hay datos) |
| `npm run emulators:seed` | Emulators con `--import=./.emulator-data` |
| `npm run emulators:export` | Exporta datos actuales a `.emulator-data/` |
| `npm run emulators:base` | Emulators limpios (sin import) |

## Primeros pasos

```bash
# 1. Arrancar Firebase emulators (nueva terminal)
npm run emulators

# 2. Arrancar frontend (nueva terminal)
npm start

# 3. Abrir http://localhost:4200
```

## Documentación

- [Arquitectura](./docs/architecture.md) — Patrón BFF, SSR, componentes standalone
- [Universos](./docs/universes.md) — CRUD completo, formulario con pestañas
- [Mundos](./docs/worlds.md) — CRUD, tipos de mundo, relación con universos
- [API](./docs/api.md) — Endpoints BFF de referencia
- [Emuladores](./docs/emulators.md) — Setup de Firebase local y persistencia

## Convenciones

- Componentes **standalone** (sin NgModules)
- **Signals** para estado reactivo (no RxJS BehaviorSubject)
- Control flow moderno: `@if`, `@for`, `@defer`
- BFF: Firebase SDK solo en server routes (`*.server.ts`)
- `HttpClient` + `withFetch()` en cliente
- Archivos nombrados `feature.ts` (no `feature.component.ts`)
- Lazy loading con `loadComponent: () => import(...)`
