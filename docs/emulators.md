# Firebase Emulators

Entorno local de desarrollo con Firebase Emulator Suite.

## Servicios emulados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Authentication | `9099` | `http://localhost:9099` |
| Firestore | `8080` | `http://localhost:8080` |
| Emulator UI | `4001` | `http://localhost:4001` |

## Comandos

```bash
# Arrancar emuladores (auto-detecta datos guardados)
npm run emulators

# Arrancar emuladores limpios (sin importar datos)
npm run emulators:base

# Arrancar forzando importación de datos
npm run emulators:seed

# Guardar datos actuales (ejecutar ANTES de apagar)
npm run emulators:export
```

## Persistencia de datos

Los emuladores mantienen los datos en **memoria**. Para no perderlos entre sesiones:

### Workflow recomendado

```
1. Trabajas con datos en los emuladores
2. Antes de cerrar → npm run emulators:export
3. Se guarda todo en .emulator-data/
4. Próxima vez → npm run emulators (detecta el backup automáticamente)
```

### Cómo funciona

El script `start-emulators.ps1`:

```powershell
if (existe .emulator-data/firebase-export.json) {
  → npm run emulators:seed (importa datos)
} else {
  → npm run emulators:base (limpio)
}
```

### Si pierdes los datos

1. Los emuladores se iniciaron sin `--import` (limpios)
2. O mataste los procesos sin hacer `npm run emulators:export`
3. Solución: si tienes datos en Firebase real, considera seedearlos; si no, empieza de cero

## Conexión desde la app

El cliente Angular se conecta a los emuladores automáticamente en desarrollo:

```typescript
// environments/environment.ts
export const environment = {
  useEmulators: true,
  // ...
};
```

El **cliente** (`AuthService`) usa `connectAuthEmulator` para conectar con Auth local:

```typescript
if (environment.useEmulators) {
  connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
```

Firebase Admin SDK se configura en `firebase.server.ts` con:

```typescript
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
db.settings({ host: '127.0.0.1:8080', ssl: false });
```

Requiere `ENVIRONMENT=LOCAL` (se establece automáticamente con `npm start`).

## Requisitos

- **Java 17+** necesario para Firestore Emulator
- Configurar `JAVA_HOME` como variable de entorno
