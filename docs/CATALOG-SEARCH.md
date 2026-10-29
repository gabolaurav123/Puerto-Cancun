# Parser conversacional determinista

## Alcance y API

Nuevo modulo CommonJS `catalog-search.js`, sin dependencias nuevas, red, IA, base de
datos ni cambios a `server.js`, `app.js`, `intelligence-utils.js` o
`inventory-contract.js`. Node >=20, como el proyecto.

```js
const { interpretCatalogSearch } = require("./catalog-search");

interpretCatalogSearch(text, previous = {}, options = {});
// options: { properties?, language?, lang?, discardRequirements? }
// -> { filters, warnings, clarificationRequired, understood, conversation }
```

- `filters`: objeto nuevo compatible con `inventory-contract.parseQuery`. Siempre
  incluye `entity` (`properties` o `developments`) y `locations` (array). Los demas
  campos son opcionales: `text`, `zone`, `type`, `operation`, `modality`, `currency`,
  `min`, `max`, `beds`, `development`, `featured`, `priceBasis`,
  `priceBasisExplicit`, `rentPeriod`, `bounds`.
- Los campos ausentes significan filtro desactivado. El modulo acepta el contexto
  normalizado con limites `null` del contrato actual y mantiene una salida dispersa.
- `previous`: filtros iniciales, o el resultado anterior completo. En turnos de
  aclaracion pasar `{filters, conversation}` o el resultado completo, no solo filtros.
  Solo se conservan claves autorizadas; no se propagan permisos, estados, SQL,
  `includePrivate`, paginacion o argumentos ajenos al contrato. No muta entradas.
- `warnings`: array de mensajes ES/EN; puede haber avisos informativos sin
  bloqueo (preferencia de vista no verificada, uso comercial, presupuesto retirado).
- `clarificationRequired`: booleano. **Si es true, no ejecutar como consulta exacta**.
  Los filtros pueden contener un presupuesto pendiente de moneda/operacion/periodo,
  o una propuesta de agrupaciones cuya union de subzonas requiere eleccion.
- `understood`: array de etiquetas legibles ES/EN del estado interpretado, no
  resultados ni afirmaciones del inventario. Los valores de filtros no se traducen.
- Idioma: `options.language`, `options.lang`, `previous.language`, `previous.lang`,
  `previous.conversation.language`, en ese orden; acepta `en-US`/`es-MX` sin importar
  mayusculas. Predeterminado `es`. No se adivina el idioma por las palabras buscadas.
- `conversation`: campo aditivo serializable, version 1, idioma y `pending`, array
  de `{code, sources}`. `sources` conserva las frases originales de requisitos que
  no caben en filtros. No incluir este estado en URL ni pasarlo como filtros SQL.
- `properties`: catalogo opcional ya autorizado por el servidor, solo en memoria.
  Resuelve nombres de proyectos y unidades realmente recibidos. Ignora registros
  privados/borradores y padres privados conforme a `inventory.isPublic`.
  No sustituye la autorizacion del backend.

El modulo reutiliza `fold` de `intelligence-utils.js` y la validacion, entidades,
visibilidad, aliases de contexto y Locations de `inventory-contract.js`. Amplia
las reglas deterministas existentes, pero no llama al ranking ni a la expansion
de precio del buscador antiguo. No usa `parseIntelligentSearch` para presupuestos:
esa funcion antigua no representa modalidad, periodo o varias Locations.

## Integracion prevista

No se modifica el endpoint. `catalog-assistant.js` ya conserva el estado completo
y usa el envelope compatible con el endpoint existente:

```js
const interpreted = interpretCatalogSearch(query, previousFilters, {
  properties: authorizedPublicInventory,
  language: requestLanguage,
});

if (interpreted.clarificationRequired) {
  // Mostrar criterios y advertencias; solicitar una eleccion, no mostrar todos
  // los anuncios como si fueran coincidencias exactas ni afirmar "cero resultados".
  return { ...interpreted, needsChoice: true };
}

const result = inventory.queryInventory(authorizedPublicInventory, interpreted.filters);
return { ...interpreted, items: result.items, total: result.total, errors: result.errors };
```

