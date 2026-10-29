# Auditoria de inventario y conciliacion, 2026-10-29

## Alcance y evidencia

Auditoria NO DESTRUCTIVA del master, seccion 11 y A05-A10. No se ejecuto importacion, restauracion, conexion a DB, acceso a credenciales, publicacion ni modificacion de los XLSX. No se ejecutaron los scripts historicos. `inventory-contract.js` se cargo en solo lectura. Los cambios ajenos del repositorio se conservaron.

Raiz de trabajo: `C:/Users/gabol/Documents/Codex/2026-06-29/files-mentioned-by-the-user-codex`.

- Master: `C:/Users/gabol/.codex/attachments/9d5666c3-723f-43fd-91bc-1905e68e2f17/Texto pegado.txt`.
- Evidencia historica: `output/excel-import-20261026/`, en la raiz de trabajo.
- Resultados de esta auditoria: `output/master-20261029/audit/`, en la raiz de trabajo.
- Snapshot publico: GET sin credenciales a `https://www.puertocancun.center/api/properties`, HTTP 200. La hora y huella exactas de captura estan en `api-request.json`.
- Contrato usado: version `2026-10-29.1`, SHA256 `62e1bb3907008b80792deb617723aaffdb2a448d4948afd26669ea5f92bddd67`. Estos conteos son de esa version local, no prueba de que este desplegada.

Los reportes omiten usuarios, correos, telefonos, propietarios, sesiones, credenciales, identidades de servidor/DB y metadatos administrativos. Para registros privados historicos se conservan solo ID de inventario, entidad, estado y datos de conteo/clasificacion. No se guarda la respuesta HTTP cruda: se guarda una proyeccion publica permitida y la huella de la respuesta original. Las descripciones completas de anuncios no se copian al snapshot saneado; los casos contienen extractos publicos pertinentes.

## Inventario de los cinco archivos

Todos estan en `C:/Users/gabol/Downloads/`. Las cinco huellas coinciden con `import-manifest.json` del 26 de octubre y se comprobaron nuevamente despues de leerlos.

| Fuente | Nombre exacto | Filas principales | Hojas | Filas no vacias, todas las hojas |
| --- | --- | ---: | ---: | ---: |
| F1 | Inventario_Corredor_Colosio_41_Desarrollos_Ubicaciones_Google_Maps_Funcionales (1).xlsx | 41 | 3 | 94 |
| F2 | Puerto_Cancun_45_Desarrollos_Descripcion_Comercial_Optimizada_CON_UBICACIONES (1).xlsx | 45 | 4 | 148 |
| F3 | Inventario_Residenciales_Lujo_Zona_Hotelera_Cancun_2026_CON_UBICACIONES.xlsx | 38 | 5 | 136 |
| F4 | Inventario_Residenciales_Lujo_Costa_Mujeres_Punta_Sam_2026_CON_UBICACIONES.xlsx | 16 | 5 | 75 |
| F5 | Inventario_Residenciales_Alto_Nivel_Av_Huayacan_Cancun_2026_Google_Maps.xlsx | 53 | 3 | 120 |
| Total | Cinco archivos reales | **193** | **20** | **573** |

| Fuente | SHA256 completo |
| --- | --- |
| F1 | `b5b7ca88e4f2d7f9060e73d712b80c4c985b79666b823563b586dbfd2cef9b12` |
| F2 | `6d83f791efff5b9488fc0e2ad79c68e4c17bdc914c2a74434d39626b1a706aae` |
| F3 | `1dd48c1c2b01f3f02cb616b5c348adc3ec7192006610b39a2de62c29f07aac42` |
| F4 | `f8ec96864ee6f78a805cb4e21d3fb1aa7a4d521f8c845853de5d81f78763290f` |
| F5 | `304a6878c2fb3885c8475ce739954c0d3777741cf978cfb19cc46f87046e0c00` |

### Hojas y filas reales

"Filas" cuenta filas con al menos una celda no vacia, incluidos encabezados. "Registros" cuenta las filas numeradas de la tabla, sin encabezado. Las hojas auxiliares repiten evidencia del desarrollo: no son anuncios adicionales. La hoja principal se detecto por encabezados de descripcion y enlace, no por posicion ni por una supuesta hoja llamada zona.

