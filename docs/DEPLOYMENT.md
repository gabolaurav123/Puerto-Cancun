# Despliegue seguro

## Configuración de Seenode

- Build: `npm ci`
- Start: `npm start`
- Node: 20
- Liveness: `/health`
- Readiness: `/ready`

`/health` confirma que el proceso responde. `/ready` devuelve `200` solamente cuando PostgreSQL y la inicialización están listos.

## Automatización desde GitHub

El workflow `Deploy main` valida cada commit de `main`. Para que también inicie Seenode automáticamente:

1. Crear en Seenode un deploy hook para la aplicación.
2. Guardarlo como secret `SEENODE_DEPLOY_HOOK_URL` en GitHub.
3. Crear la variable de repositorio `PUBLIC_DEPLOY_URL` con el dominio del servicio, sin `/` final.

Después del despliegue, el workflow consulta `/ready` y `/api/version`.

## Verificación manual

1. Confirmar que `/ready` responda `200`.
2. Abrir `/api/version` y comparar `release` con el commit de `main`.
3. Confirmar que `assetVersion` cambió cuando se modificaron `app.js` o `styles.css`.
4. Probar inicio, propiedades, acceso administrativo y generación de PDF.

## Reversión

Si el smoke test falla, volver a desplegar el último commit estable. No se deben borrar tablas ni ejecutar SQL manual durante una reversión. Las migraciones nuevas deben ser compatibles hacia atrás o incluir un procedimiento probado de recuperación.
