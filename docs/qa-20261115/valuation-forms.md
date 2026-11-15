# Valoración y formularios editoriales — 15-11-2026

## Recorrido inventariado

| Entrada | Formulario anterior | Obligatorios anteriores | Destino | Cambio |
| --- | --- | --- | --- | --- |
| `/valuacion-inmobiliaria-cancun`, `/en/property-valuation-cancun` y bloque de valoración en páginas de venta | `PropertyValuationForm` | País, teléfono, zona; consentimiento insertado en navegador | `POST /api/leads` → `lead_requests`, contacto, `valuations`, notificación y evento | Zona + canal elegido + consentimiento. Nombre y detalles siguen opcionales. |
| `/revisar-precio-propiedad`, `/en/review-property-price` | `PropertyValuationForm(..., true)` | País, teléfono, zona e importe; moneda MXN/USD elegible | Mismo endpoint y registro de valoración | El importe obligatorio se expresa en USD; email sustituye al teléfono si se elige. |
| Guías de compra y antiguas fichas con `BuyerLeadForm` | Formulario adicional de comprador/desarrollo | Nombre, WhatsApp y email en comprador; nombre y contacto ambiguo en desarrollo | `POST /api/leads` | CTA al modal contextual existente: un solo canal, ID de propiedad o desarrollo correcto, intención canónica. |
| Envíos legados `leadType=contacto-desarrollo` | Formulario anterior directo | Nombre, opción y contacto | `POST /api/leads` | Mantiene compatibilidad de endpoint; resuelve desarrollo publicado y rechaza operaciones incompatibles de preventa. |

`PropertyValuationForm` es visible en las páginas indicadas. `BuyerLeadForm` deja de insertar otro formulario, incluso cuando se reutiliza desde una plantilla editorial: abre el mismo componente de contacto del portal. La consulta guiada y otras herramientas de exploración no forman parte de estos formularios.

## Validación y persistencia

- `contactChannel` define `whatsapp` o `email`. Sólo el campo elegido se muestra, valida y envía. México aparece por defecto; Estados Unidos y Canadá están en el HTML inicial y `PccInquiry.populatePhone` carga el catálogo completo existente.
- La zona es obligatoria en valoración. Revisión de precio exige un importe positivo finito, hasta 10¹³. Los nuevos formularios llevan `currency=USD` y `priceMode=public-usd`; el servidor rechaza una moneda incompatible.
- Los clientes legados sin marcador conservan su moneda declarada. Un importe sin moneda no recibe una moneda inventada. Los datos históricos no se reescriben.
- Terreno conserva superficie de lote y datos voluntarios pertinentes; construcción, recámaras, baños y antigüedad se ocultan/deshabilitan. El servidor también descarta esos campos cuando el tipo es terreno.
- Se guardan canal, consentimiento y fecha del consentimiento en el payload actual. Un contacto por email no exige teléfono ni se guarda como contacto prioritario por teléfono.
- El bloqueo transaccional usa la identidad del canal. La consulta de duplicados funciona por email y teléfono; la huella de valoración excluye la fecha nueva de consentimiento. Una repetición con el mismo `requestId` no crea otra valoración.
- `leadFormSubmit` conserva datos y `requestId` cuando hay fallo. Sólo borra el formulario al recibir un `lead.id` confirmado. Origen incluye ruta, query e idioma. El botón opcional posterior abre WhatsApp únicamente cuando se generó esa continuidad para el canal seleccionado.
- El endpoint legado de desarrollos utiliza el resolutor canónico de inventario y preventas. Guarda el identificador del desarrollo en `payload.developmentId`, sin presentarlo como una propiedad/unidad.

## Comprobaciones ejecutadas

`node --test test/public-valuation-flow.test.js test/owner-review-and-listing-media.test.js`: **8 aprobadas, 0 fallos, 2 omitidas**. Las dos omitidas requieren `PCC_TEST_BASE` y credenciales de un entorno local completo; no se ejecutan contra producción.

Las nuevas pruebas montan el manejador real de `/api/leads` en HTTP localhost con un doble de base de datos. Comprueban envío email sin teléfono, WhatsApp con México por defecto, canal inactivo ignorado, consentimiento, zona, importes, datos de terreno, persistencia en valoración, reintento sin duplicado, monedas heredadas, rechazo de renta/venta de propietarios en preventa y separación de IDs. Una prueba del submit real del navegador comprueba conservación de datos/requestId tras fallo y confirmación sólo después de guardar. Los HTML ES/EN comprueban el formulario breve, moneda USD y campos opcionales.

La comprobación visual y los envíos sobre una base local real se registran en la validación general del cambio. Estas pruebas no sustituyen ese recorrido ni modifican la base de datos publicada.
