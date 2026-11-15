# Auditoría de ubicación pública · 15 noviembre 2026

## Entradas y comportamiento previo

| Entrada | Implementación / datos | Comportamiento y pérdida detectada |
| --- | --- | --- |
| Ficha ES/EN de propiedad o desarrollo | `seo-pages.renderPropertyPage`, `inventory-metadata.publicProperty` | Ubicación debajo de descripción, amenidades y evidencia. El título siempre dice propiedad, incluso en desarrollos. Con coordenadas genera iframe y marcador, sin respetar precisión aproximada en ese render. Sin coordenadas requiere pulsar `data-show-area-map`. |
| Proyecto dentro de Preventas | `catalog-view` y directorio público | Usa información del desarrollo enlazado; requiere integrar la misma resolución y sección de ubicación que la ficha completa. |
| Tarjetas y recomendaciones | `catalog-view`, `seo-pages.renderInventoryCards` | Etiqueta principal a menudo contiene solo zona. Falta una localidad/subzona estable para Fuera de Cancún. |
| Mapa de resultados | `catalog-map.prepareItems/mount` | Redondea coordenadas aproximadas y distingue marcadores, tiene control de zoom y modo táctil para desplazar página. No inventa coordenadas si faltan. |
| Mapa de zona manual | `app.bindPublicAreaMap` → GET `/api/geocode` | Geocodifica texto al pulsar botón y muestra iframe sin marcador. El fallo deja texto de error, pero mapa y ubicación son secundarios. |
| Edición/recarga | `normalizePropertyInput` → columnas `latitude`, `longitude`, `map_place`, `location_precision`, `parent_development_id` → `toProperty` | La normalización conserva campos omitidos, campos geográficos vacíos heredados y coordenadas anteriores cuando llegan ambas vacías; desvincular requiere acción explícita. La precisión `exact` no exige coordenadas: puede quedar una declaración exacta sin punto verificable. |
| Relación propiedad–desarrollo | `PROPERTY_SUMMARY_COLUMNS.parent_development_record`, `portal-directory.enrichProperties` | El resumen de padre no trae ubicación/precisión; `publicProperty` borra además cualquier dirección y coordenadas del padre. La alternativa debe resolverse solo desde un desarrollo público vinculado, respetando autorización de la unidad y del proyecto. Nunca desde otra unidad. |

La captura de datos públicos de partida está en `outputs/qa-20261115/public-inventory-before.json` (282 publicaciones). Es evidencia de lectura, no una operación de actualización de datos.

## Casos de control

| ID / ficha | Evidencia existente | Decisión |
| --- | --- | --- |
| `prop-c6b8c354-ab11-4ef2-b7ce-fef8f80dc4c0`, Punta Cancún | Ubicación exacta, 21.134899 / -86.744659, calle y Zona Hotelera. | Conservar mapa automático con marcador exacto autorizado. |
| `prop-c2d9955e-b6a5-42f9-80e1-46a6adfb7a87`, desarrollo Punta Cancún | Exacta, 21.136656 / -86.747455. | Conservar punto propio; no sustituir por el de su unidad. |
| `prop-xlsx-3d0d5ff2d8b69246286aaa67`, Mondrian | Zona Hotelera, Cancún, Quintana Roo; aproximada; sin coordenadas públicas. | Mapa automático de zona sin marcador exacto. No atribuir una ubicación precisa por el nombre comercial o por imágenes. |
| `prop-xlsx-60231635df1962b7dc647b1a`, Azürea | Zona Hotelera, Cancún, Quintana Roo; aproximada; sin coordenadas públicas. | Igual: referencia de zona y texto siempre visibles. |
| `prop-9bd1e577-b73d-47fd-9a4d-6462a198358b`, RIVA MLS M7612 | Unidad con precisión exacta, 21.160899 / -86.805907 y dirección Riva, Boulevard Puerto Cancún. | Mapa exacto de esta unidad, no fuente de coordenadas para otra ficha. |
| `prop-fc731974-b929-4daa-90c4-3f20b96ecfb2`, RIVA | Precisión declarada exacta, pero coordenadas nulas; dirección «Quintana Roo, México»; barrio RIVA, zona Puerto Cancún. | Causa de la contradicción: etiqueta depende del campo de precisión y mapa depende de coordenadas. Mostrar zona aproximada mientras falta punto verificable; dejar dato original intacto y caso pendiente de verificación. |
| `prop-xlsx-6954138fa174d915e2b09278`, desarrollo Riva | Zona Puerto Cancún, precisión aproximada, coordenadas nulas. | No completar con coordenadas de unidades. |
| `prop-8008c9bc-02ca-435f-9dcd-b5739cfed032`, Al Mare | Clasificación comercial Puerto Cancún y punto exacto 21.164223 / -86.805854. Dirección guardada «7, Circuito Marina, Zona Hotelera, Cancún…» y barrio Zona Hotelera. | Conservar clasificación y dirección, distinguiendo zona comercial y dirección publicada. «Zona Hotelera» proviene del texto geocodificado, no demuestra cambio de zona comercial. No reescribir datos sin verificación del equipo. |

