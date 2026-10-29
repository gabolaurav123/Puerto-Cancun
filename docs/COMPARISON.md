# Comparador publico integrado

## Estado actual

El comparador esta conectado en el codigo de la plataforma: `index.html` carga estilos y script, `app.js` monta y actualiza el controlador con inventario publico, y `seo-pages.js` genera controles SSR `data-compare-id`. La seleccion admite **dos a cuatro inmuebles**, tambien con limite de cuatro en el estado guardado y en el comportamiento de respaldo de app.

La integracion esta implementada; eso no acredita por si solo despliegue o aprobacion de toda la plataforma. Los resultados globales de las pruebas integradas se incorporan en `CIERRE-20261029.md`. Este documento describe el codigo actual y su evidencia local, no una propuesta futura de conexion.

API de entrada: `window.PccComparison.mount({ properties })`. Requiere `inventory-contract.js` antes de `comparison-ui.js`. CommonJS expone funciones puras para pruebas. El componente no consulta DB ni obtiene inventario por su cuenta: recibe la respuesta publica vigente de `/api/properties`.

## Integracion de plataforma

| Archivo | Comportamiento actual |
| --- | --- |
| index.html | Incluye comparison.css y comparison-ui.js, con version de recurso. |
| app.js | mountPublicComparison recibe datos publicos, evita montar en /panel y llama updateProperties cuando ya existe instancia. La URL compare prevalece sobre la seleccion local al montar. |
| app.js | onChange sincroniza state.compare y pcc.compare; favoritos, consulta y visita usan los manejadores existentes. toggleCompare/openCompareModal delegan al controlador cuando esta disponible. |
| app.js / seo-pages.js | Las tarjetas de cliente y SSR incluyen data-compare-id; el control SSR tiene nombre accesible localizado ES/EN. |
| catalog-ui.js / catalog-view.js | Conservan compare en filtros, enlaces y navegacion del catalogo; tras reemplazar resultados sincronizan controles. |
| server.js | Sirve los recursos del componente y los incluye en el versionado de recursos publicos. |

La bandeja anterior se oculta cuando el comparador principal esta montado para evitar dos interfaces de seleccion simultaneas. Favoritos, consultas, solicitud de visita y acceso a ficha se conservan. El comportamiento de respaldo de app sigue limitado a cuatro; no existe un limite vigente de tres.

El modulo escucha `data-compare-id`, no `data-compare`. No combinar ambos atributos en un mismo boton. Los controles incorporados al volver a renderizar se detectan mediante MutationObserver.

Sin `target`, el componente inserta una seccion al final del primer `main`, o del `body` si no hay main. Admite `target: '#comparisonHost'` o un elemento DOM dedicado. No crea un modal ni una capa fija.

## Idioma ES/EN

- `options.lang` prevalece sobre `document.documentElement.lang`; admite variantes regionales ES/EN. Sin override, observa cambios de idioma del documento. La integracion actual usa el idioma del documento, con prioridad de ruta establecida por app.
- `setLang(null)` elimina el override y vuelve al idioma del documento. `update({lang})` permite sincronizar un idioma explicito desde otra integracion.
- Controles, mensajes, estados vacios/errores, ARIA, tipos, entidades, Locations, periodos y fechas estan localizados. Los numeros se formatean con Intl sin cambiar importe, moneda o unidad.
- Fichas EN usan `titleEn`/`title_en` y `urlEn`/`url_en`; si falta titulo EN, se muestra el ID con aviso de titulo pendiente, no una traduccion inventada. Los enlaces de respaldo permanecen en el catalogo EN.
- Compartir usa `/propiedades?compare=ID1,ID2` en ES y `/en/properties?compare=ID1,ID2` en EN. Contacto/visita de respaldo usan `/contacto` o `/en/contact`.

La interfaz aprovecha Lucide de la plataforma. Si no esta disponible, conserva etiquetas y simbolo de quitar. No agrega dependencias remotas. La CSP de fuentes de la plataforma esta corregida en `platform-utils.js`: permite la hoja de Google Fonts y fuentes HTTPS; no se considera bloqueo pendiente del comparador.

