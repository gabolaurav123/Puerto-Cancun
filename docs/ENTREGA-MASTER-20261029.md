# Entrega de control del master, 29 octubre 2026

## Estado del trabajo

Documento de seguimiento de la plataforma; **el master completo sigue pendiente**. Se releyo el prompt y se contrasto con el codigo y las pruebas disponibles. Los resultados mas recientes, alcance de las pruebas, inventario observado y estado de commit/despliegue estan en [CIERRE-20261029.md](CIERRE-20261029.md), que prevalece sobre los cortes historicos de este documento. No se declara aceptacion integral en produccion.

**Cambio de alcance del usuario, 29 octubre 2026:** "no pongas planos interactivos ni nada porque no tenemos planos de nada, quita eso". Planos interactivos, masterplan y recorridos 360 o 3D basados en ese material quedan **excluidos por usuario**, no pendientes ni bloqueantes. No se requiere desarrollar soporte ni obtener ese material. Se conservan fotos, galerias y videos reales existentes, asi como las solicitudes de visita. Esta decision sustituye el alcance original de I07/T32.

La matriz detallada esta en [MASTER-20261029.md](MASTER-20261029.md). Estado del corte:

| Matriz | Total | Distribucion |
| --- | ---: | --- |
| O01-O42 | 42 | Estado por requisito en la matriz |
| A01-A20 | 20 | Estado por hallazgo en la matriz |
| T01-T56 | 56 | Evidencia local, parcial o pendiente por caso; T32 excluido |
| I01-I10 | 10 | Estado por innovacion; I07 excluido |

No son porcentajes de aceptacion. Implementado no significa desplegado; Local no significa prueba completa de produccion. Los casos parciales tambien requieren cierre. T17 de desarrollos ya paso; los resultados recientes de PostgreSQL y navegador estan en CIERRE. T32 e I07 se conservan para trazabilidad como excluidos, no como fallos ni requisitos de aceptacion pendientes.

## Cambios disponibles

- Contrato comun de entidades, Locations, filtros, calidad, precios y conciliacion por ID. MLS repetido no fusiona registros. Geografia original separada de agrupacion comercial.
- Catalogo SSR/cliente con filtros, URL, historial, abortos de respuestas obsoletas, contador por entidad y CTA comprador/vendedor. Mapa Leaflet con clusters, precision y busqueda explicita de area; no tiempos de viaje fabricados.
- Parser determinista ES/EN con filtros estrictos, aclaraciones persistentes y 40 consultas esperadas. Busquedas guardadas conjugan texto inicial y filtros; las correcciones actuales validan criterios efectivos al crear/editar, no truncan texto largo ni activan alertas con criterios invalidos. Su verificacion integrada final queda en cierre, no su implementacion.
- Administracion con completas/incompletas, faltantes accionables, referencias no persistentes, desglose, conjuntos de IDs y estadisticas segregadas. Consultas exactas de calidad corregidas: preservan los IDs solicitados, no amplian criterios desconocidos y no presentan registros por revisar como completos. Hay prueba aprobada en PostgreSQL aislado.
- Demanda sin coincidencias calculada por `demand-analysis.js` sobre busquedas guardadas reales, no visitas anonimas. Correcciones actuales distinguen criterios invalidos de ausencia de coincidencias y agrupan Locations sin depender del orden ni duplicados. No equivale a una nueva solicitud ni a seguimiento comercial terminado.
- Editor conserva contexto, evita submit accidental con Enter, mantiene borradores y conflictos de version. La integracion serial valida sesiones, borradores y 409 que preserva cambios mas recientes. Contexto vendedor persistente en `commercial_context`; los recorridos de navegador siguen en cierre, no bloqueados por falta de backend.
- Disponibilidad implementada y probada por el equipo de desarrollo: fecha publica sin `verifiedBy`, verificacion administrativa e historial, revision configurable por `PROPERTY_REVIEW_DAYS` y `DEVELOPMENT_REVIEW_DAYS`, conjuntos exactos por estado. No editar fecha de ficha como sustituto de comprobar disponibilidad. Resultados actuales en CIERRE.
- Prioridad de idioma de ruta corregida, EN real en componentes nuevos y redireccion de host www/canonical implementada. Falta QA completa de rutas legacy/MLS1281 y textos heredados.
- Textos publicos compradores reales / real buyers y premium generico corregidos; se conservan deliberadamente roles, segmentos y clasificaciones premium internas. No son pendientes de correccion publica.
- CSP de fuentes configurada y corregida en platform-utils.js: style-src admite fonts.googleapis.com y font-src admite fuentes HTTPS. No se mantiene como bloqueo pendiente; prueba de configuracion en test/platform-hardening.test.js.
- Comparador conectado en app/index/SSR: index carga recursos, app monta/actualiza datos publicos y SSR ofrece data-compare-id. Seleccion de hasta cuatro, idioma ES/EN y persistencia de compare en catalogo. La integracion esta implementada; su validacion global se incorpora al cierre.

