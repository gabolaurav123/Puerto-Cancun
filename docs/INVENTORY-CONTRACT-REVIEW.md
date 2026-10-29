# Inventory contract: entrega y revision de integracion

Fecha: 2026-10-29. Contrato estable y siete correcciones de integracion entregadas.
La ultima autorizacion permite solo dos funciones de `server.js`, seis de
`app.js`, pruebas propias nuevas y este informe. Sin DB, migraciones, produccion,
notificaciones reales ni commit. El contrato no cambio durante esta correccion.

## Estado del contrato

**Estable para integracion: VERSION 2026-10-29.2.**
SHA256: `e0c56b7c738a3d68fee7446f1d916f18c2a2f36f8b6939637ec186847f0c28f6`.

API exportada conservada y verificada por prueba de claves exactas.
Los 16 hallazgos R01-R16 estan corregidos dentro del modulo. Las 201 pruebas
originales pasaron antes de ampliar cobertura; ninguna regresion se omitio,
convirtio en TODO ni se debilito para aceptar un requisito ausente.

La revision inicial de VERSION 2026-10-29.1 obtuvo 201 pruebas, 147 aprobadas
y 54 fallidas. Hash inicial:
`62e1bb3907008b80792deb617723aaffdb2a448d4948afd26669ea5f92bddd67`.

## Integracion I01-I07 corregida

| Caso | Defecto reproducido | Correccion y regresion |
|---|---|---|
| I01 [P1] | Alerta con coordenadas hidden o relacion privada que no coincide en catalogo publico | Reutiliza `getPublicProperties`; solo evalua y entrega `visibleProperty`. Cubre hidden, approximate, exact, relacion privada, ID retirado y dedupe de avisos. |
| I02 [P1] | Colosio sin ciudad/estado se reclasificaba como Cancun City | `toProperty` conserva ciudad/estado ausentes o vacios; no introduce evidencia geografica. La clasificacion cruda y la del DTO coinciden. |
| I03 [P1] | Base from/null se convertia en total y entraba al presupuesto | El DTO usa importe, moneda y base de `priceOf(row)`; mantiene ambiguos y null fuera de comparaciones. |
| I04 [P1] | Precio null reaparecia como 900 por una columna legacy | Helpers consumen `priceOf`; sin importe/base/moneda validos muestran por confirmar, o consultar si existe politica explicita. |
| I05 [P1] | Presupuesto guiado admitia faltantes como cero y precios por m2 como totales | Interseccion de dos consultas del contrato, sin comparador paralelo; moneda, operacion, periodo y base se validan. Entrada invalida muestra error. |
| I06 [P1] | Todas las rentas se etiquetaban mensuales | Periodos dia/mes/ano reales ES/EN; desconocido se anuncia por confirmar. Soporta metadata camel/snake-case. |
| I07 [P2] | Orden por importe desnudo y empate dependiente de entrada | `renderProperties` usa `queryInventory(...).all`: grupos comparables, ID estable, dedupe solo por ID y sin truncar a 24. |

### Funciones exactas modificadas

- `server.js`: `toProperty`, `createSavedSearchAlertsForProperty`.
- `app.js`: `formatCurrencyLine`, `localizedPropertyPrice`, `formatPriceLines`,
  `formatPriceSummary`, `propertyMatches`, `renderProperties`.

No se editaron funciones admin, editor, `savedSearchSubmit`, `loadPublicData`,
comparacion, `sortedProperties`, `comparablePrice` ni `guidedSearchSubmit`.
La ruta de render ya no llama a los dos comparadores legacy. La suite coloca
stubs que lanzan error si el filtro/render vuelve a usarlos.

Integracion posterior del parent conservada: `savedCatalogQuery` recibe
`{ queryText: search.query_text, properties: publicProperties }`. Dos regresiones
verifican el texto guardado por separado y la resolucion de nombres de desarrollo
contra el catalogo publico. No se edito `evaluateSavedSearch`.
El parent reporto 13/13 pruebas DB; no se ejecutaron pruebas DB en esta tarea.

### Compatibilidad de consumidores

- Se conservan firmas existentes; `formatCurrencyLine` agrega periodo opcional y
  `propertyMatches` admite consultas ya parseadas sin romper la llamada de un argumento.
- El presupuesto guiado es USD porque el formulario lo declara. No se deduce
  operacion ni periodo: sin ellos, el presupuesto ambiguo queda bloqueado.
  El cero numerico del estado inicial sigue significando filtro desactivado.
- Ciudad/estado pasan a null si estaban ausentes; no se fabrica Cancun/Quintana Roo.
  Bases desconocidas no se presentan como precio total ni desde.