## Controlador y sincronizacion

El montaje actual usa callbacks equivalentes a estos; el ejemplo describe el contrato, no solicita crear otra instancia:

```js
const controller = PccComparison.mount({
  properties: publicProperties,
  getFavoriteIds: () => state.favorites,
  onFavorite: (id) => toggleFavorite(id),
  onContact: (id) => contactAdvisor(id),
  onTour: (id) => openTourRequest(id),
  onChange: (ids) => {
    state.compare = ids;
    localStorage.setItem(keys.compare, JSON.stringify(ids));
  },
});

// Refresco del inventario publico sin recrear el componente.
controller.updateProperties(nextPublicProperties);

// Sincronizacion explicita opcional, sin notificacion de vuelta.
controller.update({
  properties: nextPublicProperties,
  ids: state.compare,
  lang: state.lang,
  notify: false,
});
```

`onChange(ids)` se emite inicialmente y al cambiar los IDs normalizados, no por refrescar los mismos IDs o cambiar el idioma. Devolver los mismos IDs con setIds/updateProperties no provoca bucles. Con `notify:false`, la aplicacion debe leer `getState().ids` si necesita conservar la seleccion saneada tras enviar IDs retirados.

Metodos: `add`, `remove`, `toggle`, `setIds`, `updateProperties`, `update({properties?,ids?,lang?,notify?,updateUrl?,differencesOnly?})`, `setLang`, `getState`, `shareUrl`, `share`, `open`, `syncControls`, `refreshFavorites`, `setDifferencesOnly`, `saveSelection`, `loadSelection`, `deleteSelection`, `getSavedSelections` y `destroy`.

Un nuevo mount elimina solo la instancia anterior del modulo. destroy desconecta listeners/observer y restaura los atributos ARIA externos modificados. getState devuelve una copia de la proyeccion publica, no los objetos originales.

## Seleccion, URL y nombres locales

- Identidad por ID interno: MLS repetido no fusiona inmuebles. Con cero/uno no se inventa una comparacion; con cuatro, agregar un quinto no sustituye los anteriores.
- Lee `?compare=` salvo que se pase `ids`. Deduplica y descarta IDs no disponibles sin revelar si eran privados, borrados o inexistentes.
- Compartir incluye solamente dos a cuatro IDs publicos y el origen actual. No incluye nombre local, comentarios privados, PII, filtros, titulos, precios ni favoritos. shareUrl devuelve cadena vacia con menos de dos.
- La seleccion usa history.replaceState conservando ruta/filtros/hash actuales; popstate restaura la seleccion de la URL. Si falla clipboard, muestra el enlace enfocado y no afirma que lo copio.
- updateProperties actualiza precios/datos y descarta retirados. Sin un nuevo inventario recibido, el componente no puede conocer una despublicacion posterior.
- Selecciones con nombre: guardar/abrir/eliminar en localStorage, clave `pcc.comparison.selections.v1`, maximo 20, nombre de hasta 80 caracteres. Solo se almacena nombre + IDs. Aviso visible **Solo en este dispositivo**; no sincroniza con cuenta/servidor.
- Al abrir una seleccion guardada se revalidan los IDs contra el inventario publico recibido. El nombre no se agrega a la URL. Fallos de almacenamiento se informan sin falso exito.

## Comparacion de datos

Reutiliza isPublic, entityOf, resolveLocation, LOCATIONS y priceOf del contrato compartido. No reclasifica geografia ni corrige datos por titulo.

