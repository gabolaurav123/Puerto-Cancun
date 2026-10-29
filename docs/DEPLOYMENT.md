# Despliegue seguro

## Configuración de Seenode

- Build: `npm ci`
- Start: `npm start`
- Node: 20
- Liveness: `/health`
- Readiness: `/ready`
- Dominio principal: `PUBLIC_SITE_URL=https://www.puertocancun.center`
- Dominio exclusivo de fichas: `PUBLIC_SHARE_DOMAIN=https://pic.estate`

`/health` confirma que el proceso responde. `/ready` devuelve `200` solamente cuando PostgreSQL y la inicialización están listos.
`pic.estate` debe apuntar al mismo servicio, pero el servidor solo permite allí rutas temporales `/f/:code`; cualquier otra ruta responde `404` y queda excluida de indexación.

## Automatización desde GitHub

El workflow `Deploy main` valida cada commit de `main`. Para que también inicie Seenode automáticamente:

1. Crear en Seenode un deploy hook para la aplicación.
2. Guardarlo como secret `SEENODE_DEPLOY_HOOK_URL` en GitHub.
3. Crear la variable de repositorio `PUBLIC_DEPLOY_URL` con la URL HTTPS directa del servicio principal (no `pic.estate`), sin credenciales, query ni fragmento. No se siguen redirecciones.

Antes de invocar el hook existente, el workflow calcula la huella esperada del checkout con `node asset-version.js`. Después ejecuta `node scripts/deploy-smoke.js`: exige `/ready` con HTTP 200, `ok: true` y `databaseReady: true`, seguido de `/api/version` con HTTP 200, `databaseReady: true` y `assetVersion` exactamente igual a la esperada. Debe obtener dos coincidencias consecutivas; cualquier fallo reinicia esa cuenta.

El smoke reintenta cada 5 segundos durante un máximo de 5 minutos. Cada petición, incluida la lectura del JSON, tiene un timeout de 10 segundos limitado por el tiempo restante. Usa peticiones sin caché y un parámetro único por intento. Una versión antigua, un JSON inválido o un timeout nunca se aceptan como éxito. Cuando hay hook configurado, faltar `PUBLIC_DEPLOY_URL` también hace fallar el smoke; sin hook se conserva el aviso de despliegue manual. No se cambia el proveedor ni el hook.

## Huella compartida

`asset-version.js` exporta `computeAssetVersion` y la lista explícita `RUNTIME_FILES`. El servidor y CI usan ese mismo helper. La huella son los primeros 12 caracteres hexadecimales de SHA-256 sobre nombres, tamaños y contenido UTF-8; normaliza CRLF/CR a LF para coincidir entre Windows y Linux. Incluye los assets anteriores, `index.html`, fuentes de catálogo/SEO/servidor, el propio helper y manifiestos de dependencias. Si falta un archivo listado, el cálculo falla. Agregar nuevas fuentes de ejecución a esa lista cuando corresponda.

No enumera directorios ni lee `.env`, secretos, DB o uploads. La huella representa los archivos listados, no el SHA del commit ni configuración, datos o assets binarios externos a esa lista: cambios exclusivamente de documentación o pruebas pueden conservarla. Dos muestras consecutivas reducen el riesgo de observar una réplica antigua, pero no certifican todas las réplicas. El smoke solo registra estado y huellas válidas, nunca cuerpos de respuesta ni URLs privadas.

## Verificación manual

Desde el checkout exacto que se pretende desplegar, sin modificaciones posteriores, en PowerShell:

```powershell
$env:PUBLIC_DEPLOY_URL = 'https://www.puertocancun.center'
$env:EXPECTED_ASSET_VERSION = node asset-version.js
node scripts/deploy-smoke.js
```

La huella esperada debe proceder del checkout, nunca copiarse de la respuesta remota. El comando solo consulta readiness y versión; no invoca el hook ni modifica datos. Se permite HTTP únicamente para fixtures en loopback. Contrastar también `release` con el commit cuando el proveedor suministre ese metadato fiable, y probar inicio, propiedades, acceso administrativo y PDF. Las pruebas automatizadas del helper y del smoke usan fixtures/mocks y un servidor HTTP local, sin desplegar ni conectar a la DB.

## Reversión

Si el smoke test falla, volver a desplegar el último commit estable. No se deben borrar tablas ni ejecutar SQL manual durante una reversión. Las migraciones nuevas deben ser compatibles hacia atrás o incluir un procedimiento probado de recuperación.
