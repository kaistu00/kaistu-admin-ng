---
name: angular-ssr-host-validation
description: "Cómo resolver el error 'Header host is not allowed' en Angular SSR durante desarrollo."
version: 1.0.0
---

# Angular SSR Host Validation Fix

## Error
```
Header "host" with value "localhost:4200" is not allowed
```

## Causa
Angular SSR valida el header `Host` por seguridad. En desarrollo, `localhost:4200` no está en la lista de hosts permitidos por defecto.

## Solución
En `angular.json`, bajo `projects.<project>.architect.build.options.security`:

```json
"security": {
  "allowedHosts": ["localhost", "localhost:4200"]
}
```

## Pasos adicionales
1. Borrar caché: `Remove-Item -Recurse -Force ".angular"`
2. Rebuild: `ng serve` limpiará la caché automáticamente

## Notas
- `ng serve` también construye los server bundles con SSR
- El cambio requiere rebuild, no hot-reload
- En producción, añadir el dominio real