| Fuente | Hoja exacta | Filas | Registros | Columnas usadas | Funcion |
| --- | --- | ---: | ---: | ---: | --- |
| F1 | Inventario y Google Maps | 42 | 41 | 7 | Principal |
| F1 | Ubicaciones y fuentes | 42 | 41 | 9 | Apoyo |
| F1 | Instrucciones | 10 | 0 | 2 | Guia |
| F2 | Inventario consolidado | 46 | 45 | 7 | Principal |
| F2 | Fuentes de amenidades | 46 | 45 | 5 | Apoyo |
| F2 | Ubicaciones y Maps | 46 | 45 | 6 | Apoyo |
| F2 | Guía de localización | 10 | 0 | 2 | Guia |
| F3 | Zona Hotelera - Lujo | 39 | 38 | 7 | Principal |
| F3 | Fuentes y situación | 39 | 38 | 6 | Apoyo |
| F3 | Criterios del catálogo | 9 | 0 | 2 | Guia |
| F3 | Ubicaciones y Maps | 39 | 38 | 6 | Apoyo |
| F3 | Guía de localización | 10 | 0 | 2 | Guia |
| F4 | Costa Mujeres - Lujo | 17 | 16 | 7 | Principal |
| F4 | Fuentes y situación | 17 | 16 | 6 | Apoyo |
| F4 | Criterios del catálogo | 14 | 0 | 2 | Guia |
| F4 | Ubicaciones y Maps | 17 | 16 | 6 | Apoyo |
| F4 | Guía de localización | 10 | 0 | 2 | Guia |
| F5 | Inventario y Google Maps | 54 | 53 | 7 | Principal |
| F5 | Control y fuentes | 54 | 53 | 10 | Apoyo |
| F5 | Guía de uso | 12 | 0 | 2 | Guia |

Las principales tienen A: numero local del catalogo, B: desarrollo, C: descripcion, D: enlace representativo, E: imagen/galeria de referencia, F: direccion/referencia y G: URL de Google Maps. Los encabezados literales de **cada columna de cada hoja**, coordenadas, formatos, visibilidad y dimensiones se conservan en `xlsx-evidence.json`.

Las auxiliares contienen categoria, situacion comercial, corredor/conexion, precision, fuentes de domicilio y/o amenidades. No hay columnas de MLS, identificador de unidad, precio de unidad, moneda, periodicidad ni concepto de superficie de una unidad. Todos los formatos de celdas no vacias son `General`. No convertir numeros del catalogo en MLS ni cantidades narradas de un proyecto en anuncios individuales o superficies de una unidad.

### Enlaces y huellas de fila

- **1.050 ocurrencias de URL de texto**: F1 205, F2 225, F3 202, F4 100, F5 318. Son ocurrencias, no destinos unicos.
- **0 hipervinculos de celda incrustados**, **0 formulas**, **0 medios incrustados**, **0 macros**, **0 partes de vinculos externos de workbook**. Se inspeccionaron relaciones de hipervinculo, no solo el texto visible. No se ejecuto ni recalculo contenido.
- 386 ocurrencias de busquedas de Maps, 53 URL candidatas a imagen y 611 referencias/galerias. Las **193 filas principales** usan busquedas por nombre/direccion, no coordenadas verificadas. Una extension de imagen no acredita descarga, disponibilidad ni licencia.
- No se navegaron ni resolvieron esos destinos. `links[].resolution = not-fetched` evita afirmar que funcionan hoy.
- Cada una de las 193 filas tiene SHA256 del archivo, SHA256 de celdas originales ordenadas (valor, tipo, formato e hipervinculo), archivo/hoja/fila y `sourceRowKey`. La serializacion esta documentada en `xlsx-evidence.json`. Las huellas son evidencia; no sustituyen el ID interno estable.
- No aparecen los tokens exactos 1707, N1412, 1017, 1882, 188, 1944 o 2015 en las celdas de estos cinco libros. Las coincidencias de nombre de proyecto no acreditan la identidad de una unidad.

## Conciliacion historica

El lote `xlsx-developments-20261026` registra finalizacion `2026-10-26T19:25:26.121Z`. Se cotejaron manifiesto, resultado, verificacion, snapshots publicos y los digests before/after ya almacenados. No se consulto la DB.

