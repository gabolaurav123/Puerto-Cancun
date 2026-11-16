# Mapa público de desarrollos — 16 de noviembre de 2026

## Cobertura y método

La línea base de esta revisión era **67 de 174 desarrollos** con un punto público publicado o verificado. El corte verificado del **16 de noviembre de 2026** devuelve **167 de 174**, con **7 ubicaciones pendientes de confirmación**. El estado del informe es `awaiting-location-confirmation`. El recuento está verificado contra el snapshot público; no equivale a confirmar que los 174 estén ubicados ni que estos cambios ya estén desplegados.

El recuento se calculó sin acceder a la base de datos, usando `outputs/qa-20261116-development-map/public-inventory.json`, `inventory.isPublic`, `inventory.entityOf` y `resolvePublicLocation`. El inventario base y el snapshot actual contienen los mismos 174 desarrollos públicos.

El registro de referencias contiene **151 entradas**. Se auditaron sus IDs y la normalización de título que usa la protección del resolver: **151 IDs presentes y 151 títulos coincidentes; cero IDs ausentes y cero discrepancias**. La comprobación incluye Ocean Towers Residences. El número de referencias no se suma directamente a los puntos almacenados porque puede haber coincidencias entre ambas fuentes.

`development-locations-pending.json` contiene los IDs pendientes, título, zona, motivo y fuentes consultadas cuando están disponibles. Las ubicaciones de presentación se identifican como edificio, conjunto o comunidad; no se presentan como el punto de una vivienda individual. No se usaron centros de zona, oficinas comerciales u homónimos como sustitutos de un desarrollo.

Para regenerar este recuento, pendientes y auditoría de zonas: `node outputs/qa-20261116-development-map/update-map-docs.cjs`. El generador solo lee el snapshot y el registro; escribe estos dos documentos y `catalog-audit.json`, sin conectar con la base de datos.

## Cambios funcionales

- Cada marcador ofrece **Ver desarrollo** y **Pedir información**; los resultados pendientes conservan estas acciones en la lista de ubicaciones no disponibles.
- El mapa incluye los resultados filtrados de todas las páginas. La zona, entidad y demás filtros se intersectan antes de paginar.
- **Buscar esta área** utiliza el mismo punto público que el marcador, incluidas las referencias verificadas separadas del inventario y el redondeo de las propiedades con ubicación aproximada.
- `public-inventory-query.js` comparte ese criterio con la API del catálogo, la búsqueda inteligente, sugerencias, consultas guardadas, evaluación de coincidencias y alertas. Solo cambia el filtrado de lectura; no añade escrituras de coordenadas ni modifica el flujo de entrega de avisos.
- Las consultas mantienen inmueble/proyecto, desarrollo, zona, referencia, filtros y origen. La URL de retorno conserva `view=map`. En preventas se recupera la referencia editorial de `presaleProject.reference`.
- Las ubicaciones ocultas y los bloques de ubicación deshabilitados siguen prevaleciendo sobre cualquier referencia. Un desarrollo sin punto exacto confirmado no recibe un marcador aproximado.

## Navegador y filtros por zona

El agente principal verificó el catálogo de desarrollos en **español e inglés**, con anchos de **390 y 1440 px**: apertura del marcador, sus dos acciones, entrada al formulario con contexto del desarrollo, cierre conservando la vista de origen y acceso a la ficha. También comprobó zoom, consulta desde resultados pendientes y el flujo contextual. No se enviaron consultas de prueba a clientes.

La auditoría de las cuatro zonas confirmó resultados y acciones en ambos idiomas, sin errores reportados. El recuento de lectura actualizado al generar este documento es:

| Zona pública | Desarrollos | Con punto exacto | Pendientes |
| --- | ---: | ---: | ---: |
| Zona Hotelera | 37 | 37 | 0 |
| Puerto Cancún | 43 | 41 | 2 |
| Ciudad de Cancún | 78 | 75 | 3 |
| Fuera de Cancún | 16 | 14 | 2 |
| Total | 174 | 167 | 7 |

La evidencia de navegador está en `outputs/qa-20261116-development-map/map-desktop-es.jpg`, `map-mobile-es.jpg` e `inquiry-mobile-es.jpg`. `catalog-audit.json` contiene la auditoría bilingüe regenerada con el registro actual: cuatro zonas y catálogo completo, dos acciones por resultado, contexto de desarrollo y retorno a mapa, sin errores.

## Pruebas automatizadas

`npm run verify`, con `../qa-bin` en PATH, terminó con **exit 0**:

- 1415 pruebas en total.
- 1380 aprobadas.
- 35 omitidas, principalmente pruebas opcionales de navegador o servicios externos; no se cuentan como aprobadas.
- 0 fallos.

Registro completo: `outputs/qa-20261116-development-map/verify-city-final.log`.

La comprobación focalizada posterior de los datos y el mapa terminó con **74 pruebas aprobadas, una omitida y cero fallos**, tras incorporar la última ubicación de SLS Bahía Beach.

