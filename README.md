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
DATABASE_URL=postgresql://...
PUBLIC_SITE_URL=https://www.puertocancun.center
SESSION_SECRET=un-secreto-largo-y-aleatorio
ADMIN_USER=admin prueba
ADMIN_PASSWORD=tu-password-admin
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
INSTAGRAM_ACCOUNT_ID=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_OAUTH_URL=
INSTAGRAM_PROFILE_URL=https://www.instagram.com/
GOOGLE_CLIENT_ID=tu-client-id-de-google
GOOGLE_MAPS_API_KEY=tu-api-key-de-google-maps
INDEXNOW_KEY=tu-clave-indexnow
PORT=3000
```

No subas `.env` al repositorio. La URL real de Neon y la contraseña del administrador deben quedar como variables de entorno.
`GOOGLE_CLIENT_ID` activa el inicio con Gmail. `GOOGLE_MAPS_API_KEY` activa el mapa clicable; sin esa clave se conservan el mapa embebido, geolocalización y coordenadas manuales.

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
- Catálogo base con los 32 estados de México y municipios y zonas principales de Quintana Roo.
- Fichas PDF de una página con hasta cuatro imágenes, en versión institucional o neutra sin datos de la agencia.
- Espacio de Instagram para seleccionar una propiedad y generar captions con OpenAI; la conexión se habilita con credenciales de Meta.
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

Las campañas preparan y registran mensajes; no realizan envío masivo sin un proveedor autorizado. Las herramientas IA internas generan borradores determinísticos y requieren aprobación humana. Google OAuth, Google Maps avanzado, correo, WhatsApp Business y un proveedor LLM se habilitan mediante credenciales externas. IndexNow se activa al configurar `INDEXNOW_KEY`; Google Search Console y Bing Webmaster Tools requieren verificación de dominio fuera del repositorio.

## Verificación

```bash
npm run check
npm test
```
