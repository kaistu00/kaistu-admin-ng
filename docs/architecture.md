# Arquitectura

## BFF (Backend for Frontend)

KAISTU Admin usa el patrón **BFF** para separar la lógica de Firebase del cliente:

```
┌──────────────┐     HTTP      ┌──────────────┐    Admin SDK    ┌──────────┐
│   Cliente    │ ──────────►   │  Express SSR │ ──────────────► │ Firebase │
│  (Angular)   │ ◄──────────   │  (server.ts) │ ◄────────────── │(Auth, FS)│
└──────────────┘     JSON      └──────────────┘                 └──────────┘
       │                              ▲
       │  Google OAuth (popup)         │  Session cookie (httpOnly)
       ▼                              │
   firebase/auth (cliente) ───────────┘
```

**Reglas**:
- ❌ No hay Firebase SDK para Firestore en el cliente
- ✅ `firebase/auth` SDK en cliente exclusivamente para Google Sign-In (popup OAuth)
- ✅ El cliente usa `HttpClient` contra `/api/...`
- ✅ Las API routes en `server.ts` usan Firebase Admin SDK
- ✅ `firebase.server.ts` hace `import()` dinámico de `firebase-admin` para evitar errores CJS/ESM con `__dirname`
- ✅ Sesión manejada con cookie httpOnly + `sameSite: lax`
- ✅ El servidor valida que el email pertenezca a `@kaistu.com`

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

## Flujo de autenticación

```
1. App carga → GET /api/auth/me (restaurar sesión por cookie)
2. Sin sesión → AuthGuard redirige a /login
3. Usuario hace clic en "Iniciar sesión con Google"
4. Popup Google → firebase/auth (cliente) → idToken
5. POST /api/auth/login { idToken } → servidor verifica
6. Servidor: verifica token + email @kaistu.com → crea cookie httpOnly
7. Respuesta con perfil → AuthService.user.set(profile)
8. AuthGuard permite acceso → Dashboard
9. Email no @kaistu.com → servidor responde 403 → redirige a https://kaistu.com
```

## Flujo de datos (CRUD)

```
1. Usuario autenticado interactúa con el formulario
2. Signal actualiza el estado local
3. onSubmit() envía POST/PUT a /api/...
4. Cookie de sesión se envía automáticamente
5. Express recibe, verifica sesión (opcional), llama a Firebase Admin
6. Respuesta JSON vuelve al cliente
7. Toast de confirmación + navegación
```
