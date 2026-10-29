# Revision de disponibilidad (I08)

- `PROPERTY_REVIEW_DAYS` y `DEVELOPMENT_REVIEW_DAYS`: enteros de 1 a 3650 dias.
  Ausencia o valor invalido usa 90 dias por entidad. Requiere reiniciar el servidor.
- GET `/api/admin/properties/:id/verify` requiere administrador y devuelve
  `{ reviewPolicy: { properties, developments } }`. No consulta ni cambia DB;
  el ID conserva la misma ruta del recurso. Respuesta no cacheable.
- POST en esa ruta exige `{ confirmAvailability: true }`. El handler real es
  `verifyPropertyFreshness`: confirma revision con una fuente actual, evita doble
  envio y no reintenta automaticamente. No constituye verificacion juridica.
- El timestamp procede de PostgreSQL `NOW()`, nunca del cliente ni de la ultima
  edicion. `verified_by` procede de la sesion. `updated_at`, `created_at`, estado,
  precio y visibilidad no cambian. Actualizacion y auditoria usan una sola
  sentencia CTE atomica; el log usa exactamente el timestamp registrado.
- Borradores y archivadas responden 409 y no se verifican. Revisar una ficha
  vendida o rentada explicitamente no la reactiva ni afirma que este disponible.
- Dashboard y Copilot priorizan inventario activo y publico nunca revisado,
  vencido o con fecha futura/invalida. El limite incluye el dia exacto del plazo.
  Una edicion reciente no limpia esos pendientes. Copilot limita la lista a 10.
- El modulo administrativo consulta la politica una vez por sesion visible;
  si falla, muestra plazo desconocido y permite reintentar. No inventa un plazo
  configurado ni presenta fechas de edicion como verificacion. Los contadores
  abren IDs exactos; borradores, archivadas, vendidas y privadas no se mezclan.

## Pruebas

`node --test test/availability-review.test.js test/admin-inventory-contract.test.js`

VM y dobles de consultas, sin importar el servidor ni abrir DB. Cubren umbrales,
estados, confirmacion, SQL parametrizado y atomico, error/cancelacion, no reintento
y no mutacion del inventario. La atomicidad se comprueba por estructura de la
sentencia; no se ejecuta contra PostgreSQL en esta tarea.

Actualizacion del integrador: una prueba posterior con DB detecto que la ficha
publica conservaba `lastVerifiedAt: null` en cache despues de confirmar. El
integrador reporto la correccion con `invalidatePublicPropertyCache` tras la
consulta confirmada y el ajuste de su mock. Ese recorrido DB fue externo a
estas pruebas unitarias; su resultado final corresponde al reporte de integracion.

QA de navegador existente: habilitar `PCC_ADMIN_BROWSER_QA=1`, `PLAYWRIGHT_MODULE`
y `CHROMIUM_PATH`; la politica se simula con GET y se bloquea el resto de la red.
