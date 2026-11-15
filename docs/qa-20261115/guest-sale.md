# Enviar publicación sin cuenta · 15 noviembre 2026

## Recorrido auditado

La entrada de venta abre `#sellerOptionsModal` o el enlace `data-open-guest-sale` de la guía de venta; ambos llegan a `#guestSaleModal`. Antes había dos pantallas: título/tipo/ubicación y mapa visible, luego contacto. El servidor exigía teléfono incluso al elegir correo. El botón intermedio podía traducirse como «Enviar solicitud» aunque solo cambiaba de pantalla.

La solicitud usa POST `/api/guest-sale-requests`. Se conserva en `guest_sale_requests`, crea o vincula CRM mediante `upsertContact`, registra contexto en `activity_logs` y avisa mediante `notifications`. Su seguimiento continúa en Solicitudes de venta y Contactos sin registro. La aprobación posterior sigue creando un borrador privado; este cambio no publica inventario automáticamente.

## Cambios

- Una sola vista y un único botón de envío: tipo, zona/localidad aproximada, canal elegido y consentimiento. Nombre, título, descripción y fotos son opcionales en un bloque desplegable. Si falta título, el servidor registra «Tipo · Zona», sin inventar características.
- Correo muestra y valida solo correo. WhatsApp muestra y valida teléfono/país; México es el valor inicial, con Estados Unidos y Canadá disponibles y el selector internacional existente.
- El mapa queda en un detalle opcional, no se inicializa al abrir el formulario y no muestra coordenadas manuales. Los campos de ubicación persistentes se conservan para quien sí elige precisarla.
- La respuesta mantiene idioma, origen, canal y consentimiento. La confirmación exige un ID recibido del servidor; no abre WhatsApp automáticamente ni cierra la confirmación. La continuidad externa existente es voluntaria.
- Un fallo conserva campos y clave de reintento. El cliente bloquea envíos simultáneos y la repetición después del éxito; el servidor deduplica por canal/contacto e identidad de solicitud, con bloqueo transaccional por contacto y clave. Una clave confirmada con otro contacto devuelve conflicto sin duplicar ni exponer el registro anterior.
- El diálogo devuelve el foco al origen, contiene la navegación por Tab y permite cerrar con Escape.

Archivos: `index.html`, funciones de venta sin registro y guardia del mapa opcional en `app.js`, textos específicos de `site-language.js`, ruta POST de `server.js`; pruebas `test/guest-sale-single-step.test.js` y actualización del contrato anterior en `test/guest-sale-pdf-sharing.test.js`.

## Validación

- `node --test test/guest-sale-single-step.test.js test/guest-sale-pdf-sharing.test.js test/master-stabilization-regressions.test.js`: 15 pasan, 0 fallos, 1 prueba de navegador optativa.
- `PCC_GUEST_BROWSER=1 node --test test/guest-sale-single-step.test.js`: 6/6 pasan con Edge local. El navegador de 390 px usa el formulario real, cambia a correo, envía sin teléfono/título/fotos, conserva datos tras un fallo, reutiliza la clave y muestra confirmación solo al recibir el ID; no hay desbordamiento horizontal.
- Las pruebas del manejador ejecutan el código real de la ruta con transacciones simuladas: correo solo, WhatsApp MX por defecto, país/canal/consentimiento inválidos, datos opcionales, duplicados, reintentos e identidad distinta. Comprueban una sola solicitud/contacto/notificación. No sustituyen una prueba de conexión PostgreSQL real.

No se enviaron solicitudes ni se modificaron registros de producción durante esta validación. No hay cambios de esquema ni migraciones de datos en este flujo.
