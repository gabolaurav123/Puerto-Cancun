# Puerto Cancun Center

Sitio inmobiliario con frontend, panel de vendedores, panel administrativo y backend conectado a PostgreSQL/Neon.

## Configuracion

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

No subas `.env` al repositorio. La URL real de Neon y la contrasena del administrador deben quedar como variables de entorno.
`GOOGLE_CLIENT_ID` activa el boton para iniciar sesion con Gmail. `GOOGLE_MAPS_API_KEY` activa el mapa clicable; sin esa clave la web conserva el mapa embebido, geolocalizacion y coordenadas manuales.

## Ejecutar

```bash
npm start
```

El servidor crea automaticamente las tablas necesarias y carga propiedades de ejemplo si la tabla esta vacia.

## Funcionalidad

- Selector de moneda USD/MXN.
- Cambio de idioma Espanol/Ingles.
- Busqueda y filtros por tipo, zona, venta/renta y destacadas.
- Registro e inicio de sesion para vendedores.
- Inicio de sesion con Google/Gmail cuando `GOOGLE_CLIENT_ID` esta configurado.
- Panel de vendedor para enviar solicitudes de venta.
- Panel administrativo tipo centro de operaciones con leads, solicitudes, valoraciones, publicaciones, CRM, catálogos, match comprador-propiedad, mapa, analítica y tareas.
- Publicaciones con precio USD y precio MXN como campos independientes.
- Catálogos de ubicacion, coordenadas y mapa para solicitudes/publicaciones.
- Carga multiple de imagenes JPG, PNG o WEBP, maximo 20 archivos optimizados antes de guardarse.
- Botones de propiedad conectados a WhatsApp con mensaje automatico.
- Persistencia en PostgreSQL para cuentas, solicitudes, publicaciones, metricas y sesiones.
