# Mapa público de desarrollos — 16 de noviembre de 2026

## Cobertura y método

La línea base de esta revisión era **67 de 174 desarrollos** con un punto público publicado o verificado. El corte verificado del **16 de noviembre de 2026** devuelve **160 de 174**, con **14 ubicaciones pendientes de confirmación**. El estado del informe es `awaiting-location-confirmation`. El recuento está verificado contra el snapshot público; no equivale a confirmar que los 174 estén ubicados ni que estos cambios ya estén desplegados.

El recuento se calculó sin acceder a la base de datos, usando `outputs/qa-20261116-development-map/public-inventory.json`, `inventory.isPublic`, `inventory.entityOf` y `resolvePublicLocation`. El inventario base y el snapshot actual contienen los mismos 174 desarrollos públicos.

El registro de referencias contiene **144 entradas**. Se auditaron sus IDs y la normalización de título que usa la protección del resolver: **144 IDs presentes y 144 títulos coincidentes; cero IDs ausentes y cero discrepancias**. La comprobación incluye Ocean Towers Residences. El número de referencias no se suma directamente a los puntos almacenados porque puede haber coincidencias entre ambas fuentes.

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
| Zona Hotelera | 37 | 34 | 3 |
| Puerto Cancún | 43 | 39 | 4 |
| Ciudad de Cancún | 78 | 73 | 5 |
| Fuera de Cancún | 16 | 14 | 2 |
| Total | 174 | 160 | 14 |

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

El agente principal actualizará la cobertura si se verifican más ubicaciones y confirmará por separado el despliegue y su versión en el dominio público.
