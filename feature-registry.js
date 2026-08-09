const features = Object.freeze([
  { id: "dashboard", name: "Centro de control", section: "dashboard", description: "Resume operación, inventario, solicitudes, leads y tareas con datos reales.", permissions: ["admin"], actions: ["revisar prioridades", "abrir métricas"], steps: ["Abre Centro de control.", "Revisa Qué requiere atención ahora.", "Selecciona una métrica para abrir su módulo filtrado."] },
  { id: "new-property", name: "Crear propiedad", section: "new-property", description: "Registra una unidad individual en venta o renta.", permissions: ["admin", "editor"], actions: ["crear", "guardar borrador", "subir fotos", "vincular desarrollo"], steps: ["Abre Publicaciones y selecciona Nueva propiedad.", "Completa título, tipo, moneda, precio y ubicación.", "Sube la galería y ordena la portada.", "Agrega características, amenidades y descripción.", "Revisa el indicador de calidad y guarda."] },
  { id: "properties", name: "Inventario de propiedades", section: "properties", description: "Busca, filtra, edita, archiva y revisa calidad de propiedades.", permissions: ["admin", "editor"], actions: ["buscar", "editar", "archivar", "destacar", "generar ficha"], steps: ["Abre Publicaciones.", "Busca por título, MLS, zona o keyword.", "Usa Editar para cargar la ficha sin perder datos."] },
  { id: "new-development", name: "Crear desarrollo", section: "new-development", description: "Crea la ficha maestra de un proyecto inmobiliario, separada de sus unidades.", permissions: ["admin", "editor"], actions: ["crear", "subir galería", "definir amenidades"], steps: ["Abre Desarrollos y selecciona Nuevo desarrollo.", "Completa nombre, desarrollador, estatus, entrega y precio desde.", "Registra ubicación, amenidades y galería general.", "Revisa y guarda la ficha maestra."] },
  { id: "developments", name: "Inventario de desarrollos", section: "developments", description: "Administra proyectos inmobiliarios y sus datos maestros.", permissions: ["admin", "editor"], actions: ["buscar", "editar", "vincular unidades"], steps: ["Abre Desarrollos.", "Busca el proyecto.", "Edita su ficha o vincula unidades desde Nueva propiedad."] },
  { id: "leads", name: "Asesorías", section: "leads", description: "Gestiona solicitudes de asesoría y sus siguientes acciones.", permissions: ["admin", "advisor"], actions: ["clasificar", "responder", "asignar", "dar seguimiento"], steps: ["Abre Asesorías.", "Filtra por tipo, estado o prioridad.", "Abre la solicitud, responde y registra la siguiente acción."] },
  { id: "requests", name: "Solicitudes de vendedores", section: "requests", description: "Revisa solicitudes enviadas por propietarios.", permissions: ["admin", "advisor"], actions: ["aprobar", "rechazar", "responder"], steps: ["Abre Solicitudes.", "Revisa contacto, inmueble y galería.", "Solicita datos faltantes o aprueba la solicitud."] },
  { id: "contacts", name: "CRM y contactos", section: "contacts", description: "Concentra cuentas y contactos provenientes de formularios, solicitudes y WhatsApp.", permissions: ["admin", "advisor"], actions: ["crear", "editar", "archivar", "enviar correo"], steps: ["Abre CRM / Contactos.", "Busca por nombre, correo o teléfono.", "Edita el perfil y registra el seguimiento."] },
  { id: "valuations", name: "Valoraciones", section: "valuations", description: "Administra solicitudes y rangos de valoración inmobiliaria.", permissions: ["admin", "advisor"], actions: ["analizar", "actualizar estado", "generar ficha"], steps: ["Abre Valoraciones.", "Selecciona la solicitud.", "Registra rango, confianza, comentarios y estado."] },
  { id: "matches", name: "Match comprador-propiedad", section: "matches", description: "Cruza preferencias confirmadas con inventario activo y explica cada puntuación.", permissions: ["admin", "advisor"], actions: ["analizar compatibilidad", "contactar comprador"], steps: ["Abre Match.", "Revisa porcentaje y factores coincidentes.", "Confirma presupuesto y disponibilidad antes de contactar."] },
  { id: "smart-map", name: "Mapa inteligente", section: "smart-map", description: "Muestra inventario y señales geográficas registradas.", permissions: ["admin", "advisor"], actions: ["explorar zonas", "abrir propiedad"], steps: ["Abre Mapa inteligente.", "Selecciona una zona o marcador.", "Abre la ficha relacionada para verificar datos."] },
  { id: "catalogs", name: "Catálogos de ubicación", section: "catalogs", description: "Administra estados, municipios, zonas y colonias con jerarquía.", permissions: ["admin"], actions: ["crear ubicación", "editar", "desactivar"], steps: ["Abre Catálogos.", "Selecciona el nivel y su elemento padre.", "Guarda y verifica su disponibilidad en formularios."] },
  { id: "marketing", name: "Marketing", section: "marketing", description: "Prepara contenido e imágenes usando fotografías reales y revisión humana.", permissions: ["admin", "editor"], actions: ["crear contenido", "componer imagen", "revisar redes"], steps: ["Abre Marketing.", "Elige Contenido o Imágenes.", "Busca una propiedad real.", "Genera, revisa y aprueba antes de descargar o publicar."] },
  { id: "mailing", name: "Mailing", section: "mailing", description: "Crea borradores y envía correos mediante el proveedor configurado.", permissions: ["admin", "advisor"], actions: ["seleccionar destinatarios", "guardar borrador", "enviar"], steps: ["Abre Mailing.", "Selecciona un segmento o correos específicos.", "Revisa asunto y contenido.", "Envía solo cuando el proveedor indique disponible."] },
  { id: "whatsapp", name: "WhatsApp CRM", section: "whatsapp", description: "Conecta una sesión real, muestra chats, leads y diagnóstico del proveedor.", permissions: ["admin", "advisor"], actions: ["conectar", "diagnosticar", "responder", "pausar bot"], steps: ["Abre WhatsApp.", "Consulta el estado real.", "Si aparece un QR real, escanéalo con el teléfono.", "Abre Chats para responder y registrar seguimiento."] },
  { id: "blog", name: "Blog", section: "blog", description: "Gestiona artículos bilingües, portada e imágenes internas.", permissions: ["admin", "editor"], actions: ["crear", "editar", "publicar"], steps: ["Abre Blog.", "Completa contenido y SEO.", "Sube portada e imágenes de contenido.", "Publica después de revisar ambos idiomas."] },
  { id: "pdf", name: "Fichas PDF", section: "pdf", description: "Genera fichas institucionales o neutras desde datos reales.", permissions: ["admin", "advisor", "editor"], actions: ["buscar propiedad", "previsualizar", "generar", "descargar"], steps: ["Abre Fichas PDF.", "Busca por MLS o título.", "Selecciona tipo de ficha.", "Previsualiza, genera y descarga."] },
  { id: "prompts", name: "Herramientas IA", section: "prompts", description: "Asiste con calidad, riesgos, negociación y seguimiento sin reemplazar la revisión humana.", permissions: ["admin", "advisor", "editor"], actions: ["analizar", "generar borrador", "detectar faltantes"], steps: ["Abre Herramientas IA.", "Selecciona la categoría y una entidad real.", "Genera el borrador.", "Verifica todos los hechos antes de usarlo."] },
  { id: "analytics", name: "Analítica", section: "analytics", description: "Resume eventos, búsquedas, fuentes, inventario y embudo comercial.", permissions: ["admin"], actions: ["consultar métricas", "analizar embudo"], steps: ["Abre Analítica.", "Revisa eventos, fuentes y conversiones.", "Abre el módulo operativo relacionado para actuar."] },
  { id: "tasks", name: "Tareas", section: "tasks", description: "Programa y controla seguimientos con recordatorios.", permissions: ["admin", "advisor"], actions: ["crear", "asignar", "completar"], steps: ["Abre Tareas.", "Registra vencimiento, prioridad y entidad relacionada.", "Actualiza el estado al completar el seguimiento."] },
  { id: "files", name: "Archivos", section: "files", description: "Administra documentos validados asociados a solicitudes y propiedades.", permissions: ["admin", "advisor", "editor"], actions: ["subir", "descargar", "eliminar"], steps: ["Abre Archivos.", "Selecciona la entidad relacionada.", "Sube un formato permitido y verifica el resultado."] },
  { id: "integrations", name: "Centro de integraciones", section: "integrations", description: "Muestra estado real de base de datos, IA, correo, WhatsApp, mapas y almacenamiento.", permissions: ["admin"], actions: ["diagnosticar", "revisar configuración"], steps: ["Abre Integraciones.", "Revisa cada estado y detalle.", "Corrige variables del proveedor y vuelve a probar."] },
  { id: "data-quality", name: "Calidad de datos", section: "data-quality", description: "Detecta faltantes y posibles duplicados sin eliminarlos automáticamente.", permissions: ["admin"], actions: ["detectar", "revisar", "abrir registro"], steps: ["Abre Calidad de datos.", "Selecciona una categoría.", "Revisa cada candidato antes de editar o archivar."] },
  { id: "copilot", name: "Puerto Cancún Copilot", section: "copilot", description: "Guía el uso del sistema y consulta datos administrativos mediante herramientas seguras de lectura.", permissions: ["admin"], actions: ["preguntar", "consultar", "explicar", "analizar"], steps: ["Abre Copilot.", "Escribe un objetivo o pregunta.", "Revisa fuentes, alcance y acceso sugerido."] },
]);

