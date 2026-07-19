# Puerto Cancún Center

Plataforma inmobiliaria con portal público, panel de propietarios y centro de operaciones administrativo conectado a PostgreSQL/Neon.

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Crea un archivo `.env` basado en `.env.example`.

3. Configura estas variables en tu entorno de despliegue:

```bash
DATABASE_URL=postgresql://usuario:password@host:5432/base
DATABASE_SSL=require
DATABASE_POOL_MAX=5
NODE_ENV=production
PUBLIC_SITE_URL=https://www.puertocancun.center
SESSION_SECRET=un-secreto-largo-y-aleatorio
ADMIN_USER=admin prueba
ADMIN_PASSWORD=tu-password-admin
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-terra
INSTAGRAM_ACCOUNT_ID=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_OAUTH_URL=
INSTAGRAM_PROFILE_URL=https://www.instagram.com/
GOOGLE_CLIENT_ID=tu-client-id-de-google
GOOGLE_MAPS_API_KEY=tu-api-key-de-google-maps
INDEXNOW_KEY=tu-clave-indexnow
PORT=3000
```

No subas `.env` al repositorio. La conexión PostgreSQL, las claves y la contraseña del administrador deben existir únicamente como variables de entorno.
`GOOGLE_CLIENT_ID` activa el inicio con Google. `GOOGLE_MAPS_API_KEY` activa Google Maps y su geocodificación; sin esa clave el sistema utiliza el mapa interactivo de OpenStreetMap y geocodificación desde el servidor.

### Despliegue en Seenode

- Base de datos: PostgreSQL administrado, en la misma región que el servicio web.
- Build command: `npm install`.
- Start command: `npm start`.
- Health check: `/health` (confirma que el proceso está vivo sin bloquearse por una migración); `/api/health` también valida PostgreSQL.
- Puerto: el mismo valor configurado en `PORT` y en el servicio de Seenode.
- Para una conexión privada sin TLS, usa `DATABASE_SSL=disable`; para una conexión pública o protegida usa `DATABASE_SSL=require`.

Al iniciar, el servicio abre el puerto primero y ejecuta las migraciones idempotentes en segundo plano. Si PostgreSQL no está disponible, conserva el proceso vivo, registra el error y reintenta la conexión cada 15 segundos.

## Ejecutar

```bash
npm start
```

El servidor crea automáticamente las tablas necesarias y carga propiedades de ejemplo si la tabla está vacía.

## Funcionalidad

- Selector USD/MXN e idioma Español/Inglés.
- Búsqueda guiada, filtros, favoritos, comparación y alertas.
- Panel del propietario con venta, valoración, validación de precio, validación de IA, respuestas y notificaciones.
- Solicitudes con modal de respuesta, historial, adjuntos, responsables, prioridades y tareas.
- CRM, compradores, preparación para venta, match y mapa operativo.
- Campañas segmentadas, exportación CSV, herramientas IA editables y analítica.
- Biblioteca de archivos, usuarios internos, roles y configuración persistente.
- Fichas PDF reales para propiedades y valoraciones.
- Publicaciones con estados, score, ubicación jerárquica y hasta 20 imágenes.
- Galería editable por imagen: agregar, eliminar, reordenar y elegir portada sin perder las fotos existentes.
- Catálogo base con los 32 estados de México, los 11 municipios de Quintana Roo y una selección amplia de zonas, colonias y desarrollos inmobiliarios.
- Fichas PDF de una página con hasta cuatro imágenes para cualquier propiedad, incluso borradores e incompletas. Cada inmueble ofrece dos acciones directas: institucional con logos y datos de Puerto Cancún Center, o neutra únicamente con información de la propiedad.
- Espacio de Instagram para seleccionar una propiedad, generar captions con OpenAI, copiarlos y abrir el perfil configurado. No publica automáticamente: el texto siempre requiere revisión humana.
- URL canónica individual por propiedad, categorías rastreables y versiones independientes en español e inglés.
- Schema `RealEstateAgent`, `RealEstateListing`, `BreadcrumbList`, sitemap dinámico y medios públicos sin Base64 en el HTML.
- Hero responsive WebP, Open Graph 1200×630 y staging Seenode bloqueado para indexación.
- Persistencia PostgreSQL para operación, documentos, archivos, campañas, métricas y sesiones.

## Rutas públicas

- `/propiedades` y categorías por zona, tipo, renta y preventa.
- `/propiedades/:slug` y `/en/properties/:slug` para cada publicación activa.
- `/comprar-casa-cancun`, `/vender-casa-cancun`, `/valuacion-inmobiliaria-cancun`, `/validar-respuesta-ia`, `/faq-inmobiliario-cancun` y `/zonas-cancun`.
- `/sitemap.xml`, `/robots.txt`, `/llms.txt` y `/ai-summary.json` generados por el servidor.

## Integraciones

Las campañas preparan y registran mensajes; no realizan envío masivo sin un proveedor autorizado. La generación para Instagram usa la Responses API cuando `OPENAI_API_KEY` está configurada y vuelve a un borrador local si OpenAI no está disponible. `OPENAI_MODEL` utiliza `gpt-5.6-terra` por defecto para equilibrar calidad, latencia y costo. Los resultados requieren aprobación humana.

`INSTAGRAM_OAUTH_URL` puede apuntar al flujo OAuth administrado por Meta y `INSTAGRAM_PROFILE_URL` al perfil que se abrirá desde Marketing. Las credenciales de Instagram nunca se envían al navegador. Google OAuth, Google Maps, WhatsApp e IndexNow se habilitan mediante sus respectivas variables.

## Flujos administrativos principales

- La primera imagen de la galería es la portada. Las fotos se agregan, eliminan o reordenan individualmente y se guardan con control de concurrencia.
- Una publicación pública debe conservar por lo menos una imagen; para retirar la última, primero se debe despublicar.
- Al escribir una dirección nueva se eliminan las coordenadas anteriores y se geocodifica nuevamente. Al cambiar de sección o salir del panel se limpia el formulario de publicaciones y su borrador local.
- El dashboard enlaza directamente al filtro de propiedades incompletas y cada registro muestra su porcentaje y datos faltantes.
- Construcción y terreno aceptan dos decimales. Las fichas PDF institucional y neutra conservan esos valores y muestran hasta cuatro imágenes en una sola página.

## Verificación

```bash
npm run check
npm test
```