**193 = 163 primeras filas de grupos creados + 13 primeras filas de grupos excluidos + 17 ocurrencias adicionales por nombre normalizado.** Son categorias excluyentes del historial. No son un plan de altas nuevo. Los 193 valores coinciden con el preflight y las 180 referencias de origen guardadas en los 163 desarrollos coinciden con las filas actuales.

Los 176 grupos de nombres se dividieron en 163 creaciones y 13 exclusiones: 8 por nombre existente y 5 por posible alias. Los 17 grupos repetidos se conservaron como evidencia de consolidacion anterior, no se declararon identidad confirmada. Ambos lados de cada grupo quedan sujetos a revision.

El preview publico previo tenia 164 candidatos, 7 existentes y 5 posibles alias. El manifiesto administrativo redujo candidatos a 163 al encontrar Al Mare Puerto Cancún entre los existentes. No es una fila perdida. La lista completa y transicion estan en `reconciliation.json`.

| Evidencia registrada | Antes | Despues | Altas | Existentes cambiados | Eliminados |
| --- | ---: | ---: | ---: | ---: | ---: |
| Tabla properties, mezcla de entidades | 125 | 288 | 163 | 0 | 0 |
| Tabla developments, relacion del desarrollo | 18 | 181 | 163 | 0 | 0 |
| Endpoint publico | 119 | 119 | 0 | 0 en campos comparados | 0 |

Los 163 IDs coinciden entre manifiesto, creaciones y verificacion de borradores privados. Las filas de ambas tablas no se suman: son representaciones vinculadas, no 326 desarrollos. Esta prueba cubre exclusivamente el intervalo registrado de la importacion. No establece el estado privado ni modificaciones posteriores al dia de hoy.

## Estado publico actual

La captura del 29 de octubre contiene **121 IDs unicos: 105 propiedades y 16 desarrollos**. Ningun ID repetido o ausente. Respecto del snapshot posterior a la importacion hay 2 altas visibles, 0 bajas y 0 diferencias en los campos comerciales comparados de los 119 IDs comunes. No se afirma igualdad byte a byte ni igualdad de todos los metadatos.

Dos IDs del lote, antes privados, ahora son publicos:

| ID | Desarrollo | Estado observado | updatedAt observado, UTC |
| --- | --- | --- | --- |
| `prop-xlsx-6a7657637fde17cb1f18d611` | Allure Puerto Cancún | active, isPublic=true, 0 imagenes | 2026-10-26T23:12:31.401Z |
| `prop-xlsx-bffd4cb3a6a8ea1234fdc532` | Lahia Ocean Laguna Residences & Spa | active, isPublic=true, 0 imagenes | 2026-10-26T23:12:02.953Z |

`updatedAt` no demuestra fecha exacta, autor ni autorizacion de la publicacion. No atribuir esa transicion al importador: el snapshot inmediatamente posterior tenia 0 IDs nuevos expuestos. **No se puede afirmar que los 163 siguen privados**. Los otros 161 IDs no aparecen en esta respuesta publica; eso no prueba que sigan existiendo como borrador en DB. Revisar autorizacion/estado en una tarea administrativa expresamente autorizada; no despublicar automaticamente.

### Conteos con el contrato compartido

Orden de columnas: cuatro Locations y el pendiente explicito. Todas las filas suman por ID interno. El detalle por ID/entidad/Location esta en `inventory-counts-by-id.json`.

| Universo y entidad | Zona Hotelera | Puerto Cancun | Cancun City | Fuera de Cancun | Pendiente | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Publico actual: propiedades | 30 | 30 | 8 | 21 | 16 | 105 |
| Publico actual: desarrollos | 3 | 8 | 1 | 2 | 2 | 16 |
| Publico actual: total | 33 | 38 | 9 | 23 | 18 | 121 |
| Publico historico: propiedades | 30 | 30 | 8 | 21 | 16 | 105 |
| Publico historico: desarrollos | 2 | 7 | 1 | 2 | 2 | 14 |
| Admin antes, historico: propiedades | 31 | 30 | 9 | 21 | 16 | 107 |
| Admin antes, historico: desarrollos | 3 | 8 | 1 | 2 | 4 | 18 |
| Manifiesto importado: desarrollos | 36 | 37 | 75 | 15 | 0 | 163 |
| Reconstruccion historica: propiedades | 31 | 30 | 9 | 21 | 16 | 107 |
| Reconstruccion historica: desarrollos | 39 | 45 | 76 | 17 | 4 | 181 |

