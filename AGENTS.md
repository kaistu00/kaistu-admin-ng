# KAISTU Admin — Project Context

## Stack
- **Framework**: Angular 22 (standalone components, signals, new control flow `@if`/`@for`)
- **SSR**: Angular SSR + Express 5.1 (via `@angular/ssr`)
- **Build**: Angular CLI 22 (`@angular/build` — esbuild/Vite)
- **Testing**: Vitest 4.x (`ng test`)
- **Format**: Prettier 3.8
- **Language**: TypeScript 6.0

## Architectural Rules (strict)

### BFF Pattern (Backend for Frontend)
- **No Firebase SDK on client**. All Firestore connections go through Server Routes (`*.server.ts`).
- Client uses `HttpClient` only, targeting `/api/...` endpoints.
- Configured via `provideHttpClient(withFetch())` in `app.config.ts`.

### Angular Modern
- Components are 100% **standalone** (`standalone: true`, no NgModules).
- **Signals** (`signal`, `computed`) for all reactive state. No RxJS `BehaviorSubject` for app state.
- New control flow: `@if`, `@for`, `@defer` in templates.
- File naming: `feature.ts` (not `feature.component.ts`) per Angular 22 convention.
- Lazy loading with `loadComponent: () => import(...).then(c => c.default)` + default export.

## Project Structure

```
src/
├── app/
│   ├── pages/           # Lazy-loaded route pages
│   │   ├── home/        # Dashboard
│   │   ├── universes/   # Universe management
│   │   └── characters/  # Character CRUD
│   ├── services/        # Injectable services (signals-based state)
│   ├── app.ts           # Root component (standalone)
│   ├── app.html         # Layout: sidebar + topbar + router-outlet
│   ├── app.scss         # Dark theme (--accent: #00d2ff)
│   ├── app.routes.ts    # Lazy routes
│   ├── app.config.ts    # App bootstrap config
│   └── app.spec.ts      # Root tests
├── server.ts            # Express SSR server
└── main.ts              # Client bootstrap
```

## Commands

| Command | Action |
|---------|--------|
| `npm start` | `ng serve` (dev, no SSR) |
| `npm run build` | `ng build` (SSR, production) |
| `npm test` | `ng test` (Vitest) |
| `npm run serve:ssr` | Node SSR server on port 4000 |

## Design System

- **Theme**: Dark premium (`--bg-primary: #0a0a0f`, `--bg-secondary: #0d0d14`)
- **Accent**: Cyan `#00d2ff` (eléctrico/kinetic)
- **Typography**: Inter / system-ui stack
- **Layout**: Sidebar 260px fixed, topbar 64px glassmorphism, content scrollable
- **SSR**: `allowedHosts: ["localhost", "localhost:4200"]` in angular.json for dev

## Skills & Memory

### Active Skills (from ~/.openclaw/workspace/skills/)
- **agent-subagents-ui**: Component-focused UI patterns, file-specific implementations
- **proactivity**: Reverse prompting, self-healing, signals-based opportunity detection
- **self-improving-agent**: Log corrections to `.learnings/`, promote patterns to AGENTS.md after 3x recurrence
- **self-improving**: Tiered memory (HOT/WARM/COLD), namespace isolation, self-reflection
- **skill-vetter**: Security-first vetting before installing external code
- **ui-ux-pro-max**: Design tokens, dark mode (OLED) guidelines, typography pairings

### Project Skills (.agents/skills/)
Skills aprendidas específicas de este proyecto, consultables antes de cada tarea:
- `kaistu-admin-ng.md` — Stack, convenciones, layout, tema
- `firebase-bff-angular.md` — Patrón BFF con Angular SSR
- `angular-ssr-host-validation.md` — Fix del error de host header
- `agentes-habilidades.md` — Cómo funcionan las skills del agente

### Self-Improvement Workflow
Log to `.learnings/LEARNINGS.md` when:
- User corrects me
- Command or operation fails
- Knowledge is outdated
- Better approach discovered for recurring task

Promote to this `AGENTS.md` after 3x recurrence of the same lesson.

## Branch Strategy
- New features go in feature branches (`feat/*`)
- Branch protections on `main` require PRs
