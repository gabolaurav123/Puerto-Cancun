# Saved Search Contract - 2026-10-29

## API compatible

```js
const { savedCatalogQuery, parseInitialCatalogSearch } = require("./saved-catalog-search");

savedCatalogQuery(input = {}, options = {});
parseInitialCatalogSearch(queryText, filters = {}, options = {});
// Both return { ...inventory.parseQuery(...).query, errors: string[] }.
// Never { query, errors }. Do not drop errors before queryInventory.
```

`options`: `{ queryText?, properties?, language?, lang? }`. `properties` es un
catalogo publico/autorizado opcional recibido en memoria; no se consulta produccion.
El helper `parseInitialCatalogSearch` es un wrapper de `savedCatalogQuery`, no un
parser con otra semantica. El argumento `queryText` del helper es el texto inicial.

Entradas admitidas: filtros canonicos, campos legacy, `{filters, query_text}` o
`{query, errors}` del contrato. Tambien `input.queryText`, `input.query_text`,
`options.query_text` y segundo argumento string como texto. Textos duplicados
distintos se consideran conflicto, no se elige uno silenciosamente.

Idioma: `language`/`lang` de options o input, con variantes regionales; default ES.
Los mensajes de error son ES/EN, pero enums, nombres e IDs no se traducen.

## Integracion del servidor

**Interpretar tambien al leer legacy, evaluar demanda y enviar alertas.** No basta
con interpretar solo al crear. `query_text` esta separado de `filters` en las filas
existentes; si el llamador no lo pasa, el modulo no puede recuperar ese texto.

```js
// Lectura, demanda, recomputacion de matches y alertas:
const criteria = savedCatalogQuery(search.filters || {}, {
  queryText: search.query_text || "",
  properties: publicProperties,
  language: requestLanguage,
});
if (criteria.errors.length) {
  return { needsReview: true, errors: criteria.errors };
}
const result = inventory.queryInventory(publicProperties, criteria);
```

La llamada propuesta por `demand-analysis.js` es directamente compatible:
`savedCatalogQuery(input, {queryText: search.query_text, properties: publicProperties})`.

```js
// Crear o editar; usar los valores efectivos tanto del texto como de filtros.
const criteria = parseInitialCatalogSearch(queryText, filters, {
  properties: publicProperties,
  lang: requestLanguage,
});
if (criteria.errors.length) {
  return { needsReview: true, errors: criteria.errors };
}
// Persistir criteria y queryText; no convertir errors en una busqueda sin filtros.
```

En PATCH, si solo cambia texto, volver a evaluar contra filtros existentes; si solo
cambian filtros, usar el texto existente. No truncar `queryText` antes del parser:
mas de 600 caracteres debe pedir revision, no borrar una restriccion del final.
Integracion del coordinador verificada en lectura de codigo: alta, edicion,
evaluacion e immediate alerts pasan `queryText` y `properties`; `demand-analysis.js`
tambien. El endpoint conversacional pasa idioma y localiza errores. Esta entrega
no modifica `server.js`, `app.js` ni `demand-analysis.js`.

### Bloqueo de integracion pendiente

En el snapshot revisado, alta y PATCH siguen usando `.trim().slice(0, 600)` antes
de llamar al helper (`server.js:5479` y `server.js:5525`); PATCH vuelve a truncar
al persistir (`server.js:5537`). Esto puede convertir texto invalido en una consulta
mas amplia valida: un prefijo valido seguido de espacios hasta la posicion 600
y `with sea view` pierde el requisito final. Pasar el texto completo y rechazar
longitud excesiva antes de persistir. La correccion corresponde al integrador del
servidor; no se realizo fuera del alcance autorizado. Una vez truncado, el helper
no puede reconstruir ni detectar el requisito perdido.

## Semantica

- `queryText` se interpreta con `interpretCatalogSearch`; no es una etiqueta ni se
  pega como texto literal al SQL. Los terminos no reconocidos son texto lexical AND,
  no acreditacion de atributos fisicos ni resultados fabricados.
