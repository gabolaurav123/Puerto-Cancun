# Verificación del dominio — 15 de noviembre de 2026

PR #46 integrado en `main` como `6840560` y publicado desde el servicio Seenode Puerto-Cancun (974522). GitHub Quality y Deploy main finalizaron correctamente. El dominio devolvió `assetVersion=a16d3175f07c`, coincidente con el código y el lockfile producido por la instalación de Seenode.

Comprobación de solo lectura después de publicar:

- Las mismas 282 fichas públicas antes/después; IDs, importes originales, monedas, imágenes, estado y visibilidad sin cambios.
- 47 proyectos/entradas de Preventas; las fichas de Mondrian, Al Mare, Azürea y SM10 resuelven intención única de compra en ES y EN. SLS conserva período sin confirmar; RIVA conserva su ubicación autorizada.
- Ocho páginas públicas principales responden HTTP 200 sin cargar el widget de IA. Doce comprobaciones de fichas/contexto verifican CTA, ubicación permanente e identidad.
- Cotización integrada disponible, publicada el 13 de noviembre: 18.5525 MXN/USD. La interfaz identifica fecha y aproximación; no se sustituyó por la tasa de prueba.
- Navegador del propietario: consulta de Mondrian abre en la misma página, solo compra, un campo de correo al elegir ese canal; cierre retorna al listado. La vista del proyecto carga automáticamente mapa aproximado con controles de zoom. No se enviaron formularios a producción.

La inspección final detectó una portada repetida solo en la presentación: la URL editorial `/media/properties/ID/0` y su versión vigente `?v=...` se trataban como dos imágenes. El ajuste complementario resuelve ambas a la imagen vigente, sin modificar registros: Mondrian queda con cinco imágenes únicas, incluida la portada. Las URLs remotas distintas permanecen separadas. Regresión enfocada: 19/19 aprobadas.

Evidencia local: `outputs/qa-20261115/deployment.json`, snapshots antes/después y `contacto-publicado.jpg`. Los datos de prueba persistidos y los medios auditados no se incorporan al repositorio.