- Se conservan alias legacy no ambiguos, interseccion de min/max, bounds,
  Locations, entidad, destacado, recamaras e IDs de busqueda inteligente.
- Portada conserva prioridad editorial `homeOrder`, seis elementos, botones de
  favoritos/contacto/comparacion y callbacks existentes. Empates heredan el orden
  estable del contrato. No se ordenan monedas distintas por equivalencia cambiaria.
- Alertas usan el mismo inventario publico que la consulta periodica. Los llamadores
  actuales invalidan su cache antes de crear avisos; futuras rutas deben conservarlo.

Pruebas nuevas: `test/inventory-integration-fixes.test.js` (32 casos).
Extraen funciones reales a `node:vm`; usan contrato, `publicProperty` e interprete
guardado reales, con I/O y DOM simulados. No importan ni arrancan `server.js`.

## Correcciones R01-R16

| ID | Decision implementada |
|---|---|
| R01 | Todos los alias de Colosio requieren ciudad inequivoca; municipio Benito Juarez solo basta con estado Quintana Roo. Conflictos quedan pendientes. |
| R02 | Alias documental P Cancun sin cambiar la geografia original. |
| R03 | null/vacio en min/max/beds permanece ausente; parsing idempotente. Objetos/booleanos no se convierten en numeros. |
| R04 | featured invalido devuelve error; conserva booleanos y strings documentados. |
| R05 | unclassified sirve para localizar rentas pendientes, nunca para comparar presupuestos. |
| R06 | Sin defaults de moneda u operacion. Un null/precio invalido canonico no reactiva columnas legacy. |
| R07 | Bases desconocidas/null no se transforman en total ni pasan su presupuesto. |
| R08 | location/locations explicitos sustituyen defaults y validan todas las opciones; no esconden invalidos. |
| R09 | Relacion nativa parent_development_id soportada. |
| R10 | Repeticiones de marcadores no completan descripciones; prosa legitima con pendiente sigue permitida. |
| R11 | Referencias vacias no cuentan; null image_count no borra portada; contador solo se usa en proyecciones sin referencias. |
| R12 | Calidad exige importe, moneda soportada y base valida, o politica explicita de consultar. |
| R13 | Renta requiere periodo conocido para estar completa, incluso con precio a consultar. |
| R14 | Proyecto requiere evidencia comercial existente: modalidad explicita, politica de consultar, stage o paymentPlan/En. |
| R15 | Descripcion que anuncia otro tipo genera issue, sin reclasificar; casa club/departamento de ventas no disparan ese diagnostico. |
| R16 | Base explicitamente seleccionada filtra sin limites de importe; default no restringe por accidente. |

Se corrigio la fixture positiva de proyecto: ahora usa `stage`/`paymentPlan`
del modelo real, en vez del campo inventado `commercialStatus`.
Se agrego un caso negativo que demuestra que ese campo inventado no satisface
comercializacion. No se exigieron recamaras, precio de unidad ni unidades
individuales a proyectos. Superficies esenciales tambien rechazan infinitos
y booleanos.

## Compatibilidad y decisiones

- `parseQuery` sigue devolviendo `{ query, errors }`. Admite la consulta normalizada, su variante plana con `errors`, y el envoltorio completo guardado. `contractVersion` es metadato tolerado, no un filtro ni una autorizacion.
- Se preservan errores guardados: reparsear no activa una busqueda ambigua. `matches` devuelve false ante envoltorios invalidos; `queryInventory` devuelve errores y cero resultados; `toSearchParams` rechaza con TypeError un envoltorio con errores. Serializar solo consultas validas.
- `savedCatalogQuery` sigue siendo responsable de remapear legacy. El contrato rechaza minPrice/maxPrice sin remapear y presupuestos sin moneda/operacion/periodo; no amplia silenciosamente.
- Campos nuevos de consulta: `bounds` (array o null) y `priceBasisExplicit` (booleano). Preservarlos en estados/allowlists de consumidores. Conservar solo `priceBasis:'total'` y perder el marcador false cambia un default de comparacion a un filtro explicito.
- `priceBasis` omitido conserva el default legacy total para comparar presupuestos, pero no excluye otras bases en un listado sin limites. La URL omite ese default implicito; una seleccion explicita total/sqm se conserva. Al seleccionar total sobre un objeto normalizado, establecer `priceBasisExplicit:true` o enviar input crudo sin el marcador.
- En registros, `priceUnit` omitido sigue significando total legacy por compatibilidad; `priceUnit:null` o un token desconocido no. Desde/rangos siguen pendientes de contrato positivo; no se simula soporte mezclandolos con totales.
- Moneda solo se deduce si NO hay importe/moneda canonicos y existe exactamente una columna legacy positiva denominada USD o MXN. Con dos monedas candidatas, o null explicito, queda desconocida. No hay conversiones.
- `quality.complete` sigue describiendo integridad editorial; `issues` mantiene contradicciones separadas. No publica/despublica, no implica verificacion juridica, no asigna Premium.
- Los filtros publicos requieren datos ya proyectados para su audiencia. El contrato no reemplaza la proyeccion de coordenadas ni autenticacion; I01 queda corregido al aplicarla antes de alertas.