Las regresiones cubren filtros geográficos coherentes entre mapa, API, sugerencias y búsquedas guardadas; puntos aproximados redondeados; privacidad; contexto de preventa; referencia personalizada y retorno al mapa. Los harness VM inyectan el helper real, conservando sus aserciones. El nuevo módulo está incluido en `npm run check`, no introduce ciclos de carga y no se incorpora a los scripts UMD del navegador.

## Ejemplos de pendientes justificados

- **W Residences Costa Mujeres y JW Marriott Residences Costa Mujeres:** AB Living confirma los proyectos en Isla Mujeres/Costa Mujeres, pero las páginas consultadas no publican un punto geográfico del proyecto. Se descartaron los resultados de St. Regis y del JW Marriott de Zona Hotelera. Fuentes: [W](https://abliving.com/es/locations/w-marriot-costa-mujeres/) y [JW Marriott](https://abliving.com/es/locations/jw-marriot/).
- **Belorizonte:** Bunik menciona 116 unidades en Cancún, sin dirección específica ni marcador del desarrollo en las páginas revisadas. Fuentes: [próximos desarrollos](https://www.bunik.mx/desarrollos-proximos/) y [ubicaciones](https://www.bunik.mx/ubicaciones/).
- **Bardenna:** el masterplan oficial de Zienna coloca el logotipo del proyecto en el lote L284. El SVG usa coordenadas del dibujo y no tiene georreferenciación; no permite deducir un punto exacto sin corroboración geográfica. Fuentes: [Zienna de Onix Living](https://onixliving.mx/proyecto-zienna/) y [configuración pública del masterplan](https://onix-living.s3.us-east-2.amazonaws.com/ZIENNA/mapa-disponibilidad/zienna.json).

## Protección de contenido y cierre

Esta revisión no modifica la base de datos, las publicaciones existentes, fotografías, precios, moneda, permisos ni reglas de preventa. El registro de ubicaciones se aplica exclusivamente a la presentación pública y al filtrado de lectura. Los desarrollos pendientes siguen accesibles para ver su ficha o pedir información.

## Segunda investigación de ubicaciones pendientes

Se revisaron otra vez los 14 casos que quedaban pendientes, incluyendo planos de desarrolladores, fotografías comerciales de los conjuntos, cartografía de accesos y geometrías de edificios. Las nuevas referencias conservan el ID y el nombre del inventario; su evidencia y método están en `verified-development-location-data.js`.

- **Pez Volador:** el inventario describe la calle residencial; se representa como comunidad, no como un edificio o vivienda.
- **Villas Nissa:** la fotografía del acceso muestra «Villas Nissia». La variante del nombre permite corroborar la calle del Galeón y la huella del conjunto con sus áreas comunes.
- **Náutica Isla Dorada:** las dos torres, alberca y muelles del brochure de LEMMUS corresponden a la huella aérea identificada. Se descartaron dos mapas comerciales desplazados.
- **SLS Marina Beach:** el plano oficial y la fotografía aérea del constructor Beck coinciden con la torre norte de Novo Cancún. Se descartó el punto comercial que dirigía al hotel SLS.
- **Lagunas 2:** la vía de entrada cartografiada indica expresamente «La Laguna II»; el marcador está en su acceso.
- **Residencial Campestre:** el ingreso desde Colosio conecta con Paseo del Sol y coincide con las referencias oficiales del residencial.
- **HAVEN Resort Lifestyle:** el punto publicado del proyecto coincide con la franja identificada en el plano y se distingue de Le Parc. Se descartó otro pin ubicado aproximadamente un kilómetro al sur.

La comprobación local de esta segunda revisión abrió SLS Marina Beach desde el mapa, mostró su consulta con el desarrollo correcto y volvió al mismo mapa con filtros conservados. En móvil de 390 px se comprobó Villas Nissa en español e inglés, sus dos acciones, el formulario contextual y su ficha con el mapa del conjunto. Las capturas están en `round2-map-mobile-es.jpg` y `round2-inquiry-mobile-es.jpg`, dentro del directorio de evidencia de esta revisión. No se enviaron solicitudes de prueba.

El informe de pendientes conserva las fuentes y los descartes de los casos que aún no tienen un punto corroborable. La comprobación del despliegue se documenta después de publicar esta revisión.

Validación del paquete de siete referencias: **12 pruebas aprobadas, 0 fallos**, en `round2-location-tests.log`. La auditoría del catálogo completo y sus cuatro zonas en español e inglés valida los 174 resultados, sus acciones y el retorno al mapa; 167 tienen punto y 7 siguen pendientes. Los 151 registros de referencias pasan las comprobaciones de identidad y título.

La revisión automática rechazó el comando que intentaba guardar coordenadas calculadas para los accesos de Álamos I/II, con el único motivo `blocked by policy`. Esas coordenadas no se incorporaron al registro ni se publicaron. El informe conserva únicamente las referencias del barrio y el estado pendiente. Bardenna también sigue pendiente: aunque el plano oficial identifica L284, el ajuste manual al satélite tiene una discrepancia de aproximadamente 20 m, insuficiente para certificar su parcela estrecha.