## Comparador actual

Archivos del componente: `comparison-ui.js`, `comparison.css`, `test/comparison.test.js`. API de entrada compatible: `window.PccComparison.mount({properties})`, con inventario PUBLICO del endpoint y `inventory-contract.js` previamente cargado.

### Idioma y compatibilidad

- `options.lang` prevalece sobre `document.documentElement.lang`; admite ES/EN regionales. Sin override, observa cambios del idioma del documento. `setLang(null)` vuelve al idioma del documento.
- Textos, estados, ARIA, entidades/tipos, Locations, periodos, importes formateados y fechas ES/EN. Mantiene importe y moneda originales, sin conversion monetaria/temporal/de superficie.
- EN utiliza `titleEn`/`title_en` y `urlEn`/`url_en`; sin titulo EN muestra un identificador y aviso de titulo pendiente, no traduccion inventada. Fichas/enlaces fallback usan `/en/properties` y CTA `/en/contact`.
- Compartir genera `/propiedades?compare=id1,id2` o `/en/properties?compare=id1,id2`. Solo IDs internos publicos, de dos a cuatro; nunca nombre local, comentarios privados, favoritos, titulos o PII.
- Comparabilidad explicita por entidad, moneda, operacion, base y periodo; superficies separan construccion y terreno. Departamento con lot sin concepto confirmado no se redefine como construccion.

### Ampliacion I05

- Checkbox **Solo diferencias** compara valores semanticos; conserva advertencias de incompatibilidad aunque ambos tengan el mismo dato faltante. No quita fichas, favoritos ni CTA.
- Campos adicionales: `baths`, `parking`, `catalogData.salesModality`, `developmentData.deliveryDate`, `lastVerifiedAt` y `maintenance: {amount, currency, period}`. Admite nombres snake existentes para fecha/metadata. Fechas ISO validas, sin usar updatedAt como verificacion. Desarrollos no heredan banos/estacionamientos de una unidad.
- No disponible/por confirmar cuando falta dato. No extrae precios, entrega o mantenimiento desde descripciones. **El API actual no suministra mantenimiento estructurado**: su fila seguira no disponible hasta implementar esquema/editor/proyeccion publica y aportar datos. Eso requiere codigo, no un servicio externo.
- Selecciones con nombre: guardar, abrir y eliminar en `localStorage`, clave `pcc.comparison.selections.v1`; maximo 20 selecciones, nombre hasta 80 caracteres, solo nombre + IDs. Aviso visible **Solo en este dispositivo**. Sin cuenta, servidor ni sincronizacion entre dispositivos.
- Al abrir seleccion o refrescar inventario, IDs retirados/privados se excluyen con mensaje generico. No se reactivan por estar guardados. Si storage/clipboard falla, se informa sin afirmar exito.
- Favorecer/consultar/solicitar visita conservan callbacks existentes. Imagenes, foco, tabla desplazable, controles tactiles y fallback sin Lucide permanecen disponibles.

