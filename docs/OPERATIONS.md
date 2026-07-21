# Operación y prevención de incidentes

## Identificación de errores

Todas las respuestas incluyen `X-Request-Id`, `X-App-Version` y `X-App-Release`. Los errores visibles de servidor muestran una referencia que debe buscarse en los logs de Seenode.

El panel Configuración muestra:

- versión y commit;
- estado de PostgreSQL;
- Maps y proveedor de respaldo;
- OpenAI, Instagram y WhatsApp;
- actividad administrativa reciente.

## Base de datos

Las migraciones futuras deben utilizar `db/migrations.js` y un identificador ordenado, por ejemplo `0002-property-revisions`. Nunca se debe editar una migración ya aplicada.

Recomendación operativa:

- respaldo diario de PostgreSQL;
- retención semanal y mensual;
- prueba trimestral de restauración;
- respaldo independiente de imágenes cuando se migren a almacenamiento de objetos.

## Incidentes

1. Consultar `/health`, `/ready` y `/api/version`.
2. Comparar el commit servido con `main`.
3. Buscar el `requestId` en los logs.
4. Revisar PostgreSQL antes de reiniciar repetidamente.
5. Revertir al último despliegue estable si el problema comenzó con una publicación.

### Si ninguna cuenta puede iniciar sesión

1. Consultar `/api/version` y confirmar `databaseReady: true`.
2. Si aparece `databaseIssue: DATABASE_URL_MISSING`, restaurar la misma `DATABASE_URL`; no crear otra base.
3. Si PostgreSQL está inicializando, revisar el primer error de los logs y no cambiar contraseñas todavía.
4. Confirmar que Seenode desplegó el commit actual de `main`.
5. Solo después de recuperar PostgreSQL validar `ADMIN_USER` y `ADMIN_PASSWORD`.

La inicialización nunca debe borrar ni reemplazar `seller_accounts` o `internal_users`. El catálogo geográfico reconcilia registros existentes por tipo, nombre y jerarquía, y conserva los IDs administrados.

## Seguridad

- Rotar secretos inmediatamente si aparecen en capturas o logs.
- Restringir Google Maps al dominio público y a las APIs necesarias.
- No almacenar tokens o contraseñas en `app_settings`.
- Revisar semanalmente los PR de Dependabot.
- Mantener `SESSION_SECRET`, `WHATSAPP_AUTH_SECRET` y `ADMIN_PASSWORD` separados.
