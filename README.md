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
PORT=3000
```

No subas `.env` al repositorio. La URL real de Neon y la contrasena del administrador deben quedar como variables de entorno.

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
- Panel de vendedor para enviar solicitudes de venta.
- Panel administrativo para aprobar/rechazar solicitudes y crear/editar/borrar publicaciones.
- Publicaciones con precio USD y precio MXN como campos independientes.
- Carga de imagen desde archivo JPG, PNG o WEBP, maximo 1.5 MB.
- Botones de propiedad conectados a WhatsApp con mensaje automatico.
- Persistencia en PostgreSQL para cuentas, solicitudes, publicaciones, metricas y sesiones.