### Adaptador sin bucle

```js
const controller = window.PccComparison.mount({
  properties: publicProperties,
  lang: document.documentElement.lang,
  getFavoriteIds: () => state.favorites,
  onFavorite: (id) => toggleFavorite(id),
  onContact: (id) => contactAdvisor(id),
  onTour: (id) => openTourRequest(id),
  onChange: (ids) => {
    state.compare = ids;
    localStorage.setItem(keys.compare, JSON.stringify(ids));
    // No hace falta devolver setIds al controlador desde este callback.
  },
});

// Refresco del endpoint publico; descarta retirados y actualiza datos/precios.
controller.updateProperties(nextPublicProperties);

// Sincronizacion explicita desde app, sin notificacion de vuelta.
controller.update({
  properties: nextPublicProperties,
  ids: state.compare,
  lang: state.lang,
  notify: false,
});
```

`onChange(ids)` se emite inicialmente y cuando cambia la seleccion normalizada, no por refrescar los mismos IDs, cambiar idioma o renderizar. Un eco sincrono de `setIds`/`updateProperties` no genera recursion. `notify:false` es para sincronizacion deliberada; el integrador debe conservar los IDs filtrados de `getState()` si envia IDs no publicos. Actualizar el inventario no vuelve a consultar red por su cuenta.

Metodos compatibles: `add/remove/toggle/setIds`, `updateProperties`, `getState`, `shareUrl/share`, `open`, `syncControls`, `refreshFavorites`, `destroy`. Nuevos: `update({properties?,ids?,lang?,notify?,updateUrl?,differencesOnly?})`, `setLang`, `setDifferencesOnly`, `saveSelection(name)`, `loadSelection(name)`, `deleteSelection(name)`, `getSavedSelections()`.

Nuevos controles usan `data-compare-id`. No poner ademas `data-compare` en el mismo boton; la integracion debe elegir un unico manejador. No alimentar el componente con inventario administrativo. El modulo no oculta funciones externas; cualquier sustitucion de la bandeja anterior debe preservar sus acciones en la integracion de plataforma.

`COMPARISON.md` documenta la integracion actual app/index/SSR, la seleccion de cuatro, ES/EN, los metodos del controlador y la evidencia local. Los resultados globales se incorporan en `CIERRE-20261029.md`; la existencia de integracion no equivale a declarar el cierre aprobado.

## Verificacion real

| Evidencia | Resultado | Lo que NO demuestra |
| --- | --- | --- |
| Comparador ampliado, ejecucion local registrada | 36/36, sin omitidas: 23 unitarios, 12 subpruebas de navegador y contenedor; Edge/Playwright, datos de prueba y red interceptada. Capturas desktop/movil revisadas. | Integracion app/SSR definitiva, recepcion de visita o DB/produccion. |
| Parser + UI asistente + busquedas guardadas + calidad admin + demanda, ejecucion local anterior | 224/224, sin omitidas; cinco archivos de tests, funciones reales/VM/datos de prueba. | No atribuir este total a las correcciones posteriores; tampoco demuestra despliegue o entrega de alertas. |
| contract-integration.tap previo | 385/385 | Checkout final completo. |
| Comprobacion anterior en navegador | 21 checks true; captura previa a 375/390/768/1440. Cobertura parcial; se esta repitiendo. | No representa los resultados globales del cierre ni todo el panel. |
| T17 de desarrollos | verify-latest.log confirma aprobada la prueba corregida. | No se mantiene como fallo vigente por figurar en un registro anterior; tampoco prueba toda la plataforma. |
| database-tests-serial.log inspeccionado | **13/13, cero fallos y omitidas**, PostgreSQL aislado: cuentas, permisos, sesiones, borradores, desarrollo/unidades, catalogo, conflicto 409, consulta exacta y PDF caducado. | No cubre todos los recorridos de navegador ni produccion. Sustituye el resultado anterior de local-integration.tap para estos casos. |
| Disponibilidad | Implementada; pruebas locales del equipo de desarrollo y comprobacion PostgreSQL del guardado atomico, fecha y privacidad. Resultado vigente en CIERRE. | No constituye por si sola el cierre global. |
| Correcciones actuales de consultas exactas, demanda y busquedas guardadas estrictas | Presentes en codigo/tests revisados, incluidas validaciones de rutas POST/PATCH. | Resultado integrado final por incorporar al cierre; no se inventa un nuevo total aprobado. |
| Auditoria previa | 18/18, sin escribir inventario | Estado privado actual, resolucion de enlaces externos o autorizacion de cambios. |

