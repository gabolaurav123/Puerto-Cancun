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
SESSION_SECRET=un-secreto-largo-y-aleatorio
ADMIN_USER=admin prueba
ADMIN_PASSWORD=tu-password-admin
GOOGLE_CLIENT_ID=tu-client-id-de-google
GOOGLE_MAPS_API_KEY=tu-api-key-de-google-maps
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
- Persistencia PostgreSQL para operación, documentos, archivos, campañas, métricas y sesiones.

## Integraciones

Las campañas preparan y registran mensajes; no realizan envío masivo sin un proveedor autorizado. Las herramientas IA internas generan borradores determinísticos y requieren aprobación humana. Google OAuth, Google Maps avanzado, correo, WhatsApp Business y un proveedor LLM se habilitan mediante credenciales externas.

## Verificación

```bash
npm run check
```
