# Regresión de contratos públicos — 2026-11-15

`npm.cmd run verify` completado después de integrar las correcciones: **1.381 pruebas, 1.346 aprobadas, 35 omitidas por configuración de integración, 0 fallos**. El paso `check` también pasó. Evidencia local: `outputs/qa-20261115/verify-regression.log`.

Las expectativas antiguas se actualizaron para comprobar el comportamiento solicitado:

- Tarjetas, fichas, precios por m² y datos estructurados expresan USD con una cotización de prueba fechada, manteniendo los importes almacenados y sus monedas intactos. El JSON-LD redondea a centavos; una base de precio desconocida no fabrica una oferta.
- Los límites de presupuesto y el orden público comparan USD y MXN convertidos. El panel interno conserva su moneda original. La falta de cotización devuelve precio por confirmar, sin usar un cambio inventado.
- Los enlaces de contacto llevan el ID correcto: un desarrollo no se envía como si fuera una unidad. Los criterios de búsqueda quedan como contexto estructurado, sin textos técnicos en el campo de preferencias.
- Se conservan las regresiones existentes de privacidad, ubicaciones ocultas, galerías, contenido editorial oculto, períodos de renta, deduplicación, disponibilidad y publicaciones retiradas.
- Las etiquetas de renders requieren la identidad y versión de la imagen revisada. Cambiar orden o portada conserva la asociación; reemplazar medios retira la etiqueta y deja pendiente la clasificación automática cuya evidencia ya no existe.

Se añadieron estilos para portada y galería de preventas con imágenes completas, columnas adaptables, leyendas legibles y etiquetas superiores de render. La sección de ubicación tiene espacios y un contenedor estable. La validación visual integral y las pruebas de integración activadas se documentan separadamente por el coordinador; las 35 pruebas omitidas no se presentan como ejecutadas.

Las pruebas utilizan fixtures y módulos aislados; no escriben en la base de datos de producción. No se generó ningún commit desde esta revisión de regresión.
