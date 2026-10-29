# Editor y contexto de venta

Alcance: O35/O39/O42, T20-T22/T30. Cambios limitados a funciones de editor,
borradores, acceso y vendedor de `app.js`, su markup en `index.html` y pruebas.
No hay migraciones ni cambios del servidor. No se ejecutan escrituras en produccion.

## Volver al inventario

- `captureListingReturnContext` captura seccion, filtros completos, orden,
  `adminListingPage`, `adminListingPagination` cuando existen, scroll de pagina
  y del listado, usuario y registro que abrio el editor.
- `returnToAdminListings` confirma guardar un borrador privado si hay cambios.
  Reutiliza `saveListingProgress` y sus colas existentes, IndexedDB y API de
  borradores. No publica, no modifica `isPublic` ni usa el endpoint de propiedades.
- Si falla la red, la sesion, la persistencia de fotos nuevas o se edita durante
  la sincronizacion, permanece en el editor. No declara guardado exitoso.
- Un video seleccionado sin subir bloquea el retorno con explicacion: el
  mecanismo existente no persiste archivos de video en borradores.
- `restoreListingReturnContext` restaura filtros despues de `setAdminSection`,
  que los reinicia, vuelve a renderizar y restaura foco/scroll en el siguiente
  frame. El guardado exitoso de una publicacion usa el mismo retorno.
- Entrar al editor crea una entrada de historial en la misma URL. Atras del
  navegador ejecuta el retorno protegido; cancelar mantiene el editor. No usa
  `history.back()` como destino del boton Volver ni navega a una pagina publica.
- El contexto de retorno es de memoria y del usuario activo. No se promete
  restaurar scroll/filtros tras cerrar el navegador o cambiar de cuenta.

## Enter, precio y concurrencia

- Enter en campos simples no envia el editor, el formulario de vendedor ni la
  confirmacion de publicacion. Textareas, IME, controles de archivo y botones
  activados deliberadamente conservan su comportamiento.
- Los submit requieren el boton explicito correspondiente. La publicacion
  mantiene su dialogo existente; al cerrarlo restaura el foco de origen.
- `configureListingFormMode` calcula `price.required` con el modo y
  `priceOnRequest`, incluido al recuperar un borrador. No rellena el precio.
- `expectedUpdatedAt`, identificadores de operacion y colas existentes se
  conservan. Un 409 mantiene el borrador y permite comparar con una consulta
  de solo lectura al inventario administrativo, ademas del historial existente.
- La comparacion no mezcla versiones, no reemplaza campos ni cambia la version
  esperada. Diferencias de galeria/relaciones requieren revisar el historial.
  No hay reintento forzado ni sobrescritura automatica del trabajo de otro editor.

## Contexto de venta

Entrada compatible con los CTA existentes:

```text
/vender-casa-cancun?intent=sell&location=puerto-cancun&type=Departamento
/en/sell-property-cancun?intent=sell&location=fuera-de-cancun&type=Terreno
```

- `parseSellerContext` valida Locations y tipos contra `PccInventory`. Conserva
  multiples Locations sin elegir una por su cuenta; `zone` es solo referencia.
- `rememberSellerContext` conserva criterios publicos en memoria y
  `sessionStorage` por pestana, durante un maximo de 24 horas; no incluye tokens,
  credenciales, contactos ni direcciones privadas. Se vincula al usuario vendedor
  despues del acceso y no se aplica a otra cuenta.
- Login y Google vuelven a una URL conocida `/panel?intent=sell...`; no se acepta
  `returnTo` ni destinos externos. La renovacion de la misma sesion administrativa
  conserva el editor abierto y sus cambios.
- `prepareSellerForm` espera primero la recuperacion del borrador. Luego muestra
  el contexto comercial en `sellerContextSummary` y los campos ocultos
  `contextLocations`, `contextType`, `contextZone`. El tipo se preselecciona solo
  si esta vacio y el formulario no fue editado. Un borrador existente prevalece.
- Nunca se rellenan estado, municipio, zona fisica, direccion o coordenadas con
  la agrupacion comercial. Los campos de contexto se conservan mediante el
  borrador de vendedor existente y se limpian al confirmar el envio. Se cancela
  el autosave pendiente para no recrear el borrador despues de ese envio.
- El servidor actual puede ignorar estos campos extra al almacenar la solicitud;
  este cambio garantiza continuidad hasta el formulario, no una nueva columna
  ni un contrato de persistencia backend.

### Dependencia del servidor

Una URL directa `/panel?intent=sell...` abierta SIN sesion llega primero a
`GET /panel`, que actualmente redirige a `/?auth=login` descartando parametros.
JavaScript no puede recuperar parametros que el servidor ya descarto. El flujo
desde el CTA de la pagina de venta si captura los criterios antes del login.
Si se requieren enlaces directos anonimos al panel, el responsable del servidor
debe conservar solo los parametros permitidos en esa redireccion.

### Busquedas guardadas

`savedSearchForm` incorpora selects `operation` (vacio, `sale`, `rent`) y
`rentPeriod` (vacio, `month`, `day`, `year`). Ambos comienzan sin seleccion.
No se migran datos legacy ni se infiere una operacion o periodo. El integrador
mantiene `savedSearchSubmit`, resumen y validacion backend de presupuestos/alertas.

## Verificacion

```sh
node --check app.js
node --test test/editor-context.test.js test/editor-resilience.test.js
node --test test/visual-audit-regressions.test.js
```

Las pruebas usan funciones reales extraidas en VM, dobles de API y almacenamiento;
no importan `server.js` ni acceden a una DB. Cubren Enter, retorno/cancelacion,
filtros/paginacion/scroll, errores de red y fotos, cambios durante un guardado,
version esperada, comparacion de conflictos y contexto de venta/login.
No equivalen a una prueba de concurrencia contra PostgreSQL ni a validacion con
personal del equipo. Esas verificaciones requieren un entorno aislado autorizado.

La prueba de navegador es opcional y usa el markup y CSS reales en un documento
aislado, sin arrancar el servidor y bloqueando todas las peticiones de red. Cubre
Enter, envio explicito, foco del dialogo y criterios de busqueda vacios a 1440 y
390 px. En esta maquina se verifico con Chrome headless y perfil temporal, sin
abrir Brave ni usar perfiles personales:

```powershell
$env:PCC_EDITOR_BROWSER_QA='1'
$env:PLAYWRIGHT_MODULE='C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
$env:CHROMIUM_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe'
node --test test/editor-context.test.js test/editor-resilience.test.js test/visual-audit-regressions.test.js
```
