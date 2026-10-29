# Uso del catalogo y administracion

Esta guia corresponde al codigo del 29 de octubre de 2026. Su disponibilidad en
la web publicada depende del despliegue verificado en `CIERRE-20261029.md`.

## Buscar y comparar

1. Abre Buscar, una tarjeta Location o un tipo de propiedad. La direccion del
   navegador conserva los criterios al recargar y al usar Atras.
2. Selecciona Propiedades o Desarrollos. Los proyectos no cuentan como viviendas
   individuales. Preventa es una modalidad, no una zona ni un tipo de inmueble.
3. En los filtros de precio indica operacion, moneda original y, cuando sea renta,
   el periodo. Un precio por metro cuadrado no se mezcla con uno total.
4. La busqueda inteligente pide precisar lo que falta. No toma una respuesta
   parcial como permiso para ignorar el presupuesto o ampliar la zona.
5. En Mapa aparecen las ubicaciones publicas disponibles. Una ubicacion aproximada
   no es la direccion exacta. Buscar esta area aplica el mismo filtro al listado;
   si el proveedor no carga, Lista sigue disponible.
6. Pulsa Comparar en dos a cuatro fichas. Solo diferencias conserva los avisos de
   incompatibilidad. Una seleccion con nombre se guarda solo en ese dispositivo;
   el enlace compartido contiene IDs publicos, no nombres de clientes ni notas.

## Publicaciones y desarrollos

1. Abre el inventario correspondiente. El inventario general excluye borradores
   y archivados; utiliza Vista / estado para consultarlos expresamente.
2. Completas e Incompletas se calculan con requisitos de cada entidad y tipo.
   Un terreno no necesita recamaras. Una ficha completa no acredita disponibilidad
   ni una revision juridica.
3. Los avisos Sin portada, Incompletas y Por revisar abren sus registros por ID.
   Revisa el campo indicado sin renombrar, fusionar o borrar otras fichas por MLS.
4. Para corregir una agrupacion comercial, abre la ficha y cambia Location tras
   comprobar la fuente. Esto no debe sustituir su ciudad, direccion o coordenadas.
5. Destacada y Publica son controles distintos. Una ficha privada no aparece en
   portada por estar destacada. Orden en destacadas usa numeros menores primero.
6. Volver conserva filtros y posicion del inventario. Con cambios pendientes,
   confirma el guardado del borrador; si falla, no se presenta como guardado.
7. Verificar disponibilidad requiere confirmacion explicita. No cambia fecha de
   edicion, precio, visibilidad ni estado comercial. La revision vence a los 90 dias
   por defecto, configurable por separado para propiedades y desarrollos.

## Que incluye cada Location

| Location | Alcance |
|---|---|
| Zona Hotelera (ZH) | Zona Hotelera de Cancun, Costa Mujeres y Punta Sam; excluye Puerto Cancun. |
| Puerto Cancun | Puerto Cancun y sus subzonas y desarrollos. |
| Cancun City | Ciudad de Cancun, Huayacan, corredor Colosio y subzonas urbanas confirmadas. |
| Fuera de Cancun | Tulum, Playa del Carmen, Merida, Ciudad de Mexico y otros destinos confirmados fuera de las anteriores. |

Los registros ambiguos permanecen pendientes de clasificar. El nombre del archivo
Excel no demuestra por si solo la ubicacion de cada fila.

## Estadisticas y demanda

- Estadisticas separa propiedades y desarrollos y permite abrir el conjunto exacto
  de cada indicador. Los precios se agrupan por moneda, operacion, base y periodo;
  no son una valuacion ni un promedio convertido con un tipo de cambio supuesto.
- En Compradores, la revision de demanda sin coincidencias analiza las ultimas
  500 busquedas guardadas de cuentas registradas. No cuenta visitas anonimas como
  compradores. Los criterios invalidos se muestran aparte para revision.
- Copilot admite consultas de calidad como "Desarrollos de Puerto Cancun sin
  portada" y permite abrir los IDs resultantes. Una consulta no modifica datos.

## Excel y datos pendientes

Esta entrega audita los cinco libros originales y su importacion anterior; **no
vuelve a importar ni modifica los registros existentes**. El asistente completo de
carga, mapeo, revision y reimportacion con conflictos dentro del panel sigue
pendiente. No hay un boton nuevo que pueda usarse como si ese flujo ya existiera.

Para los borradores importados anteriormente: Desarrollos, Inventario de
desarrollos, Vista / estado, Borradores. Revisa cada ficha y confirma fotos,
ubicacion, texto y visibilidad antes de publicarla. El estado privado actual debe
verificarse en el panel; un informe historico no lo reemplaza.

La auditoria conserva archivo, hoja, fila y huellas de contenido. Una coincidencia
de MLS no autoriza fusionar inmuebles. Ver `INVENTORY-RECONCILIATION-20261029.md`
para los casos que requieren documentacion comercial.

## Fuera de alcance

Por decision del usuario no se agregan planos interactivos, masterplan ni
recorridos 360/3D basados en planos inexistentes. Las fotografias y videos reales
actuales se conservan. Los enlaces normales a mapas no son planos del inmueble.
