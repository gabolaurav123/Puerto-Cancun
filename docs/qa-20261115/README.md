# Recorrido público: contacto, ubicación, preventas y USD

Implementación sobre `4fb2132`, revisada antes de desplegar. No incluye migraciones, borrados, cambios de precios originales, carga de imágenes nuevas ni escrituras en la base de producción.

## Cambios y rutas

- Inicio `/` y `/en`, Contacto `/contacto` y `/en/contact`, menú/pie/flotante y entradas editoriales: contacto humano mediante el modal existente, rótulos fieles a la acción y oficinas una sola vez en Contacto. El asesor conversacional público queda apagado por defecto (`PUBLIC_PROPERTY_ADVISOR_ENABLED=false`); la arquitectura y las herramientas internas se conservan.
- Catálogos `/propiedades`, `/en/properties`, tipos, Destacadas, zonas/subzonas, rentas, desarrollos y resultados vacíos: solicitud en la página de origen, filtros estructurados y retorno sin perder la consulta. Un medio de respuesta, consentimiento, nombre y nota opcionales. Compra/renta y referencias se validan en servidor.
- Fichas `/propiedades/:slug`, `/en/properties/:slug`, `/preventas-cancun` y `/en/cancun-presales`: acción principal junto a ubicación/resumen; desarrollo y propiedad usan IDs distintos; preventa únicamente compra; las unidades independientes de renta/reventa mantienen su modalidad.
- Venta y publicación sin cuenta, valoración y revisión de precio: ingreso breve, ubicación aproximada sin pin obligatorio, canal elegido, consentimiento e idempotencia. Las visitas coordinadas permiten fecha/hora opcionales. Las alertas explican cuándo solo queda seguimiento humano.
- Precio público en USD en tarjetas, fichas, mapas, filtros, calculadora y documentos compartidos. MXN se convierte únicamente con una cotización válida, fechada y marcada como aproximada; sin tasa se solicita confirmación. Se conservan moneda/importe originales y el significado de búsquedas históricas MXN.
- Ubicación permanente y mapa diferido sin botón de mostrar. Coordenadas exactas solo cuando están autorizadas; zona aproximada claramente identificada; texto visible aunque el mapa falle.

## Evidencia y pruebas

- [Inventario previo de entradas](entries.md): rutas, controles visibles/ocultos, parámetros, contexto y destinos existentes.
- [Contacto HTTP y navegador](inquiry-contract-qa.md): operaciones, referencias canónicas, canal, consentimiento, errores/reintentos y foco.
- [Persistencia real local](local-persistence.md): 15/15 casos aprobados con Express y PostgreSQL; inventario 33 → 33. Solicitudes, CRM, notificaciones, visitas, alertas y valoraciones leídas después de guardarse. Sin entrega de mensajes externos.
- `scripts/qa-public-journey.cjs`: 48 recorridos sobre las plantillas/clientes reales y un snapshot de 282 fichas públicas, ES/EN × 390/1366 px. Incluye Inicio, Contacto, catálogo, sin resultados, Preventas, Mondrian, Al Mare, Azürea, SM10, SLS MLS 1877, terreno fuera de Cancún y RIVA MLS M7612. Cero errores JavaScript y cero escrituras automáticas; apertura/canal/cierre/contexto y ancho verificados. La tasa 20 MXN/USD de esta prueba es un fixture local, nunca una cotización publicada. Las imágenes remotas y servicios externos se bloquean; la auditoría visual de galerías se documenta por separado.
- [Ubicación](locations.md), [publicación sin cuenta](guest-sale.md), [valoración](valuation-forms.md), [precios](pricing.md) y [PDF/calculadora](usd-pdf.md): verificaciones enfocadas y límites.
- `npm run verify`: sintaxis y suite completa. Resultado final: 1.383 pruebas, 1.348 aprobadas, 35 omitidas por configuración de integración, cero fallos. Las pruebas de navegador optativas y de PostgreSQL real se ejecutaron además de esta suite. Verificación del despliegue pendiente al registrar este informe.

## Inventario de galerías y decisiones

[Informe de preventas](presales.md), [inventario por imagen](gallery-review.csv) y [plan reproducible](presale-correction-plan.json): **181 desarrollos disponibles, 489 referencias de imagen inspeccionadas**. El público actual contiene 174 desarrollos; cuatro borradores y tres archivados siguen privados. El número 193 no coincide con los registros deduplicados disponibles y no se fabricaron registros para completarlo.

Se incorporan **44 desarrollos y la propiedad SM10** a las dos entradas existentes: **47 entradas de Preventas (46 desarrollos y una propiedad)**. Proyección pública versionada y no destructiva mediante `data/presale-review-20261115.json`; conserva IDs, URLs, galerías y modalidad original. Mondrian mantiene únicamente las cuatro imágenes del desarrollo previamente autorizadas junto a su portada, sin crear una unidad muestra ni mezclar las tres imágenes del departamento.

Quedan **26 casos comerciales/visuales pendientes**, con evidencia individual: renders que conviven con edificios entregados, fases no corroboradas o textos de preventa sin evidencia visual suficiente. En ubicación, RIVA desarrollo no tiene coordenadas pese a declarar exactitud; se muestra zona aproximada sin copiar las de su unidad. Al Mare conserva Puerto Cancún como clasificación comercial y Zona Hotelera en la dirección de origen, pendiente de confirmar esa correspondencia.

## Archivos principales

`contextual-contact.js`, `contact-inquiries.js`, `inquiry-context.js`, `commercial-workflow.js`, `commercial-panel.js`, `app.js`, `index.html`, `seo-pages.js`, `server.js`, `site-language.js`; `public-listing-details.js`, `inventory-metadata.js`, `catalog-map.js`; `presale-policy.js`, `portal-directory.js`, `catalog-directory.js`; `public-pricing.js`, `inventory-contract.js`, `catalog-view.js`, `catalog-ui.js`, `catalog-search.js`, `catalog-assistant.js`, `saved-catalog-search.js`, `pdf-property-sheet.js`, `public-pdf-cache.js`, `external-property-utils.js`; CSS, versión de assets y pruebas asociadas.