El cliente envia `body.filters = {filters, conversation, language}` y ademas
`body.lang`/`body.language`. El servidor existente pasa `body.filters` como segundo
argumento, por lo que no necesita aplanarlo; debe devolver `...interpreted`, incluido
`conversation`. Al responder "USD" se recalculan moneda/operacion/periodo, pero
siguen pendientes vista, rutas, atributos sin soporte, exclusiones o union de zonas.
Una respuesta generica "si"/"yes" no confirma una ampliacion.

`Nueva busqueda`/`Start over` elimina contexto y pendientes. Una eleccion clara
resuelve la ambiguedad de su dimension; no elimina otros requisitos. Se soportan
renuncias explicitas `Sin requisito de vista al mar` / `Drop sea view requirement`
y `Sin requisito de tiempo` / `Drop travel time requirement`. Para una UI de
eleccion explicita se permite `options.discardRequirements: [code]` (tambien en
el envelope previo). No enviar codigos automaticamente por contestar moneda u
operacion. Descarta un codigo completo, incluidas todas sus fuentes; mostrar esos
requisitos antes de confirmarlo. `conversation_invalid` exige reinicio, no renuncia.

Ejemplo: `interpretCatalogSearch("Buy house with sea view under 700000", {},
{lang:"en"})`, seguido de `interpretCatalogSearch("USD", resultadoAnterior)`,
conserva `max:700000`, `currency:"USD"`, `operation:"sale"` y el pendiente
`sea_view`. `clarificationRequired` sigue siendo true; no es una consulta ejecutable.

Los codigos pendientes incluyen `sea_view`, `travel_time`, `unsupported_attribute`,
`area`, `editorial`, `exclusion`, `bedroom_operator`, `subzone_union`, `zone_alias`,
`cancun`, `colosio` y conflictos de tipo/entidad/nombre/operacion/modalidad/moneda/
periodo/presupuesto. La validacion derivada del contrato se recalcula, no queda
obsoleta al completar una dimension. Estados corruptos/versiones desconocidas se
bloquean. Un resultado antiguo sin `conversation` migra advertencias reconocidas
conservadoramente; contexto incompleto requiere reinicio. No hay almacenamiento
global ni historial de servidor: el llamador es responsable de reenviar el estado.

API de UI sin ruptura: `window.PccCatalogAssistant.search(text, status, button,
{language?, lang?} = {})` y `reset()`. Por defecto usa `document.documentElement.lang`;
el submit delegado respeta `lang` del formulario. No navega mientras haya eleccion,
errores o pendientes. Si una respuesta pierde un estado previo, bloquea y ofrece
reinicio. Reset aborta y restaura el boton; una respuesta tardia no restaura el estado.

Exports adicionales: `catalogLanguage(...sources)` y
`localizeCatalogError(message, language="es")` para adaptadores de servidor.
Errores desconocidos en ingles usan un aviso generico sin fingir una traduccion.
Para guardado/demanda/alertas, usar el contrato de `docs/SAVED-CATALOG-SEARCH.md`.

Una consulta valida sin coincidencias conserva sus filtros. Contacto comprador y
acceso vendedor deben recibir ese mismo contexto; no hay fallback que aumente el
presupuesto, quite zonas o fabrique alternativas. El modulo no devuelve fichas,
IDs de resultados, conteos, disponibilidad ni mensajes de exito comercial.

## Reglas

- Acentos, mayusculas y espacios se normalizan; `P Cancun`, `Puerto Cancun` y
  `Puerto Cancun` con acento apuntan a `puerto-cancun`. `ZH`/Hotel Zone usa
  `zona-hotelera`; no incluye Puerto Cancun.