function registryForRole(role) {
  return features.filter((feature) => feature.permissions.includes(role));
}

function normalizedSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .trim();
}

function queryTokens(query) {
  const aliases = new Map([
    ["creo", "crear"],
    ["crea", "crear"],
    ["creando", "crear"],
    ["genero", "generar"],
    ["genera", "generar"],
    ["conecto", "conectar"],
    ["conecta", "conectar"],
    ["funciona", "funcion"],
    ["funcionan", "funcion"],
  ]);
  return normalizedSearchText(query)
    .split(/\s+/)
    .filter((term) => term.length > 2 && !["como", "una", "uno", "para", "que", "del", "las", "los"].includes(term))
    .map((term) => aliases.get(term) || term);
}

function searchFeatures(query, role = "admin", context = {}) {
  const terms = queryTokens(query);
  const contextual = normalizedSearchText(context.module || context.section || "");
  return registryForRole(role).map((feature) => {
    const name = normalizedSearchText(`${feature.id} ${feature.name}`);
    const actions = normalizedSearchText(feature.actions.join(" "));
    const text = normalizedSearchText(`${feature.description} ${feature.steps.join(" ")}`);
    const lexicalScore = terms.reduce((score, term) => {
      if (name.includes(term)) return score + 6;
      if (actions.includes(term)) return score + 4;
      if (text.includes(term)) return score + 2;
      return score;
    }, 0);
    const score = lexicalScore + (contextual && feature.section === contextual ? 1 : 0);
    return { ...feature, score };
  }).filter((feature) => feature.score > 0 || !terms.length).sort((a, b) => b.score - a.score);
}

module.exports = { features, registryForRole, searchFeatures };