| Campo | Regla |
| --- | --- |
| Precio | Importe original, sin FX, ranking, promedio ni precio/m2 derivado. |
| Compatibilidad | Misma entidad, moneda USD/MXN, operacion, base total/por m2 y, en renta, periodo day/month/year explicito e igual. Criterios ausentes/incompatibles se explican. |
| Precio a consultar | catalogData.priceOnRequest o importe ausente/invalido no se convierten en precio comparable. |
| Construccion / terreno | area y lot separados, sin sumar ni reasignar; cero/vacio/invalido no es superficie disponible. m2 y ft2 no se convierten. |
| Concepto dudoso | lot de Departamento y superficie global de desarrollo quedan por confirmar, no se presentan como construccion de una unidad. |
| Recamaras / banos / estacionamiento | beds/baths/parking explicitos; ausencia no es cero. No se atribuyen unidades a un desarrollo. |
| Mantenimiento | maintenance: {amount,currency,period}, solo dato estructurado recibido. El endpoint actual no suministra este campo; se muestra no disponible, sin deducir de descripciones. |
| Modalidad | catalogData.salesModality: presale/direct/resale; venta legacy no implica directa. Renta muestra no aplica. |
| Entrega | developmentData.deliveryDate valida; no fecha inventada desde texto o actualizacion. |
| Verificacion | lastVerifiedAt / last_verified_at valida; nunca sustituida por updatedAt ni acompanada de verifiedBy privado. |
| Location / entidad | Contrato compartido, pendiente explicito cuando corresponda; desarrollo no equivale a unidad disponible. |

**Solo diferencias** oculta filas con valores semanticos iguales; conserva las advertencias de incompatibilidad incluso si ambos tienen el mismo faltante. Mantiene encabezados de fichas, favoritos y CTA. Compatible no significa recomendacion financiera ni anuncio verificado.

## Favoritos, contacto y accesibilidad

Favoritos usan onFavorite o toggleFavorite; leen getFavoriteIds o pcc.favorites. Sin callback conservan los demas IDs locales. Contacto y visita usan onContact/contactAdvisor y onTour/openTourRequest; sin manejador hay enlaces normales por idioma. Los callbacks reciben ID, no metadatos administrativos. Una solicitud de visita no es un recorrido virtual ni se declara recibida por pulsar el enlace.

Tabla con caption/scope, region desplazable con teclado, mensajes role=status, aria-pressed, foco visible/restaurado y controles tactiles. En movil el desplazamiento horizontal queda en la tabla. CSS encapsulado, sin ocultar acciones externas. Fotos y videos reales existentes de la plataforma se conservan; planos/masterplan/360/3D basados en material no disponible siguen excluidos por usuario.

## Privacidad

Solo active/featured con isPublic booleano explicito true y sin banderas contradictorias. Copias privadas/conflictivas de un ID se excluyen. Proyeccion limitada a campos de tabla y enlaces publicos; no incluye direccion exacta, coordenadas, propietarios, usuarios, verifiedBy ni descripciones administrativas. Texto escapado, IDs acotados, enlaces locales e imagenes HTTPS o assets/uploads permitidos.

Usar siempre la respuesta publica: esta defensa del componente no sustituye la autorizacion del servidor. No suministrar state.properties cuando corresponda al inventario administrativo.

## Evidencia y cierre

Ejecucion local registrada de `test/comparison.test.js`: **36/36, cero fallos y omitidas** (23 pruebas de logica, 12 subpruebas de navegador y contenedor). Cubre ES/EN, URLs, limite cuatro, privacidad, respuestas de callbacks sin bucle, diferencias, seleccion local, favoritos/CTA, teclado, portapapeles, baja de publicaciones, historial y ciclo de montaje. Anchos 320/375/768/1440; capturas desktop/movil revisadas en memoria.

```sh
node --check comparison-ui.js
node --test test/comparison.test.js
```

Para incluir navegador, definir PCC_PLAYWRIGHT_MODULE y opcionalmente PCC_BROWSER_CHANNEL=msedge o chrome. Sin Playwright, se omite explicitamente esa prueba. La ejecucion registrada uso datos locales y red interceptada; no acredita por si sola el resultado global integrado ni produccion.

Esta revision solo actualiza documentacion. Las pruebas integradas y los resultados globales **se incorporan en CIERRE-20261029.md**; no se declara el cierre terminado.