Reproduccion del comparador en este entorno (no necesita servidor de la aplicacion):

```powershell
$env:PCC_PLAYWRIGHT_MODULE='C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:PCC_BROWSER_CHANNEL='msedge'
& 'C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' --test test/comparison.test.js
```

Sin la variable Playwright, la suite omite explicitamente browser: no reportar esa ejecucion como cobertura movil/teclado completa. No se arranco un servidor de aplicacion ni se deja un servidor nuevo ejecutandose para este componente aislado.

## Trabajo de codigo restante

Este trabajo de plataforma sigue pendiente de implementacion segun el alcance vigente. Esta actualizacion solo mantiene la documentacion; no amplia codigo. Las necesidades de programacion se separan de la validacion en curso y de los accesos o confirmaciones descritos despues:

1. Importer con identidad estable fuente/fila, hashes fuente/fila, comparacion contra version importada y conflicto ante edicion posterior; MLS no unico, preview y CSV formula escape. Auditoria/ledger no sustituyen ese flujo. T23.
2. Resolver Maps y propuesta de enriquecimiento con fuente, error y ambiguedad; adaptador de rutas con modo/hora/cuotas/cache/UI. Cuenta necesaria para resultados reales, no para escribir soporte. I02/T24.
3. Eventos completos de alertas por cambios de precio/disponibilidad, deduplicacion por evento y frecuencia, reintentos/canales y seguimiento comercial. La deduplicacion actual por busqueda+propiedad no acredita todos los eventos futuros. Disponibilidad, demanda real y validacion estricta de busquedas guardadas ya estan implementadas/corregidas; no repetirlas como pendientes de codigo. I06/T31.
4. Copilot: propuesta campo actual/propuesto/fuente/motivo, aceptar/rechazar por campo y trazabilidad Excel/PDF a editor. La consulta administrativa exacta y sus correcciones ya existen; queda ese alcance adicional. I04/T28.
5. Completar I05 amplio: esquema/editor/API de mantenimiento, calculo precio/m2 solo con concepto seguro, compensaciones factuales y experiencia PDF vivo/estatico/caducidad si se integra. No falta la UI ES/EN ni Solo diferencias ni nombres locales: ya se entregan.
6. Vistas guardadas/columnas/vista previa de cambios masivos admin, semantica Nuevo/primera publicacion y trazabilidad de coherencia periodica. Disponibilidad, fecha publica de verificacion y cola configurable ya estan implementadas. Los textos publicos reales/premium y la CSP de fuentes ya estan corregidos; no forman parte de este trabajo pendiente. O39/I08.
7. Completar instrumentacion y las mejoras de densidad/rendimiento que resulten de la medicion. Las posiciones del primer precio en E3 son historicas, no el resultado actual: home 1440=1733.625px y 375=2591.859375px; catalogo 1440=1024.34375px y 375=1304.296875px. La repeticion de navegador/medicion y su comparacion se consolidan al cierre; no atribuir una mejora ni un fallo vigente a esas cifras anteriores. Instrumentacion es codigo; medicion es validacion; RUM p75 requiere trafico. T35/T52.

## Validacion en cierre

El entorno de PostgreSQL aislado ya esta disponible y se utilizo con 13/13 aprobadas; no es una dependencia de acceso pendiente. La repeticion parcial de navegador, los recorridos completos de plataforma y la consolidacion de resultados globales siguen en curso. Una validacion pendiente no significa que falte implementar la funcion ni que se necesiten credenciales nuevas. Los resultados globales se incorporan en `CIERRE-20261029.md`.

