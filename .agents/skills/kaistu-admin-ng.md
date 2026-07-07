---
name: kaistu-admin-ng
description: "Panel de administración KAISTU Studio con Angular 22, SSR, signals, BFF pattern y tema oscuro premium."
version: 1.0.0
---

# KAISTU Admin NG

## Stack
- Angular 22 standalone, SSR (`@angular/ssr` + Express 5.1)
- Build: `@angular/build` (esbuild/Vite)
- Tests: Vitest 4.x
- TypeScript 6.0

## Conventions
- Files: `feature.ts` (no `.component.ts`) — Angular 22 naming
- Components: `standalone: true`, `imports` in decorator, `default export`
- State: `signal`/`computed`, no RxJS `BehaviorSubject`
- Templates: `@if`/`@for` control flow, no `*ngIf`/`*ngFor`
- Lazy routes: `loadComponent: () => import(...).then(c => c.default)`

## SSR Dev Server Fix
- Error: `Header "host" with value "localhost:4200" is not allowed`
- Fix: Add `"allowedHosts": ["localhost", "localhost:4200"]` in `angular.json` under `build.options.security`
- Clear `.angular/` cache after changing config

## Layout Architecture
```
layout → sidebar (260px fixed) | main-area → topbar (64px glass) + content (router-outlet)
```
- Sidebar: logo + nav links con `routerLink` + `routerLinkActive`
- Topbar: título reactivo + `<select>` universo activo
- Theme: `--bg-primary: #0a0a0f`, `--accent: #00d2ff`, Inter font

## Services Pattern
```ts
@Injectable({ providedIn: 'root' })
export class XService {
  readonly data = signal<Type[]>([]);
  readonly active = signal<Type | null>(null);
  setX(val: Type): void { this.active.set(val); }
}
```
