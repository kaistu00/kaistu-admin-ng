# Arquitectura

## BFF (Backend for Frontend)

KAISTU Admin usa el patrón **BFF (Backend for Frontend)** estricto. No hay ningún Firebase SDK en el cliente:

```
┌──────────────┐     HTTP      ┌──────────────┐    Admin SDK    ┌──────────┐
│   Cliente    │ ──────────►   │  Express SSR │ ──────────────► │ Firebase │
│  (Angular)   │ ◄──────────   │  (server.ts) │ ◄────────────── │(Auth, FS)│
└──────────────┘     JSON      └──────────────┘                 └──────────┘
       ▲                              │
       │  Redirect OAuth               │  Google OAuth flow
       │  (no SDK)                     │  (server-side)
       └───────────────────────────────┘
```

**Reglas**:
- ❌ No hay ningún Firebase SDK en el cliente (ni Auth, ni Firestore)
- ✅ El cliente usa `HttpClient` contra `/api/...`
- ✅ Las API routes en `server.ts` usan Firebase Admin SDK
- ✅ `firebase.server.ts` hace `import()` dinámico de `firebase-admin` para evitar errores CJS/ESM con `__dirname`
- ✅ Sesión manejada con cookie httpOnly + `sameSite: lax`
- ✅ El servidor valida que el email pertenezca a `@kaistu.com`
- ✅ Middleware de autenticación protege todas las rutas `/api/*`
- ✅ En desarrollo: `/api/auth/dev-login` usa el emulador local
- ✅ En producción: flujo OAuth completo via Google (redirect) — sin popup SDK

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

### Desarrollo (con emulador)

```
1. App carga → GET /api/auth/me (restaurar sesión por cookie)
2. Sin sesión → AuthGuard redirige a /login
3. Usuario introduce email @kaistu.com y hace clic en "Acceder"
4. POST /api/auth/dev-login { email } → servidor:
   a. Crea/obtiene usuario en Auth emulator (Admin SDK)
   b. Genera custom token → lo canjea por idToken via REST API del emulador
   c. Crea cookie httpOnly con createSessionCookie()
5. Respuesta con perfil → AuthService.user.set(profile)
6. AuthGuard permite acceso → Dashboard
7. Email no @kaistu.com → servidor responde 403 → redirige a https://kaistu.com
```

### Producción (Google OAuth server-side)

```
1. Usuario hace clic en "Iniciar sesión con Google"
2. Redirige a GET /api/auth/google → servidor redirige a Google OAuth
3. Usuario autoriza en Google → redirect a /api/auth/callback
4. Servidor: canjea code por tokens → verifyIdToken() → valida @kaistu.com
5. Crea cookie httpOnly → redirige al dashboard (/)
6. Si el email no es @kaistu.com → script redirect a https://kaistu.com
```

## Flujo de datos (CRUD)

```
1. Usuario autenticado interactúa con el formulario
2. Signal actualiza el estado local
3. onSubmit() envía POST/PUT a /api/...
4. Cookie de sesión se envía automáticamente
5. Express verifica sesión (middleware) → llama a Firebase Admin
6. Respuesta JSON vuelve al cliente
7. Toast de confirmación + navegación
```
