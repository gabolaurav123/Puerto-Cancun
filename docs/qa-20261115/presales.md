# Preventas y auditoría completa de galerías — 15 de noviembre de 2026

## Alcance comprobado

- Inventario actual: **181 desarrollos distintos**. La API pública contiene **174**; el coordinador corroboró en el panel administrativo actual **4 borradores y 3 eliminados/archivados**. Los siete coinciden con el extracto administrativo conservado del 3 de noviembre. El número histórico 193 no corresponde a 193 IDs actuales y no se usa como resultado de esta revisión.
- Revisión adicional de la propiedad **SM10, MLS 2013**, por la discrepancia entre su título de preventa y su modalidad.
- **489 referencias de imágenes revisadas visualmente**: 475 de desarrollos públicos, 13 de SM10 y 1 captura de un registro archivado. No se muestrearon portadas: se recorrieron todas las imágenes de cada galería, incluidos planos, collages, fotos de eventos y galerías mixtas.
- 488 referencias se descargaron en lectura y se vieron en 25 hojas de contacto numeradas, con ampliación individual de las imágenes que requerían confirmar su naturaleza. La imagen privada de `fewf` se revisó mediante navegador autenticado: captura del panel administrativo, no imagen inmobiliaria. No se adjunta porque contiene contactos de prueba. Una solicitud pública de esa imagen devuelve 404, que es correcto para un registro archivado.
- Clasificación de imágenes: **374 fotografías, 98 renders —incluido un collage mixto—, 16 planos y 1 captura no inmobiliaria**. Una fotografía de interiores o un plano no se trató automáticamente como render.

## Fuentes y trazabilidad

El inventario completo por ID, nombre, imagen, tipo, evidencia visual, fuente comercial, modalidad original, decisión y justificación está en [gallery-review.json](gallery-review.json) y [gallery-review.csv](gallery-review.csv). Cada imagen incluye su índice original, número de contacto y SHA256 cuando fue descargada. Los datos personales no forman parte de estos archivos.

Fuentes leídas, sin escrituras:

1. `GET https://www.puertocancun.center/api/properties`, conservado localmente en `outputs/qa-20261115/public-snapshot.json`.
2. Los cuatro listados originales ya extraídos en `../development-recovery/sources.json`: cada registro conserva archivo, hoja, fila y URL de fuente, además de su situación comercial original.
3. `../development-recovery/admin-developments.json` y el inventario privado actual corroborado por el coordinador en la UI del 15 de noviembre.
4. Las imágenes publicadas de cada galería, vistas efectivamente; ni el título ni el nombre del archivo se usaron para declarar una imagen render.

Las 25 hojas de contacto están en `outputs/qa-20261115/gallery/sheet-01.jpg` hasta `sheet-25.jpg`; la hoja 7 conserva el error de descarga pública de la captura privada, cuya revisión autenticada se registra por separado. Son artefactos locales de QA; los originales no se reemplazaron ni editaron.

## Decisiones aplicadas

El estado público canónico pasa de **2 a 47 entradas en Preventas**: **46 desarrollos y una propiedad sin desarrollo padre demostrado (SM10)**. Se conservan las dos preventas existentes y se incorporan **44 desarrollos + SM10** según la regla solicitada: render confirmado sin evidencia contradictoria de entrega, cierre o fase comercial no corroborada. No se creó ningún inmueble en la base de datos.

La operación es una **proyección pública no destructiva**: `presale-policy.js` consulta `data/presale-review-20261115.json`; `portal-directory.js` la aplica al materializar el directorio y enriquecer copias de los registros públicos. Los registros originales, precios, medios, IDs, slugs y URLs permanecen intactos. `portalPresale.originalModality` conserva el valor de origen. El directorio administra vistas de las fichas existentes, no duplicados de inventario.

El plan exacto se encuentra en [presale-correction-plan.json](presale-correction-plan.json). Incluye antes/después de los IDs de inventario, operaciones, proyectos añadidos y pendientes. Se reproduce sin credenciales ni acceso de escritura:

```powershell
node scripts/plan-presale-corrections.cjs outputs/qa-20261115/public-snapshot.json docs/qa-20261115/presale-correction-plan.json
```

El recolector `scripts/audit-presale-galleries.cjs` solo lee imágenes. `scripts/record-presale-visual-review.cjs` registra las decisiones visuales y exige el hash exacto del manifiesto revisado; si cambia el conjunto de imágenes, se detiene para impedir aplicar por error las decisiones numeradas a otra galería.

## Casos solicitados

