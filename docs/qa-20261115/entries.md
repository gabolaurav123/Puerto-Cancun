# Recorrido público — inventario previo, 15 de noviembre de 2026

Revisión previa a los cambios sobre `4fb2132`. Se contrastó código compartido, HTML público y el recorrido visible de Preventas en producción; las pruebas posteriores se registran aparte. ES y EN comparten los mismos manejadores; móvil y escritorio comparten las solicitudes. No se enviaron pruebas a producción.

| Entrada / origen | Acción y formulario anterior | Obligatorios / contexto | Persistencia y respuesta |
|---|---|---|---|
| Inicio, Contacto, flotante | Botones de oficina rotulados WhatsApp abren `PccInquiry`, modal de dos pasos | Intención y teléfono + país + consentimiento; oficina preservada; campos conocidos repetidos | `POST /api/inquiries` → `lead_requests`, CRM, notificación; WhatsApp voluntario después |
| Catálogo, Destacadas, tipos, zonas, subzonas, Fuera de Cancún, Rentas | Tarjetas y ayudas → modal contextual | Propiedad, MLS, filtros, origen; campos y operación editables aunque conocidos | Mismo endpoint; contexto estructurado y mensaje opcional |
| Sin resultados / guardar búsqueda | `data-save-search` → modal con servicio `search-watch` | Teléfono obligatorio aun eligiendo aviso por email; filtros serializados; preferencias se mezclan con resumen técnico en algunas entradas | `lead_requests.payload.searchWatch`; avisos del módulo comercial, cancelación por token |
| Directorio de desarrollos y Preventas | Ver proyecto + pedir información; ayudas de comprador y propietario | Mondrian y Al Mare transmiten `Compra y renta` en `preferences`; permiten 4 intenciones pese a Preventas | Consulta comercial, sin validación canónica de operación por proyecto |
| Ficha y recomendaciones | Cerca del precio / bloque final, información o visita | Desarrollo repite compra/renta/venta/publicar; visita requiere fecha/hora sin agenda real | `lead_requests`, `tour_requests`; coordinación del equipo |
| Menú, pie, guías y artículos | Venta, poner en renta, compra, revisión de precio, valoración | Intención conocida; modal o formulario editorial existente | Consultas / solicitudes de valoración y CRM |
| Valoración / revisión de precio | `PropertyValuationForm`, `data-lead-form` | Zona y teléfono; revisión requiere importe; moneda MXN/USD; detalles voluntarios | `POST /api/leads`, registro de valoración, seguimiento del equipo |
| Venta sin cuenta | Selector de publicación → `guestSaleModal` | Título, tipo, ubicación, contacto, consentimiento; mapa y fotos distraen del ingreso básico | `POST /api/guest-sale-requests`, idempotencia, CRM, revisión administrativa antes de publicar |
| Asesor público IA | Lanzador, panel y botones `data-advisor-open` | Conversación pública y derivación a contacto | `POST /api/advisor/chat`; se retirará temporalmente, sin eliminar herramientas internas |
| «Validación de IA» histórica | `AIValidationCTA()` es nombre técnico; texto visible «¿Ya tienes un precio en mente?» | Lleva a revisión humana `/revisar-precio-propiedad`, no al widget | Conservar como revisión humana, importe USD |
| Derechos de privacidad | Formulario editorial legal | Identificación/correo y solicitud de derechos, finalidad distinta a captación | Endpoint de leads legal; conservar su proceso y enlaces |

## Plantillas y controles ocultos

`index.html` comparte panel administrativo, formulario de valoración interno, modal de visita antiguo y formulario de alerta con páginas públicas. Su existencia en HTML no demuestra una entrada visible. Las fichas SSR de `seo-pages.js` y tarjetas de `catalog-view.js` usan el modal `contextual-contact.js`. Se conserva compatibilidad con enlaces directos a Contacto y endpoints heredados, validando el contexto del inventario en el servidor.

## Reproducciones confirmadas antes del cambio

- Preventas muestra dos proyectos: Mondrian y Al Mare. El enlace de consulta lleva `preferences=Desarrollos · Operacion: Compra y renta`. El modal visible de Mondrian permite comprar, rentar, vender y publicar en renta; vuelve a pedir zona/desarrollo y requiere continuar para llegar al contacto.
- Ubicación: dos registros de RIVA distintos; la unidad MLS M7612 tiene coordenadas exactas, mientras el desarrollo declara exactitud sin coordenadas. No se deben copiar coordenadas de la unidad al desarrollo. Mondrian/Azürea requieren mapa de zona manual. Al Mare tiene dirección geocodificada en Zona Hotelera y clasificación comercial Puerto Cancún; conservar ambos conceptos sin inventar una corrección.
- Botones de oficina con rótulo WhatsApp abren una solicitud interna. La confirmación actual depende indebidamente de que exista URL de WhatsApp.

## Archivos y destinos inspeccionados

`index.html`, `seo-pages.js`, `catalog-view.js`, `catalog-ui.js`, `contextual-contact.js`, `contact-inquiries.js`, `commercial-workflow.js`, `app.js`, `server.js`, `advisor-widget.js`. Seguimiento existente: CRM/contactos, asesorías (`lead_requests`), solicitudes sin cuenta, visitas y avisos. Los canales y consentimientos deben permanecer visibles en estos destinos y en las acciones de respuesta.