## Mapa y tipologias

`bounds=west,south,east,north` admite CSV o array JSON de exactamente cuatro
numeros finitos. Longitud [-180,180], latitud [-90,90], west < east, south < north.
No cruza el antimeridiano. Errores explicitos identifican el mapa y no devuelven
el catalogo general. Limites inclusivos; cero real es valido; coordenadas
null/vacias/NaN/infinitas/booleanas o fuera de rango no coinciden. El filtro se
combina con entidad, visibilidad, Location, tipo, destacados, presupuesto y
paginacion sin motor paralelo. `toSearchParams` conserva CSV.

Las tipologias explicitas (`publicationSection/publication_section:'typologies'`
o tipo Tipologia/Typology) no se mezclan con unidades/proyectos. `entityOf`
devuelve typologies, `isPublic` false y `quality` indica unsupported-entity.
Consultarlas produce error de soporte pendiente. `reconcile().pendingRecords`
retiene sus diagnosticos; no entran en total, records ni counts del inventario.
No se expanden capacidades/modelos de proyectos a anuncios ficticios.

## Pruebas finales

```text
node --test test/inventory-contract.test.js test/inventory-integration-fixes.test.js
tests 329; pass 329; fail 0; skipped 0; todo 0; cancelled 0
exit code 0

node --test --test-reporter=spec test/catalog-search.test.js test/catalog-metadata.test.js test/homepage-regression.test.js test/visual-audit-regressions.test.js
tests 148; pass 147; fail 1; skipped 0; todo 0
exit code 1

node --test --test-reporter=spec --test-name-pattern='^(?!.*(?:browser|browser integration))' test/admin-inventory-contract.test.js test/catalog-map.test.js
tests 83; pass 81; fail 0; skipped 2; todo 0
exit code 0
```

Unico fallo de la ejecucion adicional: `test/homepage-regression.test.js:33`
exige el literal `res.redirect(302, "/?auth=login")`; la ruta `/panel` construye
ahora `/?${context}` con `URLSearchParams` para preservar intent/contexto.
Es una asercion estatica fuera de las funciones modificadas; no se edito la ruta
ni su prueba. Parser, metadata y auditoria visual pasaron. Los dos casos browser
opcionales de admin/mapa no se ejecutaron; no se presentan como cobertura real.
El fallo historico de fixture de proyecto en admin ya no aparece en su suite actual.

`node --check` en `app.js`, `server.js`, `inventory-contract.js` y ambas suites
propias paso. Smoke real de `savedCatalogQuery` (sin DB): persistir/reabrir el envoltorio
con VERSION, filtrar bounds, serializar y rechazar presupuesto legacy ambiguo,
todos comprobados con aserciones.

Las 297 pruebas cubren ambas exportaciones (CommonJS y global PccInventory en
VM), mapas, alertas, idempotencia, precios null, entidades, tipologias pendientes,
MLS duplicados, IDs unicos, Locations/acentos, calidad, no inferencia ciega y
orden/paginacion. No equivalen a navegador real ni pruebas HTTP/DB.

## Referencias y limites

Master leido: `C:/Users/gabol/.codex/attachments/9d5666c3-723f-43fd-91bc-1905e68e2f17/Texto pegado.txt`,
SHA256 `768f55a038a246cf4f6941da5b5e517995deb2bc0eb76b164bc8f60bde6c711f`;
matriz `docs/MASTER-20261029.md`. HEAD de referencia
`e3d610b6ac13e2aeb820d53c5b9a9f1c2e180060`; habia trabajo paralelo sin commit.

No se verificaron archivos de portada por HTTP, datos reales de MLS/Excel,
navegador, servicios externos ni publicaciones reales. Una URL no vacia no
demuestra que el archivo exista. Los registros sin ID y duplicados por ID con
contenido contradictorio siguen requiriendo validacion/precedencia en ingreso;
no se eligio una politica arbitraria. La visibilidad legacy sigue suponiendo
estados y booleanos tipados. Las siete correcciones se limitaron a las funciones
autorizadas. Hay ediciones paralelas en el arbol; los hashes de fuentes usados
por la nueva suite se imprimen como diagnostico de cada ejecucion.