La reconstruccion de 288 IDs combina el snapshot administrativo anterior y el manifiesto; **no es un snapshot administrativo actual**. El numero 45 de esta tabla es la agrupacion comercial historica Puerto Cancun, no 45 desarrollos publicos ni prueba sobre el contador observado del panel.

**Desacuerdo de clasificacion a entregar al responsable del contrato, sin modificarlo:** los 15 borradores del manifiesto con `zone="Costa Mujeres / Punta Sam"` y `city="Isla Mujeres"` caen en Fuera de Cancun porque el alias combinado no existe y la ciudad activa la regla exterior. En el publico ocurre con `zone="Playa Mujeres"` para La Amada (unidad 1707 y desarrollo) y la unidad 2059: 3 IDs. La misma version ya reconoce `Punta Sam` y `Punta Sam / Playa Mujeres` como Zona Hotelera. Confirmar/ajustar el alias comercial de estos corredores con evidencia de direccion, sin trasladar automaticamente todo el municipio de Isla Mujeres a Zona Hotelera. Los conteos arriba preservan el resultado real del contrato, sin disimular el desacuerdo mediante parches locales.

## Casos A05-A10

Cada caso tiene ID completo, campos observados, coordenadas, URL original de Maps, relacion con desarrollo, evidencia de descripcion, comparacion historica y archivo/hoja/fila en `case-review.json`. Las coordenadas publicadas no fueron verificadas con geocodificacion externa. Los campos comerciales comparados de estos casos ya estaban iguales en ambos snapshots del 26 de octubre.

### 1707: no fusionar

- `prop-75106945-438a-4b8c-b17a-da3f4bf8b03c`: penthouse La Amada, Departamento, USD 650.000 total, Playa Mujeres, coordenadas 21.240014 / -86.802745; padre `prop-6c9ccecb-ba9f-4895-bc22-07a2a1c2812c`.
- `prop-c509fa59-749c-4621-b6d8-ba35db87ae38`: casa Aldea Zama Tulum, USD 2.150.000 total, 20.199446 / -87.456091; sin padre vinculado.
- Excel: F4, `Costa Mujeres - Lujo`, fila 6, La Amada Residences. No ficha MLS ni fila de la casa Aldea Zama. Es la unica colision MLS del snapshot publico.
- Seguro: conservar ambos IDs, precios, rutas y referencias; mostrar ambos resultados al buscar 1707. Humano: obtener procedencia y ambito del identificador externo para decidir si uno fue capturado incorrectamente. No hay evidencia para declarar una misma propiedad.

### N1412: conflicto de tipo

`prop-2fe947ab-d263-4b7d-a710-26fc983b0010` tiene titulo DEPARTAMENTO EN VENTA EN X TOWERS, descripcion de departamento, `type=Casa`, zona Puerto Cancun, sin desarrollo vinculado, `lot=256` y `area=0`. No se localizo X Towers ni el MLS en los cinco libros. Seguro: marcar el conflicto y conservar fuente/ID. Humano: confirmar ficha de la unidad antes de cambiar a Departamento o vincular proyecto. El titulo por si solo no autoriza la correccion.

### 1017: unidad y desarrollo discrepan

`prop-66a3412d-a13d-4656-a1ce-0ce77b6a57ac` esta en Zona Hotelera, pero la descripcion y su padre Novo Cancun (`prop-ddfe8334-300a-48f3-bc36-7be72942f118`) indican Puerto Cancun. Direccion y colonia repiten Novo Cancun. F2, `Inventario consolidado`, fila 31: Novo Cancún (Apus y Boreal), direccion Boulevard Puerto Cancun. La exclusion historica fue por posible alias.

Propuesta sustentada: Location Puerto Cancun conservando ciudad, municipio y coordenadas originales. Requiere confirmacion de la relacion comercial y direccion antes de modificar ficha, tarjeta, mapa o contadores. No se aplico.

### 1882 y 188: ubicacion y concepto de superficie

