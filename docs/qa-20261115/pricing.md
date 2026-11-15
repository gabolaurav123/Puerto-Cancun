# Auditoría de precios públicos — 15 de noviembre de 2026

## Inventario anterior a la edición

| Entrada | Presentación y fuente actual | Riesgo encontrado | Integración requerida |
| --- | --- | --- | --- |
| Catálogo, Destacadas, tipos, zonas, rentas | `catalog-view.js` → tarjetas de `seo-pages.js`; `inventory-contract.js` filtra y ordena importe/moneda original | Los MXN no participan en presupuestos USD; el orden se separa por moneda | Proyección USD explícita al consultar y formato público central |
| Mapa de resultados | `catalog-view.js` construye los datos; `catalog-map.js` muestra el texto de precio recibido | Hereda el importe original de la tarjeta | Reutilizar exactamente el mismo descriptor/formato USD |
| Ficha pública y recomendaciones | `seo-pages.js`: `selectListingPrice` / `formatListingPrice`; JSON-LD usa importe original | Distintas rutas pueden presentar monedas diferentes | Misma proyección con la misma instantánea de cambio; no publicar como oferta contractual un valor aproximado |
| Vista pública heredada/modal | `app.js`: `primaryPropertyPrice`, `formatPriceLines`, `formatPriceSummary` | Comparte formateadores con panel/PDF | Convertir sólo en contexto público; mantener formato original interno |
| Consultas, alertas y búsquedas guardadas | `catalog-view.js`, `catalog-search.js`, `saved-catalog-search.js`, `commercial-workflow.js` | Cambiar globalmente `currency=USD` alteraría filtros antiguos | Nuevo `priceMode=public-usd`; las consultas antiguas sin este campo mantienen semántica original |
| Valoración/revisión de precio/calculadora | `seo-pages.js` y formularios de `app.js` | Moneda elegible MXN/USD, textos heredados de moneda original | Entradas públicas USD; conservar registros históricos y currency original en almacenamiento |
| Ficha compartida externa | `external-property-utils.js` → `renderExternalPropertyShareHtml` | Precio original y metadatos OG pueden ser MXN | Inyectar snapshot y formato público en salida compartida, sin alterar el registro |
| PDF/ficha compartida | `pdf-property-sheet.js`, generadores de `server.js` | El mismo render sirve uso administrativo y publicación | Proyección explícita en la salida pública; fuentes internas y valores contractuales originales permanecen intactos |
| Panel, importación y reimportación | `priceOf`, `propertyFromRow`, `normalizeProperty`, columnas originales | Cambiar la extracción básica puede destruir trazabilidad | No modificar los importes/monedas guardados ni la semántica de `priceOf` |

## Fuente existente

`exchange-rate.js` consulta Banco de México mediante Frankfurter, conserva fecha de publicación, fecha de comprobación y estado. Lectura pública de `/api/config` del 15-11-2026: 1 USD = 18.5525 MXN, observación del 13-11-2026, estado `available`. Es una referencia fechada de la última jornada publicada; no se inventa una tasa para fines de semana.

## Contrato de implementación

- `priceOf` conserva siempre el importe, moneda, unidad y período originales.
- La proyección pública convierte MXN / tasa USD→MXN; USD no se vuelve a convertir.
- La cotización debe tener par USD/MXN, fecha real no futura, comprobación no futura, proveedor BANXICO y antigüedad máxima de siete días. Se admite una observación reciente cacheada durante una incidencia, identificada como última cotización disponible.
- Se señala el importe convertido como aproximado, con fecha. Sin tasa utilizable se pide confirmar el precio USD; un dato faltante nunca pasa a cero.
- El filtro nuevo `priceMode=public-usd` compara importes convertidos con presupuesto USD. Los enlaces y búsquedas guardadas anteriores sin ese marcador conservan la moneda y límites originales.
- Orden y rangos públicos usan USD, manteniendo separados venta/renta, total/m² y períodos de renta. Un período no confirmado no se presume mensual.

## Validación

- `node --test test/public-pricing.test.js test/inventory-contract.test.js test/catalog-search.test.js test/saved-catalog-search.test.js test/exchange-rate.test.js`: **519 pruebas aprobadas, 0 fallos** (15-11-2026).
- Venta en USD conserva exactamente su importe. Venta en MXN se convierte una vez; la misma proyección puede recalcularse con otra tasa sin dividir dos veces.
- Presupuesto, orden y rango comparan 18,000,000 MXN / 20 = 900,000 USD con registros originales de 950,000 y 1,000,000 USD. Los tres entran en el mismo límite público USD. Los resultados se calculan con decimales completos y se redondean sólo al presentarlos.
- Sin tasa válida, USD sigue visible; MXN pasa a «Precio en USD por confirmar» y no inventa coincidencias de presupuesto. Sin presupuesto se conserva la ficha consultable.
- Precio total y precio/m² se agrupan por separado. Venta, renta mensual, renta diaria, renta anual y renta sin período confirmado conservan su semántica.
- **MLS 1877, lectura pública real**: `prop-14132f12-1ce6-4ef3-b47a-e25d6169db61`, renta, **USD 7,200**, total, sin `rentPeriod` en `catalogData`. La prueba conserva 7,200 USD y muestra «período por confirmar», sin asumir mensualidad.
- Un filtro histórico `currency=MXN&max=20000000` conserva su límite original y sus coincidencias al serializar, guardar y ejecutar alertas. El formato de su presupuesto puede calcularse en USD sin modificar el filtro original.
- Nuevos filtros `priceMode=public-usd` sobreviven serialización URL, intérprete, búsquedas guardadas y ejecución. El módulo compartido produce los mismos importes y resultados en navegador y servidor.
- La comprobación anterior cubre el contrato y el formato central. La verificación visual de cada ruta pública pertenece a la integración de plantillas y aplicación; no se da por verificada únicamente por estas pruebas.

## API para integrar en rutas públicas

```js
const inventory = require('./inventory-contract');
const pricing = require('./public-pricing');
const snapshot = exchangeRateService.getSnapshot();

// No modifica la propiedad ni su precio original.
const descriptor = inventory.publicPriceOf(property, snapshot);
const text = inventory.publicPriceText(property, snapshot, lang);
const note = pricing.rateNote(descriptor, lang);

// Sólo formularios nuevos que el usuario aplica en USD.
const input = { ...filters, currency: 'USD', priceMode: 'public-usd' };
const result = inventory.queryInventory(properties, input, {
  exchangeRate: snapshot, publicPricing: true, lang,
});

// Al abrir una búsqueda anterior, no reescribir input ni agregar priceMode.
const legacyResult = inventory.queryInventory(properties, savedQuery, {
  exchangeRate: snapshot, publicPricing: true, lang,
});
const displayBudget = pricing.budgetInUsd(savedQuery, snapshot);
```

`descriptor.amount` es USD o null, `originalAmount`/`originalCurrency` conservan la fuente, `approximate` y `date` identifican conversión. `descriptor.rate` contiene la observación completa validada, no sólo un número. `publicPriceRange` devuelve grupos con `min`, `max`, `currency`, `operation`, `basis`, `period`, `approximate`, `date` y `count`.

En navegador, cargar `public-pricing.js` **antes** de `inventory-contract.js`; incluirlo en verificación y versionado de assets. La presentación compartida/PDF pública debe llamar el mismo contrato con snapshot explícito. Los editores administrativos y documentos contractuales continúan usando `priceOf` y valores originales.