| Caso | Evidencia y resultado |
|---|---|
| Mondrian, `prop-xlsx-3d0d5ff2d8b69246286aaa67` | Mantiene preventa explícita. Se conservan su portada y las cuatro imágenes de áreas comunes confirmadas por el propietario. No se creó una unidad ni se añadieron las tres imágenes del departamento muestra. No hay una relación de unidad demostrada en el inventario disponible. |
| Al Mare, `prop-8008c9bc-02ca-435f-9dcd-b5739cfed032` | Mantiene preventa explícita. Galería de cinco imágenes: cuatro renders y una imagen de ubicación. La ficha de proyecto hereda descripción, amenidades, ubicación y galería del desarrollo público. |
| Azürea, `prop-xlsx-60231635df1962b7dc647b1a` | Render confirmado en su imagen; el listado original declara “En preventa”. Incorporación al directorio y modalidad pública canónica. |
| SM10, `prop-6954a2d1-ba0e-43fd-917b-071a4a14f61b`, MLS 2013 | Siete renders, cuatro fotos de entorno y dos planos; título y descripción expresan preventa. Se conserva como propiedad, con una vista de preventa asociada a su mismo ID, y sin inventar desarrollo padre. |

## Pendientes y galerías mixtas

**26 casos quedan documentados para verificar**, sin reclasificación automática. Hay dos motivos: un render convive con evidencia de entrega/edificio operativo/fase comercial no corroborada; o el listado importado menciona preventa pero la galería actual no aporta render y falta confirmar la fase vigente. Los casos son Alzia, Aurora Towers, Bahía Príncipe, Bay View Grand at Grand Island, El Encanto Punta Sam, Esther Wow, Fiora, H Living, JW Marriott Costa Mujeres, Koa, Le Parc, Novo, Riva, SENSE, Sereia, SHA Residences México, Thalassa, Torre Ghalia, Torre Nikté, Valle Aurora, Vidaraa, Villalta Laguna, Vista Hermosa, Vita Residenze, W Residences y Zelva-44 Río. Sus razones individuales y fuentes están en el inventario auditable.

Ejemplos de revisión de galerías completas:

- **Riva**: 16 imágenes, con edificio construido, planos y un collage que contiene un render de una amenidad externa. Se etiqueta ese render; la galería no acredita que el edificio o sus unidades actuales estén en preventa. Se conserva su modalidad original `direct`.
- **Novo**: 13 imágenes, entre ellas un render y un plano, junto a fotos del conjunto construido. Pendiente de confirmar la fase, sin reclasificar unidades.
- **Bahía Príncipe**: 15 imágenes; hay un render de vivienda entre fotografías del resort. La fase correspondiente no está identificada.
- **Lagos del Sol**: se revisaron las 55 imágenes, incluidos eventos, fauna y mascotas; se conservan todos los medios.
- **Zen Gardens**: 12 imágenes; 11 renders y un plano. Incluido en preventas sin usar el plano como prueba.

Los cuatro borradores sin portada y los tres archivados siguen sin publicarse. No se rehabilitaron registros ni se insertaron imágenes genéricas.

## Contrato único de comportamiento

`presaleState(record, { directory, records })` determina `isPresale`, `projectId`, `developmentId`, `propertyId`, estado, modalidad de origen e índices de renders. `inquiryPolicy` devuelve únicamente `allowedIntents: ["buy"]` para preventas, incluidos registros crudos de base de datos relacionados por ID con un proyecto confirmado. Las unidades de renta o con modalidad explícita `resale` no heredan preventa por compartir desarrollo y quedan fuera de sus unidades publicadas.

Las fichas de proyecto usan `sale` y `presale`, heredan el contenido público permitido de la ficha real, llevan contexto completo al formulario y presentan la sección de ubicación permanente antes de descripción y galería. Las restricciones de ubicación/galería/descripción se respetan. La etiqueta “Render arquitectónico / Architectural rendering” sigue a su imagen original, incluso si un editor elige otra portada. La identidad incluye la URL y su versión `v`; solo se ignoran parámetros de transformación de tamaño/calidad. Cambiar la versión o reemplazar la imagen retira la etiqueta hasta otra revisión. Si desaparecen todos los renders revisados que sustentaban una clasificación automática, esta pasa a pendiente; una modalidad explícita o confirmación editorial independiente sigue siendo evidencia comercial válida. El navegador recibe identidades revisadas, nunca confía en índices aislados. Fechas, precios, etapas y disponibilidades no se inventan a partir de renders.

## Verificación

`node --test test/presale-policy.test.js test/presale-content.test.js test/portal-directory.test.js`: **18/18 aprobadas**. Se prueban aislamiento de rentas y reventas, invariancia de IDs y registros, materialización repetible, títulos que ya no corresponden al registro revisado, contradicción de entrega, SM10 sin padre supuesto, ubicación protegida, contexto de formulario, etiquetas que siguen imágenes tras cambiar la portada y caducidad de la evidencia al reemplazar la galería tanto en servidor como en navegador.

La verificación del despliegue y navegación pública final corresponde al coordinador; este informe documenta revisión e implementación local, no declara por sí mismo que esté publicado.