| MLS / ID | Datos publicos observados | Evidencia Excel | Decision |
| --- | --- | --- | --- |
| 1882 / `prop-3b6d76b4-8825-476e-a601-90d13517be7b` | SLS Harbour Beach; zona Puerto Cancun, colonia Zona Hotelera, direccion incluye Novo Cancun/Benito Juarez; area=0, lot=262; sin padre | F2, Inventario consolidado, fila 39; proyecto Puerto Cancun; excluido por nombre existente | Mantener Location ya correcta. Revisar direccion/colonia y posible padre `prop-6483e3e1-0141-4dc5-a63f-8e317416c53f`. No vincular por nombre solamente. |
| 188 / `prop-1eab46a2-4c5c-4fb0-80af-15868d6aa747` | Allure; zone=Benito Juarez, colonia Zona Hotelera, direccion Boulevard Puerto Cancun; area=0, lot=378; sin padre | F2, Inventario consolidado, fila 4; Allure Puerto Cancun, ahora proyecto publico `prop-xlsx-6a7657637fde17cb1f18d611` | Proponer Puerto Cancun y revisar vinculo. El municipio no es una subzona. |

Los Excel no verifican si **262 y 378 m2** son construidos, privativos, vendibles, terraza o terreno. No mover `lot` a `area` ni aplicar un renombrado global a departamentos. Obtener la ficha original de cada unidad y preservar el importe/concepto original mientras se revisa. Coordenadas publicas y direcciones quedan en la evidencia, no se recalcularon.

### 1944: mantener precio por superficie

`prop-30e4cbc8-08d4-442d-8773-4a3bc7badb40`: Terreno, Playa del Carmen, MXN 4.200, `priceUnit=sqm`, venta. Descripcion confirma precio por m2. `lot=10617`, pero texto indica **10.617,17 m2**. Ninguno de los libros es la ficha de este terreno.

Seguro: conservar MXN/por m2 y excluirlo de comparaciones de precio total. Humano: confirmar superficie aplicable y su precision antes de derivar un total. No convertir 4.200 en total ni calcularlo silenciosamente con la superficie truncada.

### 2015: renta, titulo de venta y superficie contradictoria

`prop-aa0f6d1a-bd28-4e30-802f-efbf6a926b41`: titulo DEPARTAMENTO EN VENTA EN PORTOFINO, pero `operation=rent` y descripcion de renta; USD 5.000, precio total, periodo **unclassified** segun contrato. `area=256`, texto **226,55 m2**. `zone=Benito Juarez` deja Location pendiente; no tiene padre.

F3, `Zona Hotelera - Lujo`, fila 27: Portofino, Blvd. Kukulcan km 9.5, sin precio ni superficie de la unidad. Proyecto importado `prop-xlsx-7d2560733369ab14c64095a3`, no visible en el GET actual. Seguro: preservar monto/moneda/operacion almacenados y registrar los conflictos. Humano: confirmar renta y periodo, corregir titulo si corresponde, resolver superficie, Location y vinculo. No inferir renta mensual ni cambiar precio por considerarlo bajo.

### PUNTACANCUN: descripcion pendiente publicada

Desarrollo `prop-c2d9955e-b6a5-42f9-80e1-46a6adfb7a87`: activo/publico, descripcion **POR DEFINIR**, con imagenes y una unidad vinculada: MLS 1386, `prop-c6b8c354-ab11-4ef2-b7ce-fef8f80dc4c0`. El placeholder se detecta con el contrato compartido.

F3, `Zona Hotelera - Lujo`, fila 28: Punta Cancún Residencial, excluido como posible alias. Seguro: registrar descripcion pendiente, sin inventarla. Humano: confirmar equivalencia del desarrollo y revisar/autorizar texto comercial de esa fuente antes de reemplazar el placeholder. No despublicar, borrar imagenes ni desvincular la unidad automaticamente.

## Riesgos del importador previo y decisiones

Revision estatica, sin ejecutar los archivos mencionados:

