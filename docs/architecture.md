# Arquitectura

## BFF (Backend for Frontend)

KAISTU Admin usa el patrón **BFF** para separar la lógica de Firebase del cliente:

```
┌──────────────┐     HTTP      ┌──────────────┐    Admin SDK    ┌──────────┐
│   Cliente    │ ──────────►   │  Express SSR │ ──────────────► │ Firebase │
│  (Angular)   │ ◄──────────   │  (server.ts) │ ◄────────────── │(Firestore)│
└──────────────┘     JSON      └──────────────┘                 └──────────┘
```

**Reglas**:
- ❌ No hay Firebase SDK en el cliente
- ✅ El cliente usa `HttpClient` contra `/api/...`
- ✅ Las API routes en `server.ts` usan Firebase Admin SDK
- ✅ `firebase.server.ts` hace `import()` dinámico de `firebase-admin` para evitar errores CJS/ESM con `__dirname`

## SSR (Server-Side Rendering)

Angular SSR con Express 5.1:

- **Desarrollo**: `ng serve` compila y sirve tanto cliente como SSR
- **Producción**: `ng build` genera `dist/` con servidor Express
- **API**: Las rutas `/api/*` se registran antes del middleware de Angular SSR
- **RenderMode**: Rutas con interacción se configuran como `RenderMode.Client` en `app.routes.server.ts`

## Componentes

- **Standalone**: Todos los componentes son `standalone: true`, sin NgModules
- **Signals**: Estado reactivo con `signal()`, `computed()`, `effect()`
- **Control flow**: `@if`, `@for`, `@defer` (nuevo sistema de Angular 22)
- **Lazy loading**: Cada página se carga con `loadComponent: () => import(...)`

## Tema

- **Fondo**: `--bg-primary: #0a0a0f` (dark premium)
- **Acento**: `--accent: #00d2ff` (cian)
- **Tipografía**: Inter / system-ui
- **Layout**: Sidebar 260px fija + topbar 64px glassmorphism + content scrollable

## Flujo de datos

```
1. Usuario interactúa con el formulario
2. Signal actualiza el estado local
3. onSubmit() envía POST/PUT a /api/...
4. Express recibe, llama a Firebase Admin
5. Respuesta JSON vuelve al cliente
6. Toast de confirmación + navegación
```
