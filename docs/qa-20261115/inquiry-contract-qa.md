# QA de contacto contextual — 15-11-2026

## Entorno

Pruebas puras y HTTP sobre el resolutor y los manejadores reales, con inventario de prueba y doble de almacenamiento. Las pruebas del navegador sirven el componente público real desde un servidor HTTP exclusivo en `127.0.0.1`, con Edge headless y un perfil nuevo. Se bloquean todas las peticiones fuera de ese origen. No se conecta una base de producción ni se envían mensajes externos.

## Resultados

- `node --test test/public-inquiry-contract.test.js test/inquiry-idempotency.test.js`: **11 aprobadas, 0 fallos**.
- `test/contextual-inquiry-browser.test.js` con `PCC_LAYOUT_BROWSER=1`: **1 escenario integral aprobado, 0 fallos, sin omisiones**, 10.9 segundos. Recorre ES/EN en anchos 360 y 1366 px y luego renta, preventa, terreno, visita, alerta y fallo de red.

### Contratos y envío

- Un ID legado de desarrollo en `propertyId`, un `developmentId`, una referencia de desarrollo y su alias resuelven al proyecto, aunque una unidad hija aparezca antes en inventario.
- Propiedad en venta, renta, unidad en preventa y desarrollo en preventa fijan la intención correspondiente. Solicitudes de renta o de propietario sobre preventa se rechazan en servidor.
- El contexto conocido reemplaza títulos, MLS, tipo y zona enviados por el navegador. Fuera de Cancún conserva Cozumel como municipio real.
- Email requiere sólo email; se ignora un teléfono oculto inválido. WhatsApp ignora el email inactivo y utiliza México por defecto. Consentimiento ausente y canal inválido se rechazan.
- Reintentar con el mismo contacto, solicitud y contexto produce el mismo lead. Un segundo correo crea un lead distinto. La activación de alertas conserva filtros históricos en MXN y necesita consentimiento específico y canal disponible coincidente.
- Una visita sin fecha se registra como solicitada y pendiente de coordinación, con fecha/hora nulas. Un cliente no puede inventar un período mensual para la renta que carece de ese dato.
- `sourcePath` conserva `priceMode=public-usd`, límites y filtros admitidos, y descarta parámetros ajenos y URLs externas.

### Navegador real

- El formulario es de un solo paso, el campo de canal recibe foco y nombre no es obligatorio. Cambiar a email oculta y deshabilita país/teléfono, y activa solamente la validación de email.
- Cerrar conserva los datos introducidos, idioma, URL y filtros; devuelve foco al botón de origen. Reabrir recupera el borrador. La confirmación recibe foco y el retorno conserva la página.
- Las cuatro combinaciones de idioma/tamaño no tienen desbordamiento horizontal.
- Los enlaces antiguos que intentan indicar renta sobre preventa o compra sobre una renta se normalizan visualmente a la operación de la ficha; el servidor vuelve a validarla.
- La visita no exige fecha. El aviso automático aparece sólo al seleccionar un canal compatible y su consentimiento está desmarcado inicialmente.
- Se simula pérdida de la respuesta después de que el servidor guardó el lead: se conserva email/requestId, se reintenta, el servidor devuelve 200 y el mismo ID, y queda exactamente un registro.

## Defectos encontrados y cubiertos por regresiones

Se corrigieron durante la integración: selección accidental de una unidad por `portalDevelopmentId` al resolver una referencia del padre; etiquetado incorrecto de propiedades normales con padre como preventas; período de renta inventado por el cliente; pérdida de `priceMode` al preservar URL de origen; y aceptación de un presupuesto MXN marcado como presupuesto público USD. Las pruebas anteriores comprueban cada corrección.