- `Ahora solo reventa` conserva tipo, Location, moneda y presupuesto. Solo cambia
  modalidad; implica Venta cuando no habia operacion. Venta sin modalidad nunca
  significa `direct`: no descarta ventas antiguas sin clasificar.
- Una nueva ubicacion sustituye la anterior. `tambien`, `also`, `include` o
  `incluye` solicitan union, conservando criterios no geograficos.
- `zone` es una subzona exacta. Huayacan usa Cancun City y zona Huayacan; con
  catalogo opcional se conserva el alias exacto existente, por ejemplo Avenida
  Huayacan. Variantes no equivalentes presentes a la vez requieren aclaracion.
- **Limite del contrato actual:** `locations` es OR entre grupos, pero `zone` es
  un unico AND global. Puerto Cancun OR Punta Sam no puede representarse
  exactamente. Se propone `locations: ["puerto-cancun", "zona-hotelera"]`, sin
  `zone`, con advertencia y `clarificationRequired: true`. No ejecutar esa
  propuesta sin elegir una subzona o confirmar la ampliacion a ambos grupos.
  La union entre grupos completos, por ejemplo Puerto Cancun + Cancun City, si
  es ejecutable. Agregar Punta Sam al grupo ZH completo ya seleccionado no lo reduce.
- Para destinos externos (Tulum, Playa del Carmen, Merida, CDMX), combina la
  Location externa con texto geografico, porque no hay filtro `city`. Es busqueda
  textual, no comprobacion geografica. Colosio sin ciudad y Cancun sin agrupacion
  requieren eleccion; no se corrigen datos de inventario a partir de esas palabras.
- `Desarrollos` elige proyectos, nunca unidades mezcladas. `Departamentos del
  desarrollo X` mantiene propiedades y resuelve `development` usando un ID
  recibido en `developmentData.id`, `id` del proyecto o la relacion de la unidad.
  La forma `Desarrollo X` usa entidad proyectos y texto. Nombres homonimos piden
  elegir identidad. Sin catalogo usa texto, no inventa un ID de desarrollo.
- `1707`/`MLS 1707` conserva `text: "1707"`. No resuelve a un solo ID, no deduplica
  por MLS ni modifica fichas. La consulta autorizada conserva ambas identidades.
- Terreno comercial produce `type: "Terreno"` y advertencia de uso no verificado;
  no equivale a `type: "Comercial"` ni a acreditar permisos de uso de suelo.
- Hasta/under/budget y un importe suelto con moneda producen limite maximo
  inclusivo; desde/at least, minimo inclusivo; entre/between/from...to, intervalo.
  `beds` siempre significa minimo; maximos o cantidades exactas de recamaras piden
  aclaracion. No se relajan limites para conseguir resultados.
- Soporta `700000`, `700.000`, `700,000`, `700 000`, `700k`, `700 mil`, `1,5 millones`,
  `1.5 million`, `hasta700000USD`, USD/dolares y MXN/pesos. Grupos de tres cifras
  tras punto/coma se consideran millares. Decimales monetarios: hasta dos cifras.
  Numeros invalidos, negativos o fuera del rango seguro se bloquean.
- `$` solo no indica moneda. Se conserva una moneda explicita del contexto, pero
  sin ella se solicita eleccion. No hay tipo de cambio ni conversion silenciosa.
- Un presupuesto requiere moneda y operacion. Renta requiere periodo explicito
  (`month`, `day`, `year`), incluso sin importe. Cambiar compra/renta, periodo o
  base total/por m2 retira limites incompatibles con aviso; un presupuesto nuevo
  en ese turno los reemplaza. Modificar solo min o max conserva el otro extremo.
- `Nueva busqueda`/`Start over` reinicia. Hay comandos para quitar presupuesto,
  zonas, modalidad, tipo, desarrollo, recamaras, destacados o texto.
- Minutos sin rutas y vistas obligatorias sin dato verificable piden aclaracion;
  no generan filtros ficticios ni se filtran por palabras de una descripcion.
  Una preferencia de vista solo genera aviso. Portadas/borradores requieren una
  consulta administrativa autorizada independiente; esta API no habilita acceso.
