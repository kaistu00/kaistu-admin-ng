# Learnings

## 2026-07-08: Firebase emulators required for local dev

- Los emuladores (`npm run emulators`) deben estar levantados antes de `npm start`
- Si no hay emuladores, `/api/universes` y cualquier endpoint BFF que use `getDb()` lanzará error porque Firebase Admin no puede conectar a Firestore local
- El emulator UI está en `http://localhost:4001`
- Los datos se pueden seedear con `npm run emulators:seed`
- Para producción usar `npm run build` + `npm run serve:ssr:kaistu-admin-ng`
- `ng serve` (dev) no soporta bien firebase-admin por problemas de bundling CJS/ESM con `__dirname`. Siempre usar build production para probar Firebase.

## 2026-07-08: Firebase Admin SSR fix — externalDependencies

- `firebase-admin` usa dependencias CJS que referencian `__dirname`, lo que falla en contexto ESM cuando esbuild lo bundlea
- **Fix**: añadir `"externalDependencies": ["firebase-admin"]` en `angular.json` bajo `build.options`
- Esto fuerza a que firebase-admin se resuelva desde `node_modules` en runtime, donde `__dirname` funciona correctamente
- Los `import()` dinámicos de firebase-admin funcionan bien con esta configuración
- `db.settings({ host: '127.0.0.1:8080', ssl: false })` es necesario para conectar al emulador

## 2026-07-09: Firestore emulator — pérdida de datos al reiniciar

- **Causa**: `npm run emulators` arranca limpio. Los datos viven solo en memoria.
- **Para preservar datos**:
  1. `npm run emulators:export` — guarda el estado actual en `.emulator-data/`
  2. `npm run emulators` usa `start-emulators.ps1` que detecta si hay backup y hace `--import` automático
- **Siempre exportar antes de matar procesos** (o antes de apagar el PC)
- El `.emulator-data/` no se genera solo — hay que exportar explícitamente la primera vez

## 2026-07-08: API Keys y datos sensibles deben ir cifrados en localStorage

- **Regla**: cualquier API Key, token o secreto que se guarde en localStorage debe pasar por `encrypt()`/`decrypt()` con XOR + base64 + prefijo `enc:v1:`
- El cifrado usa una clave derivada de `window.location.origin` + una app secret, haciendo que los datos sean específicos del origen
- Usar prefijo (`enc:v1:`) para distinguir formato cifrado de texto plano, permitiendo migración automática
- Nunca almacenar texto plano de credenciales en localStorage
- El descifrado ocurre en `readStore()` y el cifrado en `writeStore()` — toda la lógica de negocio trabaja con datos descifrados en memoria