## Dependencias concretas

- **Confirmacion de inventario:** responsable con fuente documental para N1412, 1017/1882/188, 1944, 2015, PUNTA CANCUN y grupos de importacion. Los libros son catalogos de proyectos, no prueba de una unidad/MLS/precio/superficie.
- **72/45:** snapshot administrativo actual autorizado y definicion del universo por entidad/estado para conciliar IDs. No se requiere restaurar DB ni dar credenciales al informe.
- **Mexico:** confirmar el numero de contacto heredado. USA solicitado ya figura; no marcar verificacion comercial realizada.
- **Mapas/rutas:** cuenta habilitada, facturacion/cuotas y licencia/capacidad de tiles. MAPS-20261029 documenta proveedores/endpoints; aqui no se verifican tarifas ni se incurre en costos. La CSP de fuentes actual ya esta corregida; revisar configuracion solo si se cambia de proveedor. No estimar minutos desde distancia.
- **IA/canales:** configuracion y consentimiento para generacion/envios reales; parser y calidad deterministas funcionan sin LLM. No declarar enviada una notificacion si solo se creo tarea/match.
- **Media existente:** conservar fotos, galerias y videos reales con sus relaciones actuales. No hay dependencia de obtener planos, masterplan o material para recorridos 360/3D excluidos por el usuario.
- **Aceptacion con personas y trafico:** coordinar prueba con un operador independiente; trafico suficiente para RUM p75. No son dependencias para programar las funciones restantes. El acceso al entorno aislado no se considera pendiente.

Tecnologia observada: CommonJS/JavaScript sin dependencias nuevas para comparador/parser/contrato; Node >=20 en manifest, Express ^4.21.2 y pg ^8.13.1 declarados (rangos, no version instalada acreditada), Leaflet 1.9.4 documentado por el modulo de mapa. Reutilizar este stack; LLM/vector/MCP/OTel no son requisitos para cerrar los comportamientos deterministicos. Sin presupuesto de proveedores inventado.

## Decisiones seguras y aprobaciones

Seguro sin escribir datos: clasificar evidencia, preservar IDs, probar funciones/fixtures, informar faltantes, ocultar privados, conservar filtros/monedas/periodos, dejar borradores sin publicar y comparar solo datos recibidos publicamente.

Requiere confirmacion humana: corregir tipo/zona/precio/operacion/superficie, fusionar identidad, publicar/despublicar importados, confirmar disponibilidad, licencias o configurar servicios pagados. E6 muestra 121 IDs publicos en su captura previa (105 propiedades/16 desarrollos) y dos altas visibles respecto al snapshot postimport; no demuestra autorizacion ni estado actual de los otros 161 importados. No usar ese dato para un cambio automatico.

## Cierre de plataforma

1. Terminar la validacion integrada app/index/SSR y los recorridos de plataforma. No usar evidencia local como sustituto de la prueba integrada; no declarar el cierre concluido.
2. Conservar el 13/13 serial de DB y T17 corregida como evidencia aprobada. Consolidar la suite general y la repeticion de navegador con fecha y alcance, sin arrastrar fallos historicos ya resueltos ni inventar resultados nuevos. Revisar huella del contrato contra reporte de auditoria actualizado.
3. Recorrer URL/idioma/paginacion/comparacion, favoritos/CTA, mapas/fotos/videos/PUNTA/quickview/solicitud de visita y venta guest/login; registrar recepcion en entorno aislado, no mediante clic. No exigir planos ni recorridos virtuales excluidos.
4. Los resultados globales se incorporan en `CIERRE-20261029.md`, con alcance, fecha y entorno. Produccion/commit/despliegue no forman parte de esta actualizacion; seguir DEPLOYMENT/OPERATIONS y respaldo vigente cuando se autoricen.
