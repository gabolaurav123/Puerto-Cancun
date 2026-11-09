# Guardado y seguimiento comercial

## Imágenes y relaciones

El guardado de galería usa una transacción y comprueba la revisión de la ficha para evitar sobrescribir una edición más reciente. Las URLs de imágenes incluyen una versión ligada a la ficha. La respuesta de guardado actualiza la revisión del editor.

Los borradores respaldan las fotos en `admin_listing_drafts`, además de la copia local. Un autoguardado de texto conserva las imágenes respaldadas. Los errores mantienen el formulario y sus fotos para reintentar.

La ubicación y los vínculos existentes no se sustituyen con campos vacíos u omitidos. Desvincular requiere una acción explícita. Los desarrollos se identifican por su ID persistente, independientemente del nombre. Se rechaza la creación accidental de otro desarrollo con el mismo nombre y zona.

No se añadieron migraciones de esquema ni procesos de borrado de inventario.

## Asesor y contacto

El asesor usa el proveedor OpenAI ya configurado para interpretar la conversación. Los resultados, precios, superficies y respuestas sobre fichas se obtienen del inventario público. Ante falta del proveedor funciona como asesor guiado. Las preferencias sin evidencia se muestran como pendientes, nunca como coincidencias verificadas.

La visita se registra en `tour_requests` con estado `requested` y queda relacionada con la consulta en `lead_requests`. Solo el equipo cambia su estado a confirmada. El horario solicitado utiliza la zona horaria de Cancún.

En **Asesorías → Seguimiento comercial, búsquedas y coincidencias** se consultan solicitudes, coincidencias, responsables, notas e historial. Las captaciones y cierres requieren una nota. Las métricas cuentan los registros reales; no se infieren cierres de clics o mensajes.

## Avisos de búsquedas guardadas

Las búsquedas de visitantes se guardan en el JSON de su consulta. Solo se activan avisos con consentimiento y un canal disponible: correo mediante Resend y remitente configurado, o sesión WhatsApp conectada. Los botones de WhatsApp comercial no equivalen a una sesión automática conectada.

Las preferencias que exigen confirmación se conservan para revisión del equipo. Las búsquedas sin canal también se guardan y la web explica que los avisos no están activos. Al publicarse inventario se comprueban coincidencias; también se revisan periódicamente si `SAVED_SEARCH_ALERTS` está habilitado. Cada aviso permite cancelación. Una entrega incierta se marca para revisión y no se reenvía ciegamente.

## Verificación

Ejecutar `npm run verify`. Para las integraciones con PostgreSQL usar únicamente una instancia aislada en loopback mediante `PCC_TEST_BASE`; esas pruebas no admiten un dominio de producción. Las pruebas cubren conservación de fotos y relaciones, reintentos sin duplicación, filtros completos, estado solicitado/confirmado, cruces comerciales y cancelación de avisos.