- Excluir tipos/zonas y seleccionar varios tipos no se traduce a la primera
  coincidencia positiva. Banos, superficie y amenities sin filtro en el contrato
  requieren aclaracion. Palabras no consumidas quedan como busqueda textual AND.
- Entrada maxima 600 caracteres. Exceso de entrada o de texto libre (>300) se
  bloquea, sin truncar silenciosamente un limite obligatorio.

## Matriz de evaluacion del master

Master: `Texto pegado.txt`, version 29-10-2026, secciones 13.1-13.5 y 21.2;
aceptacion relacionada: T08/T09/T10/T26/T33/T36/T38/T42/T44/T47.
Los ejemplos del master no son inventario ni conteos esperados de produccion.

Los siguientes 40 casos tienen comparacion profunda del objeto completo en
`test/catalog-search.test.js`. Se indican patches sobre el objeto base
`{entity:"properties",locations:[]}`; no hay otras claves implicitas.
`P` = `{locations:["puerto-cancun"],type:"Departamento",operation:"sale",currency:"USD",max:700000}`;
`R` = P + `{modality:"resale"}`. El proyecto del fixture tiene ID `fixture-sls`.
"Elegir" equivale a `clarificationRequired: true`.

| Caso | Consulta / contexto | Filtros exactos sobre base | Estado |
| --- | --- | --- | --- |
| E01 | Quiero comprar un departamento en Puerto Cancun de hasta 700000 USD | P | Valido |
| E02 | I want to buy an apartment in Puerto Cancun up to 700,000 USD | P | Valido |
| E03 | Comprar departamento en Puerto Cancun hasta700000USD | P | Valido |
| E04 | Comprar departamento en Puerto Cancun hasta 700.000 USD | P | Valido |
| E05 | Ahora solo reventa / P | R | Valido |
| E06 | Now resale only / P | R | Valido |
| E07 | Incluye tambien Punta Sam / R | R, locations:["puerto-cancun","zona-hotelera"] | Elegir union |
| E08 | Also include Punta Sam / P | P, locations:["puerto-cancun","zona-hotelera"] | Elegir union |
| E09 | Renta mensual en SLS Harbour Beach | operation:"rent",rentPeriod:"month",development:"fixture-sls" | Valido |
| E10 | Monthly rent in SLS Harbour Beach | operation:"rent",rentPeriod:"month",development:"fixture-sls" | Valido |
| E11 | Casas en preventa en Huayacan | type:"Casa",operation:"sale",modality:"presale",locations:["cancun-city"],zone:"Huayacan" con acento | Valido |
| E12 | Pre-sale houses in Huayacan | Igual E11 | Valido |
| E13 | Terreno comercial en Huayacan | type:"Terreno",locations:["cancun-city"],zone:"Huayacan" con acento | Aviso uso |
| E14 | Commercial land in Huayacan | Igual E13 | Aviso uso |
| E15 | 1707 | text:"1707" | Valido |
| E16 | MLS: 1707 | text:"1707" | Valido |
| E17 | Desarrollos de Puerto Cancun sin portada | entity:"developments",locations:["puerto-cancun"] | Elegir acceso |
| E18 | Developments in Puerto Cancun missing cover | Igual E17 | Elegir acceso |
| E19 | Comprar casa hasta 700000 | type:"Casa",operation:"sale",max:700000 | Elegir moneda |
| E20 | Buy house under $700000 | Igual E19 | Elegir moneda |
| E21 | Departamento en Puerto Cancun hasta 700000 USD | P sin operation | Elegir operacion |
| E22 | Rent a condo under 5000 USD | type:"Departamento",operation:"rent",currency:"USD",max:5000 | Elegir periodo |
| E23 | Casa a veinte minutos del aeropuerto | type:"Casa" | Sin rutas |
| E24 | House within 20 minutes of the airport | type:"Casa" | Sin rutas |
| E25 | Departamento con vista al mar | type:"Departamento" | Sin dato de vista |
| E26 | Buy a condo, preferably ocean view | type:"Departamento",operation:"sale" | Aviso preferencia |
| E27 | Si tiene vista al mar, mejor / P | P | Aviso preferencia |
| E28 | Casas en Merida | type:"Casa",locations:["fuera-de-cancun"],text:"Merida" con acento | Valido |
| E29 | Featured apartments in the Hotel Zone | type:"Departamento",locations:["zona-hotelera"],featured:true | Valido |
| E30 | Casas en venta | type:"Casa",operation:"sale" | Sin inferir direct |
| E31 | Direct sale houses | type:"Casa",operation:"sale",modality:"direct" | Valido |
| E32 | Comprar departamento de dos recamaras en P Cancun hasta 700 mil dolares | P, beds:2 | Valido |
| E33 | Buy condos between 500 and 700 thousand USD | type:"Departamento",operation:"sale",currency:"USD",min:500000,max:700000 | Valido |
| E34 | Comprar casa hasta 1,5 millones de pesos | type:"Casa",operation:"sale",currency:"MXN",max:1500000 | Valido |
| E35 | Buy houses from 500000 USD to 700000 USD | type:"Casa",operation:"sale",currency:"USD",min:500000,max:700000 | Valido |
| E36 | Departamentos del desarrollo SLS Harbour Beach | type:"Departamento",development:"fixture-sls" | Unidades |
| E37 | Desarrollo SLS Harbour Beach | entity:"developments",text:"SLS Harbour Beach" | Proyectos |
| E38 | Now only Costa Mujeres / P | P, locations:["zona-hotelera"],zone:"Costa Mujeres" | Valido |
| E39 | Departamentos en ZH | type:"Departamento",locations:["zona-hotelera"] | Valido |
| E40 | Buy a house in Puerto Cancun and Cancun City | type:"Casa",operation:"sale",locations:["puerto-cancun","cancun-city"] | Union exacta |