## Límites y pendientes de datos

- La salida pública no permite reconstruir coordenadas originales ocultas ni afirmar que existan en la base. No se cambia su autorización.
- Falta confirmar punto exacto de la segunda ficha RIVA y, si se desea publicar precisión mayor, de Mondrian y Azürea.
- Un destino genérico «Fuera de Cancún» o el estado por sí solos no habilitan un mapa centrado artificialmente en Cancún.
- Esta corrección no debe geocodificar y guardar automáticamente coordenadas ni modificar la base de datos al iniciar el servidor.

## Implementación y pruebas

`public-listing-details.js` es compartido entre SSR y navegador. `resolvePublicLocation` devuelve zona/localidad, precisión efectiva, procedencia y coordenadas públicas; `renderPublicLocationSection` genera la sección permanente. La clasificación comercial encabeza la ubicación compacta; la dirección administrativa publicada se presenta aparte. Un «Fuera de Cancún» sin localidad concreta no genera un mapa al centro de Cancún. Las relaciones contradictorias o privadas no permiten heredar puntos.

`catalog-map.mountListingLocationMaps` observa la cercanía de la sección (300 px) y carga Leaflet automáticamente; reserva 240–360 px desde el HTML. Un punto autorizado lleva marcador; una aproximación utiliza una región circular y aviso explícito. El geocodificador solo obtiene referencias temporales de zonas y nunca guarda coordenadas. Fallos de geocodificador, recursos o teselas conservan el texto y el enlace de consulta. En móvil, un dedo desplaza la página y los controles +/− amplían el mapa.

Integración: título, resumen y tarjetas de `seo-pages`; mapa después del bloque principal, antes del video/descripción/amenidades; `app.bindPublicAreaMap` y detalle dinámico; directorio preventas mediante el mismo helper. `inventory-metadata.publicProperty` limita cualquier ubicación del padre a un desarrollo explícitamente público, vinculado y autorizado por ambas precisiones, con lista de campos permitidos. No se cambió una autorización de datos ni se copió el punto de una unidad hermana.

Validación ejecutada:

- `node --test test/public-location.test.js test/catalog-metadata.test.js test/catalog-map.test.js test/listing-integrity.test.js test/presale-content.test.js`: 81 pasan, 0 fallos, 2 pruebas de navegador optativas omitidas en esta corrida.
- `PCC_LOCATION_BROWSER=1 node --test test/public-location.test.js` con Edge/Playwright local: 9/9 pasan. Comprueba carga diferida automática, un solo mapa por sección, zoom real, región aproximada sin pin, proveedor caído, Leaflet bloqueado, ancho de 390 px y desplazamiento mediante eventos táctiles reales.
- Las dos pruebas de mapa de `public-ux-corrections` se actualizaron al nuevo contrato automático, precisión explícita y posición antes de la descripción.
- Captura funcional local `outputs/qa-20261115/location-mobile.png`: usa teselas sintéticas para que la prueba no dependa de Internet; no representa una captura del sitio desplegado.

El registro original permanece intacto después de resolver/renderizar su ubicación. La solución se puede ejecutar repetidamente sobre la misma respuesta pública sin producir escrituras.

## Edición e importación

Las pruebas existentes de `listing-integrity` ejecutan la normalización real aislada y confirman que una edición parcial o controles geográficos vacíos conservan dirección, zona, coordenadas, padre, fotos y clasificación. La desvinculación debe ser explícita. El `UPSERT` de `syncDevelopmentEntity` conserva la identidad del desarrollo y no sustituye las coordenadas de su publicación.

El importador Excel histórico no forma parte de los módulos versionados actuales: `docs/INVENTORY-RECONCILIATION-20261029.md` documenta `build-manifest.cjs` e `import-drafts.cjs`, IDs derivados de nombres y ausencia de una prueba de reimportación. Esta intervención no ejecuta ni modifica ese importador; tampoco demuestra una reimportación contra DB. Cualquier futura reimportación debe cotejar identidad estable y valores actuales por campo, conservar cambios manuales y revisar conflictos. No se corrige un dato geográfico solo por parecido de título.