1. `analyze.py:43` tomaba `worksheets[0]` y contaba numeros en A. En estos cinco libros produjo 193 filas correctas; no es una regla general de descubrimiento de hojas. La auditoria independiente recorre todas las hojas y detecta encabezados.
2. `build-manifest.cjs:31` y `:47` derivan ID/idempotencyKey del nombre normalizado. `import-drafts.cjs:86` omite por nombre o ID existente. El mismo manifiesto tiene proteccion contra altas repetidas segun el codigo, pero **no se ejecuto una reimportacion**. Un cambio de titulo puede generar identidad nueva; la igualdad de nombre tampoco demuestra mismo proyecto o unidad.
3. Hay huella de archivo y referencias de fila en el manifiesto, pero no hash de contenido de fila ni comparacion por campo con la ultima version aplicada para detectar correccion manual posterior. Este lote no actualizaba existentes, asi que no se atribuye una sobrescritura que no ocurrio. No reutilizarlo como actualizador sin control de conflictos y precedencia.
4. Diferencia real de normalizacion: `Ka’anali` queda `kaanali` en Python y `ka anali` en JS. La auditoria concilia mediante titulo original y posicion; el caso se registra. Un futuro esquema debe versionar/canonizar la normalizacion y conservar compatibilidad con identidades anteriores.
5. `final-report.cjs:41` escapa comillas CSV, pero no neutraliza formulas iniciadas por `=`, `+`, `-`, `@` o controles/espacios que las precedan. No se encontro formula en los XLSX actuales. El riesgo es reutilizar ese exportador con contenido futuro no confiable. Esta auditoria no genera CSV ni XLSX nuevos.

Requisitos recomendados para una implementacion futura, **no implementados en este alcance**: ID interno estable; identificador externo con fuente/ambito; huella de archivo y fila; registro de valores realmente aplicados por campo; reintentos idempotentes; conflicto si el valor vigente difiere del ultimo aplicado; revision explicita de coincidencias aproximadas y MLS repetidos; escape de formulas en CSV. El hash de fila o el MLS no debe transformarse en identidad universal. Cualquier modulo futuro debe ser independiente (`import-reconciliation.js` y `test/import-reconciliation.test.js`) antes de integrarlo y probarse sin DB.

### Seguro sin cambiar publicaciones

Conservar IDs y datos originales, anexar huellas/procedencia, comparar snapshots por ID, registrar candidatos y conflictos, mantener `sqm` separado de precio total, mantener moneda y periodo desconocido, y mostrar conteos separados de propiedades/desarrollos/publicos/privados historicos. Estas son las acciones realizadas en los reportes.

### Confirmacion humana necesaria

Corregir N1412; resolver la procedencia MLS 1707; confirmar Locations y vinculos 1017/1882/188/2015; determinar conceptos de superficies 1882/188 y diferencias 1944/2015; aprobar equivalencia/texto de PUNTA CANCUN; revisar los 17 grupos de nombres repetidos y los 5 posibles alias; verificar autorizacion de las dos publicaciones posteriores. Ninguna de estas decisiones se aplico.

## Reproduccion y pruebas

Desde `work/Puerto-Cancun-repo`, usando los ejecutables del runtime bundled:

```powershell
& 'C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' -B scripts/audit-inventory-20261029.py
& 'C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' scripts/audit-inventory-20261029.cjs
& 'C:/Users/gabol/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' --test scripts/audit-inventory-20261029.test.cjs
```

La segunda orden hace un unico GET y actualiza exclusivamente resultados de auditoria. Las pruebas usan archivos locales, sin red ni DB. Reejecutar con un contrato modificado exige regenerar conteos y revisar este informe; los tests comprueban la huella de la version compartida.

Resultado: **18/18 pruebas** de fuentes/huellas, filas, conciliacion, digests historicos, conteos por ID/entidad/Location, colision MLS, tipos, precios, superficies, enlaces y omision de datos privados. Los checks de integridad pasan. La condicion `noImportedIdsInCurrentPublicResponse=false` es un **hallazgo real**, no un fallo ocultado: existen dos publicaciones posteriores.

No se corrio la suite global de la aplicacion ni pruebas de escritura/reimportacion, DB o panel autenticado. No se verificaron externamente enlaces, disponibilidad, coordenadas ni licencias de imagen. No se abrio ni restauro backup alguno. Los resultados no autorizan cambios de datos.

Entregables: scripts nuevos `audit-inventory-20261029.py`, `audit-inventory-20261029.cjs`, `audit-inventory-20261029.test.cjs`; este documento; y en el directorio de resultados, `xlsx-evidence.json`, `reconciliation.json`, `source-row-ledger.json`, `inventory-counts-by-id.json`, `case-review.json`, `public-snapshot-sanitized.json`, `api-request.json`, `checks.json` y el registro `tests.tap`.
