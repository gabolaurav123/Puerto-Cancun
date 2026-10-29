# Decisiones tecnicas y costes

Consulta: 29 octubre 2026. No se adquirieron servicios ni se cambiaron planes.
Estas estimaciones no sustituyen una cotizacion ni la factura de la cuenta.

| Componente | Decision | Beneficio y alternativa |
|---|---|---|
| Interfaz | JavaScript, HTML SSR, CSS existentes | No introduce framework ni reescritura; enlaces y formularios GET siguen operativos sin mejora asincrona. |
| Consulta | Contrato compartido 2026-10-29.2 | Misma identidad, permisos y filtros. Parser determinista ES/EN antes de pagar embeddings o LLM. |
| Datos | PostgreSQL actual, columnas aditivas JSONB | No modifica ubicaciones, precios ni registros existentes por inferencia. Sin PostGIS/pgvector: volumen actual no justifica extensiones aun. |
| Mapa | Leaflet 1.9.4 bajo demanda, OSM raster | Grupos por coordenada, bbox y precision. Lista accesible cuando CDN/tiles fallan. |
| Comparacion | Modulo local, proyeccion de API publica | No transmite contactos ni notas administrativas; valores originales sin FX supuesto. |
| Guardado | API de borradores, IndexedDB y expectedUpdatedAt existentes | Retorno protegido y conflicto 409 sin sobrescritura automatica. |
| Observabilidad | IDs de solicitud, health, logs y metricas existentes | Se conserva el sistema; no se instala otro colector sin destino operativo. |
| Pruebas | node:test + Playwright/Chromium local | Fixtures y PostgreSQL aislados; no pruebas de escritura en produccion. |

## Volumen y coste orientativo

| Escenario mensual | Coste incremental de API | Condicion |
|---|---|---|
| 10.000 busquedas estructuradas/conversacionales | USD 0 en servicios de IA | Reglas locales. CPU, base de datos y trafico consumen el plan de hosting existente. |
| Auditar 5 Excel, 193 filas principales | USD 0 en servicios externos | Lectura local, sin generar fotos, resolver coordenadas ni llamadas IA. |
| 1.000 aperturas de mapa, supuesto 20 tiles cada una | Sin tarifa por peticion del servicio publico OSM | 20.000 solicitudes estimadas, no cuota garantizada. No uso masivo/offline, atribucion y cache normales. Contratar proveedor con SLA al crecer. |
| Routes Essentials: 500 consultas x 20 inmuebles | 10.000 elementos; USD 0 si la franquicia mensual esta disponible | Servicio NO activado. Credencial, facturacion y condiciones requeridas. |
| Routes Essentials: 1.000 consultas x 20 inmuebles | 20.000 elementos; aproximadamente USD 50 | Con 10.000 gratuitos y USD 5/1.000 en primer tramo. Funciones de otro SKU cambian el precio. |
| Places Details Essentials: 193 lugares | USD 0 si hay franquicia disponible; USD 0,965 sin ella en primer tramo | NO activado. Resolver una URL no equivale a obtener coordenadas ni permiso de republicacion. |

Google publica franquicias de 10.000 eventos para ambos SKU Essentials y USD 5 por
1.000 en el primer tramo facturable. Las matrices cobran por elemento, no por
sesion de usuario. Aplican consumo agregado, SKU efectivo, impuestos y condiciones
de la cuenta. Fuentes: [lista oficial](https://developers.google.com/maps/billing-and-pricing/pricing)
y [facturacion por elemento](https://developers.google.com/maps/documentation/javascript/usage-and-billing).

OSM es best-effort, no una garantia de capacidad ni disponibilidad. La carga es
solo al abrir el mapa, sin precarga masiva. Fuente: [politica oficial de tiles](https://operations.osmfoundation.org/policies/tiles/).

## Dependencias pendientes

- Tiempos de traslado: cuenta con facturacion, API habilitada, key restringida,
  cuotas y limite de gasto de aplicacion. No se estiman minutos a partir de distancia.
- Resolucion de Maps: URL de lugar verificable, servicio autorizado y revision
  humana. Muchos Excel contienen una busqueda general, no un punto confirmado.
- Rendimiento p75: requiere observacion de usuarios reales. Mediciones locales
  y muestras de navegador no se presentan como LCP/INP/CLS de campo.

La busqueda y comparacion nuevas no dependen de un saldo de IA. Los servicios de
generacion de descripciones existentes mantienen su configuracion y limites;
no se asigna un presupuesto nuevo ni se anuncia gasto cero para esas funciones.

Planos interactivos, masterplan y recorridos 360/3D basados en ese material fueron
excluidos expresamente por el usuario el 29 de octubre. No requieren contratar
servicios ni obtener archivos; se mantienen las fotografias y videos existentes.