## Verificacion y evidencia

```sh
node --check catalog-search.js
node --test test/catalog-search.test.js
node --test test/catalog-search.test.js test/catalog-assistant.test.js test/saved-catalog-search.test.js
```

La entrega original tenia 95 pruebas del parser. La ampliacion ES/EN y estado
conversacional incluye regresiones para cada requisito pendiente, JSON round trip,
cambio de idioma y respuesta de moneda/operacion/periodo. La suite de UI ejecuta
el modulo real en un DOM reducido con endpoint determinista, sin red. Evidencia
combinada e instrucciones de integracion: `docs/SAVED-CATALOG-SEARCH.md`.

Ademas de E01-E40, se prueban respuestas de aclaracion por turnos, reinicio,
inmutabilidad, determinismo, precio por m2, formatos numericos, limites imposibles,
monedas mezcladas, periodos incompatibles, negaciones, selectores privados,
homonimos, alias, contexto invalido y preservacion de min/max.

La consulta con el contrato real sobre fixtures aislados comprueba:

- USD 700000 incluye solo `fixture-limit`; excluye 700000.01, MXN, renta,
  precio por m2 y el proyecto. No existe tolerancia del 20%.
- `1707` devuelve `fixture-collision-a` y `fixture-collision-b`, no el borrador.
- Renta mensual SLS devuelve solo `fixture-rental`, no `fixture-daily` ni proyecto.
- Desarrollo SLS devuelve solo `fixture-project`, no sus unidades.
- Presupuesto imposible y texto inexistente dan lista vacia calculada, sin
  propiedades nuevas ni alternativas inventadas.

Esta evidencia valida interpretacion, consulta en memoria y flujo de UI aislado,
no endpoint desplegado, aspecto visual, permisos de sesion, geocodificacion,
exactitud del inventario real o despliegue.
No se ejecutaron servicios pagados, llamadas IA ni lecturas de produccion.
