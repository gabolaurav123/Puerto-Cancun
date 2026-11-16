# Correcciones públicas — 16 de noviembre de 2026

## Alcance y cambios

- Se conservó el diseño compacto de «Contáctanos Hoy» y se restauraron sus colores: fondo azul, título dorado y botones verdes de WhatsApp para México y Estados Unidos.
- El menú móvil ocupa un panel visible bajo la cabecera, con desplazamiento interno. La cabecera permanece visible hasta 1180 px; el comportamiento de escritorio se conserva. Abrir y cerrar el menú mantiene el ancho útil de la página y restaura su desplazamiento después del reajuste del documento, sin animación ni interferencia con una nueva navegación.
- La navegación y los controles públicos en inglés utilizan **Communities**. El enlace secundario de un proyecto en preventa dice **View community details** y conserva su URL. Los textos funcionales de búsqueda, consulta y publicación se expresan como acciones directas; no exigen hablar con un asesor para continuar. No se modificaron roles administrativos, contenido editorial almacenado ni permisos.
- Las fichas y los proyectos en preventa mantienen una consulta principal y ofrecen WhatsApp directo de ambas oficinas, con nombre y referencia del inmueble o proyecto. Los desarrollos muestran las opciones de compra, venta y renta en su resumen. Las descripciones usan el ancho disponible de su sección.
- El formulario mantiene el contexto de origen y permite elegir el canal de respuesta. La selección de moneda del presupuesto convierte únicamente ese presupuesto con una cotización vigente; si no hay cotización utilizable conserva importe y moneda. Los precios publicados y sus reglas no se sustituyen.

## Verificación automatizada realizada

Comando focalizado:

```text
node --test test/presale-content.test.js test/contact-config.test.js test/homepage-regression.test.js test/guest-sale-single-step.test.js test/owner-review-and-listing-media.test.js test/visual-audit-regressions.test.js
```

Resultado: **38 pruebas, 34 aprobadas, 4 omitidas, 0 fallos**. Las omitidas requieren navegador o condiciones externas y no cuentan como verificadas.

La selección comprueba enlaces directos de WhatsApp y contexto bilingüe, reglas de preventa, conservación de los datos y la idempotencia del formulario de venta, contenido de portada, video y pies de foto, cabecera móvil, cierre accesible del menú y restauración del desplazamiento. Las pruebas nuevas de menú cubren scroll profundo, restauración después del reajuste y protección de una nueva navegación por ancla.

También pasaron la comprobación de sintaxis de `app.js`, `seo-pages.js`, `site-language.js` y `catalog-directory.js`, y `git diff --check`. El registro previo `outputs/qa-20261116-corrections/riva-search-tests.log` contiene 301 pruebas de búsqueda aprobadas. Estos resultados focalizados no sustituyen el CI completo.

## Evidencia visual y alcance de esta revisión

Las capturas de comparación de la iteración visual están en `outputs/qa-20261116/before/` y `outputs/qa-20261116/after/`, para 360, 390, 768 y 1440 px, en español e inglés. La evidencia adicional de esta corrección está en `outputs/qa-20261116-corrections/`.

La revisión de este subagente se realizó sobre código, pruebas y archivos. El agente principal ejecutó la comprobación interactiva y confirmó 48 vistas adaptables sin desbordamientos horizontales ni controles recortados, más 8 formularios cargados con el envío visible y sin repetir la pregunta de tipo.

La prueba del menú con clic nativo confirmó apertura al primer toque, cabecera móvil visible y conservación exacta del desplazamiento: antes de abrir, guardado y después de cerrar, **12291.333 px**. El salto observado anteriormente en una comprobación automatizada correspondía al desplazamiento que hacía el localizador de CUA al buscar el botón sobre contenido con `content-visibility`; no se reprodujo con clic nativo. La regresión automatizada cubre también el reajuste del documento y una nueva navegación por ancla.

## Ubicaciones verificadas sin cambios en la base de datos

La auditoría inicial encontró **17 de 174 desarrollos con coordenadas**. Se preparó un registro de **51 referencias geográficas verificadas**, separado del inventario persistente, en `verified-development-location-data.js`.

`verified-development-locations.js` aplica referencias únicamente a desarrollos cuyo ID y título coinciden. Respeta ubicaciones ocultas y bloques de ubicación deshabilitados; rechaza coordenadas inválidas y conflictos de ID. El registro no publica fichas, no borra contenido y no escribe coordenadas en la base de datos. El total de referencias no equivale automáticamente al total de marcadores nuevos: depende de los registros públicos coincidentes y sus permisos.

La investigación de Puerto Cancún dejó **24 ubicaciones verificadas y 10 pendientes**, con fuentes y motivos en:

- `outputs/qa-20261116-corrections/location-research-puerto.json`
- `outputs/qa-20261116-corrections/location-research-puerto-pending.json`

No se usaron puntos genéricos de zona como si fueran edificios. Los centros de huellas OSM identifican un edificio o conjunto; no prometen localizar su acceso ni una unidad individual. Se retuvieron como pendientes las identidades ambiguas y las coordenadas contradictorias, incluyendo SLS Marina, SLS Bahía y los dos registros La Marina/Marina Residencial.

Para Mondrian, el contrato público presentado ante SEC vincula las residencias de Tower 2 al conjunto Grand Island y publica el Plus Code `3688+4P, Cancún`. Su centro es **21.0653125, -86.7831875**. Se documentó como punto del **conjunto**, no como ubicación exacta de una vivienda o entrada. El Schedule 2 no incluye plano en el HTML; el Schedule 7 solo muestra un radio de restricción comercial y no se utilizó para obtener coordenadas. Evidencia: `outputs/qa-20261116-corrections/location-research-mondrian-sec.json`.

Fuentes primarias de Mondrian: [acuerdo de gestión, páginas 5–6](https://www.sec.gov/Archives/edgar/data/1988776/000114036126021583/ef20060687_ex4-35.htm) y [descripción del proyecto](https://www.sec.gov/Archives/edgar/data/1988776/000114036126021583/ef20060687_ex4-34.htm).

## Cierre operativo

El agente principal conserva el cierre operativo: ejecutar el CI completo y comprobar el despliegue del commit correcto en el dominio. Las pruebas locales y la comprobación interactiva documentadas aquí no se presentan como confirmación de ese despliegue.

## Verificación de entrega

- `npm run verify`: 1409 pruebas, 1374 aprobadas, 35 omitidas, cero fallos.
- Navegador: Inicio, catálogo, RIVA, Mondrian, Contacto y formulario en español e inglés a 360, 390, 768 y 1440 px; 48 comprobaciones sin desbordamiento horizontal ni botones recortados. Formularios comprobados tras terminar su carga.
- Consulta desde Zona Hotelera: sin pregunta de tipo; USD 100000 → MXN 1860000 con la referencia vigente y regreso a USD 100000, sin alterar precios publicados ni enviar solicitudes de prueba.
- Formulario con alto reducido a480px: contenido desplazable y envío accesible; no equivale a una prueba física de teclado iOS/Android.
- Mapa de desarrollos: 67 de174 con punto publicado/verificado;107 pendientes documentados en `development-locations-pending.json`. Puerto Cancún filtra33 de43. Zoom comprobado de mosaicos nivel15 a16 y acciones de consulta con contexto.
- Descripción de desarrollo comprobada a1240px de ancho útil; acciones de comprar/vender/rentar visibles.
- Menú390px desde scroll profundo: primer clic nativo abre, cierre conserva12291.333px; desplazamiento interno independiente.