- Filtros y texto inicial son una conjuncion. `min` y `beds` toman el mayor minimo;
  `max` el menor maximo. Locations se intersectan. Texto libre se combina por AND.
  Presupuesto, moneda, entidad, selector, bounds y destacados nunca se diluyen.
- Moneda/operacion/periodo faltantes pueden completarse desde el texto. Nunca se
  infieren USD, renta mensual, conversiones o modalidad directa.
- Tipos, moneda, operacion, periodo, entidad, zona, selector o base contradictorios
  producen `errors`. Se conserva la restriccion estructurada, pero no es ejecutable
  hasta revisar. Un intervalo vacio tambien produce error, no intercambia limites.
- `New search`, quitar presupuesto o borrar texto no son ordenes de ampliacion
  autorizadas dentro de una intencion guardada: si descartan restricciones,
  generan errores. Para refinamiento conversacional usar `interpretCatalogSearch`;
  para cambiar deliberadamente una busqueda guardada, enviar los criterios finales
  corregidos y su texto coherente.
- Campos legacy `propertyType`, `location`, `minPrice`, `maxPrice`, `bedrooms`, `q`
  y sorts antiguos se remapean aun si hay `entity`, `locations` o `contractVersion`.
  `propertyType: "Desarrollo"` selecciona proyectos; `Preventa` selecciona modalidad
  presale/venta. Una location legacy no reconocida como grupo conserva zona exacta.
- Campos restrictivos sin soporte, incluidos bathrooms/minArea/amenities/features,
  se rechazan tambien en objetos canonicos. No desaparecen por tener una version.
- Todos los avisos del parser requieren revision antes de alertas automaticas,
  incluso una preferencia de vista o uso comercial no verificado. Una coincidencia
  no debe implicar cumplimiento de algo que el contrato no pudo comprobar.
- `conversation` recibido se reenvia al parser. Una respuesta de moneda no resuelve
  vista/rutas/atributos pendientes. El resultado guardado sigue siendo plano: los
  errores conservan el bloqueo incluso al serializar y volver a normalizar.
- Errores historicos recibidos permanecen bloqueantes: algunos representan datos
  ya descartados por un normalizador antiguo y no se pueden reconstruir. Tras
  revision explicita, reconstruir la intencion corregida, no borrar errors para
  activar notificaciones sobre la propuesta parcial.
- No hay fetch, IA, geocoding, base de datos, escritura de produccion ni efectos
  externos en ninguno de estos helpers. Son deterministas y no mutan entradas.

## Evidencia local

Ejecucion del 29-10-2026: **562/562 pruebas aprobadas**, cero fallos, omitidas o
canceladas. Incluye 221 pruebas propias (133 parser, 70 guardado, 18 UI) y las
suites existentes indicadas abajo. Sintaxis verificada para los tres modulos.
El repositorio sigue recibiendo cambios paralelos; no se afirma toda la suite global.

```sh
node --check catalog-search.js
node --check catalog-assistant.js
node --check saved-catalog-search.js
node --test test/catalog-search.test.js test/catalog-assistant.test.js test/saved-catalog-search.test.js
node --test test/catalog-metadata.test.js test/inventory-contract.test.js test/inventory-integration-fixes.test.js test/intelligence-foundation.test.js test/location-catalog.test.js test/demand-analysis.test.js
```

Las pruebas del parser conservan los 40 casos exactos del master; cubren ES/EN,
pendientes por turnos, cambios de idioma, aclaraciones invalidas y renuncias
explicitas. Las de guardado comprueban conjuncion, conflictos, campos legacy,
queryText, estado pendiente y compatibilidad de salida plana. Se verifica tambien
`analyzeDemand` real con fixtures sinteticos: una restriccion no soportada va a
revision, no se cuenta como demanda insatisfecha; un limite textual no se amplia.
El test de entrada larga exige pasar el texto original completo al helper; no
valida como correcto el truncado que aun realiza el servidor. Las de UI prueban
el modulo real en VM con DOM reducido, endpoint determinista y cero red: transporte
del envelope, navegacion bloqueada, reset, respuestas tardias y render seguro.

No se afirma verificacion visual ni del endpoint desplegado. No se arranca server,
ni se realizan llamadas a servicios pagados/IA o lecturas de datos de produccion.
