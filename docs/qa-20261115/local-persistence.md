# QA de persistencia local · 15 noviembre 2026

Resultado: **15 casos pasan, 0 fallos** contra Express y PostgreSQL reales de desarrollo. Los envíos se hicieron exclusivamente a `http://127.0.0.1:44763`; la lectura de verificación usó `127.0.0.1:44762/postgres`, usuario de pruebas `qa`. No se inicializó el esquema, no se ejecutaron migraciones ni se modificó producción.

El wrapper `../qa-http/nov15-server.cjs` arranca con un entorno reducido, sin claves externas, `NODE_ENV=development`, avisos automáticos apagados y asesor público deshabilitado. Antes de enviar, se comprobó que ambos canales automáticos devolvían `false`. Las URLs de continuidad externa solo se reciben como datos; no se abren ni se envían mensajes.

## Casos comprobados

| Flujo | Resultado persistido |
| --- | --- |
| Contacto general ES, solo correo | Un lead, consentimiento, origen `/contacto` y contacto CRM; reintento devuelve el mismo ID. |
| Otro correo sin teléfono | Contacto CRM distinto; no se mezcla con contactos de teléfono vacío. |
| Ficha de terreno EN, WhatsApp México | ID, título y zona resueltos desde inventario; datos manipulados del navegador no sustituyen la ficha; número normalizado. |
| Ficha de renta EN, WhatsApp Canadá | Intención de renta fija; el período no confirmado no se convierte en mensual por un parámetro entrante. |
| Visita | Un lead y una sola fila `tour_requests`, estado solicitado, inmueble y canal correctos. |
| Búsqueda vacía: terreno en Cozumel, Fuera de Cancún | Filtros preservados: operación, tipo, destino, superficie mínima, presupuesto USD y zona. Seguimiento `pending_channel` porque los canales externos están apagados; activar correo en ese entorno devuelve 400. |
| Propietario que pone en renta | `vendedor-ofrece-renta`, intención `let` y zona Cozumel. |
| Propietario que vende | `vendedor-venta`, intención `sell` y WhatsApp. |
| Envío sin cuenta por correo | Tipo/localidad/contacto bastan; título predeterminado, cero imágenes, sin coordenadas inventadas, CRM existente vinculado. |
| Envío sin cuenta por WhatsApp USA | Teléfono y prefijo conservados; reintento devuelve el mismo registro, contacto y notificación. |
| Valoración por correo | Una valoración y un lead; precio/currency ausentes permanecen nulos. |
| Revisión de precio por WhatsApp | Una valoración con 42,500 USD, contexto y canal correctos; reintento no duplica. |
| Preventa heredada del inventario local | Compra aceptada; renta, venta del propietario y publicación en renta rechazadas por el servidor. |
| Desarrollo | `developmentId` persistido; `property_id` nulo, sin confundir ambos tipos de identificador. |
| Seguimiento administrativo | Las APIs autenticadas de asesorías, solicitudes sin cuenta y valoraciones recuperan los registros nuevos. |

En cada consulta normal se verificó un único lead y una única notificación después del reintento. Las ventas sin cuenta verificaron además `activity_logs` con canal/consentimiento. Las visitas y valoraciones comprobaron sus filas relacionadas directamente en PostgreSQL.

## Conteos de la corrida final

| Tabla | Antes | Después | Incremento |
| --- | ---: | ---: | ---: |
| properties | 33 | 33 | 0 |
| lead_requests | 93 | 105 | 12 |
| contacts | 67 | 72 | 5 |
| guest_sale_requests | 5 | 7 | 2 |
| tour_requests | 8 | 9 | 1 |
| valuations | 48 | 50 | 2 |

Estos son registros de prueba retenidos para inspección; no se borraron filas. Los IDs exactos y comprobaciones están en `outputs/qa-20261115/local-inquiries-persistence.json`.

## Reproducción y límites

`scripts/qa-local-inquiries-20261115.cjs` exige la URL HTTP local, la conexión PostgreSQL local y credenciales administrativas locales mediante variables `PCC_QA_URL`, `PCC_QA_DATABASE_URL`, `PCC_QA_ADMIN`, `PCC_QA_PASSWORD`. Rechaza cualquier host/puerto distintos antes de conectarse. La contraseña no se guarda en el script ni en el informe.

La primera corrida utilizó una sola identidad de visitante: el límite real de 12 consultas por diez minutos produjo 429 después de comprobar los primeros flujos. Se conservó como `local-inquiries-rate-limit-first.json`. La corrida final mantiene el límite del producto y simula un visitante diferente por caso mediante direcciones reservadas `192.0.2.x` en el proxy local; cada reintento conserva el mismo visitante. No se desactivó la protección.

Esta validación prueba recepción, persistencia, recuperación administrativa y deduplicación. No prueba entrega de correos o mensajes externos, porque esos servicios están desactivados en este entorno. El inventario local contiene fixtures anteriores: no se afirma haber escrito ni probado contra las fichas de producción de Mondrian o Al Mare.
