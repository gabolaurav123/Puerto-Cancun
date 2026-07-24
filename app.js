const IMAGE_MAX_BYTES = 240 * 1024;
const IMAGE_ORIGINAL_MAX_BYTES = 12 * 1024 * 1024;
const IMAGE_MAX_COUNT = 20;
const DESCRIPTION_MAX_LENGTH = 50000;
const LISTING_DRAFT_KEY = "pcc.admin.listingDraft.v2";
const SELLER_DRAFT_KEY = "pcc.seller.requestDraft.v1";
const DRAFT_DB_NAME = "puertoCancunDrafts";
const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const WHATSAPP_NUMBER = "5219982166563";
const LOCATION_FIELD_ORDER = ["state", "city", "zone", "neighborhood"];

const keys = {
  lang: "pcc.lang",
  favorites: "pcc.favorites",
  compare: "pcc.compare",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82";

const fallbackIcons = {
  "arrow-left": '<path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path>',
  "arrow-right": '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  "badge-dollar-sign":
    '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.76 4 4 0 0 1-4.78 4.77 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path>',
  "book-open": '<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1 1-1h5a3 3 0 0 1 3 3 3 3 0 0 1 3-3h5a1 1 0 0 1 1 1V5a1 1 0 0 0-1-1h-5a3 3 0 0 0-3 3 3 3 0 0 0-3-3H4a1 1 0 0 0-1 1Z"></path>',
  calculator:
    '<rect width="16" height="20" x="4" y="2" rx="2"></rect><line x1="8" x2="16" y1="6" y2="6"></line><line x1="16" x2="16" y1="14" y2="18"></line><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"></path>',
  "circle-help": '<circle cx="12" cy="12" r="10"></circle><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"></path><path d="M12 17h.01"></path>',
  crosshair: '<circle cx="12" cy="12" r="10"></circle><line x1="22" x2="18" y1="12" y2="12"></line><line x1="6" x2="2" y1="12" y2="12"></line><line x1="12" x2="12" y1="6" y2="2"></line><line x1="12" x2="12" y1="22" y2="18"></line>',
  home: '<path d="m3 11 9-8 9 8"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"></path>',
  "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7"></path>',
  "map-pin": '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
  map: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" x2="9" y1="3" y2="18"></line><line x1="15" x2="15" y1="6" y2="21"></line>',
  menu: '<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>',
  "message-circle":
    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"></path>',
  plus: '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
  search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
};

const translations = {
  es: {
    currencyLabel: "Seleccione una moneda:",
    navSearch: "Buscar",
    navFeatured: "Destacadas",
    navPropertyType: "Tipo de propiedad",
    menuAllSale: "Ver todo en venta",
    typeHouses: "Casas",
    typeLand: "Terrenos",
    typePresales: "Pre-ventas",
    typeRentals: "Rentas",
    typeCondos: "Departamentos",
    typeCommercial: "Comercial",
    typeDevelopments: "Desarrollos",
    navPuerto: "Puerto Cancún",
    navZones: "Zonas",
    navDevelopments: "Desarrollos",
    navAbout: "Nosotros",
    menuAllZones: "Ver todas las zonas",
    navSell: "Vender",
    navLogin: "Iniciar sesión",
    heroKicker: "Propiedades de lujo en Cancún",
    heroTitle: "Compra o vende tu propiedad en Cancún",
    heroSubtitle:
      "Te ayudamos a validar precios, preparar tu propiedad, encontrar compradores reales y tomar mejores decisiones inmobiliarias en Cancún.",
    heroSellCta: "Quiero vender mi propiedad",
    heroBuyCta: "Quiero comprar en Cancún",
    heroValuationCta: "Validar precio con asesor",
    searchPlaceholder: "Ciudad, dirección, código postal",
    searchButton: "Buscar",
    contactToday: "Contáctanos Hoy",
    aiHomeKicker: "IA + criterio local",
    aiHomeTitle: "Usa la IA para informarte. Usa un asesor local para decidir bien.",
    aiHomeCopy:
      "Hoy muchos propietarios y compradores usan ChatGPT, Gemini o Claude para estimar precios, crear anuncios o comparar zonas. Eso puede ser útil, pero una operación real en Cancún depende de factores que la IA no siempre puede validar: documentación, demanda por zona, estado físico, negociación, perfil del comprador, tiempos de cierre y condiciones reales del mercado.",
    aiHomeCta: "Validar mi decisión con un asesor local",
    aiNoteTitle: "La IA orienta. Cancún confirma.",
    aiNoteCopy: "Convertimos la información de la IA en una estrategia inmobiliaria revisada con criterio local.",
    aiValidationKicker: "Validación de IA",
    aiValidationTitle: "ChatGPT ya te dio un precio o una estrategia?",
    aiValidationCopy:
      "Pega aquí el precio, descripción o recomendación que te dio la IA y te ayudamos a revisarlo desde el mercado inmobiliario real de Cancún.",
    operationType: "Tipo de operación",
    sellOperation: "Vender",
    buyOperation: "Comprar",
    investOperation: "Invertir",
    aiResponseField: "Respuesta que te dio la IA",
    validateWithAdvisor: "Validar con asesor local",
    sellerAudienceTitle: "Para propietarios que quieren vender mejor",
    sellerAudienceCopy:
      "Te ayudamos a definir un precio competitivo, preparar tu propiedad, crear una estrategia de difusión y negociar con compradores reales.",
    buyerAudienceTitle: "Para compradores que buscan elegir bien",
    buyerAudienceCopy:
      "Te ayudamos a encontrar propiedades según tu presupuesto, zona, estilo de vida y objetivo de inversión.",
    valuationRequest: "Solicitar valoración",
    searchProperty: "Buscar propiedad",
    aiResourcesTitle: "Compra o vende tu propiedad en Cancún",
    resourceProperties: "Ver propiedades disponibles",
    resourceSellHere: "Vender mi propiedad aquí",
    resourceBuyGuide: "Guía para comprar casa en Cancún",
    resourceValuation: "Valoración inmobiliaria",
    resourceFaq: "Preguntas frecuentes",
    resourceZones: "Zonas de Cancún",
    featuredZones: "Zonas destacadas",
    allZones: "Todas las zonas",
    zonePresales: "Preventas | Presales",
    welcomeTitle: "Bienvenido a Puerto Cancún Center!",
    welcomeCopy:
      "Con años de experiencia en el ramo inmobiliario de lujo en Cancún, Puerto Cancún y la Zona Hotelera, Puerto Cancún Center representa propiedades seleccionadas con inventario actualizado, asesoría profesional y seguimiento cercano para compradores, vendedores e inversionistas.",
    featuredProperties: "Propiedades destacadas",
    featuredCopy:
      "Oportunidades de alta plusvalía en desarrollos frente al mar, residencias en canales y condominios con amenidades premium.",
    seeMore: "Ver más",
    searchByType: "Busca por tipo",
    presaleTitle: "Pre-ventas",
    presaleCopy:
      "Conozca de la mano de nuestros expertos opciones en preventa, con información clara de entrega, plusvalía y esquema de pago.",
    allProperties: "Todas las propiedades",
    guidedKicker: "Búsqueda guiada",
    guidedTitle: "Encuentra tu propiedad ideal",
    guidedOperation: "Comprar o rentar",
    guidedBoth: "Ambas",
    guidedBuy: "Comprar",
    guidedRent: "Rentar",
    guidedBudget: "Presupuesto máximo USD",
    guidedBedrooms: "Recámaras",
    guidedGoal: "Objetivo",
    goalLive: "Vivir",
    goalInvest: "Invertir",
    goalVacation: "Vacacionar",
    goalIncome: "Generar renta",
    viewProperties: "Ver propiedades",
    alertKicker: "Alerta de propiedades",
    alertTitle: "Recibe opciones compatibles",
    alertCopy: "Registraremos tu zona, tipo y presupuesto para que un asesor pueda avisarte.",
    alertCreate: "Crear alerta",
    fieldName: "Nombre",
    fieldEmail: "Correo",
    clearFilters: "Limpiar filtros",
    sortBy: "Ordenar por:",
    sortHigh: "Precio alto a bajo",
    sortLow: "Precio bajo a alto",
    sortNew: "Más recientes",
    filterType: "Tipo",
    filterZone: "Zona",
    filterOperation: "Operacion",
    allTypes: "Todos",
    allZonesShort: "Todas",
    allOperations: "Todas",
    activeFilters: "Filtro activo",
    requestInfo: "Solicitar informacion",
    moreProperties: "Ver más propiedades",
    teamTitle: "Equipo de asesores de Puerto Cancún Center",
    teamKicker: "Asesoría local",
    teamCopy: "Un solo equipo para revisar inventario, preparar publicaciones, dar seguimiento a solicitudes y coordinar el contacto entre compradores y propietarios.",
    teamCta: "Contactar al equipo",
    teamRoleSales: "Asesor inmobiliario senior",
    teamRoleListings: "Coordinadora de propiedades",
    teamRoleInvestment: "Consultor de inversión",
    sellTitle: "Quieres vender una propiedad?",
    sellCopy:
      "Conoce el proceso, los beneficios y el acompañamiento que recibirás antes de registrarte para anunciar tu propiedad.",
    startSellerRequest: "Conocer cómo vender",
    footerCommunities: "Comunidades",
    footerBuy: "Compra de propiedad",
    footerSell: "Asesoría de venta",
    footerAbout: "Nosotros",
    saleProperty: "Venta de propiedad",
    aboutPuerto: "Sobre Puerto Cancún Center",
    location: "Ubicación",
    legalCopy:
      "Al navegar en español, los precios se muestran directamente en Pesos Mexicanos (MXN). La versión en inglés los presenta en Dólares de Estados Unidos (USD).",
    rights: "Todos los derechos reservados.",
    backToSite: "Volver al sitio",
    logout: "Cerrar sesión",
    sellerRequestTitle: "Enviar solicitud de venta",
    sellerGuideTitle: "Guia rapida para vender",
    sellerGuideCopy:
      "Completa los datos principales, agrega una imagen clara y deja un mensaje para que el equipo pueda pedirte mas informacion antes de publicar.",
    sellerHelpTitle: "Necesitas asesoria para llenar el formulario?",
    sellerHelpCopy: "Un asesor puede ayudarte a preparar la informacion, fotos y ubicacion antes de enviar la solicitud.",
    sellerHelpCta: "Solicitar guia por WhatsApp",
    sellerContactTitle: "Datos de contacto para esta solicitud",
    propertyTitle: "Título de la propiedad",
    propertyTitleEs: "Título de la propiedad en español",
    propertyTitleEn: "Título de la propiedad en inglés",
    publicationDestination: "Dónde se publica",
    publicationProperties: "Propiedades",
    publicationDevelopments: "Desarrollos",
    bilingualFieldHelp: "Este texto se muestra cuando el visitante navega en inglés.",
    propertyType: "Tipo de propiedad",
    zone: "Zona",
    stateField: "Estado",
    cityField: "Ciudad / municipio",
    neighborhoodField: "Colonia / desarrollo",
    price: "Precio",
    currency: "Moneda",
    address: "Dirección",
    mapPickerTitle: "Ubicación en mapa",
    mapPickerCopy: "Arrastra el pin o haz clic en el mapa para definir la ubicación exacta.",
    mapPickerHelp:
      "Arrastra el pin o haz clic en el mapa para ajustar la ubicación exacta. También puedes escribir las coordenadas manualmente.",
    useCurrentLocation: "Usar mi ubicacion",
    locateAddress: "Ubicar dirección",
    openGoogleMaps: "Abrir Google Maps",
    latitudeField: "Latitud",
    longitudeField: "Longitud",
    locationDetected: "Ubicación detectada. Revisa el mapa antes de guardar.",
    locationUnavailable: "No se pudo obtener tu ubicacion. Puedes escribir las coordenadas manualmente.",
    mapLoadUnavailable: "No se pudo cargar el mapa interactivo. Puedes usar el mapa visible o escribir las coordenadas manualmente.",
    mapSearching: "Buscando la dirección y actualizando el pin...",
    mapAddressFound: "Dirección localizada. Confirma o ajusta el pin antes de guardar.",
    mapAddressNotFound: "No encontramos esa dirección automáticamente. Ajusta el pin en el mapa o escribe las coordenadas.",
    mapAddressChanged: "Dirección modificada. Esperando para actualizar el mapa...",
    bedrooms: "Recámaras",
    bathrooms: "Baños",
    area: "M2 construcción",
    description: "Descripción",
    descriptionEs: "Descripción en español",
    descriptionEn: "Descripción en inglés",
    mapSearchLabel: "Buscar una ubicación en el mapa",
    mapSearchPlaceholder: "Dirección, ciudad, estado o país",
    mapSearchAction: "Buscar y mover el pin",
    sendRequest: "Enviar solicitud",
    myRequests: "Mis solicitudes",
    adminRequestsTitle: "Solicitudes de vendedores",
    manageListings: "Administrar publicaciones",
    operation: "Operación",
    sale: "Venta",
    rent: "Renta",
    priceUsd: "Precio USD",
    priceMxn: "Precio MXN",
    imageUpload: "Imagenes de la propiedad",
    imageHelp: "JPG, PNG o WEBP. Maximo 20 imagenes. Se optimizan antes de guardarse.",
    imageGalleryTitle: "Galería y orden de publicación",
    imageGalleryHelp: "La primera imagen será la portada. Arrastra las fotos o usa las flechas para cambiar su orden.",
    currentImage: "Imagen actual",
    selectedImage: "Imagenes seleccionadas",
    removeImage: "Quitar imagenes",
    imageRemoved: "Imagenes quitadas. Puedes seleccionar otras antes de guardar.",
    imageTooLarge: "La imagen no debe superar 1.5 MB.",
    tooManyImages: "Solo puedes cargar hasta 20 imagenes por publicacion.",
    invalidImageType: "La imagen debe ser JPG, JPEG, PNG o WEBP.",
    missingPrice: "Agrega al menos un precio: USD o MXN.",
    markFeatured: "Marcar como destacada",
    saveListing: "Guardar publicación",
    newListing: "Nueva publicación",
    authTitle: "Acceso Puerto Cancún Center",
    authIntro: "Regístrate y anuncia con nosotros. Podrás enviar tu propiedad, agregar fotografías y seguir el proceso con un asesor.",
    createAccount: "Crear cuenta",
    emailOrUser: "Correo o usuario",
    password: "Contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    passwordRule: "Usa por lo menos 12 caracteres y evita reutilizar otra contraseña.",
    updateExistingPassword: "¿Ya tenías cuenta? Actualizar contraseña",
    updatePasswordTitle: "Actualizar contraseña",
    updatePasswordIntro: "Si ya tenías una cuenta, confirma tu contraseña actual y crea una nueva de al menos 12 caracteres.",
    updatePasswordAction: "Actualizar contraseña",
    backToLogin: "Volver a iniciar sesión",
    passwordUpdated: "Contraseña actualizada. Ya puedes iniciar sesión.",
    passwordUpgradeRequired: "Tu contraseña anterior sigue siendo válida, pero ahora debes actualizarla a un mínimo de 12 caracteres.",
    adminPasswordManaged: "La contraseña de la cuenta administradora se cambia en ADMIN_PASSWORD dentro de Seenode y requiere un nuevo despliegue.",
    noAccount: "No tienes cuenta? Crear una cuenta para vender",
    googleAuthCopy: "Tambien puedes entrar con tu cuenta de Google.",
    googleLoginUnavailable: "Configura GOOGLE_CLIENT_ID para activar el acceso con Google.",
    googleLoginError: "No se pudo iniciar sesion con Google.",
    firstName: "Nombre",
    lastName: "Apellido",
    email: "Dirección de correo",
    phone: "Teléfono",
    preferredContact: "Método de contacto preferido",
    contactEmail: "Correo",
    contactPhone: "Celular",
    noResults: "No se encontraron propiedades con esos filtros.",
    resultText: "propiedades",
    viewDetails: "Ver detalle",
    contactAdvisor: "WhatsApp",
    contactWhatsApp: "Contactar por WhatsApp",
    new: "Nuevo",
    reduced: "Precio reducido",
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    noRequests: "No hay solicitudes registradas.",
    sellerPanelTitle: "Panel de vendedor",
    sellerPanelSubtitle: "Envía solicitudes de venta y revisa el estado de cada propiedad.",
    adminPanelTitle: "Panel administrativo",
    adminPanelSubtitle: "Revisa solicitudes, analiza actividad y administra las publicaciones del sitio.",
    adminWorkspaceTitle: "Centro de control",
    adminWorkspaceCopy: "Revisa solicitudes, publicaciones, precios, zonas y actividad desde un solo panel.",
    adminJumpRequests: "Solicitudes",
    adminJumpListings: "Publicaciones",
    adminJumpCatalogs: "Catálogos",
    adminJumpNew: "Nueva propiedad",
    adminJumpPrompts: "Herramientas IA",
    adminJumpLeads: "Asesorias",
    adminJumpDashboard: "Dashboard",
    adminJumpContacts: "CRM / Contactos",
    adminJumpValuations: "Valoraciones",
    adminJumpBuyers: "Compradores",
    adminJumpSellers: "Vendedores",
    adminJumpMatches: "Match",
    adminJumpMap: "Mapa inteligente",
    adminJumpMarketing: "Marketing",
    adminJumpPdf: "Fichas PDF",
    adminJumpAnalytics: "Analítica",
    adminJumpTasks: "Tareas",
    adminJumpFiles: "Archivos",
    adminJumpSettings: "Configuración",
    adminJumpRoles: "Roles",
    adminSidebarCollapse: "Contraer menu",
    adminSidebarExpand: "Expandir menu",
    adminAttentionTitle: "Que necesita atencion hoy",
    adminQuickActions: "Accesos rapidos",
    adminOpsSubtitle: "Operacion comercial, publicaciones, contactos y seguimiento desde un solo lugar.",
    leadCenterTitle: "Centro de Leads",
    leadCenterHint: "Bandeja amplia con prioridad, score, datos de contacto y siguiente accion sugerida.",
    valuationTitle: "Valoraciones inmobiliarias",
    valuationHint: "Solicitudes y valoraciones manuales para revisar precio esperado, rango sugerido y respuesta profesional.",
    noValuations: "No hay valoraciones pendientes.",
    createValuation: "Crear valoración manual",
    suggestedPrice: "Precio sugerido",
    lowRange: "Rango bajo",
    highRange: "Rango alto",
    confidenceLevel: "Confianza",
    saveValuation: "Guardar valoración",
    taskTitle: "Tareas / Seguimiento",
    taskHint: "Seguimientos comerciales para leads, contactos, propiedades y valoraciones.",
    noTasks: "No hay tareas registradas.",
    createTask: "Crear tarea",
    taskDue: "Fecha limite",
    taskCompleted: "Completada",
    taskInProgress: "En proceso",
    matchTitle: "Match comprador-propiedad",
    matchHint: "Cruza compradores con propiedades activas por zona, tipo y presupuesto.",
    noMatches: "No hay matches suficientes todavia.",
    matchScore: "compatibilidad",
    prepareMessage: "Preparar mensaje",
    smartMapTitle: "Mapa inteligente",
    smartMapHint: "Vista operativa por zonas, inventario y leads registrados.",
    analyticsTitle: "Analítica comercial",
    analyticsHint: "Eventos, busquedas, zonas solicitadas y propiedades con mayor actividad.",
    marketingTitle: "Campañas / Marketing",
    marketingHint: "Segmentos listos para contactar compradores, vendedores y propietarios en valoración.",
    pdfTitle: "Fichas PDF",
    pdfHint: "Preparación de fichas comerciales para propiedades y valoraciones.",
    filesTitle: "Archivos",
    filesHint: "Documentos, imagenes y respuestas adjuntas quedaran asociados a solicitudes y propiedades.",
    settingsTitle: "Configuración",
    settingsHint: "Parametros de sitio, WhatsApp, moneda, SEO y avisos.",
    rolesTitle: "Roles / usuarios internos",
    rolesHint: "Base para super admin, administrador, asesor y editor.",
    buyerPanelTitle: "Compradores",
    sellerOpsTitle: "Vendedores / Propietarios",
    tableLead: "Lead",
    tableContact: "Contacto",
    tableSource: "Fuente",
    nextAction: "Siguiente accion",
    propertyQualityMissing: "Faltan",
    qualityPremium: "Premium",
    qualityReady: "Lista",
    qualityNeedsWork: "Mejorable",
    qualityIncomplete: "Incompleta",
    exportCsv: "Exportar CSV",
    adminPromptLibraryTitle: "Herramientas IA internas para publicaciones y asesorías",
    adminPromptLibraryCopy:
      "Usa estos textos como apoyo interno para valorar, redactar y revisar propiedades antes de publicar. No son una sección pública.",
    adminPromptsEmpty: "No hay herramientas internas configuradas.",
    adminLeadsTitle: "Solicitudes de asesoria",
    adminLeadSummary: "solicitudes de asesoria",
    adminLeadsHint: "Responde por WhatsApp o correo y marca cada solicitud como atendida.",
    adminNoLeads: "No hay solicitudes de asesoria.",
    leadFilterAll: "Todas",
    leadFilterSeller: "Vender",
    leadFilterValuation: "Valoracion",
    leadFilterAi: "Validar IA",
    leadFilterBuyer: "Compradores",
    leadFilterProperty: "Propiedad",
    leadFilterWhatsApp: "WhatsApp / ayuda",
    crmTitle: "CRM / Contactos",
    crmSummary: "contactos registrados",
    crmHint: "Contactos generados desde formularios, vendedor, comprador y WhatsApp.",
    noContacts: "No hay contactos registrados.",
    contactTypeBuyer: "Comprador",
    contactTypeSeller: "Vendedor",
    contactTypeUnclassified: "Sin clasificar",
    leadScoreCold: "Frio",
    leadScoreWarm: "Tibio",
    leadScoreHot: "Caliente",
    leadScorePremium: "Premium",
    listingStatus: "Estado de publicacion",
    publicListing: "Visible en web publica",
    statusDraft: "Borrador",
    statusPending: "Pendiente",
    statusActive: "Activa",
    statusDisabled: "Deshabilitada",
    statusSold: "Vendida",
    statusRented: "Rentada",
    statusArchived: "Archivada",
    statusRejected: "Rechazada",
    qualityScore: "Calidad",
    markActive: "Activar",
    markDisabled: "Deshabilitar",
    markSold: "Vendida",
    duplicateListing: "Duplicar",
    adminScrollableHint: "Desplaza dentro de esta lista para ver más.",
    adminListingsHint: "Edita, revisa y elimina publicaciones existentes.",
    adminInsightPending: "Pendientes por revisar",
    adminInsightLeads: "Asesorias nuevas",
    adminInsightFeatured: "Propiedades destacadas",
    adminInsightAverage: "Precio promedio",
    adminInsightSearches: "Búsquedas registradas",
    adminRequestSummary: "solicitudes totales",
    adminListingSummary: "publicaciones activas",
    adminNoPending: "No hay solicitudes pendientes.",
    adminTopZones: "Zonas con inventario",
    adminOperations: "Operación",
    adminInventory: "Inventario",
    adminSellerContact: "Contacto del vendedor",
    adminPropertyFacts: "Datos de la propiedad",
    adminRequestMeta: "Solicitud",
    locationCatalogTitle: "Catálogos de ubicación",
    locationCatalogCopy: "Da de alta estados, ciudades, zonas y colonias para registrar direcciones más precisas en cada inmueble.",
    catalogType: "Tipo",
    catalogParent: "Pertenece a",
    catalogName: "Nombre",
    catalogSortOrder: "Orden",
    catalogActive: "Activo",
    catalogState: "Estado",
    catalogCity: "Ciudad / municipio",
    catalogZone: "Zona",
    catalogNeighborhood: "Colonia / desarrollo",
    saveCatalog: "Guardar catálogo",
    newCatalog: "Nuevo catálogo",
    editCatalog: "Editar",
    disableCatalog: "Desactivar",
    enableCatalog: "Activar",
    catalogSaved: "Catálogo guardado.",
    catalogDeleted: "Catálogo eliminado.",
    catalogEmpty: "No hay opciones registradas.",
    noParent: "Sin superior",
    optionalLocation: "Sin seleccionar",
    showMore: "Mostrar más",
    sellerRole: "Cuenta de vendedor",
    adminRole: "Cuenta administradora",
    accountPrompt: "Completa estos datos para crear tu cuenta de vendedor.",
    requestSent: "Solicitud enviada. El administrador podrá revisarla en su panel.",
    leadSent: "Solicitud enviada. Un asesor puede revisar tu información.",
    loginError: "La contraseña no coincide con esa cuenta.",
    loginUnavailable: "La base de datos no está disponible en este momento. Tus cuentas y publicaciones no fueron eliminadas; vuelve a intentar después del redeploy.",
    accountExists: "Ya existe una cuenta con ese correo.",
    accountCreated: "Cuenta creada. Bienvenido al panel de vendedor.",
    listingSaved: "Publicación guardada.",
    listingDeleted: "Publicación enviada al archivo. Puedes restaurarla marcándola como activa.",
    requestApproved: "Solicitud aprobada y publicada.",
    requestRejected: "Solicitud rechazada.",
    leadUpdated: "Solicitud de asesoria actualizada.",
    leadDeleted: "Solicitud de asesoria eliminada.",
    confirmDeleteLead: "Borrar esta solicitud de asesoria?",
    leadStatusNew: "Nueva",
    leadStatusContacted: "Atendida",
    leadStatusClosed: "Cerrada",
    leadTypeGeneral: "General",
    leadTypeAiValidation: "Validacion de IA",
    leadTypeValuation: "Valoracion",
    leadTypeBuyer: "Compra",
    leadTypeSeller: "Venta",
    respondWhatsApp: "Responder WhatsApp",
    respondEmail: "Responder correo",
    markContacted: "Marcar atendida",
    markClosed: "Cerrar",
    adminRespond: "Responder",
    responsePrompt: "Escribe la respuesta interna/para cliente:",
    noEmail: "Sin correo",
    whatsAppPending: "Abrir WhatsApp",
    statProperties: "Publicaciones",
    statRequests: "Solicitudes pendientes",
    statLeads: "Asesorias nuevas",
    statSearches: "Busquedas",
    statUsers: "Cuentas vendedor",
    statVisits: "Visitas demo",
    priority: "Prioridad",
    edit: "Editar",
    delete: "Borrar",
    archiveListing: "Archivar",
    approve: "Aprobar",
    reject: "Rechazar",
    requestBy: "Solicitud de",
    preferred: "Prefiere",
    listingsEmpty: "No hay publicaciones.",
    perMonth: " / mes",
    bedShort: "recámaras",
    bathShort: "baños",
    sqmBuild: "m2 con",
    sqmLot: "m2 lote",
    mls: "MLS#",
    sellerPanelShort: "Panel vendedor",
    adminPanelShort: "Panel admin",
    confirmDelete: "Archivar esta publicación? Dejará de ser pública, pero podrás restaurarla.",
    apiError: "No se pudo conectar con la base de datos. Revisa DATABASE_URL y el servidor.",
    partialLoadError: "Algunos datos tardaron en responder. El portal continúa disponible y puedes reintentar.",
  },
  en: {
    currencyLabel: "Select currency:",
    navSearch: "Search",
    navFeatured: "Featured",
    navPropertyType: "Property type",
    menuAllSale: "View all for sale",
    typeHouses: "Homes",
    typeLand: "Land",
    typePresales: "Presales",
    typeRentals: "Rentals",
    typeCondos: "Condos",
    typeCommercial: "Commercial",
    typeDevelopments: "Developments",
    navPuerto: "Puerto Cancun",
    navZones: "Areas",
    navDevelopments: "Developments",
    navAbout: "About us",
    menuAllZones: "View all areas",
    navSell: "Sell",
    navLogin: "Log in",
    heroKicker: "Luxury properties in Cancun",
    heroTitle: "Buy or sell your Cancun property",
    heroSubtitle:
      "We help you validate pricing, prepare your property, find real buyers, and make better real estate decisions in Cancun.",
    heroSellCta: "I want to sell my property",
    heroBuyCta: "I want to buy in Cancun",
    heroValuationCta: "Validate price with an advisor",
    searchPlaceholder: "City, address, zip code",
    searchButton: "Search",
    contactToday: "Contact Us Today",
    aiHomeKicker: "AI + local judgment",
    aiHomeTitle: "Use AI to get informed. Use a local advisor to decide well.",
    aiHomeCopy:
      "Many owners and buyers now use ChatGPT, Gemini, or Claude to estimate prices, create listings, or compare areas. That can help, but a real Cancun transaction depends on factors AI cannot always validate: documents, area demand, physical condition, negotiation, buyer profile, closing timing, and real market conditions.",
    aiHomeCta: "Validate my decision with a local advisor",
    aiNoteTitle: "AI orients. Cancun confirms.",
    aiNoteCopy: "We turn AI information into a real estate strategy reviewed with local judgment.",
    aiValidationKicker: "AI validation",
    aiValidationTitle: "Did ChatGPT already give you a price or strategy?",
    aiValidationCopy:
      "Paste the price, description, or recommendation AI gave you and we can review it from the real Cancun property market.",
    operationType: "Operation type",
    sellOperation: "Sell",
    buyOperation: "Buy",
    investOperation: "Invest",
    aiResponseField: "AI response",
    validateWithAdvisor: "Validate with local advisor",
    sellerAudienceTitle: "For owners who want to sell better",
    sellerAudienceCopy:
      "We help define a competitive price, prepare your property, create a marketing strategy, and negotiate with real buyers.",
    buyerAudienceTitle: "For buyers who want to choose well",
    buyerAudienceCopy: "We help find properties by budget, area, lifestyle, and investment objective.",
    valuationRequest: "Request valuation",
    searchProperty: "Search property",
    aiResourcesTitle: "Buy or sell your property in Cancun",
    resourceProperties: "View available properties",
    resourceSellHere: "Sell my property here",
    resourceBuyGuide: "Guide to buying a home in Cancun",
    resourceValuation: "Property valuation",
    resourceFaq: "Frequently asked questions",
    resourceZones: "Cancun areas",
    featuredZones: "Featured areas",
    allZones: "All areas",
    zonePresales: "Presales",
    welcomeTitle: "Welcome to Puerto Cancun Center!",
    welcomeCopy:
      "With years of experience in luxury real estate across Cancun, Puerto Cancun, and the Hotel Zone, Puerto Cancun Center represents selected properties with updated inventory, professional guidance, and close follow-up for buyers, sellers, and investors.",
    featuredProperties: "Featured properties",
    featuredCopy:
      "High-value opportunities in oceanfront developments, canal residences, and condos with premium amenities.",
    seeMore: "See more",
    searchByType: "Search by type",
    presaleTitle: "Presales",
    presaleCopy:
      "Review presale opportunities with expert guidance, clear delivery information, appreciation potential, and payment structures.",
    allProperties: "All properties",
    guidedKicker: "Guided search",
    guidedTitle: "Find your ideal property",
    guidedOperation: "Buy or rent",
    guidedBoth: "Both",
    guidedBuy: "Buy",
    guidedRent: "Rent",
    guidedBudget: "Maximum budget USD",
    guidedBedrooms: "Bedrooms",
    guidedGoal: "Goal",
    goalLive: "Primary residence",
    goalInvest: "Investment",
    goalVacation: "Vacation home",
    goalIncome: "Rental income",
    viewProperties: "View properties",
    alertKicker: "Property alert",
    alertTitle: "Receive compatible options",
    alertCopy: "We will save your preferred area, type and budget so an advisor can contact you.",
    alertCreate: "Create alert",
    fieldName: "Name",
    fieldEmail: "Email",
    clearFilters: "Clear filters",
    sortBy: "Sort by:",
    sortHigh: "Price high to low",
    sortLow: "Price low to high",
    sortNew: "Newest",
    filterType: "Type",
    filterZone: "Area",
    filterOperation: "Operation",
    allTypes: "All",
    allZonesShort: "All",
    allOperations: "All",
    activeFilters: "Active filter",
    requestInfo: "Request information",
    moreProperties: "See more properties",
    teamTitle: "Meet the Puerto Cancun Center team",
    teamKicker: "Local advisory",
    teamCopy: "One team to review inventory, prepare listings, follow up on requests, and coordinate contact between buyers and property owners.",
    teamCta: "Contact the team",
    teamRoleSales: "Senior real estate advisor",
    teamRoleListings: "Property coordinator",
    teamRoleInvestment: "Investment consultant",
    sellTitle: "Want to sell a property?",
    sellCopy: "Learn about the process, benefits and support you will receive before registering to list your property.",
    startSellerRequest: "Learn how to sell",
    footerCommunities: "Communities",
    footerBuy: "Property purchase",
    footerSell: "Seller advisory",
    footerAbout: "About",
    saleProperty: "Property sale",
    aboutPuerto: "About Puerto Cancun Center",
    location: "Location",
    legalCopy:
      "When browsing in English, property prices are shown directly in United States Dollars (USD). The Spanish version presents them in Mexican Pesos (MXN).",
    rights: "All rights reserved.",
    backToSite: "Back to site",
    logout: "Log out",
    sellerRequestTitle: "Submit sale request",
    sellerGuideTitle: "Quick selling guide",
    sellerGuideCopy:
      "Complete the key details, add a clear image, and leave a message so the team can request more information before publishing.",
    sellerHelpTitle: "Need help filling out the form?",
    sellerHelpCopy: "An advisor can help prepare the information, photos, and location before you submit the request.",
    sellerHelpCta: "Request WhatsApp guidance",
    sellerContactTitle: "Contact details for this request",
    propertyTitle: "Property title",
    propertyTitleEs: "Property title in Spanish",
    propertyTitleEn: "Property title in English",
    publicationDestination: "Publish in",
    publicationProperties: "Properties",
    publicationDevelopments: "Developments",
    bilingualFieldHelp: "This copy is shown when visitors browse in English.",
    propertyType: "Property type",
    zone: "Area",
    stateField: "State",
    cityField: "City / municipality",
    neighborhoodField: "Neighborhood / development",
    price: "Price",
    currency: "Currency",
    address: "Address",
    mapPickerTitle: "Map location",
    mapPickerCopy: "Drag the pin or click the map to set the exact property location.",
    mapPickerHelp: "Drag the pin or click the map to set the exact location. You can also enter the coordinates manually.",
    useCurrentLocation: "Use my location",
    locateAddress: "Locate address",
    openGoogleMaps: "Open Google Maps",
    latitudeField: "Latitude",
    longitudeField: "Longitude",
    locationDetected: "Location detected. Review the map before saving.",
    locationUnavailable: "Could not get your location. You can enter coordinates manually.",
    mapLoadUnavailable: "The interactive map could not be loaded. Use the visible map or enter the coordinates manually.",
    mapSearching: "Finding the address and updating the pin...",
    mapAddressFound: "Address found. Confirm or adjust the pin before saving.",
    mapAddressNotFound: "We could not find that address automatically. Adjust the pin or enter the coordinates.",
    mapAddressChanged: "Address changed. Waiting to update the map...",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    area: "Built m2",
    description: "Description",
    descriptionEs: "Description in Spanish",
    descriptionEn: "Description in English",
    mapSearchLabel: "Search for a location on the map",
    mapSearchPlaceholder: "Address, city, state or country",
    mapSearchAction: "Search and move pin",
    sendRequest: "Submit request",
    myRequests: "My requests",
    adminRequestsTitle: "Seller requests",
    manageListings: "Manage listings",
    operation: "Operation",
    sale: "Sale",
    rent: "Rent",
    priceUsd: "USD price",
    priceMxn: "MXN price",
    imageUpload: "Property images",
    imageHelp: "JPG, PNG or WEBP. Up to 20 images. They are optimized before saving.",
    imageGalleryTitle: "Gallery and publication order",
    imageGalleryHelp: "The first image will be the cover. Drag photos or use the arrows to change their order.",
    currentImage: "Current image",
    selectedImage: "Selected images",
    removeImage: "Remove images",
    imageRemoved: "Images removed. You can select others before saving.",
    imageTooLarge: "Image must not exceed 1.5 MB.",
    tooManyImages: "You can upload up to 20 images per listing.",
    invalidImageType: "Image must be JPG, JPEG, PNG, or WEBP.",
    missingPrice: "Add at least one price: USD or MXN.",
    markFeatured: "Mark as featured",
    saveListing: "Save listing",
    newListing: "New listing",
    authTitle: "Puerto Cancun Center access",
    authIntro: "Register and list with us. You can submit your property, add photos, and follow the process with an advisor.",
    createAccount: "Create account",
    emailOrUser: "Email or user",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    currentPassword: "Current password",
    newPassword: "New password",
    passwordRule: "Use at least 12 characters and avoid reusing another password.",
    updateExistingPassword: "Already have an account? Update password",
    updatePasswordTitle: "Update password",
    updatePasswordIntro: "If you already had an account, confirm your current password and create a new one with at least 12 characters.",
    updatePasswordAction: "Update password",
    backToLogin: "Back to sign in",
    passwordUpdated: "Password updated. You can now sign in.",
    passwordUpgradeRequired: "Your previous password is still valid, but it must now be updated to at least 12 characters.",
    adminPasswordManaged: "The administrator password is changed through ADMIN_PASSWORD in Seenode and requires a new deployment.",
    noAccount: "No account? Create a seller account",
    googleAuthCopy: "You can also continue with your Google account.",
    googleLoginUnavailable: "Set GOOGLE_CLIENT_ID to enable Google sign-in.",
    googleLoginError: "Could not sign in with Google.",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone",
    preferredContact: "Preferred contact method",
    contactEmail: "Email",
    contactPhone: "Phone",
    noResults: "No properties matched those filters.",
    resultText: "properties",
    viewDetails: "View details",
    contactAdvisor: "WhatsApp",
    contactWhatsApp: "Contact on WhatsApp",
    new: "New",
    reduced: "Reduced price",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    noRequests: "No requests registered.",
    sellerPanelTitle: "Seller panel",
    sellerPanelSubtitle: "Submit sale requests and review each property's status.",
    adminPanelTitle: "Admin panel",
    adminPanelSubtitle: "Review requests, monitor activity, and manage site listings.",
    adminWorkspaceTitle: "Control center",
    adminWorkspaceCopy: "Review requests, listings, prices, areas, and activity from one panel.",
    adminJumpRequests: "Requests",
    adminJumpListings: "Listings",
    adminJumpCatalogs: "Catalogs",
    adminJumpNew: "New property",
    adminJumpPrompts: "AI tools",
    adminJumpLeads: "Advisory",
    adminJumpDashboard: "Dashboard",
    adminJumpContacts: "CRM / Contacts",
    adminJumpValuations: "Valuations",
    adminJumpBuyers: "Buyers",
    adminJumpSellers: "Sellers",
    adminJumpMatches: "Match",
    adminJumpMap: "Smart map",
    adminJumpMarketing: "Marketing",
    adminJumpPdf: "PDF sheets",
    adminJumpAnalytics: "Analytics",
    adminJumpTasks: "Tasks",
    adminJumpFiles: "Files",
    adminJumpSettings: "Settings",
    adminJumpRoles: "Roles",
    adminSidebarCollapse: "Collapse menu",
    adminSidebarExpand: "Expand menu",
    adminAttentionTitle: "What needs attention today",
    adminQuickActions: "Quick actions",
    adminOpsSubtitle: "Sales operation, listings, contacts and follow-up in one place.",
    leadCenterTitle: "Lead Center",
    leadCenterHint: "Wide inbox with priority, score, contact data and suggested next action.",
    valuationTitle: "Property valuations",
    valuationHint: "Requests and manual valuations to review expected price, suggested range and professional response.",
    noValuations: "No pending valuations.",
    createValuation: "Create manual valuation",
    suggestedPrice: "Suggested price",
    lowRange: "Low range",
    highRange: "High range",
    confidenceLevel: "Confidence",
    saveValuation: "Save valuation",
    taskTitle: "Tasks / Follow-up",
    taskHint: "Commercial follow-ups for leads, contacts, properties and valuations.",
    noTasks: "No tasks yet.",
    createTask: "Create task",
    taskDue: "Due date",
    taskCompleted: "Completed",
    taskInProgress: "In progress",
    matchTitle: "Buyer-property match",
    matchHint: "Crosses buyers with active listings by zone, type and budget.",
    noMatches: "No strong matches yet.",
    matchScore: "compatibility",
    prepareMessage: "Prepare message",
    smartMapTitle: "Smart map",
    smartMapHint: "Operational view by zones, inventory and registered leads.",
    analyticsTitle: "Commercial analytics",
    analyticsHint: "Events, searches, requested zones and properties with more activity.",
    marketingTitle: "Campaigns / Marketing",
    marketingHint: "Segments ready to contact buyers, sellers and owners in valuation.",
    pdfTitle: "PDF sheets",
    pdfHint: "Commercial sheet preparation for listings and valuations.",
    filesTitle: "Files",
    filesHint: "Documents, images and attached responses stay linked to requests and listings.",
    settingsTitle: "Settings",
    settingsHint: "Site, WhatsApp, currency, SEO and notice settings.",
    rolesTitle: "Roles / internal users",
    rolesHint: "Foundation for super admin, administrator, advisor and editor.",
    buyerPanelTitle: "Buyers",
    sellerOpsTitle: "Sellers / Owners",
    tableLead: "Lead",
    tableContact: "Contact",
    tableSource: "Source",
    nextAction: "Next action",
    propertyQualityMissing: "Missing",
    qualityPremium: "Premium",
    qualityReady: "Ready",
    qualityNeedsWork: "Needs work",
    qualityIncomplete: "Incomplete",
    exportCsv: "Export CSV",
    adminPromptLibraryTitle: "Internal AI tools for listings and advisory",
    adminPromptLibraryCopy:
      "Use these texts as internal support to value, write, and review properties before publishing. This is not a public section.",
    adminPromptsEmpty: "No internal tools configured.",
    adminLeadsTitle: "Advisor requests",
    adminLeadSummary: "advisor requests",
    adminLeadsHint: "Reply by WhatsApp or email and mark each request as handled.",
    adminNoLeads: "No advisor requests.",
    leadFilterAll: "All",
    leadFilterSeller: "Seller",
    leadFilterValuation: "Valuation",
    leadFilterAi: "Validate AI",
    leadFilterBuyer: "Buyers",
    leadFilterProperty: "Property",
    leadFilterWhatsApp: "WhatsApp / help",
    crmTitle: "CRM / Contacts",
    crmSummary: "registered contacts",
    crmHint: "Contacts generated from forms, sellers, buyers, and WhatsApp.",
    noContacts: "No contacts registered.",
    contactTypeBuyer: "Buyer",
    contactTypeSeller: "Seller",
    contactTypeUnclassified: "Unclassified",
    leadScoreCold: "Cold",
    leadScoreWarm: "Warm",
    leadScoreHot: "Hot",
    leadScorePremium: "Premium",
    listingStatus: "Listing status",
    publicListing: "Visible on public site",
    statusDraft: "Draft",
    statusPending: "Pending",
    statusActive: "Active",
    statusDisabled: "Disabled",
    statusSold: "Sold",
    statusRented: "Rented",
    statusArchived: "Archived",
    statusRejected: "Rejected",
    qualityScore: "Quality",
    markActive: "Activate",
    markDisabled: "Disable",
    markSold: "Sold",
    duplicateListing: "Duplicate",
    adminScrollableHint: "Scroll inside this list to see more.",
    adminListingsHint: "Edit, review, and delete existing listings.",
    adminInsightPending: "Pending review",
    adminInsightLeads: "New advisor requests",
    adminInsightFeatured: "Featured properties",
    adminInsightAverage: "Average price",
    adminInsightSearches: "Recorded searches",
    adminRequestSummary: "total requests",
    adminListingSummary: "active listings",
    adminNoPending: "No pending requests.",
    adminTopZones: "Inventory areas",
    adminOperations: "Operation",
    adminInventory: "Inventory",
    adminSellerContact: "Seller contact",
    adminPropertyFacts: "Property facts",
    adminRequestMeta: "Request",
    locationCatalogTitle: "Location catalogs",
    locationCatalogCopy: "Add states, cities, areas, and neighborhoods to register more precise property addresses.",
    catalogType: "Type",
    catalogParent: "Belongs to",
    catalogName: "Name",
    catalogSortOrder: "Order",
    catalogActive: "Active",
    catalogState: "State",
    catalogCity: "City / municipality",
    catalogZone: "Area",
    catalogNeighborhood: "Neighborhood / development",
    saveCatalog: "Save catalog",
    newCatalog: "New catalog",
    editCatalog: "Edit",
    disableCatalog: "Disable",
    enableCatalog: "Enable",
    catalogSaved: "Catalog saved.",
    catalogDeleted: "Catalog deleted.",
    catalogEmpty: "No options registered.",
    noParent: "No parent",
    optionalLocation: "Not selected",
    showMore: "Show more",
    sellerRole: "Seller account",
    adminRole: "Admin account",
    accountPrompt: "Complete these details to create your seller account.",
    requestSent: "Request submitted. The administrator can review it in the panel.",
    leadSent: "Request submitted. An advisor can review your information.",
    loginError: "The password does not match that account.",
    loginUnavailable: "The database is currently unavailable. Your accounts and listings were not deleted; try again after the redeploy.",
    accountExists: "An account already exists with that email.",
    accountCreated: "Account created. Welcome to the seller panel.",
    listingSaved: "Listing saved.",
    listingDeleted: "Listing archived. You can restore it by marking it active.",
    requestApproved: "Request approved and published.",
    requestRejected: "Request rejected.",
    leadUpdated: "Advisor request updated.",
    leadDeleted: "Advisor request deleted.",
    confirmDeleteLead: "Delete this advisor request?",
    leadStatusNew: "New",
    leadStatusContacted: "Handled",
    leadStatusClosed: "Closed",
    leadTypeGeneral: "General",
    leadTypeAiValidation: "AI validation",
    leadTypeValuation: "Valuation",
    leadTypeBuyer: "Buyer",
    leadTypeSeller: "Seller",
    respondWhatsApp: "Reply WhatsApp",
    respondEmail: "Reply email",
    markContacted: "Mark handled",
    markClosed: "Close",
    adminRespond: "Reply",
    responsePrompt: "Write the internal/client response:",
    noEmail: "No email",
    whatsAppPending: "Open WhatsApp",
    statProperties: "Listings",
    statRequests: "Pending requests",
    statLeads: "New advisory",
    statSearches: "Searches",
    statUsers: "Seller accounts",
    statVisits: "Demo visits",
    priority: "Priority",
    edit: "Edit",
    delete: "Delete",
    archiveListing: "Archive",
    approve: "Approve",
    reject: "Reject",
    requestBy: "Request from",
    preferred: "Prefers",
    listingsEmpty: "No listings.",
    perMonth: " / month",
    bedShort: "beds",
    bathShort: "baths",
    sqmBuild: "m2 built",
    sqmLot: "m2 lot",
    mls: "MLS#",
    sellerPanelShort: "Seller panel",
    adminPanelShort: "Admin panel",
    confirmDelete: "Archive this listing? It will no longer be public, but you can restore it.",
    apiError: "Could not connect to the database. Check DATABASE_URL and the server.",
    partialLoadError: "Some data took too long to respond. The portal remains available and you can retry.",
  },
};

const storedLanguage = localStorage.getItem(keys.lang);
const urlLanguage = window.location.pathname === "/en" || window.location.pathname.startsWith("/en/") ? "en" : "";
const initialLanguage = urlLanguage || storedLanguage || document.body.dataset.lang || "es";

const state = {
  lang: initialLanguage,
  currency: initialLanguage === "en" ? "USD" : "MXN",
  session: null,
  properties: [],
  requests: [],
  leads: [],
  contacts: [],
  valuations: [],
  tasks: [],
  matches: [],
  buyers: [],
  serviceRequests: [],
  notifications: [],
  internalUsers: [],
  files: [],
  documents: [],
  campaigns: [],
  instagramStatus: { connected: false, oauthUrl: "", profileUrl: "https://www.instagram.com/", aiConfigured: false },
  settings: {},
  platform: { version: "", release: "", shortRelease: "", environment: "", databaseReady: false },
  systemHealth: { ok: false, databaseReady: false },
  activity: [],
  messages: [],
  whatsapp: {
    overview: null,
    chats: [],
    leads: [],
    messages: [],
    activeTab: "connection",
    selectedJid: "",
  },
  analytics: { eventsByType: [], propertyEvents: [], searchZones: [], leadSources: [] },
  adminPrompts: [],
  locationOptions: [],
  adminSection: "dashboard",
  leadFilter: "all",
  adminLeadStatusFilter: "all",
  adminLeadPriorityFilter: "all",
  adminRequestFilter: "all",
  taskFilter: "all",
  adminListingFilters: { search: "", type: "", zone: "", operation: "", status: "", quality: "", missingCover: false },
  catalogFilters: { search: "", type: "" },
  sidebarCollapsed: false,
  config: { googleClientId: "", googleMapsApiKey: "", exchangeRate: 18.5 },
  googleReady: false,
  stats: {
    properties: 0,
    activeProperties: 0,
    disabledProperties: 0,
    featuredProperties: 0,
    pendingRequests: 0,
    newLeads: 0,
    contacts: 0,
    users: 0,
    visits: 0,
    searches: 0,
  },
  filters: {
    text: "",
    type: "",
    zone: "",
    operation: "",
    featured: false,
  },
  detailPropertyId: null,
  favorites: safeParseStoredIds(keys.favorites),
  compare: safeParseStoredIds(keys.compare).slice(0, 3),
  guided: { budget: 0, beds: 0 },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const formField = (form, name) => form?.elements?.namedItem(name) || form?.querySelector?.(`[name="${name}"]`) || null;
const googleMapInstances = new WeakMap();
let lastScrollY = 0;
let adminListingSearchTimer = 0;
let listingDraftTimer = 0;
let sellerDraftTimer = 0;
let whatsappPollTimer = 0;
let whatsappSearchTimer = 0;
let draftDbPromise = null;
let draftWriteQueue = Promise.resolve();
const mapGeocodeTimers = new WeakMap();
const mapGeocodeControllers = new WeakMap();
const DEFAULT_MAP_CENTER = { lat: 21.1619, lng: -86.8515 };

function safeParseStoredIds(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function openDraftDatabase() {
  if (!("indexedDB" in window)) return Promise.resolve(null);
  if (draftDbPromise) return draftDbPromise;
  draftDbPromise = new Promise((resolve) => {
    const request = indexedDB.open(DRAFT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("drafts")) request.result.createObjectStore("drafts", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return draftDbPromise;
}

async function writePersistentDraft(key, value) {
  const database = await openDraftDatabase();
  if (!database) return;
  await new Promise((resolve) => {
    const transaction = database.transaction("drafts", "readwrite");
    transaction.objectStore("drafts").put({ key, value });
    transaction.oncomplete = resolve;
    transaction.onerror = resolve;
    transaction.onabort = resolve;
  });
}

async function readPersistentDraft(key) {
  const database = await openDraftDatabase();
  if (!database) return null;
  return new Promise((resolve) => {
    const request = database.transaction("drafts", "readonly").objectStore("drafts").get(key);
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => resolve(null);
  });
}

async function deletePersistentDraft(key) {
  const database = await openDraftDatabase();
  if (!database) return;
  await new Promise((resolve) => {
    const transaction = database.transaction("drafts", "readwrite");
    transaction.objectStore("drafts").delete(key);
    transaction.oncomplete = resolve;
    transaction.onerror = resolve;
    transaction.onabort = resolve;
  });
}

function queueDraftOperation(operation) {
  draftWriteQueue = draftWriteQueue.then(operation, operation);
  return draftWriteQueue;
}

function t(key) {
  return translations[state.lang][key] || translations.es[key] || key;
}

function storedImages(item) {
  const images = Array.isArray(item?.images) ? item.images.filter(Boolean) : [];
  if (item?.image && !images.includes(item.image)) images.unshift(item.image);
  return images;
}

function safeParseImages(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function primaryImage(item) {
  return storedImages(item)[0] || fallbackImage;
}

function optimizedMediaUrl(value, width) {
  const image = String(value || "");
  if (!image.startsWith("/media/properties/")) return image;
  return `${image}${image.includes("?") ? "&" : "?"}w=${width}`;
}

function displayLocation(item) {
  const parts = [item.neighborhood, item.zone, item.city, item.state].filter(Boolean);
  return parts.filter((part, index) => parts.indexOf(part) === index).join(", ");
}

function parentFieldForLocation(type) {
  if (type === "city") return "state";
  if (type === "zone") return "city";
  if (type === "neighborhood") return "zone";
  return "";
}

function locationOptionsByType(type, form = null) {
  const parentField = parentFieldForLocation(type);
  let options = state.locationOptions.filter((option) => option.type === type);
  if (form && parentField && formField(form, parentField)?.value) {
    const parentValue = formField(form, parentField).value;
    const parentIds = state.locationOptions
      .filter((option) => option.type === parentField && option.name === parentValue)
      .map((option) => option.id);
    if (parentIds.length) {
      options = options.filter((option) => parentIds.includes(option.parentId));
    }
  }
  return options.sort((a, b) => a.name.localeCompare(b.name));
}

function ensureSelectOption(select, value) {
  if (!select || !value) return;
  if (!Array.from(select.options).some((option) => option.value === value)) {
    select.append(new Option(value, value));
  }
}

function fillLocationSelect(select, selectedValue = select?.value || "", optionsConfig = {}) {
  if (!select) return;
  const type = select.dataset.locationSelect;
  const required = select.required;
  const current = selectedValue || select.value;
  const preserveUnknown = optionsConfig.preserveUnknown !== false;
  const options = locationOptionsByType(type, select.form);
  select.innerHTML = required ? "" : `<option value="">${escapeHtml(t("optionalLocation"))}</option>`;
  options.forEach((option) => {
    select.append(new Option(option.name, option.name));
  });
  if (preserveUnknown) ensureSelectOption(select, current);
  if (current) select.value = current;
  if (!select.value && required && options[0]) select.value = options[0].name;
}

function refreshLocationSelects() {
  const forms = [...new Set($$("[data-location-select]").map((select) => select.form).filter(Boolean))];
  forms.forEach((form) => {
    LOCATION_FIELD_ORDER.forEach((name) => fillLocationSelect(formField(form, name)));
  });
  $$("[data-location-select]")
    .filter((select) => !select.form)
    .forEach((select) => fillLocationSelect(select));
}

function setLocationFormValues(form, source = {}) {
  LOCATION_FIELD_ORDER.forEach((name) => {
    const select = formField(form, name);
    if (!select) return;
    fillLocationSelect(select, source[name] || select.value || "");
    if (source[name]) select.value = source[name];
  });
}

function handleLocationSelectChange(select) {
  const form = select.form;
  if (!form) return;
  const currentIndex = LOCATION_FIELD_ORDER.indexOf(select.name);
  if (currentIndex < 0) return;
  LOCATION_FIELD_ORDER.slice(currentIndex + 1).forEach((name) => {
    fillLocationSelect(formField(form, name), "", { preserveUnknown: false });
  });
  updateMapPickerForForm(form);
}

function scriptOnce(src, id) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(t("apiError")));
    document.head.append(script);
  });
}

function mapQueryFromForm(form) {
  if (!form) return "Cancun, Quintana Roo";
  const latitude = formField(form, "latitude")?.value;
  const longitude = formField(form, "longitude")?.value;
  if (latitude && longitude) return `${latitude},${longitude}`;
  const parts = [
    formField(form, "address")?.value,
    formField(form, "neighborhood")?.value,
    formField(form, "zone")?.value,
    formField(form, "city")?.value,
    formField(form, "state")?.value,
  ].filter(Boolean);
  return parts.join(", ") || "Cancun, Quintana Roo";
}

function mapAddressQueryFromForm(form) {
  if (!form) return "";
  return [
    formField(form, "address")?.value,
    formField(form, "neighborhood")?.value,
    formField(form, "zone")?.value,
    formField(form, "city")?.value,
    formField(form, "state")?.value,
  ].filter(Boolean).join(", ");
}

function setMapStatus(picker, message, isError = false) {
  const status = picker?.querySelector(".map-help");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

async function geocodeMapAddress(picker, explicitQuery = "") {
  const form = picker?.closest("form");
  const query = String(explicitQuery || mapAddressQueryFromForm(form)).trim();
  if (!form || !query) return;
  mapGeocodeControllers.get(picker)?.abort();
  const controller = new AbortController();
  mapGeocodeControllers.set(picker, controller);
  setMapStatus(picker, t("mapSearching"));
  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(query)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Dirección no encontrada");
    if (controller.signal.aborted) return;
    setMapCoordinates(picker, result.latitude, result.longitude);
    if (formField(form, "mapPlace")) formField(form, "mapPlace").value = result.formattedAddress || query;
    setMapStatus(picker, t("mapAddressFound"));
  } catch (error) {
    if (error.name === "AbortError") return;
    setMapStatus(picker, t("mapAddressNotFound"), true);
  }
}

function scheduleMapAddressGeocode(picker) {
  window.clearTimeout(mapGeocodeTimers.get(picker));
  const form = picker?.closest("form");
  if (!form) return;
  if (formField(form, "latitude")) formField(form, "latitude").value = "";
  if (formField(form, "longitude")) formField(form, "longitude").value = "";
  updateMapPicker(picker);
  setMapStatus(picker, t("mapAddressChanged"));
  mapGeocodeTimers.set(picker, window.setTimeout(() => void geocodeMapAddress(picker), 700));
}

function setMapMarkerVisible(instance, visible) {
  if (!instance) return;
  if (instance.type === "google") instance.marker.setVisible(visible);
  else instance.marker.setOpacity(visible ? 1 : 0);
}

function centerMapInstance(instance, center, zoom = 13) {
  if (!instance) return;
  if (instance.type === "google") {
    instance.map.setCenter(center);
    instance.map.setZoom(zoom);
  } else {
    instance.map.setView([center.lat, center.lng], zoom, { animate: false });
  }
}

function updateMapPicker(picker) {
  if (!picker) return;
  const form = picker.closest("form");
  const query = mapQueryFromForm(form);
  const encoded = encodeURIComponent(query);
  const frame = picker.querySelector("[data-map-frame]");
  const openLink = picker.querySelector("[data-open-map]");
  const placeInput = picker.querySelector("[data-map-place]");
  const instance = googleMapInstances.get(picker);
  if (frame && !instance) frame.src = `https://www.google.com/maps?q=${encoded}&output=embed`;
  if (openLink) openLink.href = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  if (placeInput) placeInput.value = mapAddressQueryFromForm(form) || query;

  if (instance && formField(form, "latitude")?.value && formField(form, "longitude")?.value) {
    const center = {
      lat: Number(formField(form, "latitude").value),
      lng: Number(formField(form, "longitude").value),
    };
    setMapMarkerVisible(instance, true);
    if (instance.type === "google") {
      instance.map.setCenter(center);
      instance.marker.setPosition(center);
    } else {
      instance.marker.setLatLng([center.lat, center.lng]);
      instance.map.panTo([center.lat, center.lng], { animate: false });
    }
  } else if (instance) {
    setMapMarkerVisible(instance, true);
    centerMapInstance(instance, DEFAULT_MAP_CENTER);
    if (instance.type === "google") instance.marker.setPosition(DEFAULT_MAP_CENTER);
    else instance.marker.setLatLng([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng]);
  }
}

function updateMapPickerForForm(form) {
  const picker = form?.querySelector("[data-map-picker]");
  if (picker) updateMapPicker(picker);
}

function setMapCoordinates(picker, latitude, longitude, messageKey = "") {
  const form = picker.closest("form");
  if (!form) return;
  formField(form, "latitude").value = Number(latitude).toFixed(6);
  formField(form, "longitude").value = Number(longitude).toFixed(6);
  updateMapPicker(picker);
  const message = form.querySelector(".form-message");
  if (message && messageKey) setFormMessage(message, t(messageKey));
}

function resetMapPickerForForm(form) {
  const picker = form?.querySelector("[data-map-picker]");
  if (!picker) return;
  window.clearTimeout(mapGeocodeTimers.get(picker));
  mapGeocodeControllers.get(picker)?.abort();
  mapGeocodeTimers.delete(picker);
  mapGeocodeControllers.delete(picker);
  if (formField(form, "latitude")) formField(form, "latitude").value = "";
  if (formField(form, "longitude")) formField(form, "longitude").value = "";
  if (formField(form, "mapPlace")) formField(form, "mapPlace").value = "";
  updateMapPicker(picker);
  setMapStatus(picker, t("mapPickerHelp"));
}

async function initializeGoogleMaps() {
  if (!state.config.googleMapsApiKey || window.google?.maps) return;
  await scriptOnce(
    `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(state.config.googleMapsApiKey)}`,
    "googleMapsScript"
  );
}

async function initializeLeaflet() {
  if (!document.getElementById("leafletStyles")) {
    const link = document.createElement("link");
    link.id = "leafletStyles";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.append(link);
  }
  if (!window.L) await scriptOnce("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", "leafletScript");
}

async function enhanceLeafletMapPicker(picker) {
  await initializeLeaflet();
  if (!window.L || googleMapInstances.has(picker)) return;
  const form = picker.closest("form");
  const latitude = Number(formField(form, "latitude")?.value || 21.1619);
  const longitude = Number(formField(form, "longitude")?.value || -86.8515);
  const canvas = picker.querySelector("[data-map-canvas]");
  if (!canvas) return;
  canvas.hidden = false;
  picker.classList.add("is-loading-map");
  const map = L.map(canvas, { zoomControl: true, attributionControl: true }).setView([latitude, longitude], 13);
  const tileSources = [
    {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      options: {
        subdomains: "abcd",
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
      },
    },
  ];
  let tileLayer = null;
  let tileSourceIndex = 0;
  let tileErrors = 0;
  let tilesReady = false;
  let switchingTiles = false;
  let mapFallbackTimer = null;

  const revealInteractiveMap = () => {
    if (tilesReady) return;
    tilesReady = true;
    window.clearTimeout(mapFallbackTimer);
    canvas.hidden = false;
    picker.classList.remove("is-loading-map", "map-load-failed");
    picker.classList.add("has-interactive-map");
    window.requestAnimationFrame(() => map.invalidateSize({ animate: false }));
  };

  const showEmbeddedFallback = () => {
    if (tilesReady) return;
    picker.classList.remove("is-loading-map", "has-interactive-map");
    picker.classList.add("map-load-failed");
    canvas.hidden = true;
    const help = picker.querySelector(".map-help");
    if (help) help.textContent = t("mapLoadUnavailable");
  };

  const addTileLayer = () => {
    const source = tileSources[tileSourceIndex];
    tileErrors = 0;
    switchingTiles = false;
    if (tileLayer) map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(source.url, source.options)
      .on("tileload", revealInteractiveMap)
      .on("tileerror", () => {
        tileErrors += 1;
        if (tileErrors < 3 || switchingTiles) return;
        if (tileSourceIndex < tileSources.length - 1) {
          switchingTiles = true;
          tileSourceIndex += 1;
          addTileLayer();
        } else if (tileErrors >= 6) {
          showEmbeddedFallback();
        }
      })
      .addTo(map);
  };
  addTileLayer();
  const icon = L.divIcon({
    className: "draggable-map-pin",
    html: '<span aria-hidden="true"></span>',
    iconSize: [30, 40],
    iconAnchor: [15, 38],
  });
  const marker = L.marker([latitude, longitude], { draggable: true, icon }).addTo(map);
  const update = (latlng) => setMapCoordinates(picker, latlng.lat, latlng.lng, "locationDetected");
  marker.on("dragend", (event) => update(event.target.getLatLng()));
  map.on("click", (event) => {
    marker.setLatLng(event.latlng);
    update(event.latlng);
  });
  const resizeMap = () => {
    if (!canvas.hidden && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      map.invalidateSize({ animate: false });
    }
  };
  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(resizeMap) : null;
  resizeObserver?.observe(canvas);
  googleMapInstances.set(picker, { type: "leaflet", map, marker, resizeObserver });
  marker.setOpacity(1);
  window.requestAnimationFrame(() => window.requestAnimationFrame(resizeMap));
  window.setTimeout(resizeMap, 250);
  window.setTimeout(resizeMap, 900);
  mapFallbackTimer = window.setTimeout(showEmbeddedFallback, 12000);
}

async function enhanceMapPicker(picker) {
  if (googleMapInstances.has(picker)) return;
  if (!state.config.googleMapsApiKey) {
    await enhanceLeafletMapPicker(picker);
    return;
  }
  await initializeGoogleMaps();
  if (!window.google?.maps) return;
  const form = picker.closest("form");
  const latitude = Number(formField(form, "latitude")?.value || 21.1619);
  const longitude = Number(formField(form, "longitude")?.value || -86.8515);
  const center = { lat: latitude, lng: longitude };
  const canvas = document.createElement("div");
  canvas.className = "google-map-canvas";
  picker.querySelector("[data-map-frame]")?.before(canvas);
  const map = new google.maps.Map(canvas, {
    center,
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });
  const geocoder = new google.maps.Geocoder();
  const marker = new google.maps.Marker({ map, position: center, draggable: true });
  const updateFromLatLng = (latLng) => {
    marker.setPosition(latLng);
    setMapCoordinates(picker, latLng.lat(), latLng.lng());
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === "OK" && results?.[0]?.formatted_address && formField(form, "address") && !formField(form, "address").dataset.locked) {
        formField(form, "address").value = results[0].formatted_address;
        updateMapPicker(picker);
      }
    });
  };
  map.addListener("click", (event) => {
    updateFromLatLng(event.latLng);
  });
  marker.addListener("dragend", (event) => updateFromLatLng(event.latLng));
  googleMapInstances.set(picker, { type: "google", map, marker });
  marker.setVisible(true);
  picker.classList.add("has-google-map");
}

function bindMapPickers() {
  $$("[data-map-picker]").forEach((picker) => {
    if (!picker.querySelector("[data-map-search]")) {
      const search = document.createElement("div");
      search.className = "map-location-search";
      search.innerHTML = `
        <label>
          <span data-i18n="mapSearchLabel">${escapeHtml(t("mapSearchLabel"))}</span>
          <div class="search-input-with-icon">
            <i data-lucide="search"></i>
            <input data-map-search type="search" placeholder="${escapeHtml(t("mapSearchPlaceholder"))}" />
          </div>
        </label>
        <button class="ghost-button" type="button" data-map-search-submit>
          <i data-lucide="map-pin"></i>
          <span data-i18n="mapSearchAction">${escapeHtml(t("mapSearchAction"))}</span>
        </button>`;
      picker.querySelector("[data-map-frame]")?.before(search);
    }
    if (picker.dataset.bound === "true") {
      updateMapPicker(picker);
      return;
    }
    picker.dataset.bound = "true";
    const form = picker.closest("form");
    ["address", "state", "city", "zone", "neighborhood"].forEach((name) => {
      form?.elements[name]?.addEventListener("input", () => scheduleMapAddressGeocode(picker));
      form?.elements[name]?.addEventListener("change", () => scheduleMapAddressGeocode(picker));
    });
    ["latitude", "longitude"].forEach((name) => {
      form?.elements[name]?.addEventListener("input", () => updateMapPicker(picker));
      form?.elements[name]?.addEventListener("change", () => updateMapPicker(picker));
    });
    picker.querySelector("[data-use-current-location]")?.addEventListener("click", () => {
      if (!navigator.geolocation) {
        setFormMessage(form.querySelector(".form-message"), t("locationUnavailable"), true);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => setMapCoordinates(picker, position.coords.latitude, position.coords.longitude, "locationDetected"),
        () => setFormMessage(form.querySelector(".form-message"), t("locationUnavailable"), true),
        { enableHighAccuracy: true, timeout: 9000 }
      );
    });
    picker.querySelector("[data-geocode-address]")?.addEventListener("click", () => {
      window.clearTimeout(mapGeocodeTimers.get(picker));
      void geocodeMapAddress(picker);
    });
    const mapSearch = picker.querySelector("[data-map-search]");
    const submitMapSearch = () => {
      const query = String(mapSearch?.value || "").trim();
      if (query) void geocodeMapAddress(picker, query);
    };
    picker.querySelector("[data-map-search-submit]")?.addEventListener("click", submitMapSearch);
    mapSearch?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      submitMapSearch();
    });
    updateMapPicker(picker);
    void enhanceMapPicker(picker).catch(() => {
      picker.classList.remove("is-loading-map", "has-interactive-map");
      picker.classList.add("map-load-failed");
      const canvas = picker.querySelector("[data-map-canvas]");
      if (canvas) canvas.hidden = true;
      const help = picker.querySelector(".map-help");
      if (help) help.textContent = t("mapLoadUnavailable");
    });
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(path, options = {}) {
  const { timeoutMs = 45000, body, headers = {}, retry = true, ...fetchOptions } = options;
  const method = String(fetchOptions.method || "GET").toUpperCase();
  const attempts = retry && method === "GET" ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(path, {
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...headers },
        ...fetchOptions,
        signal: controller.signal,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      window.clearTimeout(timeout);
      if (attempt + 1 < attempts) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        continue;
      }
      if (error.name === "AbortError") {
        const timeoutError = new Error("No se recibió confirmación del servidor. La información permanece en pantalla para reintentar.");
        timeoutError.status = 504;
        throw timeoutError;
      }
      throw new Error("No fue posible conectar con el servidor. Revisa tu conexión y vuelve a intentar.", { cause: error });
    } finally {
      window.clearTimeout(timeout);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (attempt + 1 < attempts && [502, 503, 504].includes(response.status)) {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        continue;
      }
      const error = new Error(data.error || "Request failed");
      error.status = response.status;
      error.code = data.code || "";
      error.retryable = data.retryable === true;
      error.requestId = data.requestId || response.headers.get("X-Request-Id") || "";
      if (error.requestId && error.status >= 500) error.message += ` · Referencia ${error.requestId}`;
      throw error;
    }
    return data;
  }
  throw new Error("No fue posible completar la solicitud.");
}

function downloadFileName(response, fallbackName) {
  const disposition = response.headers.get("content-disposition") || "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  try {
    return decodeURIComponent(encoded || plain || fallbackName);
  } catch {
    return plain || fallbackName;
  }
}

async function downloadFile(url, fallbackName = "archivo.pdf") {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo descargar el archivo.");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = downloadFileName(response, fallbackName);
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function showToast(message, type = "success") {
  const stack = $("#toastStack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = `app-toast ${type === "error" ? "error" : ""}`;
  toast.innerHTML = `<i data-lucide="${type === "error" ? "circle-alert" : "circle-check"}"></i><span>${escapeHtml(message)}</span>`;
  stack.append(toast);
  refreshIcons();
  window.setTimeout(() => toast.remove(), 4200);
}

const formProgressTimers = new WeakMap();

function setFormProgress(button, loading, label) {
  const form = button?.closest("form");
  if (!form) return;
  let indicator = form.querySelector(".form-progress[data-form-progress]");
  if (loading) {
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "form-progress";
      indicator.dataset.formProgress = "true";
      indicator.setAttribute("role", "status");
      indicator.setAttribute("aria-live", "polite");
      indicator.innerHTML = `
        <div class="form-progress-copy">
          <span>${escapeHtml(label)}</span>
          <strong>8%</strong>
        </div>
        <div class="form-progress-track" aria-hidden="true"><span></span></div>
        <small>No cierres esta ventana. Las imágenes pueden tardar un poco en procesarse.</small>
      `;
      button.closest(".form-actions")?.insertAdjacentElement("afterend", indicator) || form.append(indicator);
    }
    let progress = 8;
    const bar = indicator.querySelector(".form-progress-track span");
    const value = indicator.querySelector("strong");
    bar.style.width = `${progress}%`;
    const timer = window.setInterval(() => {
      progress = Math.min(92, progress + Math.max(1, Math.round((92 - progress) * 0.08)));
      bar.style.width = `${progress}%`;
      value.textContent = `${progress}%`;
    }, 700);
    formProgressTimers.set(form, timer);
    return;
  }
  const timer = formProgressTimers.get(form);
  if (timer) window.clearInterval(timer);
  formProgressTimers.delete(form);
  if (!indicator) return;
  indicator.querySelector(".form-progress-track span").style.width = "100%";
  indicator.querySelector("strong").textContent = "100%";
  indicator.querySelector(".form-progress-copy span").textContent = "Proceso completado";
  window.setTimeout(() => indicator.remove(), 650);
}

function setButtonLoading(button, loading, label = "Procesando...") {
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.textContent = label;
    button.setAttribute("aria-busy", "true");
    setFormProgress(button, true, label);
    return;
  }
  button.disabled = false;
  if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
  else button.textContent = button.dataset.originalText || button.textContent;
  button.removeAttribute("aria-busy");
  setFormProgress(button, false);
  delete button.dataset.originalText;
  delete button.dataset.originalHtml;
  refreshIcons();
}

function confirmAction(message, title = "Confirmar acción") {
  const modal = $("#confirmModal");
  if (!modal) return Promise.resolve(false);
  $("#confirmModalTitle").textContent = title;
  $("#confirmModalMessage").textContent = message;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  return new Promise((resolve) => {
    const accept = $("#confirmModalAccept");
    const cancel = $("#confirmModalCancel");
    const finish = (result) => {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      accept.onclick = null;
      cancel.onclick = null;
      resolve(result);
    };
    accept.onclick = () => finish(true);
    cancel.onclick = () => finish(false);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function localizedTitle(property) {
  return state.lang === "en" ? property.titleEn || property.titleEs || property.title : property.titleEs || property.title;
}

function localizedDescription(property) {
  return state.lang === "en"
    ? property.descriptionEn || property.descriptionEs || property.description || ""
    : property.descriptionEs || property.description || "";
}

function displayType(type) {
  const map = {
    Casa: t("typeHouses"),
    Departamento: t("typeCondos"),
    Terreno: t("typeLand"),
    Comercial: t("typeCommercial"),
    Preventa: t("typePresales"),
    Desarrollo: t("typeDevelopments"),
  };
  return map[type] || type;
}

function formatCurrencyLine(code, amount, operation = "sale") {
  if (amount === null || amount === undefined || amount === "") return "";
  const locale = state.lang === "en" ? "en-US" : "es-MX";
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(amount || 0));
  return `${code} ${formatted}${operation === "rent" ? t("perMonth") : ""}`;
}

function localizedPropertyPrice(property) {
  const exchangeRate = Number(state.config.exchangeRate || 18.5) || 18.5;
  if (state.lang === "en") {
    const amount = property.priceUsd ?? (property.priceMxn ? Number(property.priceMxn) / exchangeRate : null);
    return amount ? ["USD", amount] : null;
  }
  const amount = property.priceMxn ?? (property.priceUsd ? Number(property.priceUsd) * exchangeRate : null);
  return amount ? ["MXN", amount] : null;
}

function formatPriceLines(property) {
  const selected = localizedPropertyPrice(property);
  return selected ? [formatCurrencyLine(selected[0], selected[1], property.operation)] : [];
}

function formatPriceSummary(property) {
  const lines = formatPriceLines(property);
  return lines.length ? lines.join(" / ") : "Precio por confirmar";
}

function selectedPrice(property) {
  return localizedPropertyPrice(property);
}

function comparablePrice(property) {
  return Number(localizedPropertyPrice(property)?.[1] || 0);
}

function truncateText(text, maxLength = 145) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(state.lang === "en" ? "en-US" : "es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "N/A";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function formatUsd(value) {
  return `USD ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

function resetFilters() {
  state.filters = { text: "", type: "", zone: "", operation: "", featured: false };
  state.guided = { budget: 0, beds: 0 };
  const searchInput = $("#searchInput");
  if (searchInput) searchInput.value = "";
  syncFilterControls();
}

function syncFilterControls() {
  const type = $("#filterType");
  const zone = $("#filterZone");
  const operation = $("#filterOperation");
  if (type) type.value = state.filters.type || "";
  if (zone) zone.value = state.filters.zone || "";
  if (operation) operation.value = state.filters.operation || "";
}

function activeFilterLabels() {
  const labels = [];
  if (state.filters.featured) labels.push(t("navFeatured"));
  if (state.filters.operation) labels.push(state.filters.operation === "rent" ? t("rent") : t("sale"));
  if (state.filters.type) labels.push(displayType(state.filters.type));
  if (state.filters.zone) labels.push(state.filters.zone);
  if (state.filters.text) labels.push(`"${state.filters.text}"`);
  return labels;
}

function updateActiveFilterSummary() {
  const summary = $("#activeFilterSummary");
  if (!summary) return;
  const labels = activeFilterLabels();
  summary.textContent = labels.length ? `${t("activeFilters")}: ${labels.join(" · ")}` : "";
}

function hasCategoryFilter() {
  return Boolean(state.filters.type || state.filters.zone || state.filters.operation || state.filters.featured);
}

function categoryTitle() {
  if (state.filters.featured) return t("featuredProperties");
  if (state.filters.type === "Casa") return state.lang === "en" ? "Homes in Cancun" : "Casas en Cancun";
  if (state.filters.type === "Departamento") return state.lang === "en" ? "Condos in Cancun" : "Departamentos en Cancun";
  if (state.filters.type === "Terreno") return state.lang === "en" ? "Land in Cancun" : "Terrenos en Cancun";
  if (state.filters.type === "Comercial") return state.lang === "en" ? "Commercial properties in Cancun" : "Propiedades comerciales en Cancun";
  if (state.filters.type === "Preventa") return state.lang === "en" ? "Presales in Cancun" : "Pre-ventas en Cancun";
  if (state.filters.type === "Desarrollo") return state.lang === "en" ? "Developments in Cancun" : "Desarrollos en Cancun";
  if (state.filters.operation === "rent") return state.lang === "en" ? "Cancun rentals" : "Cancun rentas";
  if (state.filters.operation === "sale") return state.lang === "en" ? "Properties for sale in Cancun" : "Propiedades en venta en Cancun";
  if (state.filters.zone) return state.lang === "en" ? `Properties in ${state.filters.zone}` : `Propiedades en ${state.filters.zone}`;
  return t("allProperties");
}

function categoryIntro() {
  if (state.filters.operation === "rent") {
    return state.lang === "en"
      ? "Review condos and homes for rent in Puerto Cancun, the Hotel Zone, Riviera Maya, and Playa Mujeres."
      : "Revisa departamentos y casas en renta en Puerto Cancun, Zona Hotelera, Riviera Maya y Playa Mujeres.";
  }
  if (state.filters.type === "Preventa") {
    return state.lang === "en"
      ? "Presale opportunities with curated developments, payment plans, delivery context, and advisor follow-up."
      : "Oportunidades en pre-venta con desarrollos seleccionados, esquemas de pago, contexto de entrega y seguimiento de asesores.";
  }
  if (state.filters.type) {
    return state.lang === "en"
      ? `Available ${displayType(state.filters.type).toLowerCase()} with current prices, area details, images, and direct advisor contact.`
      : `${displayType(state.filters.type)} disponibles con precios actuales, datos de superficie, imagenes y contacto directo con asesores.`;
  }
  if (state.filters.zone) {
    return state.lang === "en"
      ? `Explore selected inventory in ${state.filters.zone}, including sale and rental opportunities.`
      : `Explora inventario seleccionado en ${state.filters.zone}, incluyendo oportunidades en venta y renta.`;
  }
  if (state.filters.featured) {
    return state.lang === "en"
      ? "Selected opportunities from the current inventory with premium location, views, or standout value."
      : "Oportunidades seleccionadas del inventario actual por ubicacion, vistas o valor destacado.";
  }
  return "";
}

function renderCategoryPage() {
  const section = $("#categoryPage");
  if (!section) return;
  if (!hasCategoryFilter()) {
    section.hidden = true;
    return;
  }
  $("#categoryBreadcrumb").textContent = state.lang === "en" ? "Home / Properties" : "Home / Propiedades";
  $("#categoryTitle").textContent = categoryTitle();
  $("#categoryIntro").textContent = categoryIntro();
  section.hidden = false;
}

function propertyMatches(property) {
  if (property.isPublic === false || !["active", "featured", undefined, null, ""].includes(property.status)) return false;
  const filters = state.filters;
  if (property.publicationSection === "developments" && filters.type !== "Desarrollo") return false;
  if (filters.type && property.type !== filters.type) return false;
  if (filters.zone && property.zone !== filters.zone) return false;
  if (filters.operation && property.operation !== filters.operation) return false;
  if (filters.featured && !property.featured) return false;
  if (state.guided.budget && comparablePrice(property) > Number(state.guided.budget)) return false;
  if (state.guided.beds && Number(property.beds || 0) < Number(state.guided.beds)) return false;
  if (filters.text) {
    const haystack = [
      localizedTitle(property),
      localizedDescription(property),
      property.state,
      property.city,
      property.zone,
      property.neighborhood,
      property.address,
      property.mapPlace,
      property.type,
      property.mls,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(filters.text.toLowerCase())) return false;
  }
  return true;
}

function sortedProperties(properties) {
  const sort = $("#sortSelect")?.value || "high";
  const sorted = [...properties];
  if (sort === "high") sorted.sort((a, b) => comparablePrice(b) - comparablePrice(a));
  if (sort === "low") sorted.sort((a, b) => comparablePrice(a) - comparablePrice(b));
  if (sort === "new") sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return sorted;
}

function renderProperties() {
  const grid = $("#propertyGrid");
  if (!grid) return;
  syncFilterControls();
  updateActiveFilterSummary();
  renderCategoryPage();
  const properties = sortedProperties(state.properties.filter(propertyMatches));
  const isHome = document.body.dataset.page === "home";
  const displayedProperties = isHome ? properties.slice(0, 6) : properties;
  const propertiesTitle = $("#propertiesTitle");
  const catalogCta = $("#homeCatalogCta");
  if (propertiesTitle) propertiesTitle.textContent = isHome
    ? state.lang === "en" ? "Selected properties" : "Propiedades seleccionadas"
    : t("allProperties");
  $("#resultCount").textContent = isHome && properties.length > displayedProperties.length
    ? `${displayedProperties.length} ${state.lang === "en" ? "of" : "de"} ${properties.length} ${t("resultText")}`
    : `${properties.length} ${t("resultText")}`;
  if (catalogCta) {
    catalogCta.hidden = !isHome || properties.length <= displayedProperties.length;
    $("#homeCatalogCtaTitle").textContent = state.lang === "en" ? "Explore the complete catalog" : "Explora el catálogo completo";
    $("#homeCatalogCtaCopy").textContent = state.lang === "en"
      ? "Browse every available property with dedicated filters and details."
      : "Consulta todas las propiedades disponibles con sus filtros y detalles.";
    $("#homeCatalogLink").textContent = state.lang === "en" ? "View all properties" : "Ver todas las propiedades";
    $("#homeCatalogLink").href = state.lang === "en" ? "/en/properties" : "/propiedades";
  }

  if (!properties.length) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(t("noResults"))}</p>`;
    refreshIcons();
    return;
  }

  grid.innerHTML = displayedProperties
    .map((property) => {
      const badges = [...(property.badges || [])];
      if (property.operation === "rent") badges.unshift("rent");
      const badgeHtml = badges
        .map((badge) => {
          const label = badge === "rent" ? t("typeRentals") : t(badge);
          return `<span class="badge ${badge === "reduced" ? "gold" : ""}">${escapeHtml(label)}</span>`;
        })
        .join("");
      const meta = [
        property.beds ? `${property.beds} ${t("bedShort")}` : "",
        property.baths ? `${property.baths} ${t("bathShort")}` : "",
        property.area
          ? `${new Intl.NumberFormat(state.lang === "en" ? "en-US" : "es-MX").format(property.area)} ${t("sqmBuild")}`
          : "",
        property.lot
          ? `${new Intl.NumberFormat(state.lang === "en" ? "en-US" : "es-MX").format(property.lot)} ${t("sqmLot")}`
          : "",
        property.type ? displayType(property.type) : "",
        property.mls ? `${t("mls")} ${property.mls}` : "",
      ].filter(Boolean);
      const propertyUrl = state.lang === "en" ? property.urlEn : property.urlEs;

      return `
        <article class="property-card" id="property-${escapeHtml(property.id)}">
          <div class="property-image">
            <a href="${escapeHtml(propertyUrl || `/propiedades/${property.slug || property.id}`)}" aria-label="${escapeHtml(localizedTitle(property))}"><img src="${escapeHtml(optimizedMediaUrl(primaryImage(property), 640))}" alt="${escapeHtml(localizedTitle(property))}" width="640" height="420" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" /></a>
            <div class="badge-row">${badgeHtml}</div>
            <div class="property-save-actions">
              <button class="${state.favorites.includes(property.id) ? "active" : ""}" type="button" data-favorite="${escapeHtml(property.id)}" title="Guardar favorito" aria-label="Guardar favorito"><i data-lucide="heart"></i></button>
              <button class="${state.compare.includes(property.id) ? "active" : ""}" type="button" data-compare="${escapeHtml(property.id)}" title="Comparar" aria-label="Comparar"><i data-lucide="git-compare-arrows"></i></button>
            </div>
          </div>
          <div class="property-body">
            <p class="property-price">${escapeHtml(formatPriceSummary(property))}</p>
            <h3 class="property-title">${escapeHtml(localizedTitle(property))}</h3>
            <p class="property-location">${escapeHtml(displayLocation(property))}</p>
            <p class="property-meta">${escapeHtml(meta.join(" • "))}</p>
            <p class="property-description">${escapeHtml(truncateText(localizedDescription(property)))}</p>
            <div class="property-actions">
              <a class="mini-button primary" href="${escapeHtml(propertyUrl || `/propiedades/${property.slug || property.id}`)}">${escapeHtml(state.lang === "en" ? "View property" : "Ver propiedad")}</a>
              <button class="mini-button icon-only" type="button" data-detail="${escapeHtml(property.id)}" title="${escapeHtml(state.lang === "en" ? "Quick view" : "Vista rapida")}" aria-label="${escapeHtml(state.lang === "en" ? "Quick view" : "Vista rapida")}"><i data-lucide="search"></i></button>
              <button class="mini-button whatsapp-card-button" type="button" data-contact="${escapeHtml(property.id)}"><i data-lucide="message-circle"></i><span>${escapeHtml(t("contactWhatsApp"))}</span></button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
  renderCompareTray();
  refreshIcons();
  updatePropertyJsonLd();
}

function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id)
    ? state.favorites.filter((item) => item !== id)
    : [...state.favorites, id];
  localStorage.setItem(keys.favorites, JSON.stringify(state.favorites));
  renderProperties();
  showToast(state.favorites.includes(id) ? "Propiedad guardada en favoritos." : "Propiedad eliminada de favoritos.");
}

function toggleCompare(id) {
  if (state.compare.includes(id)) {
    state.compare = state.compare.filter((item) => item !== id);
  } else {
    if (state.compare.length >= 3) {
      showToast("Puedes comparar hasta tres propiedades.", "error");
      return;
    }
    state.compare.push(id);
  }
  localStorage.setItem(keys.compare, JSON.stringify(state.compare));
  renderProperties();
}

function renderCompareTray() {
  const tray = $("#compareTray");
  if (!tray) return;
  const properties = state.compare
    .map((id) => state.properties.find((property) => property.id === id))
    .filter(Boolean);
  tray.hidden = properties.length === 0;
  $("#compareCount").textContent = `${properties.length} ${properties.length === 1 ? "propiedad" : "propiedades"}`;
  $("#compareItems").innerHTML = properties
    .map(
      (property) => `
        <button type="button" data-compare="${escapeHtml(property.id)}" title="Quitar">
          <img src="${escapeHtml(primaryImage(property))}" alt="" />
          <span>${escapeHtml(property.titleEs)}</span>
          <i data-lucide="x"></i>
        </button>
      `
    )
    .join("");
}

function openCompareModal() {
  const properties = state.compare
    .map((id) => state.properties.find((property) => property.id === id))
    .filter(Boolean);
  if (properties.length < 2) {
    showToast("Selecciona al menos dos propiedades para comparar.", "error");
    return;
  }
  const rows = [
    ["Precio", (property) => formatPriceSummary(property)],
    ["Zona", (property) => displayLocation(property)],
    ["Tipo", (property) => property.type],
    ["Operación", (property) => (property.operation === "rent" ? "Renta" : "Venta")],
    ["Recámaras", (property) => property.beds || 0],
    ["Baños", (property) => property.baths || 0],
    ["Construcción", (property) => `${property.area || 0} m²`],
    ["MLS", (property) => property.mls || "-"],
  ];
  $("#compareContent").innerHTML = `
    <table class="data-table compare-table">
      <thead><tr><th>Característica</th>${properties.map((property) => `<th><img src="${escapeHtml(primaryImage(property))}" alt="" /><strong>${escapeHtml(property.titleEs)}</strong></th>`).join("")}</tr></thead>
      <tbody>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th>${properties.map((property) => `<td>${escapeHtml(value(property))}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
  $("#compareModal").hidden = false;
  document.body.classList.add("modal-open");
}

function guidedSearchSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  state.filters.operation = form.operation.value;
  state.filters.zone = form.zone.value;
  state.filters.type = form.type.value;
  state.guided.budget = Number(form.budget.value || 0);
  state.guided.beds = Number(form.beds.value || 0);
  renderProperties();
  void api("/api/leads", {
    method: "POST",
    body: {
      leadType: "busqueda-guiada-comprador",
      name: "Búsqueda guiada",
      operation: form.operation.value,
      zone: form.zone.value,
      propertyType: form.type.value,
      budget: form.budget.value,
      bedrooms: form.beds.value,
      objective: form.objective.value,
      sourcePath: window.location.pathname,
    },
  }).catch(() => null);
  $("#propertyGrid").scrollIntoView({ behavior: "smooth", block: "start" });
}

function propertySchemaType(property) {
  if (property.type === "Casa") return "House";
  if (property.type === "Departamento") return "Apartment";
  return "Residence";
}

function updatePropertyJsonLd() {
  const existing = document.getElementById("property-jsonld");
  if (existing) existing.remove();
  if (document.body.dataset.page !== "home") return;
  const publicProperties = state.properties.filter((property) => property.isPublic !== false && ["active", "featured", undefined, null, ""].includes(property.status));
  if (!publicProperties.length) return;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Propiedades en venta y renta en Cancun",
    itemListElement: publicProperties.slice(0, 24).map((property, index) => {
      const price = selectedPrice(property);
      const path = state.lang === "en" ? property.urlEn : property.urlEs;
      const url = `${window.location.origin}${path || `/propiedades/${encodeURIComponent(property.id)}`}`;
      const image = storedImages(property).find((source) => !String(source).startsWith("data:image"));
      return {
        "@type": "ListItem",
        position: index + 1,
        name: localizedTitle(property),
        url,
        ...(image ? { image: new URL(image, window.location.origin).href } : {}),
        ...(price ? { offers: { "@type": "Offer", price: Number(price[1]), priceCurrency: price[0] } } : {}),
      };
    }),
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "property-jsonld";
  script.textContent = JSON.stringify(itemList);
  document.head.appendChild(script);
}

function renderRequestItem(request) {
  const statusClass = request.status || "pending";
  const preferred = request.preferredContact === "phone" ? t("contactPhone") : t("contactEmail");
  const price =
    request.currency === "MXN"
      ? `MXN $${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(request.price)}`
      : `USD $${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(request.price)}`;
  return `
    <div class="request-item detailed-request">
      <div class="request-item-header">
        <div>
          <span class="status ${escapeHtml(statusClass)}">${escapeHtml(t(statusClass))}</span>
          <h3>${escapeHtml(request.title)}</h3>
        </div>
        <strong>${escapeHtml(price)}</strong>
      </div>
      ${
        storedImages(request).length
          ? `<img class="request-thumb" src="${escapeHtml(primaryImage(request))}" alt="${escapeHtml(request.title)}" loading="lazy" />`
          : ""
      }
      <div class="detail-grid compact">
        <div>
          <span>${escapeHtml(t("adminSellerContact"))}</span>
          <strong>${escapeHtml(request.sellerName || "")}</strong>
          <small>${escapeHtml(request.email || "")}</small>
          <small>${escapeHtml(request.phone || "")}</small>
        </div>
        <div>
          <span>${escapeHtml(t("adminPropertyFacts"))}</span>
          <strong>${escapeHtml(displayType(request.type))}</strong>
          <small>${escapeHtml(displayLocation(request))} · ${escapeHtml(request.beds || 0)} ${escapeHtml(t("bedShort"))} · ${escapeHtml(request.baths || 0)} ${escapeHtml(t("bathShort"))}</small>
          <small>${escapeHtml(t("preferred"))}: ${escapeHtml(preferred)}</small>
        </div>
      </div>
      <p class="request-description">${escapeHtml(request.description || "")}</p>
      ${request.adminResponse ? `<p class="request-response"><strong>${escapeHtml(t("adminRespond"))}:</strong> ${escapeHtml(request.adminResponse)}</p>` : ""}
      <p class="request-date">${escapeHtml(t("adminRequestMeta"))}: ${escapeHtml(formatDate(request.createdAt))}</p>
    </div>
  `;
}

function renderSellerRequests() {
  const list = $("#sellerRequests");
  if (!list) return;
  if (!state.requests.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("noRequests"))}</p>`;
    return;
  }
  list.innerHTML = state.requests
    .map((request) => {
      const messages = state.messages.filter(
        (message) => message.request_table === "seller_request" && message.request_id === request.id
      );
      const files = Array.isArray(request.responseFiles) ? request.responseFiles : [];
      return `
        <article class="seller-request-entry">
          ${renderRequestItem(request)}
          <div class="seller-request-next">
            <strong>Próximo paso:</strong> ${escapeHtml(request.nextAction || (request.status === "missing_data" ? "Completar los datos solicitados" : "Esperar revisión del asesor"))}
          </div>
          ${
            messages.length
              ? `<div class="message-timeline">${messages
                  .map(
                    (message) => `
                      <article class="timeline-message ${escapeHtml(message.sender_type)}">
                        <small>${escapeHtml(message.sender_name || message.sender_type)} · ${escapeHtml(formatDate(message.created_at))}</small>
                        <p>${escapeHtml(message.message)}</p>
                      </article>
                    `
                  )
                  .join("")}</div>`
              : ""
          }
          <div class="item-actions">
            <button class="mini-button" type="button" data-seller-reply="${escapeHtml(request.id)}" data-request-table="seller_request">Responder al asesor</button>
            ${files
              .map((file, index) => {
                const value = String(file);
                return value.startsWith("document:")
                  ? `<a class="mini-button" href="/api/seller/documents/${encodeURIComponent(value.slice(9))}/download">Descargar PDF ${index + 1}</a>`
                  : `<span class="status">Adjunto ${index + 1}: ${escapeHtml(value)}</span>`;
              })
              .join("")}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSellerServiceRequests() {
  const list = $("#sellerServiceRequests");
  if (!list) return;
  const requests = Array.isArray(state.serviceRequests) ? state.serviceRequests : [];
  if (!requests.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = `
    <div class="table-heading"><h3>Valoraciones y validaciones</h3><span>${requests.length}</span></div>
    ${requests
      .map((request) => {
        const messages = state.messages.filter(
          (message) => message.request_table === "lead_request" && message.request_id === request.id
        );
        const response = request.lastResponse
          ? `<p class="request-response"><strong>Respuesta del asesor:</strong> ${escapeHtml(request.lastResponse)}</p>`
          : `<p class="empty-state compact">Aún no hay respuesta. El equipo la tiene en revisión.</p>`;
        return `
          <article class="wide-row">
            <div class="wide-row-main">
              <span class="status ${escapeHtml(request.status || "new")}">${escapeHtml(leadStatusLabel(request.status))}</span>
              <h3>${escapeHtml(leadTypeLabel(request.leadType))}</h3>
              <p>${escapeHtml(request.payload?.zone || "-")} · ${escapeHtml(request.payload?.propertyType || "-")} · ${escapeHtml(formatDate(request.createdAt))}</p>
            </div>
            ${response}
            ${
              messages.length
                ? `<div class="message-timeline">${messages
                    .map(
                      (message) => `
                        <article class="timeline-message ${escapeHtml(message.sender_type)}">
                          <small>${escapeHtml(message.sender_name || message.sender_type)} · ${escapeHtml(formatDate(message.created_at))}</small>
                          <p>${escapeHtml(message.message)}</p>
                          ${(message.attachments || [])
                            .map((attachment) =>
                              String(attachment).startsWith("document:")
                                ? `<a class="mini-button" href="/api/seller/documents/${encodeURIComponent(String(attachment).slice(9))}/download">Descargar PDF</a>`
                                : ""
                            )
                            .join("")}
                        </article>
                      `
                    )
                    .join("")}</div>`
                : ""
            }
            <div class="item-actions">
              <button class="mini-button" type="button" data-seller-reply="${escapeHtml(request.id)}" data-request-table="lead_request">Responder al asesor</button>
            </div>
          </article>
        `;
      })
      .join("")}
  `;
}

function renderSellerNotifications() {
  const list = $("#sellerNotifications");
  const button = $("#sellerNotificationButton");
  if (!list || !button) return;
  const notifications = state.notifications || [];
  const unread = notifications.filter((notification) => !notification.is_read && !notification.isRead).length;
  $("#sellerNotificationCount").textContent = String(unread);
  $("#sellerNotificationCount").hidden = unread === 0;
  list.innerHTML = notifications.length
    ? notifications
        .map(
          (notification) => `
            <button class="notification-item ${notification.is_read || notification.isRead ? "" : "unread"}" type="button" data-read-seller-notification="${escapeHtml(notification.id)}">
              <i data-lucide="bell-ring"></i>
              <span>
                <h3>${escapeHtml(notification.title || "Actualización")}</h3>
                <p>${escapeHtml(notification.message || "")}</p>
                <time>${escapeHtml(formatDate(notification.created_at || notification.createdAt))}</time>
              </span>
            </button>
          `
        )
        .join("")
    : `<p class="empty-state">No tienes notificaciones nuevas.</p>`;
}

function openSellerFlow(flow) {
  if (flow === "sale") {
    $("#sellerServiceCard").hidden = true;
    $("#sellerSaleWorkspace").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const form = $("#sellerServiceForm");
  const card = $("#sellerServiceCard");
  if (!form || !card) return;
  form.reset();
  form.flow.value = flow;
  const aiField = form.querySelector('[data-service-field="aiResponse"]');
  const priceField = form.querySelector('[data-service-field="expectedPrice"]');
  aiField.hidden = flow !== "ai_validation";
  priceField.hidden = flow === "ai_validation";
  const config = {
    valuation: ["Solicitar valoración", "Comparte los datos principales para que un asesor prepare un rango y próximos pasos.", "Precio esperado"],
    price_validation: ["Validar precio con asesor", "Revisaremos si tu precio parece bajo, competitivo o alto frente al inventario interno.", "Precio que quieres validar"],
    ai_validation: ["Validar respuesta de IA", "Pega la respuesta externa. Un asesor revisará qué está bien, qué falta y qué debe validarse localmente.", ""],
  }[flow];
  $("#sellerServiceTitle").textContent = config[0];
  $("#sellerServiceHint").textContent = config[1];
  $("#sellerServicePriceLabel").textContent = config[2];
  card.hidden = false;
  refreshLocationSelects();
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function sellerServiceSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Enviando...");
  try {
    const body = Object.fromEntries(new FormData(form).entries());
    await api("/api/seller/service-requests", { method: "POST", body });
    form.reset();
    $("#sellerServiceCard").hidden = true;
    await renderPanel();
    showToast("Solicitud enviada al equipo de asesores.");
  } catch (error) {
    setFormMessage($("#sellerServiceMessage"), error.message, true);
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function readSellerNotification(id) {
  await api(`/api/seller/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
  const notification = state.notifications.find((item) => item.id === id);
  if (notification) notification.is_read = true;
  renderSellerNotifications();
}

function sellerReplyToAdvisor(requestTable, requestId) {
  const form = $("#sellerReplyForm");
  form.reset();
  form.requestTable.value = requestTable;
  form.requestId.value = requestId;
  $("#sellerReplyModal").hidden = false;
  document.body.classList.add("modal-open");
}

function closeSellerReply() {
  $("#sellerReplyModal").hidden = true;
  document.body.classList.remove("modal-open");
}

async function sellerReplySubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Enviando...");
  try {
    await api("/api/seller/messages", {
      method: "POST",
      body: {
        requestTable: form.requestTable.value,
        requestId: form.requestId.value,
        message: form.message.value.trim(),
      },
    });
    closeSellerReply();
    await renderPanel();
    showToast("Respuesta enviada al asesor.");
  } catch (error) {
    setFormMessage($("#sellerReplyMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function renderAdminRequests() {
  const list = $("#adminRequests");
  if (!list) return;
  const summary = $("#adminRequestSummary");
  if (summary) {
    const pending = state.requests.filter((request) => request.status === "pending").length;
    summary.textContent = `${state.requests.length} ${t("adminRequestSummary")} · ${pending ? `${pending} ${t("pending")}` : t("adminNoPending")}`;
  }
  const requests = state.adminRequestFilter === "pending"
    ? state.requests.filter((request) => request.status === "pending")
    : state.requests;
  if (!requests.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("noRequests"))}</p>`;
    return;
  }
  const activeFilter = state.adminRequestFilter !== "all"
    ? `<div class="active-admin-filter"><span>Mostrando solicitudes pendientes</span><button type="button" data-clear-admin-drilldown="requests">Ver todas</button></div>`
    : "";
  list.innerHTML = activeFilter + requests
    .map((request) => {
      const actions =
        request.status === "pending"
          ? `<div class="item-actions">
              <button class="mini-button primary" type="button" data-approve="${escapeHtml(request.id)}">${escapeHtml(t("approve"))}</button>
              <button class="mini-button" type="button" data-reject="${escapeHtml(request.id)}">${escapeHtml(t("reject"))}</button>
              <button class="mini-button" type="button" data-respond-request="${escapeHtml(request.id)}">${escapeHtml(t("adminRespond"))}</button>
            </div>`
          : `<div class="item-actions"><button class="mini-button" type="button" data-respond-request="${escapeHtml(request.id)}">${escapeHtml(t("adminRespond"))}</button></div>`;
      return `<div class="request-admin-entry">${renderRequestItem(request)}${actions}</div>`;
    })
    .join("");
}

function leadStatusLabel(status) {
  if (status === "contacted") return t("leadStatusContacted");
  if (status === "in_review") return state.lang === "en" ? "In review" : "En revision";
  if (status === "waiting_client") return state.lang === "en" ? "Waiting client" : "Esperando cliente";
  if (status === "missing_data") return state.lang === "en" ? "Missing data" : "Faltan datos";
  if (status === "valuation_process") return state.lang === "en" ? "Valuation" : "Valoracion";
  if (status === "valuation_sent") return state.lang === "en" ? "Valuation sent" : "Valoracion enviada";
  if (status === "negotiation") return state.lang === "en" ? "Negotiation" : "Negociacion";
  if (status === "lost") return state.lang === "en" ? "Lost" : "Perdido";
  if (status === "archived") return state.lang === "en" ? "Archived" : "Archivado";
  if (status === "closed") return t("leadStatusClosed");
  return t("leadStatusNew");
}

function leadTypeLabel(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("validacion")) return t("leadTypeAiValidation");
  if (value.includes("valuacion")) return t("leadTypeValuation");
  if (value.includes("comprador")) return t("leadTypeBuyer");
  if (value.includes("vendedor") || value.includes("seller")) return t("leadTypeSeller");
  return t("leadTypeGeneral");
}

function leadCategory(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("valuacion")) return "valuation";
  if (value.includes("validacion") || value.includes("ia")) return "ai_validation";
  if (value.includes("comprador") || value.includes("buyer")) return "buyer";
  if (value.includes("vendedor") || value.includes("seller") || value.includes("venta")) return "seller";
  if (value.includes("propiedad") || value.includes("contacto")) return "property_contact";
  if (value.includes("whatsapp") || value.includes("ayuda") || value.includes("guia")) return "whatsapp_help";
  if (value.includes("busqueda")) return "search";
  return "general";
}

function scoreLabel(score) {
  if (score === "premium") return t("leadScorePremium");
  if (score === "hot") return t("leadScoreHot");
  if (score === "warm") return t("leadScoreWarm");
  return t("leadScoreCold");
}

function contactTypeLabel(type) {
  if (type === "buyer") return t("contactTypeBuyer");
  if (type === "seller") return t("contactTypeSeller");
  return t("contactTypeUnclassified");
}

function propertyStatusLabel(status) {
  const labels = {
    draft: t("statusDraft"),
    pending: t("statusPending"),
    active: t("statusActive"),
    disabled: t("statusDisabled"),
    sold: t("statusSold"),
    rented: t("statusRented"),
    archived: t("statusArchived"),
    rejected: t("statusRejected"),
  };
  return labels[status] || labels.active;
}

function leadPayloadLabel(key) {
  const labels = {
    operationType: t("operationType"),
    zone: t("zone"),
    propertyType: t("propertyType"),
    aiResponse: t("aiResponseField"),
    aiMessage: t("aiResponseField"),
    budgetOrPrice: "Precio / presupuesto",
    budget: "Presupuesto",
    landSize: "m2 terreno",
    builtSize: "m2 construccion",
    bedrooms: t("bedrooms"),
    bathrooms: t("bathrooms"),
    amenities: "Amenidades",
    age: "Antiguedad",
    legalStatus: "Estado legal",
    ownerEstimate: "Precio estimado",
    usedAi: "Uso de IA",
    goal: "Objetivo",
    purchaseDate: "Fecha estimada",
  };
  return labels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function renderLeadPayload(lead) {
  const payload = lead.payload && typeof lead.payload === "object" ? lead.payload : {};
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "");
  if (!entries.length) return "";
  const rows = entries.map(([key, value]) => {
    const text = Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : String(value);
    const isLong = text.length > 160;
    return `
      <div>
        <span>${escapeHtml(leadPayloadLabel(key))}</span>
        <strong>${escapeHtml(isLong ? truncateText(text, 160) : text)}</strong>
      </div>
    `;
  });
  const visible = rows.slice(0, 6).join("");
  const hidden = rows.slice(6).join("");
  return `
    <div class="lead-payload">${visible}</div>
    ${hidden ? `<details class="lead-more"><summary>${escapeHtml(t("showMore"))}</summary><div class="lead-payload">${hidden}</div></details>` : ""}
  `;
}

function leadPhoneForWhatsApp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

function leadWhatsAppUrl(lead) {
  const phone = leadPhoneForWhatsApp(lead.phone);
  const message = [
    `Hola ${lead.name || ""}, soy asesor de Puerto Cancun Center.`,
    "Recibimos tu solicitud y quiero apoyarte con la informacion que enviaste.",
    "",
    `Tipo: ${leadTypeLabel(lead.leadType)}`,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function leadEmailUrl(lead) {
  const subject = "Solicitud Puerto Cancun Center";
  const body = [
    `Hola ${lead.name || ""},`,
    "",
    "Recibimos tu solicitud en Puerto Cancun Center y queremos apoyarte con la informacion que enviaste.",
    "",
    `Tipo de solicitud: ${leadTypeLabel(lead.leadType)}`,
    "",
    "Quedamos atentos para continuar con la asesoria.",
  ].join("\n");
  return `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function renderAdminLeads() {
  const list = $("#adminLeads");
  if (!list) return;
  $$("[data-lead-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.leadFilter === state.leadFilter);
  });
  const summary = $("#adminLeadSummary");
  const newCount = state.leads.filter((lead) => lead.status === "new").length;
  let leads =
    state.leadFilter === "all" ? state.leads : state.leads.filter((lead) => leadCategory(lead.leadType) === state.leadFilter);
  if (state.adminLeadStatusFilter !== "all") leads = leads.filter((lead) => lead.status === state.adminLeadStatusFilter);
  if (state.adminLeadPriorityFilter !== "all") leads = leads.filter((lead) => lead.priority === state.adminLeadPriorityFilter || lead.leadScore === state.adminLeadPriorityFilter);
  if (summary) {
    summary.textContent = `${leads.length} ${t("adminLeadSummary")} · ${newCount ? `${newCount} ${t("leadStatusNew")}` : t("adminNoPending")}`;
  }
  if (!leads.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("adminNoLeads"))}</p>`;
    return;
  }
  const drilldownCopy = state.adminLeadPriorityFilter !== "all"
    ? `Mostrando leads ${state.adminLeadPriorityFilter}`
    : state.adminLeadStatusFilter !== "all"
      ? `Mostrando leads con estado ${state.adminLeadStatusFilter}`
      : "";
  const activeFilter = drilldownCopy
    ? `<div class="active-admin-filter"><span>${escapeHtml(drilldownCopy)}</span><button type="button" data-clear-admin-drilldown="leads">Ver todos</button></div>`
    : "";
  list.innerHTML = activeFilter + leads
    .map((lead) => {
      const phoneUrl = leadPhoneForWhatsApp(lead.phone) ? leadWhatsAppUrl(lead) : "";
      const source = lead.sourcePath ? `<small>${escapeHtml(lead.sourcePath)}</small>` : "";
      return `
        <article class="lead-admin-entry">
          <div class="lead-header">
            <div>
              <span class="status ${escapeHtml(lead.status || "new")}">${escapeHtml(leadStatusLabel(lead.status))}</span>
              <span class="status priority-${escapeHtml(lead.priority || "medium")}">${escapeHtml(lead.priority || "medium")}</span>
              <span class="status score-${escapeHtml(lead.leadScore || "cold")}">${escapeHtml(scoreLabel(lead.leadScore))}</span>
              <h3>${escapeHtml(lead.name || "")}</h3>
              <p>${escapeHtml(leadTypeLabel(lead.leadType))} · ${escapeHtml(formatDate(lead.createdAt))}</p>
              ${source}
            </div>
            <strong>${escapeHtml(lead.phone || "")}</strong>
          </div>
          <div class="lead-contact-grid">
            <div>
              <span>WhatsApp</span>
              <strong>${escapeHtml(lead.phone || "")}</strong>
            </div>
            <div>
              <span>${escapeHtml(t("email"))}</span>
              <strong>${escapeHtml(lead.email || t("noEmail"))}</strong>
            </div>
            <div>
              <span>${escapeHtml(t("nextAction"))}</span>
              <strong>${escapeHtml(nextActionForLead(lead))}</strong>
            </div>
            <div>
              <span>Score</span>
              <strong>${escapeHtml(scoreLabel(lead.leadScore))} · ${escapeHtml(lead.priority || "medium")}</strong>
            </div>
          </div>
          ${renderLeadPayload(lead)}
          <div class="item-actions lead-actions">
            ${
              phoneUrl
                ? `<a class="mini-button primary" href="${escapeHtml(phoneUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("respondWhatsApp"))}</a>`
                : ""
            }
            ${
              lead.email
                ? `<a class="mini-button" href="${escapeHtml(leadEmailUrl(lead))}">${escapeHtml(t("respondEmail"))}</a>`
                : ""
            }
            <button class="mini-button" type="button" data-respond-lead="${escapeHtml(lead.id)}">${escapeHtml(t("adminRespond"))}</button>
            <button class="mini-button" type="button" data-lead-id="${escapeHtml(lead.id)}" data-lead-status="contacted">${escapeHtml(t("markContacted"))}</button>
            <button class="mini-button" type="button" data-lead-id="${escapeHtml(lead.id)}" data-lead-status="closed">${escapeHtml(t("markClosed"))}</button>
            <button class="mini-button danger" type="button" data-delete-lead="${escapeHtml(lead.id)}">${escapeHtml(t("delete"))}</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAdminContacts() {
  const list = $("#adminContacts");
  if (!list) return;
  const search = ($("#contactSearch")?.value || "").trim().toLowerCase();
  const typeFilter = $("#contactTypeFilter")?.value || "";
  const contacts = state.contacts.filter((contact) => {
    const matchesSearch =
      !search || `${contact.name} ${contact.email} ${contact.phone}`.toLowerCase().includes(search);
    const matchesType = !typeFilter || contact.contactType === typeFilter;
    return matchesSearch && matchesType;
  });
  const summary = $("#adminContactSummary");
  if (summary) summary.textContent = `${contacts.length} de ${state.contacts.length} contactos`;
  if (!contacts.length) {
    list.innerHTML = `<p class="empty-state">Aquí aparecerán los contactos generados desde formularios, solicitudes de venta, valoraciones, compradores interesados y WhatsApp.</p>`;
    return;
  }
  list.innerHTML = contacts
    .map((contact) => {
      const zones = Array.isArray(contact.preferredZones) ? contact.preferredZones.join(", ") : "";
      const phoneUrl = leadPhoneForWhatsApp(contact.phone)
        ? `https://wa.me/${leadPhoneForWhatsApp(contact.phone)}?text=${encodeURIComponent("Hola, soy asesor de Puerto Cancun Center. Quiero dar seguimiento a tu solicitud.")}`
        : "";
      return `
        <article class="contact-entry">
          <div class="contact-main">
            <div>
              <span class="status score-${escapeHtml(contact.leadScore || "cold")}">${escapeHtml(scoreLabel(contact.leadScore))}</span>
              <h3>${escapeHtml(contact.name || "")}</h3>
              <p>${escapeHtml(contactTypeLabel(contact.contactType))} · ${escapeHtml(contact.source || "")}</p>
            </div>
            <strong>${escapeHtml(contact.phone || contact.email || "")}</strong>
          </div>
          <div class="lead-contact-grid">
            <div><span>WhatsApp</span><strong>${escapeHtml(contact.phone || "")}</strong></div>
            <div><span>${escapeHtml(t("email"))}</span><strong>${escapeHtml(contact.email || t("noEmail"))}</strong></div>
            <div><span>${escapeHtml(t("zone"))}</span><strong>${escapeHtml(zones || "-")}</strong></div>
            <div><span>${escapeHtml(t("propertyType"))}</span><strong>${escapeHtml(contact.propertyType || "-")}</strong></div>
          </div>
          <div class="item-actions">
            ${phoneUrl ? `<a class="mini-button primary" href="${escapeHtml(phoneUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("respondWhatsApp"))}</a>` : ""}
            ${contact.email ? `<a class="mini-button" href="mailto:${escapeHtml(contact.email)}">${escapeHtml(t("respondEmail"))}</a>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderStats() {
  const english = state.lang === "en";
  const stats = [
    [state.stats.properties, t("statProperties"), "properties"],
    [state.stats.activeProperties || 0, t("statusActive"), "active-properties"],
    [state.stats.incompleteProperties || 0, t("qualityIncomplete"), "incomplete-properties"],
    [state.stats.pendingRequests, t("statRequests"), "pending-requests"],
    [state.stats.newLeads || 0, t("statLeads"), "new-leads"],
    [state.stats.premiumLeads || 0, t("leadScorePremium"), "premium-leads"],
    [state.stats.valuationLeads || 0, t("adminJumpValuations"), "valuations"],
    [state.stats.pendingTasks || 0, t("adminJumpTasks"), "tasks"],
    [state.stats.contacts || 0, t("crmTitle"), "contacts"],
    [state.stats.searches, t("statSearches"), "analytics"],
    [state.stats.propertiesWithoutCover || 0, english ? "Missing cover" : "Sin portada", "properties-without-cover"],
    [state.stats.averageResponseHours ? `${state.stats.averageResponseHours} h` : english ? "N/A" : "N/D", english ? "Average response" : "Respuesta promedio", "leads"],
    [state.stats.generatedDocuments || 0, english ? "PDF sheets" : "Fichas PDF", "pdf"],
    [state.stats.whatsappClicks || 0, english ? "WhatsApp clicks" : "Clicks WhatsApp", "analytics"],
  ];
  $("#statsGrid").innerHTML = stats
    .map(([value, label, target]) => `<button class="stat-card" type="button" data-admin-metric="${escapeHtml(target)}" aria-label="${escapeHtml(`${label}: ${value}. ${english ? "Open details" : "Abrir detalle"}`)}"><strong>${value}</strong><span>${escapeHtml(label)}</span><small>${english ? "View details" : "Ver detalle"}</small></button>`)
    .join("");
}

function openAdminMetric(metric) {
  const emptyFilters = { search: "", type: "", zone: "", operation: "", status: "", quality: "" };
  if (["properties", "active-properties", "incomplete-properties", "properties-without-cover"].includes(metric)) {
    state.adminListingFilters = { ...emptyFilters };
    if (metric === "active-properties") state.adminListingFilters.status = "active";
    if (metric === "incomplete-properties") state.adminListingFilters.quality = "incomplete";
    if (metric === "properties-without-cover") state.adminListingFilters.missingCover = true;
    setAdminSection("properties");
    renderAdminListingFilters();
    renderAdminListings();
    $("#adminListingsCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (metric === "pending-requests") {
    state.adminRequestFilter = "pending";
    setAdminSection("requests");
    renderAdminRequests();
    return;
  }
  if (["new-leads", "premium-leads"].includes(metric)) {
    state.adminLeadStatusFilter = metric === "new-leads" ? "new" : "all";
    state.adminLeadPriorityFilter = metric === "premium-leads" ? "premium" : "all";
    setAdminSection("leads");
    renderAdminLeads();
    return;
  }
  const section = ["requests", "leads", "valuations", "tasks", "contacts", "analytics", "pdf"].includes(metric) ? metric : "dashboard";
  setAdminSection(section);
}

function renderAdminInsights() {
  const container = $("#adminInsights");
  if (!container) return;
  const properties = state.properties;
  const pending = state.requests.filter((request) => request.status === "pending").length;
  const newLeads = state.leads.filter((lead) => lead.status === "new").length;
  const premiumLeads = state.leads.filter((lead) => lead.priority === "premium" || lead.leadScore === "premium").length;
  const incompleteProperties = properties.filter((property) => (property.qualityScore || 0) < 70).length;
  const openTasks = state.tasks.filter((task) => ["pending", "in_progress"].includes(task.status)).length;
  const featured = properties.filter((property) => property.featured).length;
  const usdProperties = properties.filter((property) => property.priceUsd);
  const average =
    usdProperties.length > 0
      ? Math.round(usdProperties.reduce((sum, property) => sum + Number(property.priceUsd || 0), 0) / usdProperties.length)
      : 0;
  const topZones = Object.entries(countBy(properties, "zone"))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const operationCounts = countBy(properties, "operation");

  container.innerHTML = `
    <article class="insight-card attention-card">
      <span>${escapeHtml(t("adminAttentionTitle"))}</span>
      <strong>${pending + newLeads + premiumLeads + incompleteProperties + openTasks}</strong>
      <p>${escapeHtml(pending)} solicitudes · ${escapeHtml(newLeads)} leads · ${escapeHtml(openTasks)} tareas</p>
    </article>
    <article class="insight-card priority">
      <span>${escapeHtml(t("adminInsightPending"))}</span>
      <strong>${pending}</strong>
      <p>${escapeHtml(pending ? t("adminRequestsTitle") : t("adminNoPending"))}</p>
    </article>
    <article class="insight-card priority">
      <span>${escapeHtml(t("adminInsightLeads"))}</span>
      <strong>${newLeads}</strong>
      <p>${escapeHtml(newLeads ? t("adminLeadsTitle") : t("adminNoLeads"))}</p>
    </article>
    <article class="insight-card">
      <span>${escapeHtml(t("adminInsightFeatured"))}</span>
      <strong>${featured}</strong>
      <p>${escapeHtml(t("adminInventory"))}: ${escapeHtml(properties.length)}</p>
    </article>
    <article class="insight-card">
      <span>${escapeHtml(t("adminInsightAverage"))}</span>
      <strong>${escapeHtml(average ? formatUsd(average) : "N/A")}</strong>
      <p>${escapeHtml(t("adminOperations"))}: ${escapeHtml(t("sale"))} ${operationCounts.sale || 0} · ${escapeHtml(t("rent"))} ${operationCounts.rent || 0}</p>
    </article>
    <article class="insight-card">
      <span>${escapeHtml(t("leadScorePremium"))}</span>
      <strong>${premiumLeads}</strong>
      <p>${escapeHtml(t("nextAction"))}: WhatsApp / asesor</p>
    </article>
    <article class="insight-card">
      <span>${escapeHtml(t("qualityIncomplete"))}</span>
      <strong>${incompleteProperties}</strong>
      <p>${escapeHtml(t("propertyQualityMissing"))}: fotos, SEO o precio</p>
      <button class="mini-button" type="button" data-show-incomplete-listings>Revisar cuáles son</button>
    </article>
    <article class="insight-card">
      <span>${escapeHtml(t("adminTopZones"))}</span>
      <div class="zone-pill-row">
        ${
          topZones.length
            ? topZones.map(([zone, count]) => `<small>${escapeHtml(zone)} <b>${count}</b></small>`).join("")
            : `<small>${escapeHtml(t("listingsEmpty"))}</small>`
        }
      </div>
      <p>${escapeHtml(t("adminInsightSearches"))}: ${escapeHtml(state.stats.searches || 0)}</p>
    </article>
  `;
}

function renderAdminPrompts() {
  const list = $("#adminPromptList");
  if (!list) return;
  const prompts = Array.isArray(state.adminPrompts) ? state.adminPrompts : [];
  if (!prompts.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("adminPromptsEmpty"))}</p>`;
    return;
  }
  list.innerHTML = prompts
    .map(
      (prompt) => `
        <details>
          <summary>${escapeHtml(prompt.title)}</summary>
          <p>${escapeHtml(prompt.body)}</p>
        </details>
      `
    )
    .join("");
}

function renderLocationCatalogs() {
  const list = $("#locationCatalogList");
  if (!list) return;
  const filters = state.catalogFilters || { search: "", type: "" };
  const search = normalizeSearchText(filters.search);
  const typeOrder = ["state", "city", "zone", "neighborhood"];
  const allOptions = [...state.locationOptions].sort((a, b) => {
    const typeDifference = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    return typeDifference || locationOptionPath(a).localeCompare(locationOptionPath(b), "es", { sensitivity: "base" });
  });
  const counts = Object.fromEntries(typeOrder.map((type) => [type, allOptions.filter((option) => option.type === type).length]));
  const summary = $("#catalogSummary");
  if (summary) {
    summary.innerHTML = [
      ["map-pinned", "Total de lugares", allOptions.length],
      ["map", "Estados", counts.state],
      ["building-2", "Municipios", counts.city],
      ["route", "Zonas", counts.zone],
      ["home", "Colonias", counts.neighborhood],
    ]
      .map(([icon, label, value]) => `<article><i data-lucide="${icon}"></i><div><strong>${value}</strong><span>${label}</span></div></article>`)
      .join("");
  }
  const tabs = $("#catalogLevelTabs");
  if (tabs) {
    const tabOptions = [
      ["", "Todos", allOptions.length],
      ["state", "Estados", counts.state],
      ["city", "Municipios", counts.city],
      ["zone", "Zonas", counts.zone],
      ["neighborhood", "Colonias", counts.neighborhood],
    ];
    tabs.innerHTML = tabOptions
      .map(
        ([value, label, count]) =>
          `<button type="button" class="${filters.type === value ? "is-active" : ""}" data-catalog-level="${value}"><span>${label}</span><b>${count}</b></button>`
      )
      .join("");
  }
  const options = allOptions.filter((option) => {
    if (filters.type && option.type !== filters.type) return false;
    if (!search) return true;
    return normalizeSearchText(`${option.name} ${locationOptionPath(option)} ${catalogTypeMeta(option.type).label}`).includes(search);
  });
  const resultCount = $("#catalogResultCount");
  if (resultCount) resultCount.textContent = `${options.length} ${options.length === 1 ? "ubicación" : "ubicaciones"}`;
  list.innerHTML = options.length
    ? options
        .map((option) => {
          const meta = catalogTypeMeta(option.type);
          const nextType = nextCatalogType(option.type);
          const children = allOptions.filter((item) => item.parentId === option.id).length;
          const properties = Number(option.propertyCount || 0);
          return `
            <article class="catalog-entry ${option.isActive === false ? "is-inactive" : ""} ${$("#locationCatalogForm")?.elements.id.value === option.id ? "is-editing" : ""}">
              <div class="catalog-entry-icon"><i data-lucide="${meta.icon}"></i></div>
              <div class="catalog-entry-copy">
                <div class="catalog-entry-name">
                  <strong>${escapeHtml(option.name)}</strong>
                  <span class="catalog-type-badge">${escapeHtml(meta.label)}</span>
                  ${option.isActive === false ? `<span class="catalog-status-badge">Inactivo</span>` : ""}
                </div>
                <small>${escapeHtml(locationOptionPath(option))}</small>
              </div>
              <div class="catalog-entry-metrics">
                <span><b>${properties}</b> propiedad${properties === 1 ? "" : "es"}</span>
                ${nextType ? `<span><b>${children}</b> subnivel${children === 1 ? "" : "es"}</span>` : ""}
              </div>
              <div class="catalog-actions">
                ${nextType ? `<button class="catalog-child-button" type="button" data-add-location-child="${escapeHtml(option.id)}"><i data-lucide="corner-down-right"></i> Agregar debajo</button>` : ""}
                <button class="catalog-icon-button" type="button" data-edit-location="${escapeHtml(option.id)}" aria-label="Editar ${escapeHtml(option.name)}" title="Editar"><i data-lucide="pencil"></i></button>
                <button class="catalog-icon-button" type="button" data-toggle-location="${escapeHtml(option.id)}" aria-label="${option.isActive ? "Desactivar" : "Activar"} ${escapeHtml(option.name)}" title="${option.isActive ? "Desactivar" : "Activar"}"><i data-lucide="${option.isActive ? "eye-off" : "eye"}"></i></button>
                <button class="catalog-icon-button danger" type="button" data-delete-location="${escapeHtml(option.id)}" aria-label="Eliminar ${escapeHtml(option.name)}" title="Eliminar"><i data-lucide="trash-2"></i></button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<div class="catalog-empty-state"><i data-lucide="search-x"></i><h3>No encontramos ubicaciones</h3><p>Prueba otro término o limpia los filtros. También puedes agregar este lugar al catálogo.</p><button class="primary-button" type="button" data-new-location>Agregar ubicación</button></div>`;
  refreshIcons();
}

function catalogTypeMeta(type) {
  return {
    state: { label: "Estado", icon: "map" },
    city: { label: "Municipio", icon: "building-2" },
    zone: { label: "Zona", icon: "route" },
    neighborhood: { label: "Colonia", icon: "home" },
  }[type] || { label: "Ubicación", icon: "map-pin" };
}

function nextCatalogType(type) {
  return { state: "city", city: "zone", zone: "neighborhood" }[type] || "";
}

function locationOptionPath(option) {
  const parts = [];
  const visited = new Set();
  let current = option;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);
    current = current.parentId ? state.locationOptions.find((item) => item.id === current.parentId) : null;
  }
  return parts.join(" › ");
}

function renderCatalogParentOptions() {
  const form = $("#locationCatalogForm");
  if (!form) return;
  const type = form.elements.type.value;
  const parentSelect = form.elements.parentId;
  const parentType = type === "city" ? "state" : type === "zone" ? "city" : type === "neighborhood" ? "zone" : "";
  parentSelect.innerHTML = `<option value="">${escapeHtml(t("noParent"))}</option>`;
  if (!parentType) {
    parentSelect.disabled = true;
    return;
  }
  parentSelect.disabled = false;
  locationOptionsByType(parentType).forEach((option) => {
    parentSelect.append(new Option(locationOptionPath(option), option.id));
  });
}

async function refreshLocationOptions() {
  const data = await api("/api/location-options");
  state.locationOptions = data.options || [];
  refreshLocationSelects();
  renderCatalogParentOptions();
  renderLocationCatalogs();
}

async function locationCatalogSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#catalogFormMessage");
  setFormMessage(message, "");
  try {
    const id = form.elements.id.value;
    await api(id ? `/api/admin/location-options/${encodeURIComponent(id)}` : "/api/admin/location-options", {
      method: id ? "PUT" : "POST",
      body: {
        type: form.type.value,
        parentId: form.parentId.value,
        name: form.name.value.trim(),
        sortOrder: Number(form.sortOrder.value || 0),
        isActive: form.isActive.checked,
      },
    });
    resetCatalogForm();
    await refreshLocationOptions();
    setFormMessage(message, t("catalogSaved"));
  } catch (error) {
    setFormMessage(message, error.message, true);
  }
}

function editLocationOption(id) {
  const option = state.locationOptions.find((item) => item.id === id);
  const form = $("#locationCatalogForm");
  if (!option || !form) return;
  form.elements.id.value = option.id;
  form.elements.type.value = option.type;
  renderCatalogParentOptions();
  form.elements.parentId.value = option.parentId || "";
  form.elements.name.value = option.name;
  form.elements.sortOrder.value = option.sortOrder || 0;
  form.elements.isActive.checked = option.isActive !== false;
  $("#catalogFormTitle").textContent = `Editar ${option.name}`;
  $("#catalogFormContext").textContent = `Ruta actual: ${locationOptionPath(option)}`;
  $("#catalogEditor")?.classList.add("is-editing");
  renderLocationCatalogs();
  form.elements.name.focus({ preventScroll: true });
  $("#catalogEditor")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function prepareChildLocation(parentId) {
  const parent = state.locationOptions.find((item) => item.id === parentId);
  const childType = parent ? nextCatalogType(parent.type) : "";
  const form = $("#locationCatalogForm");
  if (!parent || !childType || !form) return;
  resetCatalogForm();
  form.elements.type.value = childType;
  renderCatalogParentOptions();
  form.elements.parentId.value = parent.id;
  const childLabel = catalogTypeMeta(childType).label.toLowerCase();
  $("#catalogFormTitle").textContent = `Agregar ${childLabel}`;
  $("#catalogFormContext").textContent = `Se guardará dentro de ${locationOptionPath(parent)}.`;
  form.elements.name.focus({ preventScroll: true });
  $("#catalogEditor")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function toggleLocationOption(id) {
  const option = state.locationOptions.find((item) => item.id === id);
  if (!option) return;
  try {
    await api(`/api/admin/location-options/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { isActive: !option.isActive },
    });
    await refreshLocationOptions();
    setFormMessage($("#catalogFormMessage"), t("catalogSaved"));
  } catch (error) {
    setFormMessage($("#catalogFormMessage"), error.message, true);
  }
}

function resetCatalogForm() {
  const form = $("#locationCatalogForm");
  if (!form) return;
  form.reset();
  form.elements.id.value = "";
  form.elements.isActive.checked = true;
  form.elements.sortOrder.value = "0";
  renderCatalogParentOptions();
  $("#catalogFormTitle").textContent = "Agregar ubicación";
  $("#catalogFormContext").textContent = "Selecciona el nivel y su ubicación superior. Los campos se adaptan automáticamente.";
  $("#catalogEditor")?.classList.remove("is-editing");
  setFormMessage($("#catalogFormMessage"), "");
  renderLocationCatalogs();
}

async function deleteLocationOption(id) {
  try {
    await api(`/api/admin/location-options/${encodeURIComponent(id)}`, { method: "DELETE" });
    await refreshLocationOptions();
    setFormMessage($("#catalogFormMessage"), t("catalogDeleted"));
  } catch (error) {
    setFormMessage($("#catalogFormMessage"), error.message, true);
  }
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function populateAdminListingFilter(select, values, current, emptyLabel) {
  if (!select) return;
  select.innerHTML = "";
  select.append(new Option(emptyLabel, ""));
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)).forEach((value) => select.append(new Option(value, value)));
  select.value = current || "";
}

function renderAdminListingFilters() {
  const filters = state.adminListingFilters;
  const search = $("#adminListingSearch");
  if (search && search.value !== filters.search) search.value = filters.search;
  populateAdminListingFilter($("#adminListingTypeFilter"), state.properties.map((item) => item.type), filters.type, "Todos");
  populateAdminListingFilter($("#adminListingZoneFilter"), state.properties.map((item) => item.zone), filters.zone, "Todas");
  if ($("#adminListingOperationFilter")) $("#adminListingOperationFilter").value = filters.operation;
  if ($("#adminListingStatusFilter")) $("#adminListingStatusFilter").value = filters.status;
  if ($("#adminListingQualityFilter")) $("#adminListingQualityFilter").value = filters.quality;
}

function renderAdminListings() {
  const list = $("#adminListings");
  if (!list) return;
  const allProperties = sortedProperties(state.properties);
  const filters = state.adminListingFilters;
  const search = normalizeSearchText(filters.search);
  const properties = allProperties.filter((property) => {
    if (filters.type && property.type !== filters.type) return false;
    if (filters.zone && property.zone !== filters.zone) return false;
    if (filters.operation && property.operation !== filters.operation) return false;
    if (filters.status && property.status !== filters.status) return false;
    if (filters.quality === "incomplete" && (property.qualityScore || 0) >= 70) return false;
    if (filters.quality === "ready" && (property.qualityScore || 0) < 70) return false;
    if (filters.missingCover && storedImages(property).length > 0) return false;
    if (!search) return true;
    const haystack = normalizeSearchText(
      [
        localizedTitle(property), property.titleEs, property.titleEn, property.zone, property.city, property.state,
        property.neighborhood, property.address, property.mapPlace, property.type, property.operation, property.status,
        property.mls, localizedDescription(property), ...(Array.isArray(property.keywords) ? property.keywords : []),
      ].join(" ")
    );
    return haystack.includes(search);
  });
  const summary = $("#adminListingSummary");
  if (summary) {
    const featured = allProperties.filter((property) => property.featured).length;
    summary.textContent = `${properties.length} de ${allProperties.length} ${t("adminListingSummary")} · ${featured} ${t("navFeatured")}`;
  }
  if (!properties.length) {
    const filtered = search || filters.type || filters.zone || filters.operation || filters.status || filters.quality || filters.missingCover;
    list.innerHTML = `<p class="empty-state">${escapeHtml(filtered ? "No se encontraron publicaciones con esa búsqueda." : t("listingsEmpty"))}</p>`;
    return;
  }
  list.innerHTML = properties
    .map((property) => {
      const description = localizedDescription(property);
      const excerpt = truncateText(description, 180);
      const hasMore = description.length > excerpt.length;
      return `
        <div class="listing-item detailed-listing">
          <img src="${escapeHtml(primaryImage(property))}" alt="${escapeHtml(localizedTitle(property))}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" />
          <div class="listing-content">
            <div class="listing-heading">
              <div>
                <span class="status ${property.featured ? "approved" : ""}">${escapeHtml(property.featured ? t("navFeatured") : displayType(property.type))}</span>
                <span class="status status-${escapeHtml(property.status || "active")}">${escapeHtml(propertyStatusLabel(property.status))}</span>
                <h3>${escapeHtml(localizedTitle(property))}</h3>
              </div>
              <strong>${escapeHtml(formatPriceSummary(property))}</strong>
            </div>
            <p>${escapeHtml(displayLocation(property))} · ${escapeHtml(displayType(property.type))} · ${escapeHtml(property.mls ? `${t("mls")} ${property.mls}` : "")}</p>
            ${
              Array.isArray(property.keywords) && property.keywords.length
                ? `<div class="listing-keywords">${property.keywords.slice(0, 10).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>`
                : ""
            }
            <div class="listing-facts">
              <span>${escapeHtml(property.beds || 0)} ${escapeHtml(t("bedShort"))}</span>
              <span>${escapeHtml(property.baths || 0)} ${escapeHtml(t("bathShort"))}</span>
              <span>${escapeHtml(property.area || 0)} ${escapeHtml(t("sqmBuild"))}</span>
              <span>${escapeHtml(property.operation === "rent" ? t("rent") : t("sale"))}</span>
              <span>${escapeHtml(t("qualityScore"))}: ${escapeHtml(property.qualityScore || 0)}% · ${escapeHtml(qualityLevelLabel(property.qualityLevel))}</span>
            </div>
            ${
              Array.isArray(property.qualityMissing) && property.qualityMissing.length
                ? `<p class="quality-missing">${escapeHtml(t("propertyQualityMissing"))}: ${escapeHtml(property.qualityMissing.slice(0, 5).join(", "))}</p>`
                : ""
            }
            <p class="listing-excerpt">${escapeHtml(excerpt)}</p>
            ${
              hasMore
                ? `<details class="listing-more"><summary>${escapeHtml(t("showMore"))}</summary><p>${escapeHtml(description)}</p></details>`
                : ""
            }
            <div class="item-actions">
              <button class="mini-button primary" type="button" data-edit-listing="${escapeHtml(property.id)}">${escapeHtml(t("edit"))}</button>
              <button class="mini-button" type="button" data-status-listing="${escapeHtml(property.id)}" data-status-value="active">${escapeHtml(t("markActive"))}</button>
              <button class="mini-button" type="button" data-status-listing="${escapeHtml(property.id)}" data-status-value="disabled">${escapeHtml(t("markDisabled"))}</button>
              <button class="mini-button" type="button" data-status-listing="${escapeHtml(property.id)}" data-status-value="sold">${escapeHtml(t("markSold"))}</button>
              <button class="mini-button" type="button" data-feature-listing="${escapeHtml(property.id)}" data-feature-value="${property.featured ? "false" : "true"}">${property.featured ? "Quitar destacada" : "Destacar"}</button>
              <button class="mini-button" type="button" data-duplicate-listing="${escapeHtml(property.id)}">Duplicar</button>
              <button class="mini-button pdf-institutional-button" type="button" data-generate-property-pdf="${escapeHtml(property.id)}" data-pdf-mode="branded">PDF institucional</button>
              <button class="mini-button pdf-neutral-button" type="button" data-generate-property-pdf="${escapeHtml(property.id)}" data-pdf-mode="neutral">PDF neutro</button>
              <button class="mini-button" type="button" data-pdf-property="${escapeHtml(property.id)}">Configurar PDF</button>
              <button class="mini-button" type="button" data-detail="${escapeHtml(property.id)}">Ver detalle público</button>
              <button class="mini-button danger" type="button" data-delete-listing="${escapeHtml(property.id)}">${escapeHtml(t("archiveListing"))}</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function qualityLevelLabel(level) {
  if (level === "premium") return t("qualityPremium");
  if (level === "ready") return t("qualityReady");
  if (level === "needs_work") return t("qualityNeedsWork");
  return t("qualityIncomplete");
}

function nextActionForLead(lead) {
  const payload = lead.payload || {};
  if (!lead.phone && !lead.email) return state.lang === "en" ? "Request contact details" : "Pedir datos de contacto";
  if (leadCategory(lead.leadType) === "valuation") return state.lang === "en" ? "Prepare valuation range" : "Preparar rango de valoracion";
  if (leadCategory(lead.leadType) === "property_contact") return state.lang === "en" ? "Send property details" : "Enviar detalles de propiedad";
  if (payload.zone && payload.propertyType) return state.lang === "en" ? "Match with active listings" : "Cruzar con propiedades activas";
  return state.lang === "en" ? "Contact and qualify" : "Contactar y calificar";
}

function formatMaybePrice(value, currency = "USD") {
  const number = Number(value || 0);
  if (!number) return "-";
  const locale = currency === "MXN" ? "es-MX" : "en-US";
  return `${currency} $${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(number)}`;
}

function valuationStatusLabel(status) {
  if (status === "in_review" || status === "in_analysis") return state.lang === "en" ? "In analysis" : "En analisis";
  if (status === "valuation_sent") return t("leadStatusContacted");
  if (status === "closed") return t("leadStatusClosed");
  return t("leadStatusNew");
}

function renderAdminValuations() {
  const list = $("#adminValuations");
  if (!list) return;
  const valuations = [...state.valuations].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  if (!valuations.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("noValuations"))}</p>`;
    return;
  }
  list.innerHTML = valuations
    .map((valuation) => {
      const range =
        valuation.lowRange || valuation.highRange
          ? `${formatMaybePrice(valuation.lowRange)} - ${formatMaybePrice(valuation.highRange)}`
          : "-";
      return `
        <article class="wide-row valuation-row">
          <div class="wide-row-main">
            <span class="status ${escapeHtml(valuation.status || "new")}">${escapeHtml(valuationStatusLabel(valuation.status))}</span>
            <h3>${escapeHtml(valuation.ownerName || "-")}</h3>
            <p>${escapeHtml(valuation.zone || "-")} · ${escapeHtml(valuation.propertyType || "-")} · ${escapeHtml(formatDate(valuation.createdAt))}</p>
          </div>
          <div class="wide-row-metrics">
            <div><span>${escapeHtml(t("price"))}</span><strong>${escapeHtml(formatMaybePrice(valuation.expectedPrice))}</strong></div>
            <div><span>${escapeHtml(t("suggestedPrice"))}</span><strong>${escapeHtml(formatMaybePrice(valuation.suggestedPrice))}</strong></div>
            <div><span>${escapeHtml(t("lowRange"))} / ${escapeHtml(t("highRange"))}</span><strong>${escapeHtml(range)}</strong></div>
            <div><span>${escapeHtml(t("confidenceLevel"))}</span><strong>${escapeHtml(valuation.confidenceLevel || "manual")}</strong></div>
          </div>
          <p>${escapeHtml(truncateText(valuation.comments || "", 220))}</p>
          <div class="item-actions">
            ${valuation.phone ? `<a class="mini-button primary" href="https://wa.me/${leadPhoneForWhatsApp(valuation.phone)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("respondWhatsApp"))}</a>` : ""}
            ${valuation.email ? `<a class="mini-button" href="mailto:${escapeHtml(valuation.email)}">${escapeHtml(t("respondEmail"))}</a>` : ""}
            <button class="mini-button" type="button" data-task-from="valuation" data-task-title="${escapeHtml(`Seguimiento valoracion ${valuation.ownerName || ""}`)}" data-related-id="${escapeHtml(valuation.requestId || valuation.id)}">${escapeHtml(t("createTask"))}</button>
            ${!String(valuation.id).startsWith("lead-") ? `<button class="mini-button" type="button" data-pdf-valuation="${escapeHtml(valuation.id)}">Generar PDF</button>` : ""}
            ${valuation.requestId ? `<button class="mini-button" type="button" data-respond-lead="${escapeHtml(valuation.requestId)}">Responder</button>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

async function valuationSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#valuationFormMessage");
  setFormMessage(message, "");
  try {
    await api("/api/admin/valuations", {
      method: "POST",
      body: {
        ownerName: form.ownerName.value.trim(),
        phone: form.phone.value.trim(),
        zone: form.zone.value.trim(),
        propertyType: form.propertyType.value.trim(),
        expectedPrice: form.expectedPrice.value,
        suggestedPrice: form.suggestedPrice.value,
        lowRange: form.lowRange.value,
        highRange: form.highRange.value,
        confidenceLevel: form.confidenceLevel.value,
        comments: form.comments.value.trim(),
        status: form.status.value,
      },
    });
    form.reset();
    await renderPanel();
    setFormMessage(message, t("requestSent"));
  } catch (error) {
    setFormMessage(message, error.message, true);
  }
}

function renderAdminTasks() {
  const list = $("#adminTasks");
  if (!list) return;
  const now = new Date();
  const week = new Date(now);
  week.setDate(now.getDate() + 7);
  const tasks = state.tasks.filter((task) => {
    const due = task.dueDate ? new Date(task.dueDate) : null;
    if (state.taskFilter === "completed") return task.status === "completed";
    if (state.taskFilter === "overdue") return due && due < now && task.status !== "completed";
    if (state.taskFilter === "today") return due && due.toDateString() === now.toDateString();
    if (state.taskFilter === "week") return due && due >= now && due <= week && task.status !== "completed";
    return true;
  });
  $$("[data-task-filter]").forEach((button) => button.classList.toggle("active", button.dataset.taskFilter === state.taskFilter));
  if (!tasks.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("noTasks"))}</p>`;
    return;
  }
  list.innerHTML = tasks
    .map(
      (task) => `
        <article class="wide-row task-row">
          <div class="wide-row-main">
            <span class="status priority-${escapeHtml(task.priority || "medium")}">${escapeHtml(task.priority || "medium")}</span>
            <span class="status ${escapeHtml(task.status || "pending")}">${escapeHtml(task.status === "completed" ? t("taskCompleted") : task.status === "in_progress" ? t("taskInProgress") : t("pending"))}</span>
            <h3>${escapeHtml(task.title)}</h3>
            <p>${escapeHtml(task.assignedTo || "Puerto Cancun Center")} · ${escapeHtml(task.dueDate ? formatDate(task.dueDate) : "-")}</p>
          </div>
          <p>${escapeHtml(task.description || "")}</p>
          <div class="item-actions">
            <button class="mini-button" type="button" data-task-status="${escapeHtml(task.id)}" data-task-status-value="in_progress">${escapeHtml(t("taskInProgress"))}</button>
            <button class="mini-button primary" type="button" data-task-status="${escapeHtml(task.id)}" data-task-status-value="completed">${escapeHtml(t("taskCompleted"))}</button>
          </div>
        </article>
      `
    )
    .join("");
}

async function taskSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#taskFormMessage");
  setFormMessage(message, "");
  try {
    await api("/api/admin/tasks", {
      method: "POST",
      body: {
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        dueDate: form.dueDate.value,
        priority: form.priority.value,
        assignedTo: form.assignedTo.value,
        relatedEntityType: form.relatedEntityType.value,
        relatedEntityId: form.relatedEntityId.value.trim(),
        status: "pending",
      },
    });
    form.reset();
    await renderPanel();
    setFormMessage(message, t("requestSent"));
  } catch (error) {
    setFormMessage(message, error.message, true);
  }
}

async function updateTaskStatus(id, status) {
  await api(`/api/admin/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } });
  await renderPanel();
}

async function createTaskFromButton(button) {
  const title = button.dataset.taskTitle || t("createTask");
  await api("/api/admin/tasks", {
    method: "POST",
    body: {
      title,
      priority: "high",
      relatedEntityType: button.dataset.taskFrom || "",
      relatedEntityId: button.dataset.relatedId || "",
    },
  });
  await renderPanel();
  setAdminSection("tasks");
}

function renderAdminMatches() {
  const list = $("#adminMatches");
  if (!list) return;
  if (!state.matches.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("noMatches"))}</p>`;
    return;
  }
  list.innerHTML = state.matches
    .map(
      (match) => `
        <article class="wide-row match-row">
          <div class="wide-row-main">
            <span class="status score-${match.score >= 85 ? "premium" : match.score >= 70 ? "hot" : "warm"}">${escapeHtml(match.score)}% ${escapeHtml(t("matchScore"))}</span>
            <h3>${escapeHtml(match.contactName)} → ${escapeHtml(match.propertyTitle)}</h3>
            <p>${escapeHtml(match.propertyZone)} · ${escapeHtml(match.propertyType)} · ${escapeHtml(formatMaybePrice(match.priceUsd))}</p>
          </div>
          <p>${escapeHtml(match.reason)}</p>
          <div class="item-actions">
            ${match.contactPhone ? `<a class="mini-button primary" href="https://wa.me/${leadPhoneForWhatsApp(match.contactPhone)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("prepareMessage"))}</a>` : ""}
            <button class="mini-button" type="button" data-task-from="match" data-task-title="${escapeHtml(`Seguimiento match ${match.contactName}`)}" data-related-id="${escapeHtml(match.id)}">${escapeHtml(t("createTask"))}</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderAdminAnalytics() {
  const container = $("#adminAnalytics");
  if (!container) return;
  const blocks = [
    [t("analyticsTitle"), state.analytics.eventsByType || [], "event_type"],
    [t("adminTopZones"), state.analytics.searchZones || [], "zone"],
    [t("tableSource"), state.analytics.leadSources || [], "source"],
    [t("adminJumpListings"), state.analytics.propertyEvents || [], "title_es"],
    ["Propiedades por estado", state.analytics.propertyStatus || [], "status"],
    ["Inventario por zona", state.analytics.zoneInventory || [], "zone"],
    ["Tareas por estado", state.analytics.taskStatus || [], "status"],
    ["Campañas por estado", state.analytics.campaignStatus || [], "status"],
    ["Solicitudes por tipo", state.analytics.leadTypes || [], "lead_type"],
  ];
  container.innerHTML = blocks
    .map(
      ([title, rows, key]) => `
        <article class="analytics-card">
          <h3>${escapeHtml(title)}</h3>
          ${
            rows.length
              ? rows
                  .map((row) => `<div><span>${escapeHtml(row[key] || "-")}</span><strong>${escapeHtml(row.count || 0)}</strong></div>`)
                  .join("")
              : `<p class="empty-state">${escapeHtml(t("listingsEmpty"))}</p>`
          }
        </article>
      `
    )
    .join("");
}

function renderAdminMap() {
  const list = $("#adminMapSummary");
  const propertyList = $("#adminMapPropertyList");
  if (!list || !propertyList) return;
  const selectedZone = $("#smartMapZone")?.value || "";
  const selectedStatus = $("#smartMapStatus")?.value || "";
  const selectedType = $("#smartMapType")?.value || "";
  const layer = $("#smartMapLayer")?.value || "properties";
  const zones = Object.entries(countBy(state.properties, "zone"))
    .sort((a, b) => b[1] - a[1])
    .map(([zone, inventory]) => {
      const leads = state.leads.filter((lead) => (lead.payload?.zone || "") === zone).length;
      return { zone, inventory, leads };
    });
  list.innerHTML = zones.length
    ? zones
        .map(
          (item) => `
            <article class="wide-row compact-row">
              <div class="wide-row-main">
                <h3>${escapeHtml(item.zone)}</h3>
                <p>${escapeHtml(item.inventory)} ${escapeHtml(t("adminInventory"))} · ${escapeHtml(item.leads)} leads</p>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">${escapeHtml(t("listingsEmpty"))}</p>`;
  const properties = state.properties.filter(
    (property) =>
      (!selectedZone || property.zone === selectedZone) &&
      (!selectedStatus || property.status === selectedStatus) &&
      (!selectedType || property.type === selectedType)
  );
  if (layer === "properties") {
    propertyList.innerHTML = properties.length
      ? properties
          .slice(0, 30)
          .map(
            (property) => `
              <button class="wide-row compact-row map-result-button" type="button" data-map-property="${escapeHtml(property.id)}">
                <div class="wide-row-main">
                  <h3>${escapeHtml(property.titleEs)}</h3>
                  <p>${escapeHtml(displayLocation(property))} · ${escapeHtml(formatPriceSummary(property))}</p>
                </div>
                <span class="status ${escapeHtml(property.status)}">${escapeHtml(property.status)}</span>
              </button>
            `
          )
          .join("")
      : `<p class="empty-state">No hay propiedades con estos filtros.</p>`;
  } else {
    const records =
      layer === "valuations"
        ? state.valuations.filter((item) => !selectedZone || item.zone === selectedZone)
        : state.leads.filter((item) => !selectedZone || item.payload?.zone === selectedZone);
    propertyList.innerHTML = records.length
      ? records
          .slice(0, 30)
          .map(
            (item) => `
              <article class="wide-row compact-row">
                <div class="wide-row-main"><h3>${escapeHtml(item.ownerName || item.name || "Contacto")}</h3><p>${escapeHtml(item.zone || item.payload?.zone || "Sin zona")} · ${escapeHtml(item.propertyType || item.payload?.propertyType || "")}</p></div>
              </article>
            `
          )
          .join("")
      : `<p class="empty-state">No hay registros para esta capa.</p>`;
  }
}

function focusMapProperty(id) {
  const property = state.properties.find((item) => item.id === id);
  if (!property) return;
  const query = property.latitude && property.longitude ? `${property.latitude},${property.longitude}` : displayLocation(property);
  $("#adminMapFrame").src = `https://www.google.com/maps?q=${encodeURIComponent(query || "Cancun, Quintana Roo")}&output=embed`;
}

function renderAdminSegments() {
  const buyers = $("#adminBuyers");
  const sellers = $("#adminSellers");
  const sellerContacts = state.contacts.filter((contact) => contact.contactType === "seller");
  if (buyers) {
    buyers.innerHTML = state.buyers.length
      ? state.buyers
          .map((buyer) => {
            const compatible = state.matches.filter((match) => match.contactId === buyer.contactId);
            const best = compatible[0];
            return `
              <article class="wide-row">
                <div class="wide-row-main">
                  <span class="status score-${escapeHtml(buyer.leadScore || "warm")}">${escapeHtml(scoreLabel(buyer.leadScore))}</span>
                  <h3>${escapeHtml(buyer.contactName)}</h3>
                  <p>${escapeHtml(buyer.phone || buyer.email || "-")} · ${escapeHtml((buyer.preferredZones || []).join(", ") || "Sin zona")}</p>
                </div>
                <div class="wide-row-metrics">
                  <div><span>Presupuesto</span><strong>${escapeHtml(formatMaybePrice(buyer.budgetMax))}</strong></div>
                  <div><span>Operación</span><strong>${escapeHtml(buyer.operation === "rent" ? "Renta" : "Compra")}</strong></div>
                  <div><span>Urgencia</span><strong>${escapeHtml(buyer.urgency || "media")}</strong></div>
                  <div><span>Radar</span><strong>${escapeHtml(best ? `${best.score}%` : "Sin match")}</strong></div>
                </div>
                ${best ? `<p><strong>Mejor coincidencia:</strong> ${escapeHtml(best.propertyTitle)}. ${escapeHtml(best.reason)}</p>` : `<p>Completa zona, tipo y presupuesto para generar coincidencias.</p>`}
                <div class="item-actions">
                  ${buyer.phone ? `<a class="mini-button primary" href="https://wa.me/${leadPhoneForWhatsApp(buyer.phone)}" target="_blank" rel="noopener">Preparar WhatsApp</a>` : ""}
                  <button class="mini-button" type="button" data-task-from="buyer" data-task-title="${escapeHtml(`Seguimiento comprador ${buyer.contactName}`)}" data-related-id="${escapeHtml(buyer.contactId)}">Crear tarea</button>
                  <button class="mini-button" type="button" data-admin-section-link="matches">Ver radar</button>
                </div>
              </article>
            `;
          })
          .join("")
      : `<p class="empty-state">Crea un perfil comprador para registrar presupuesto, zonas, objetivo y generar su radar de propiedades.</p>`;
  }
  if (sellers) {
    sellers.innerHTML = sellerContacts.length
      ? sellerContacts
          .map((contact) => {
            const requests = state.requests.filter((request) => request.email === contact.email || request.phone === contact.phone);
            const valuations = state.valuations.filter((valuation) => valuation.contactId === contact.id);
            const bestRequest = requests[0];
            let readiness = 20;
            if (bestRequest?.price) readiness += 15;
            if (bestRequest?.zone) readiness += 15;
            if ((bestRequest?.images || []).length >= 5) readiness += 20;
            if (bestRequest?.description?.length > 120) readiness += 15;
            if (bestRequest?.latitude) readiness += 15;
            const readinessLabel = readiness >= 80 ? "Lista para publicar" : readiness >= 50 ? "Necesita datos" : valuations.length ? "Necesita completar expediente" : "Necesita valoración";
            return `
              <article class="wide-row">
                <div class="wide-row-main">
                  <span class="status score-${escapeHtml(contact.leadScore || "warm")}">${escapeHtml(scoreLabel(contact.leadScore))}</span>
                  <h3>${escapeHtml(contact.name)}</h3>
                  <p>${escapeHtml(contact.phone || contact.email || "-")} · ${requests.length} solicitudes · ${valuations.length} valoraciones</p>
                </div>
                <div class="wide-row-metrics">
                  <div><span>Preparación</span><strong>${readiness}%</strong></div>
                  <div><span>Resultado</span><strong>${escapeHtml(readinessLabel)}</strong></div>
                  <div><span>Responsable</span><strong>${escapeHtml(contact.assignedTo || "Sin asignar")}</strong></div>
                </div>
                <div class="item-actions">
                  ${contact.phone ? `<a class="mini-button primary" href="https://wa.me/${leadPhoneForWhatsApp(contact.phone)}" target="_blank" rel="noopener">Pedir datos</a>` : ""}
                  <button class="mini-button" type="button" data-task-from="seller" data-task-title="${escapeHtml(`Seguimiento propietario ${contact.name}`)}" data-related-id="${escapeHtml(contact.id)}">Crear seguimiento</button>
                  ${bestRequest ? `<button class="mini-button" type="button" data-respond-request="${escapeHtml(bestRequest.id)}">Abrir solicitud</button>` : ""}
                </div>
              </article>
            `;
          })
          .join("")
      : `<p class="empty-state">Aquí aparecerán propietarios captados desde solicitudes de venta, valoraciones y registros manuales del CRM.</p>`;
  }
}

function renderContactSegment(contacts, emptyLabel) {
  if (!contacts.length) return `<p class="empty-state">${escapeHtml(emptyLabel)}: ${escapeHtml(t("noContacts"))}</p>`;
  return contacts
    .map(
      (contact) => `
        <article class="wide-row compact-row">
          <div class="wide-row-main">
            <span class="status score-${escapeHtml(contact.leadScore || "cold")}">${escapeHtml(scoreLabel(contact.leadScore))}</span>
            <h3>${escapeHtml(contact.name)}</h3>
            <p>${escapeHtml(contact.phone || contact.email || "-")} · ${escapeHtml((contact.preferredZones || []).join(", ") || "-")}</p>
          </div>
          <div class="item-actions">
            ${contact.phone ? `<a class="mini-button primary" href="https://wa.me/${leadPhoneForWhatsApp(contact.phone)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("respondWhatsApp"))}</a>` : ""}
            <button class="mini-button" type="button" data-task-from="contact" data-task-title="${escapeHtml(`Seguimiento ${contact.name}`)}" data-related-id="${escapeHtml(contact.id)}">${escapeHtml(t("createTask"))}</button>
          </div>
        </article>
      `
    )
    .join("");
}

function operationCard(title, value, copy) {
  return `<article class="operation-card"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(copy)}</p></article>`;
}

function renderOperationalModules() {
  renderMarketing();
  renderDocuments();
  renderMediaLibrary();
  renderInternalUsers();
  renderAdminNotifications();
  renderSystemHealth();
  renderAdminActivity();
  populateOperationalSelects();
}

let networkStatusTimer = 0;
function updateNetworkStatus(online = navigator.onLine, announceRecovery = false) {
  const banner = $("#networkStatus");
  if (!banner) return;
  window.clearTimeout(networkStatusTimer);
  banner.classList.toggle("is-online", online);
  const icon = banner.querySelector("i");
  const copy = banner.querySelector("span");
  if (icon) icon.setAttribute("data-lucide", online ? "wifi" : "wifi-off");
  if (copy) copy.textContent = online
    ? "La conexión se restableció. Ya puedes reintentar la operación."
    : "Sin conexión. Conservaremos los datos del formulario para que puedas reintentar.";
  banner.hidden = online && !announceRecovery;
  if (online && announceRecovery) networkStatusTimer = window.setTimeout(() => { banner.hidden = true; }, 3500);
  refreshIcons();
}

function healthItem(label, value, detail, ok = true) {
  return `<article class="system-health-item ${ok ? "is-ok" : "is-warning"}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(detail)}</small></article>`;
}

function renderReleaseInfo() {
  const element = $("#appRelease");
  if (!element) return;
  const version = state.platform?.version || "";
  const release = state.platform?.shortRelease || state.platform?.release || document.body.dataset.release || "";
  element.textContent = version || release ? `v${version || "?"} · ${release || "sin commit"}` : "";
  element.title = "Versión actualmente desplegada";
}

function renderSystemHealth() {
  const container = $("#systemHealthGrid");
  if (!container) return;
  const databaseReady = state.systemHealth?.databaseReady === true;
  const mapsReady = Boolean(state.config?.googleMapsApiKey);
  const aiReady = state.instagramStatus?.aiConfigured === true;
  const instagramReady = state.instagramStatus?.connected === true;
  const whatsappStatus = state.whatsapp?.overview?.status?.state || state.whatsapp?.overview?.status?.status || "disconnected";
  const whatsappReady = whatsappStatus === "connected";
  container.innerHTML = [
    healthItem("Versión", state.platform?.version || "No informada", state.platform?.shortRelease || state.platform?.release || "Commit no disponible", Boolean(state.platform?.version)),
    healthItem("PostgreSQL", databaseReady ? "Disponible" : "Revisar conexión", databaseReady ? "Consultas y sesiones operativas" : "La base no confirmó disponibilidad", databaseReady),
    healthItem("Google Maps", mapsReady ? "Configurado" : "Modo OpenStreetMap", mapsReady ? "Geocodificación de Google activa" : "Se utiliza el proveedor de respaldo", true),
    healthItem("OpenAI", aiReady ? "Configurado" : "Borrador local", aiReady ? "Generación asistida disponible" : "La IA usa contenido de respaldo", true),
    healthItem("Instagram", instagramReady ? "Conectado" : "Pendiente", instagramReady ? "Cuenta vinculada" : "Se puede copiar y abrir Instagram manualmente", instagramReady),
    healthItem("WhatsApp", whatsappReady ? "Conectado" : whatsappStatusLabels[whatsappStatus] || "Pendiente", "Estado de la integración operativa", whatsappReady),
  ].join("");
}

function activityActionLabel(activity) {
  const method = String(activity.metadata?.method || "").toUpperCase();
  const labels = { POST: "Creó", PUT: "Actualizó", PATCH: "Modificó", DELETE: "Eliminó" };
  return `${labels[method] || "Gestionó"} ${activity.entityType || "registro"}`;
}

function renderAdminActivity() {
  const container = $("#adminActivityList");
  if (!container) return;
  container.innerHTML = state.activity.length
    ? state.activity.map((activity) => `<article class="activity-row"><div><strong>${escapeHtml(activityActionLabel(activity))}</strong><p>${escapeHtml(activity.entityId || "colección")}</p></div><div><span>${escapeHtml(activity.userId || "sistema")}</span><small>${escapeHtml(activity.metadata?.requestId ? `Referencia ${activity.metadata.requestId}` : "Cambio registrado")}</small></div><time datetime="${escapeHtml(activity.createdAt || "")}">${escapeHtml(formatDate(activity.createdAt))}</time></article>`).join("")
    : `<p class="empty-state">Todavía no hay cambios administrativos registrados con el nuevo sistema de auditoría.</p>`;
}

async function refreshSystemHealth(button) {
  setButtonLoading(button, true, "Actualizando...");
  try {
    const [health, activity] = await Promise.all([
      api("/api/health", { retry: false }),
      api("/api/admin/activity?limit=80", { retry: false }),
    ]);
    state.systemHealth = health;
    state.activity = activity.activity || [];
    renderSystemHealth();
    renderAdminActivity();
    showToast("Estado operativo actualizado.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

function populateSelect(select, items, label, value = "id", emptyLabel = "Seleccionar") {
  if (!select) return;
  const current = select.value;
  select.innerHTML = `<option value="">${escapeHtml(emptyLabel)}</option>`;
  items.forEach((item) => select.append(new Option(label(item), item[value])));
  if (current && Array.from(select.options).some((option) => option.value === current)) select.value = current;
}

function populateOperationalSelects() {
  populateSelect($("#aiPropertySelect"), state.properties, (item) => item.titleEs, "id", "Sin propiedad");
  populateSelect($("#campaignPropertySelect"), state.properties, (item) => item.titleEs, "id", "Sin propiedad");
  populateSelect($("#instagramPropertySelect"), state.properties, (item) => `${item.titleEs} · ${displayLocation(item)}`, "id", "Selecciona una propiedad");
  populateSelect($("#pdfPropertySelect"), state.properties, (item) => item.titleEs, "id", "Selecciona una propiedad");
  populateSelect($("#pdfValuationSelect"), state.valuations, (item) => `${item.ownerName} · ${item.zone || "Sin zona"}`, "id", "Selecciona una valoración");
  populateSelect($("#aiRequestSelect"), state.leads, (item) => `${item.name} · ${leadTypeLabel(item.leadType)}`, "id", "Sin solicitud");
  $$("[data-staff-select]").forEach((select) => {
    const current = select.value;
    select.innerHTML = `<option value="">Sin asignar</option>`;
    state.internalUsers
      .filter((user) => user.status === "active")
      .forEach((user) => select.append(new Option(`${user.name} · ${user.role}`, user.id)));
    if (current) select.value = current;
  });
}

function renderMarketing() {
  const kpis = $("#adminMarketing");
  const list = $("#campaignList");
  const instagramStatus = $("#instagramConnectionStatus");
  const connectInstagram = $("#connectInstagram");
  const openInstagramProfile = $("#openInstagramProfile");
  if (instagramStatus) {
    const connected = state.instagramStatus?.connected === true;
    instagramStatus.querySelector(".status").className = `status ${connected ? "approved" : "pending"}`;
    instagramStatus.querySelector(".status").textContent = connected
      ? "Instagram conectado"
      : state.instagramStatus?.accountConfigured
        ? "Cuenta pendiente de token"
        : "Instagram sin configurar";
    if (connectInstagram) {
      connectInstagram.hidden = connected || !state.instagramStatus?.oauthUrl;
      connectInstagram.href = state.instagramStatus?.oauthUrl || "#";
    }
    if (openInstagramProfile) openInstagramProfile.href = state.instagramStatus?.profileUrl || "https://www.instagram.com/";
  }
  if (kpis) {
    kpis.innerHTML = [
      operationCard("Leads premium", state.stats.premiumLeads || 0, "Prioridad comercial"),
      operationCard("Compradores activos", state.buyers.filter((buyer) => buyer.status === "active").length, "Con perfil y presupuesto"),
      operationCard("Campañas preparadas", state.campaigns.filter((campaign) => campaign.status !== "sent").length, "Borradores y programadas"),
      operationCard("Campañas enviadas", state.campaigns.filter((campaign) => campaign.status === "sent").length, "Registro de seguimiento"),
    ].join("");
  }
  if (!list) return;
  list.innerHTML = state.campaigns.length
    ? state.campaigns
        .map(
          (campaign) => `
            <article class="wide-row compact-row">
              <div class="wide-row-main">
                <span class="status ${escapeHtml(campaign.status)}">${escapeHtml(campaign.status)}</span>
                <h3>${escapeHtml(campaign.name)}</h3>
                <p>${escapeHtml(campaign.segment)} · ${escapeHtml(campaign.channel)} · ${escapeHtml(campaign.scheduledAt ? formatDate(campaign.scheduledAt) : "Sin programar")}</p>
              </div>
              <p>${escapeHtml(truncateText(campaign.message, 180))}</p>
              <div class="item-actions">
                <a class="mini-button" href="/api/admin/campaigns/${encodeURIComponent(campaign.id)}/export">Exportar CSV</a>
                ${campaign.channel === "email" && campaign.status !== "sent" ? `<button class="mini-button primary" type="button" data-send-campaign-email="${escapeHtml(campaign.id)}">Enviar mailing</button>` : ""}
                ${campaign.status !== "sent" ? `<button class="mini-button primary" type="button" data-campaign-sent="${escapeHtml(campaign.id)}">Marcar enviada</button>` : ""}
                <button class="mini-button danger" type="button" data-delete-campaign="${escapeHtml(campaign.id)}">Eliminar</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No hay campañas. Crea una para preparar mensajes y segmentar contactos sin simular envíos masivos.</p>`;
}

function renderDocuments() {
  const list = $("#pdfHistory");
  if (!list) return;
  $("#pdfHistoryCount").textContent = `${state.documents.length} fichas`;
  list.innerHTML = state.documents.length
    ? state.documents
        .map(
          (document) => `
            <article class="wide-row compact-row">
              <div class="wide-row-main">
                <span class="status">${escapeHtml(document.documentType === "valuation" ? "VALORACIÓN" : "PROPIEDAD")}</span>
                <h3>${escapeHtml(document.title)}</h3>
                <p>${escapeHtml(formatDate(document.createdAt))} · ${escapeHtml(document.fileName)}</p>
              </div>
              <div class="item-actions">
                <a class="mini-button primary" href="/api/admin/documents/${encodeURIComponent(document.id)}/download">Descargar</a>
                <button class="mini-button danger" type="button" data-delete-document="${escapeHtml(document.id)}">Eliminar</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">Aún no hay fichas. Selecciona una propiedad o valoración y genera el primer PDF.</p>`;
}

function renderMediaLibrary() {
  const library = $("#adminFiles");
  if (!library) return;
  const search = ($("#mediaSearch")?.value || "").toLowerCase();
  const filter = $("#mediaTypeFilter")?.value || "";
  const files = state.files.filter((file) => {
    const matchesSearch = !search || `${file.name} ${file.category}`.toLowerCase().includes(search);
    const matchesType =
      !filter ||
      (filter === "image" && file.mimeType.startsWith("image/")) ||
      (filter === "pdf" && file.mimeType === "application/pdf") ||
      (filter === "document" && !file.mimeType.startsWith("image/") && file.mimeType !== "application/pdf");
    return matchesSearch && matchesType;
  });
  library.innerHTML = files.length
    ? files
        .map(
          (file) => `
            <article class="media-card">
              <div class="media-card-preview">
                ${file.mimeType.startsWith("image/") ? `<img src="/api/admin/files/${encodeURIComponent(file.id)}/download" alt="${escapeHtml(file.name)}" loading="lazy" />` : `<i data-lucide="${file.mimeType === "application/pdf" ? "file-text" : "file"}"></i>`}
              </div>
              <div class="media-card-body">
                <strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
                <span>${escapeHtml(file.category)} · ${escapeHtml(Math.max(1, Math.round(file.sizeBytes / 1024)))} KB</span>
                <span>${escapeHtml(file.relatedEntityType || "Sin asociación")}</span>
                <div class="item-actions">
                  <a class="mini-button" href="/api/admin/files/${encodeURIComponent(file.id)}/download">Descargar</a>
                  ${file.mimeType.startsWith("image/") ? `<button class="mini-button" type="button" data-use-media="${escapeHtml(file.id)}">Usar en publicación</button>` : ""}
                  <button class="mini-button danger" type="button" data-delete-media="${escapeHtml(file.id)}">Eliminar</button>
                </div>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No hay archivos con estos filtros. Sube imágenes, PDF o documentos para reutilizarlos.</p>`;
  refreshIcons();
}

function renderInternalUsers() {
  const list = $("#adminRoles");
  if (!list) return;
  list.innerHTML = state.internalUsers.length
    ? `
      <table class="data-table">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead>
        <tbody>
          ${state.internalUsers
            .map(
              (user) => `
                <tr>
                  <td><strong>${escapeHtml(user.name)}</strong></td>
                  <td>${escapeHtml(user.email)}</td>
                  <td>${escapeHtml(user.role)}</td>
                  <td><span class="status ${escapeHtml(user.status)}">${escapeHtml(user.status)}</span></td>
                  <td>${escapeHtml(user.lastLoginAt ? formatDate(user.lastLoginAt) : "Nunca")}</td>
                  <td><button class="mini-button" type="button" data-edit-user="${escapeHtml(user.id)}">Editar</button><button class="mini-button" type="button" data-toggle-user="${escapeHtml(user.id)}">${user.status === "active" ? "Desactivar" : "Activar"}</button></td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `
    : `<p class="empty-state">No hay usuarios internos. Crea asesores, editores o responsables de marketing con permisos explícitos.</p>`;
}

function renderAdminNotifications() {
  const list = $("#adminNotifications");
  if (!list) return;
  const unread = state.notifications.filter((notification) => !notification.is_read && !notification.isRead).length;
  $("#adminNotificationCount").textContent = String(unread);
  $("#adminNotificationCount").hidden = unread === 0;
  list.innerHTML = state.notifications.length
    ? state.notifications
        .map(
          (notification) => `
            <button class="notification-item ${notification.is_read ? "" : "unread"}" type="button" data-read-admin-notification="${escapeHtml(notification.id)}">
              <i data-lucide="bell-ring"></i>
              <span><h3>${escapeHtml(notification.title)}</h3><p>${escapeHtml(notification.message)}</p><time>${escapeHtml(formatDate(notification.created_at))}</time></span>
            </button>
          `
        )
        .join("")
    : `<p class="empty-state">No hay alertas administrativas.</p>`;
}

async function contactSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);
  try {
    await api("/api/admin/contacts", {
      method: "POST",
      body: {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        contactType: form.contactType.value,
        preferredZones: form.zone.value ? [form.zone.value] : [],
        budgetMax: form.budgetMax.value,
        assignedTo: form.assignedTo.value,
        leadScore: form.leadScore.value,
        notes: form.notes.value.trim(),
      },
    });
    form.reset();
    await renderPanel();
    showToast("Contacto creado en el CRM.");
  } catch (error) {
    setFormMessage($("#contactFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function buyerSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);
  try {
    await api("/api/admin/buyers", {
      method: "POST",
      body: {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        budgetMin: form.budgetMin.value,
        budgetMax: form.budgetMax.value,
        preferredZones: form.zone.value ? [form.zone.value] : [],
        propertyTypes: form.propertyType.value ? [form.propertyType.value] : [],
        operation: form.operation.value,
        bedrooms: form.bedrooms.value,
        bathrooms: form.bathrooms.value,
        objective: form.objective.value,
        urgency: form.urgency.value,
        notes: form.notes.value.trim(),
      },
    });
    form.reset();
    form.hidden = true;
    await renderPanel();
    showToast("Perfil comprador creado y agregado al radar.");
  } catch (error) {
    setFormMessage($("#buyerFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function campaignSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true);
  try {
    await api("/api/admin/campaigns", {
      method: "POST",
      body: Object.fromEntries(new FormData(form).entries()),
    });
    form.reset();
    await renderPanel();
    showToast("Campaña guardada. Ya puedes exportar su segmento o marcarla como enviada.");
  } catch (error) {
    setFormMessage($("#campaignFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function markCampaignSent(id) {
  await api(`/api/admin/campaigns/${encodeURIComponent(id)}`, { method: "PATCH", body: { status: "sent" } });
  await renderPanel();
  showToast("Campaña registrada como enviada.");
}

async function sendCampaignEmail(id, button) {
  if (!(await confirmAction("Se enviará este correo a todos los contactos con email del segmento seleccionado.", "Enviar mailing"))) return;
  setButtonLoading(button, true, "Enviando...");
  try {
    const result = await api(`/api/admin/campaigns/${encodeURIComponent(id)}/send-email`, { method: "POST" });
    await renderPanel();
    showToast(`Mailing completado: ${result.sent} enviados${result.failed ? `, ${result.failed} fallidos` : ""}.`);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function deleteCampaign(id) {
  if (!(await confirmAction("La campaña se eliminará del calendario e historial.", "Eliminar campaña"))) return;
  await api(`/api/admin/campaigns/${encodeURIComponent(id)}`, { method: "DELETE" });
  await renderPanel();
  showToast("Campaña eliminada.");
}

async function generateCampaignCopy() {
  const form = $("#campaignForm");
  const data = await api("/api/admin/ai/generate", {
    method: "POST",
    body: { tool: "campaign", propertyId: form.propertyId.value, input: form.message.value },
  });
  form.message.value = data.result.whatsapp || data.result.emailBody || JSON.stringify(data.result, null, 2);
  showToast("Borrador generado. Revísalo antes de guardarlo.");
}

async function aiToolSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Generando...");
  try {
    const data = await api("/api/admin/ai/generate", {
      method: "POST",
      body: Object.fromEntries(new FormData(form).entries()),
    });
    $("#aiResult").value = typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2);
    setFormMessage($("#aiToolMessage"), "Borrador generado con reglas internas. Requiere revisión humana.");
  } catch (error) {
    setFormMessage($("#aiToolMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function previewPdf() {
  const form = $("#pdfForm");
  const preview = $("#pdfPreview");
  const isValuation = form.documentType.value === "valuation";
  const entity = isValuation
    ? state.valuations.find((item) => item.id === form.valuationId.value)
    : state.properties.find((item) => item.id === form.propertyId.value);
  if (!entity) {
    preview.innerHTML = `<span class="eyebrow">VISTA PREVIA</span><h3>Selecciona un registro</h3><p>Elige una propiedad o valoración válida.</p>`;
    return;
  }
  const propertyMetrics = !isValuation
    ? [
        entity.beds ? `${new Intl.NumberFormat("es-MX").format(entity.beds)} recámaras` : "",
        entity.baths ? `${new Intl.NumberFormat("es-MX").format(entity.baths)} baños` : "",
        entity.area ? `${new Intl.NumberFormat("es-MX").format(entity.area)} m² construcción` : "",
        entity.lot ? `${new Intl.NumberFormat("es-MX").format(entity.lot)} m² terreno` : "",
      ].filter(Boolean).join(" · ")
    : "";
  const neutralAmenities = !isValuation && Array.isArray(entity.amenities)
    ? entity.amenities.filter(Boolean).join(" · ")
    : "";
  preview.innerHTML = isValuation
    ? `
      <span class="eyebrow">VALORACIÓN INMOBILIARIA</span>
      <h3>${escapeHtml(entity.ownerName)}</h3>
      <p>${escapeHtml(entity.zone || "-")} · ${escapeHtml(entity.propertyType || "-")}</p>
      <div class="preview-price">${escapeHtml(formatMaybePrice(entity.suggestedPrice || entity.expectedPrice))}</div>
      <p>Rango: ${escapeHtml(formatMaybePrice(entity.lowRange))} - ${escapeHtml(formatMaybePrice(entity.highRange))}</p>
      <p>${escapeHtml(entity.comments || "Requiere revisión del asesor.")}</p>
    `
    : `
      <span class="eyebrow">${form.brandMode.value === "neutral" ? "FICHA NEUTRA DETALLADA" : "FICHA COMERCIAL · PUERTO CANCÚN CENTER"}</span>
      <h3>${escapeHtml(entity.titleEs)}</h3>
      <p>${escapeHtml(displayLocation(entity))} · ${escapeHtml(entity.type)}</p>
      ${form.showPrice.checked ? `<div class="preview-price">${escapeHtml(formatPriceSummary(entity))}</div>` : ""}
      <p>${escapeHtml(propertyMetrics || "Sin características registradas")}</p>
      ${form.brandMode.value === "neutral" && neutralAmenities ? `<p><strong>Amenidades:</strong> ${escapeHtml(neutralAmenities)}</p>` : ""}
      <p>${escapeHtml(truncateText(entity.descriptionEs || "", form.brandMode.value === "neutral" ? 900 : 460))}</p>
    `;
}

async function pdfSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Generando PDF...");
  try {
    await generatePdfDocument({
      documentType: form.documentType.value,
      propertyId: form.propertyId.value,
      valuationId: form.valuationId.value,
      options: pdfOptionsFromForm(form, form.brandMode.value),
    });
    showToast("PDF generado y guardado en el historial.");
  } catch (error) {
    setFormMessage($("#pdfFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function pdfOptionsFromForm(form, brandMode = "branded") {
  return {
    currency: form?.currency?.value || "USD",
    brandMode: brandMode === "neutral" ? "neutral" : "branded",
    showPrice: form?.showPrice?.checked !== false,
    showAddress: form?.showAddress?.checked === true,
    disclaimer: String(form?.disclaimer?.value || "Información sujeta a disponibilidad y cambios sin previo aviso.").trim(),
  };
}

async function generatePdfDocument(payload) {
  const data = await api("/api/admin/documents/generate", { method: "POST", body: payload });
  await downloadFile(data.downloadUrl, data.document?.fileName || "ficha-propiedad.pdf");
  if (data.document) {
    state.documents = [data.document, ...state.documents.filter((item) => item.id !== data.document.id)];
    renderDocuments();
  }
  return data;
}

async function generatePropertyPdf(propertyId, brandMode, button) {
  const property = state.properties.find((item) => item.id === propertyId);
  if (!property) {
    showToast("Selecciona una propiedad válida para generar la ficha.", "error");
    return;
  }
  const mode = brandMode === "neutral" ? "neutral" : "branded";
  const form = $("#pdfForm");
  if (form) {
    form.propertyId.value = property.id;
    form.brandMode.value = mode;
    if (state.adminSection === "pdf") previewPdf();
  }
  setButtonLoading(button, true, mode === "neutral" ? "Generando PDF neutro..." : "Generando PDF institucional...");
  try {
    await generatePdfDocument({
      documentType: "property",
      propertyId: property.id,
      valuationId: "",
      options: pdfOptionsFromForm(form, mode),
    });
    setFormMessage($("#pdfFormMessage"), "");
    showToast(`${mode === "neutral" ? "PDF neutro" : "PDF institucional"} generado para ${property.titleEs}.`);
  } catch (error) {
    setFormMessage($("#pdfFormMessage"), error.message, true);
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function deleteDocument(id) {
  if (!(await confirmAction("La ficha se eliminará del historial.", "Eliminar ficha PDF"))) return;
  await api(`/api/admin/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
  await renderPanel();
  showToast("Ficha eliminada.");
}

async function deleteAllDocuments() {
  if (!state.documents.length) return;
  if (!(await confirmAction("Se eliminarán todas las fichas PDF del historial. Esta acción no elimina propiedades.", "Eliminar todas las fichas"))) return;
  const button = $("#deleteAllDocuments");
  setButtonLoading(button, true, "Eliminando...");
  try {
    await api("/api/admin/documents", { method: "DELETE" });
    state.documents = [];
    renderDocuments();
    showToast("Se eliminaron todas las fichas PDF.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function mediaUploadSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const file = form.file.files[0];
  if (!file) return;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Subiendo...");
  try {
    const content = await fileToDataUrl(file);
    await api("/api/admin/files", {
      method: "POST",
      body: {
        name: file.name,
        content,
        category: form.category.value,
        relatedEntityType: form.relatedEntityType.value,
        relatedEntityId: form.relatedEntityId.value.trim(),
      },
    });
    form.reset();
    await renderPanel();
    showToast("Archivo agregado a la biblioteca.");
  } catch (error) {
    setFormMessage($("#mediaFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function deleteMedia(id) {
  if (!(await confirmAction("El archivo dejará de estar disponible para reutilizarse.", "Eliminar archivo"))) return;
  await api(`/api/admin/files/${encodeURIComponent(id)}`, { method: "DELETE" });
  await renderPanel();
  showToast("Archivo eliminado.");
}

async function useMediaInListing(id) {
  const response = await fetch(`/api/admin/files/${encodeURIComponent(id)}/download`, { credentials: "same-origin" });
  const blob = await response.blob();
  const content = await fileToDataUrl(blob);
  const form = $("#listingForm");
  const images = safeParseImages(form.dataset.currentImages);
  if (!images.includes(content)) images.push(content);
  form.dataset.currentImages = JSON.stringify(images);
  form.dataset.removeImage = "false";
  form.dataset.mediaDirty = "true";
  form.dataset.persistentMediaDirty = "true";
  saveListingDraft();
  updateListingImagePreview(images);
  setAdminSection("properties");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Imagen agregada al formulario. Guarda la publicación para persistirla.");
}

async function internalUserSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  const permissions = Array.from(form.querySelectorAll('[name="permissions"]:checked')).map((item) => item.value);
  const body = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    role: form.role.value,
    status: form.status.value,
    permissions,
  };
  if (form.password.value) body.password = form.password.value;
  try {
    await api(id ? `/api/admin/users/${encodeURIComponent(id)}` : "/api/admin/users", {
      method: id ? "PATCH" : "POST",
      body,
    });
    form.reset();
    form.hidden = true;
    await renderPanel();
    showToast(id ? "Usuario actualizado." : "Usuario interno creado.");
  } catch (error) {
    setFormMessage($("#internalUserFormMessage"), error.message, true);
  }
}

function editInternalUser(id) {
  const user = state.internalUsers.find((item) => item.id === id);
  const form = $("#internalUserForm");
  if (!user || !form) return;
  form.hidden = false;
  form.elements.id.value = user.id;
  form.name.value = user.name;
  form.email.value = user.email;
  form.password.value = "";
  form.role.value = user.role;
  form.status.value = user.status;
  form.querySelectorAll('[name="permissions"]').forEach((input) => {
    input.checked = user.permissions.includes(input.value);
  });
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function toggleInternalUser(id) {
  const user = state.internalUsers.find((item) => item.id === id);
  if (!user) return;
  await api(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status: user.status === "active" ? "inactive" : "active" },
  });
  await renderPanel();
}

const settingsFieldConfig = {
  site: [
    ["siteName", "Nombre del sitio", "text"],
    ["phone", "Teléfono principal", "text"],
    ["whatsapp", "WhatsApp (solo números)", "text"],
    ["email", "Correo principal", "email"],
    ["address", "Dirección comercial", "text"],
    ["publicSiteUrl", "Dominio público", "url"],
    ["currencyPrimary", "Moneda principal", "text"],
    ["currencySecondary", "Moneda secundaria", "text"],
    ["exchangeRate", "Tipo de cambio manual", "number"],
    ["language", "Idioma predeterminado", "text"],
  ],
  maps: [
    ["apiKey", "API key", "password"],
    ["centerLat", "Latitud centro", "number"],
    ["centerLng", "Longitud centro", "number"],
    ["zoom", "Zoom inicial", "number"],
    ["restriction", "Restricción geográfica", "text"],
  ],
  seo: [
    ["metaTitle", "Meta title global", "text"],
    ["metaDescription", "Meta description global", "textarea"],
    ["openGraphImage", "Open Graph por defecto", "text"],
    ["structuredData", "Datos estructurados activos", "checkbox"],
    ["sitemap", "Sitemap activo", "checkbox"],
    ["robots", "Robots activo", "checkbox"],
  ],
  forms: [
    ["requiredPhone", "Teléfono obligatorio", "checkbox"],
    ["requiredEmail", "Correo obligatorio", "checkbox"],
    ["successMessage", "Mensaje de éxito", "textarea"],
    ["autoAssignment", "Asignación automática", "checkbox"],
  ],
  pdf: [
    ["showPrice", "Mostrar precio", "checkbox"],
    ["showExactAddress", "Mostrar dirección exacta", "checkbox"],
    ["disclaimer", "Disclaimer", "textarea"],
    ["advisorName", "Nombre del asesor", "text"],
  ],
  ai: [
    ["brandTone", "Tono de marca", "textarea"],
    ["maxLength", "Límite de respuesta", "number"],
    ["approvalRequired", "Aprobación humana obligatoria", "checkbox"],
  ],
};

function renderSettingsFields(section = $("#settingsForm")?.elements.section.value || "site") {
  const container = $("#settingsFields");
  const form = $("#settingsForm");
  if (!container || !form) return;
  form.elements.section.value = section;
  const values = state.settings[section] || {};
  container.innerHTML = (settingsFieldConfig[section] || [])
    .map(([key, label, type]) => {
      if (type === "checkbox") {
        return `<label class="checkbox-row"><input name="${escapeHtml(key)}" type="checkbox" ${values[key] ? "checked" : ""} /><span>${escapeHtml(label)}</span></label>`;
      }
      if (type === "textarea") {
        return `<label><span>${escapeHtml(label)}</span><textarea name="${escapeHtml(key)}" rows="4">${escapeHtml(values[key] || "")}</textarea></label>`;
      }
      return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(key)}" type="${escapeHtml(type)}" value="${escapeHtml(values[key] ?? "")}" ${type === "number" ? 'step="any"' : ""} /></label>`;
    })
    .join("");
}

async function settingsSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const section = form.elements.section.value;
  const body = {};
  (settingsFieldConfig[section] || []).forEach(([key, , type]) => {
    const field = form.elements[key];
    body[key] = type === "checkbox" ? field.checked : type === "number" ? Number(field.value || 0) : field.value.trim();
  });
  await api(`/api/admin/settings/${encodeURIComponent(section)}`, { method: "PUT", body });
  state.settings[section] = body;
  showToast("Configuración guardada.");
}

async function readAdminNotification(id) {
  await api(`/api/admin/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
  const item = state.notifications.find((notification) => notification.id === id);
  if (item) item.is_read = true;
  renderAdminNotifications();
}

function exportContactsCsv() {
  const rows = [["Nombre", "Email", "Telefono", "Tipo", "Score", "Zonas"]];
  state.contacts.forEach((contact) => {
    rows.push([
      contact.name || "",
      contact.email || "",
      contact.phone || "",
      contact.contactType || "",
      contact.leadScore || "",
      Array.isArray(contact.preferredZones) ? contact.preferredZones.join(" | ") : "",
    ]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "puerto-cancun-contactos.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const whatsappStatusLabels = {
  disconnected: "Sin conectar",
  connecting: "Conectando",
  qr: "QR listo",
  connected: "Conectado",
  reconnecting: "Reconectando",
  standby: "Activo en otra instancia",
  error: "Error de conexion",
};

function formatWhatsappTime(value, includeDate = false) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("es-MX", includeDate
    ? { dateStyle: "medium", timeStyle: "short" }
    : { hour: "2-digit", minute: "2-digit" }).format(date);
}

function whatsappInitials(name) {
  return String(name || "WA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function setWhatsappTab(tab) {
  state.whatsapp.activeTab = tab || "connection";
  $$('[data-whatsapp-tab]').forEach((button) => button.classList.toggle("active", button.dataset.whatsappTab === state.whatsapp.activeTab));
  $$('[data-whatsapp-tab-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.whatsappTabPanel !== state.whatsapp.activeTab;
  });
}

async function refreshWhatsappData({ includeLists = true, silent = false } = {}) {
  if (state.session?.role !== "admin") return;
  try {
    const requests = [api("/api/admin/whatsapp/overview")];
    if (includeLists) requests.push(api("/api/admin/whatsapp/chats"), api("/api/admin/whatsapp/leads"));
    const [overview, chatsData, leadsData] = await Promise.all(requests);
    state.whatsapp.overview = overview;
    if (chatsData) state.whatsapp.chats = chatsData.chats || [];
    if (leadsData) state.whatsapp.leads = leadsData.leads || [];
    renderWhatsappModule();
    updateAdminShell();
  } catch (error) {
    if (!silent) setFormMessage($("#whatsappConnectionFormMessage"), error.message, true);
  }
}

function startWhatsappPolling() {
  stopWhatsappPolling();
  if (state.session?.role !== "admin") return;
  void refreshWhatsappData({ includeLists: true, silent: true });
  whatsappPollTimer = window.setInterval(() => {
    if (state.adminSection === "whatsapp" && !document.hidden) void refreshWhatsappData({ includeLists: true, silent: true });
  }, 5000);
}

function stopWhatsappPolling() {
  window.clearInterval(whatsappPollTimer);
  whatsappPollTimer = 0;
}

function renderWhatsappOverview() {
  const overview = state.whatsapp.overview || {};
  const status = overview.status || {};
  const connection = status.connection || "disconnected";
  const label = whatsappStatusLabels[connection] || connection;
  const counts = overview.counts || {};
  const dot = $("#whatsappConnectionDot");
  if (!dot) return;
  dot.className = `whatsapp-connection-dot ${connection === "connected" ? "connected" : ["qr", "connecting", "reconnecting", "standby"].includes(connection) ? "pending" : connection === "error" ? "error" : ""}`;
  $("#whatsappConnectionLabel").textContent = label;
  $("#whatsappKpiStatus").textContent = label;
  $("#whatsappKpiChats").textContent = String(counts.chats || 0);
  $("#whatsappKpiUnread").textContent = String(counts.unread || 0);
  $("#whatsappKpiLeads").textContent = String(counts.leads || 0);

  const qrImage = $("#whatsappQrImage");
  const qrPlaceholder = $("#whatsappQrPlaceholder");
  const hasQr = connection === "qr" && Boolean(status.qrDataUrl);
  qrImage.hidden = !hasQr;
  qrPlaceholder.hidden = hasQr;
  if (hasQr && qrImage.src !== status.qrDataUrl) qrImage.src = status.qrDataUrl;

  const copy = {
    connected: ["WhatsApp comercial conectado", "La cuenta esta lista para recibir y responder conversaciones desde este CRM."],
    qr: ["Escanea el codigo QR", "En tu celular abre WhatsApp > Dispositivos vinculados > Vincular dispositivo."],
    connecting: ["Preparando la conexion", "Estamos generando una sesion segura. El codigo QR aparecera en unos segundos."],
    reconnecting: ["Restableciendo la conexion", "La sesion se reconectara automaticamente sin volver a escanear el QR."],
    standby: ["Sesion activa en otra instancia", "Este servidor queda en espera para evitar conexiones duplicadas."],
    error: ["No se pudo conectar", status.lastError || "Revisa la configuracion y genera un QR nuevo."],
    disconnected: ["Conecta el WhatsApp comercial", "La sesion se guarda cifrada y se restaura despues de reinicios del servidor."],
  }[connection] || [label, status.lastError || ""];
  $("#whatsappConnectionTitle").textContent = copy[0];
  $("#whatsappConnectionMessage").textContent = copy[1];
  $("#whatsappAccountName").textContent = status.accountName || (connection === "connected" ? "Cuenta comercial" : "No vinculada");
  $("#whatsappAccountPhone").textContent = status.phone ? `+${status.phone}` : "Sin numero";
  $("#whatsappUpdatedAt").textContent = formatWhatsappTime(status.updatedAt, true);
  $("#connectWhatsapp").disabled = ["connecting", "qr", "connected", "reconnecting"].includes(connection);
  $("#resetWhatsapp").disabled = connection === "connecting";
  $("#disconnectWhatsapp").disabled = connection === "disconnected";

  const form = $("#whatsappChatbotForm");
  const chatbot = overview.chatbot || {};
  if (form && form.dataset.loaded !== "true") {
    form.enabled.checked = chatbot.enabled === true;
    form.model.value = chatbot.model || "gpt-5.6-terra";
    form.prompt.value = chatbot.prompt || "";
    form.welcomeMessage.value = chatbot.welcomeMessage || "";
    form.handoffKeywords.value = chatbot.handoffKeywords || "";
    form.dataset.loaded = "true";
  }
  const aiConfigured = status.aiConfigured === true;
  $("#whatsappAiState").innerHTML = aiConfigured
    ? '<strong>Motor de IA configurado</strong><span>Las respuestas automaticas pueden activarse con el interruptor.</span>'
    : '<strong>Configuracion pendiente</strong><span>El prompt se guardara, pero se necesita OPENAI_API_KEY para responder automaticamente.</span>';
}

function renderWhatsappChats() {
  const list = $("#whatsappChatList");
  if (!list) return;
  const query = $("#whatsappChatSearch")?.value.trim().toLowerCase() || "";
  const chats = state.whatsapp.chats.filter((chat) => !query || [chat.name, chat.phone, chat.lastMessage].some((value) => String(value || "").toLowerCase().includes(query)));
  list.innerHTML = chats.length
    ? chats.map((chat) => `
      <button class="whatsapp-chat-item ${chat.jid === state.whatsapp.selectedJid ? "active" : ""}" type="button" data-whatsapp-chat="${escapeHtml(chat.jid)}">
        <span class="whatsapp-chat-avatar">${escapeHtml(whatsappInitials(chat.name))}</span>
        <span class="whatsapp-chat-copy"><strong>${escapeHtml(chat.name || chat.phone)}</strong><span>${escapeHtml(chat.lastMessage || "Sin mensajes")}</span></span>
        <span class="whatsapp-chat-meta"><time>${escapeHtml(formatWhatsappTime(chat.lastMessageAt))}</time>${chat.unreadCount ? `<b class="whatsapp-unread-badge">${Number(chat.unreadCount)}</b>` : ""}</span>
      </button>`).join("")
    : '<p class="empty-state">No hay conversaciones que coincidan.</p>';
}

function renderWhatsappMessages() {
  const list = $("#whatsappMessageList");
  const header = $("#whatsappConversationHeader");
  const form = $("#whatsappMessageForm");
  if (!list || !header || !form) return;
  const chat = state.whatsapp.chats.find((item) => item.jid === state.whatsapp.selectedJid);
  if (!chat) {
    header.innerHTML = "<div><strong>Selecciona una conversacion</strong><span>Los mensajes apareceran aqui.</span></div>";
    list.innerHTML = '<p class="empty-state">No hay una conversacion seleccionada.</p>';
    form.text.disabled = true;
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }
  header.innerHTML = `
    <div><strong>${escapeHtml(chat.name || chat.phone)}</strong><span>${escapeHtml(chat.phone ? `+${chat.phone}` : chat.jid)}</span></div>
    <button class="ghost-button mini-button" type="button" data-whatsapp-bot-toggle="${escapeHtml(chat.jid)}" data-bot-paused="${chat.botPaused}">
      ${chat.botPaused ? "Reactivar chatbot" : "Pausar chatbot"}
    </button>`;
  list.innerHTML = state.whatsapp.messages.length
    ? state.whatsapp.messages.map((message) => `
      <article class="whatsapp-message ${message.direction === "outgoing" ? "outgoing" : "incoming"}">
        <p>${escapeHtml(message.text || `[${message.type || "mensaje"}]`)}</p>
        <small>${escapeHtml(formatWhatsappTime(message.sentAt))}${message.status === "automated" ? " · chatbot" : ""}</small>
      </article>`).join("")
    : '<p class="empty-state">Esta conversacion todavia no tiene mensajes de texto.</p>';
  form.text.disabled = false;
  form.querySelector('button[type="submit"]').disabled = false;
  window.requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
}

async function openWhatsappChat(jid, { preserveList = false } = {}) {
  if (!jid) return;
  state.whatsapp.selectedJid = jid;
  if (!preserveList) renderWhatsappChats();
  try {
    const data = await api(`/api/admin/whatsapp/chats/${encodeURIComponent(jid)}/messages`);
    state.whatsapp.messages = data.messages || [];
    const chat = state.whatsapp.chats.find((item) => item.jid === jid);
    if (chat) chat.unreadCount = 0;
    renderWhatsappChats();
    renderWhatsappMessages();
    updateAdminShell();
  } catch (error) {
    setFormMessage($("#whatsappMessageFormMessage"), error.message, true);
  }
}

function renderWhatsappLeads() {
  const list = $("#whatsappLeadList");
  if (!list) return;
  const stageFilter = $("#whatsappLeadStageFilter")?.value || "";
  const leads = state.whatsapp.leads.filter((lead) => !stageFilter || lead.stage === stageFilter);
  const stageOptions = [["new", "Nuevo"], ["qualified", "Calificado"], ["contacted", "Contactado"], ["appointment", "Cita"], ["won", "Ganado"], ["lost", "Perdido"], ["archived", "Archivado"]];
  const scoreOptions = [["cold", "Bajo"], ["warm", "Medio"], ["hot", "Alto"], ["premium", "Premium"]];
  list.innerHTML = leads.length ? leads.map((lead) => `
    <article class="whatsapp-lead-row" data-whatsapp-lead-row="${escapeHtml(lead.id)}">
      <div class="whatsapp-lead-identity"><strong>${escapeHtml(lead.name || lead.phone)}</strong><span>${escapeHtml(lead.phone ? `+${lead.phone}` : lead.jid)}</span><span>${escapeHtml(lead.lastMessage || "Sin resumen")}</span></div>
      <label><span>Estado</span><select data-whatsapp-lead-field="stage">${stageOptions.map(([value, label]) => `<option value="${value}" ${lead.stage === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label><span>Prioridad</span><select data-whatsapp-lead-field="score">${scoreOptions.map(([value, label]) => `<option value="${value}" ${lead.score === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label><span>Interes</span><input data-whatsapp-lead-field="interest" value="${escapeHtml(lead.interest || "")}" placeholder="Comprar, vender..." /></label>
      <label><span>Zona</span><input data-whatsapp-lead-field="zone" value="${escapeHtml(lead.zone || "")}" placeholder="Puerto Cancun" /></label>
      <button class="mini-button" type="button" data-save-whatsapp-lead="${escapeHtml(lead.id)}">Guardar</button>
    </article>`).join("") : '<p class="empty-state">No hay leads de WhatsApp en este estado.</p>';
}

function renderWhatsappModule() {
  if (!$("#adminWhatsappCard")) return;
  renderWhatsappOverview();
  setWhatsappTab(state.whatsapp.activeTab);
  renderWhatsappChats();
  renderWhatsappMessages();
  renderWhatsappLeads();
  refreshIcons();
}

async function connectWhatsapp(reset = false) {
  const button = reset ? $("#resetWhatsapp") : $("#connectWhatsapp");
  setButtonLoading(button, true, reset ? "Generando..." : "Conectando...");
  setFormMessage($("#whatsappConnectionFormMessage"), "Preparando conexion segura...");
  try {
    await api("/api/admin/whatsapp/connect", { method: "POST", body: { reset }, timeoutMs: 60000 });
    setFormMessage($("#whatsappConnectionFormMessage"), "Conexion iniciada. Espera a que aparezca el codigo QR.");
    await refreshWhatsappData({ includeLists: false });
  } catch (error) {
    setFormMessage($("#whatsappConnectionFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
    renderWhatsappOverview();
  }
}

async function disconnectWhatsapp() {
  if (!window.confirm("Desconectar esta cuenta de WhatsApp y eliminar la sesion vinculada?")) return;
  const button = $("#disconnectWhatsapp");
  setButtonLoading(button, true, "Desconectando...");
  try {
    await api("/api/admin/whatsapp/connection", { method: "DELETE", timeoutMs: 60000 });
    setFormMessage($("#whatsappConnectionFormMessage"), "Cuenta desconectada correctamente.");
    await refreshWhatsappData({ includeLists: false });
  } catch (error) {
    setFormMessage($("#whatsappConnectionFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
    renderWhatsappOverview();
  }
}

async function whatsappChatbotSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  setButtonLoading(button, true, "Guardando...");
  try {
    const data = await api("/api/admin/whatsapp/chatbot", {
      method: "PUT",
      body: {
        enabled: form.enabled.checked,
        model: form.model.value,
        prompt: form.prompt.value,
        welcomeMessage: form.welcomeMessage.value,
        handoffKeywords: form.handoffKeywords.value,
      },
    });
    state.whatsapp.overview.chatbot = data.chatbot;
    form.dataset.loaded = "true";
    setFormMessage($("#whatsappChatbotMessage"), data.aiConfigured || !form.enabled.checked
      ? "Configuracion del chatbot guardada."
      : "Prompt guardado. Falta configurar OPENAI_API_KEY para activar respuestas.");
  } catch (error) {
    setFormMessage($("#whatsappChatbotMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function whatsappMessageSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const text = form.text.value.trim();
  if (!text || !state.whatsapp.selectedJid) return;
  const button = form.querySelector('button[type="submit"]');
  setButtonLoading(button, true, "Enviando...");
  try {
    await api(`/api/admin/whatsapp/chats/${encodeURIComponent(state.whatsapp.selectedJid)}/messages`, { method: "POST", body: { text }, timeoutMs: 60000 });
    form.reset();
    setFormMessage($("#whatsappMessageFormMessage"), "");
    await Promise.all([openWhatsappChat(state.whatsapp.selectedJid, { preserveList: true }), refreshWhatsappData({ includeLists: true, silent: true })]);
  } catch (error) {
    setFormMessage($("#whatsappMessageFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function toggleWhatsappChatbot(button) {
  const jid = button.dataset.whatsappBotToggle;
  const botPaused = button.dataset.botPaused !== "true";
  setButtonLoading(button, true, "Guardando...");
  try {
    await api(`/api/admin/whatsapp/chats/${encodeURIComponent(jid)}`, { method: "PATCH", body: { botPaused } });
    const chat = state.whatsapp.chats.find((item) => item.jid === jid);
    if (chat) chat.botPaused = botPaused;
    renderWhatsappMessages();
    showToast(botPaused ? "Chatbot pausado para esta conversacion." : "Chatbot reactivado para esta conversacion.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function saveWhatsappLead(button) {
  const row = button.closest("[data-whatsapp-lead-row]");
  if (!row) return;
  const value = (name) => row.querySelector(`[data-whatsapp-lead-field="${name}"]`)?.value || "";
  setButtonLoading(button, true, "Guardando...");
  try {
    await api(`/api/admin/whatsapp/leads/${encodeURIComponent(button.dataset.saveWhatsappLead)}`, {
      method: "PATCH",
      body: { stage: value("stage"), score: value("score"), interest: value("interest"), zone: value("zone") },
    });
    showToast("Lead de WhatsApp actualizado.");
    await refreshWhatsappData({ includeLists: true, silent: true });
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function loadPublicData() {
  const results = await Promise.allSettled([
    api("/api/properties"),
    api("/api/session"),
    api("/api/location-options"),
    api("/api/config"),
  ]);
  const value = (index, fallback) => results[index].status === "fulfilled" ? results[index].value : fallback;
  const propertiesData = value(0, { properties: [] });
  const sessionData = value(1, { user: null });
  const locationData = value(2, { options: [] });
  const configData = value(3, state.config);
  state.properties = propertiesData.properties || [];
  state.session = sessionData.user;
  state.locationOptions = locationData.options || [];
  state.config = configData || state.config;
  state.platform = configData?.platform || state.platform;
  if (results.every((result) => result.status === "rejected")) throw results[0].reason;
  if (results.some((result) => result.status === "rejected")) {
    showToast(t("partialLoadError"), "error");
  }
}

async function loadPanelData() {
  if (!state.session) return;
  const panelApi = (path) => api(path, { timeoutMs: 12000, retry: false });
  if (state.session.role === "admin") {
    const adminResults = await Promise.allSettled([
      panelApi("/api/admin/stats"),
      panelApi("/api/admin/requests"),
      panelApi("/api/properties"),
      panelApi("/api/admin/prompts"),
      panelApi("/api/admin/leads"),
      panelApi("/api/admin/contacts"),
      panelApi("/api/admin/valuations"),
      panelApi("/api/admin/tasks"),
      panelApi("/api/admin/matches"),
      panelApi("/api/admin/analytics"),
      panelApi("/api/admin/buyers"),
      panelApi("/api/admin/users"),
      panelApi("/api/admin/files"),
      panelApi("/api/admin/documents"),
      panelApi("/api/admin/campaigns"),
      panelApi("/api/admin/instagram/status"),
      panelApi("/api/admin/settings"),
      panelApi("/api/admin/notifications"),
      panelApi("/api/admin/whatsapp/overview"),
      panelApi("/api/admin/whatsapp/chats"),
      panelApi("/api/admin/whatsapp/leads"),
      panelApi("/api/admin/activity?limit=80"),
      panelApi("/api/health"),
    ]);
    const adminValue = (index, fallback = {}) => adminResults[index].status === "fulfilled" ? adminResults[index].value : fallback;
    const [
      statsData,
      requestsData,
      propertiesData,
      promptsData,
      leadsData,
      contactsData,
      valuationsData,
      tasksData,
      matchesData,
      analyticsData,
      buyersData,
      usersData,
      filesData,
      documentsData,
      campaignsData,
      instagramStatusData,
      settingsData,
      notificationsData,
      whatsappOverviewData,
      whatsappChatsData,
      whatsappLeadsData,
      activityData,
      systemHealthData,
    ] = adminResults.map((result, index) => adminValue(index));
    if (adminResults[0].status === "fulfilled") state.stats = statsData;
    state.requests = requestsData.requests || state.requests;
    state.properties = propertiesData.properties || state.properties;
    state.adminPrompts = promptsData.prompts || state.adminPrompts;
    state.leads = leadsData.leads || state.leads;
    state.contacts = contactsData.contacts || state.contacts;
    state.valuations = valuationsData.valuations || state.valuations;
    state.tasks = tasksData.tasks || state.tasks;
    state.matches = matchesData.matches || state.matches;
    if (adminResults[9].status === "fulfilled") state.analytics = analyticsData || state.analytics;
    state.buyers = buyersData.buyers || state.buyers;
    state.internalUsers = usersData.users || state.internalUsers;
    state.files = filesData.files || state.files;
    state.documents = documentsData.documents || state.documents;
    state.campaigns = campaignsData.campaigns || state.campaigns;
    if (adminResults[15].status === "fulfilled") state.instagramStatus = instagramStatusData || state.instagramStatus;
    state.settings = settingsData.settings || state.settings;
    state.notifications = notificationsData.notifications || state.notifications;
    if (adminResults[18].status === "fulfilled") state.whatsapp.overview = whatsappOverviewData;
    state.whatsapp.chats = whatsappChatsData.chats || state.whatsapp.chats;
    state.whatsapp.leads = whatsappLeadsData.leads || state.whatsapp.leads;
    state.activity = activityData.activity || state.activity;
    if (adminResults[22].status === "fulfilled") state.systemHealth = systemHealthData || state.systemHealth;
    const failedModules = adminResults.filter((result) => result.status === "rejected").length;
    if (failedModules) showToast(`${failedModules} módulo${failedModules === 1 ? "" : "s"} no respondió. El resto del panel continúa disponible.`, "error");
    state.serviceRequests = [];
    state.messages = [];
  } else {
    const sellerResults = await Promise.allSettled([
      panelApi("/api/seller/requests"),
      panelApi("/api/seller/service-requests"),
      panelApi("/api/seller/notifications"),
      panelApi("/api/seller/messages"),
    ]);
    const sellerValue = (index, fallback = {}) => sellerResults[index].status === "fulfilled" ? sellerResults[index].value : fallback;
    state.requests = sellerValue(0).requests || state.requests;
    state.serviceRequests = sellerValue(1).requests || state.serviceRequests;
    state.notifications = sellerValue(2).notifications || state.notifications;
    state.messages = sellerValue(3).messages || state.messages;
    const failedModules = sellerResults.filter((result) => result.status === "rejected").length;
    if (failedModules) showToast("Parte de tu panel tardó en responder. Conservamos la información disponible para que puedas reintentar.", "error");
    state.adminPrompts = [];
    state.leads = [];
    state.contacts = [];
    state.valuations = [];
    state.tasks = [];
    state.matches = [];
    state.buyers = [];
    state.internalUsers = [];
    state.files = [];
    state.documents = [];
    state.campaigns = [];
    state.instagramStatus = { connected: false, oauthUrl: "", profileUrl: "https://www.instagram.com/", aiConfigured: false };
    state.settings = {};
    state.activity = [];
    state.whatsapp = {
      overview: null,
      chats: [],
      leads: [],
      messages: [],
      activeTab: "connection",
      selectedJid: "",
    };
    state.analytics = { eventsByType: [], propertyEvents: [], searchZones: [], leadSources: [] };
  }
}

function sellerDraftSnapshot(form) {
  const fields = {};
  Array.from(form.elements).forEach((field) => {
    if (!field.name || field.type === "file" || field.type === "submit" || field.type === "button") return;
    fields[field.name] = field.type === "checkbox" ? field.checked : field.value;
  });
  return {
    fields,
    images: safeParseImages(form.dataset.currentImages),
    mediaDirty: form.dataset.mediaDirty === "true",
    idempotencyKey: form.dataset.idempotencyKey || "",
    savedAt: new Date().toISOString(),
  };
}

function currentSellerDraftKey() {
  return `${SELLER_DRAFT_KEY}.${state.session?.id || "anonymous"}`;
}

function saveSellerDraft() {
  const form = $("#sellerRequestForm");
  if (!form || state.session?.role !== "seller") return;
  const draftKey = currentSellerDraftKey();
  const snapshot = sellerDraftSnapshot(form);
  localStorage.setItem(draftKey, JSON.stringify({ ...snapshot, images: [] }));
  if (form.dataset.persistentMediaDirty === "true") {
    form.dataset.persistentMediaDirty = "false";
    void queueDraftOperation(() => writePersistentDraft(draftKey, snapshot));
  }
  form.dataset.dirty = "true";
}

function clearSellerDraft() {
  const draftKey = currentSellerDraftKey();
  localStorage.removeItem(draftKey);
  void queueDraftOperation(() => deletePersistentDraft(draftKey));
  const form = $("#sellerRequestForm");
  if (form) {
    form.dataset.dirty = "false";
    form.dataset.currentImages = "[]";
    form.dataset.mediaDirty = "false";
    form.dataset.persistentMediaDirty = "false";
    delete form.dataset.idempotencyKey;
  }
}

async function restoreSellerDraft() {
  const form = $("#sellerRequestForm");
  if (!form || form.dataset.draftRestored === "true") return;
  form.dataset.draftRestored = "true";
  try {
    const draftKey = currentSellerDraftKey();
    const localDraft = JSON.parse(localStorage.getItem(draftKey) || "null");
    const richDraft = await readPersistentDraft(draftKey);
    const draft = localDraft || richDraft;
    const sameRichDraft = richDraft && (!localDraft || richDraft.idempotencyKey === localDraft.idempotencyKey);
    if (draft && sameRichDraft && Array.isArray(richDraft.images)) draft.images = richDraft.images;
    if (!draft?.fields || !Object.values(draft.fields).some((value) => value !== "" && value !== false)) return;
    Object.entries(draft.fields).forEach(([name, value]) => {
      const field = formField(form, name);
      if (!field) return;
      if (field.type === "checkbox") field.checked = Boolean(value);
      else field.value = value ?? "";
    });
    if (draft.idempotencyKey) form.dataset.idempotencyKey = draft.idempotencyKey;
    if (Array.isArray(draft.images) && (draft.images.length || draft.mediaDirty)) {
      form.dataset.currentImages = JSON.stringify(draft.images);
      updateSellerImagePreview(draft.images.map((image) => image.imageDataUrl || image));
    }
    form.dataset.mediaDirty = draft.mediaDirty ? "true" : "false";
    form.dataset.dirty = "true";
    updateMapPickerForForm(form);
    setFormMessage($("#sellerFormMessage"), "Borrador recuperado. Revisa la información antes de enviarla.");
  } catch {
    localStorage.removeItem(currentSellerDraftKey());
  }
}

function prepareSellerForm() {
  const form = $("#sellerRequestForm");
  if (!form || !state.session || state.session.role !== "seller") return;
  if (!form.email.value) form.email.value = state.session.email || "";
  if (!form.phone.value) form.phone.value = state.session.phone || "";
  form.preferredContact.value = state.session.preferredContact || "email";
  void restoreSellerDraft();
}

function updateAdminShell() {
  if (!$("#adminPanel")) return;
  const section = state.adminSection || "dashboard";
  $$("[data-admin-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === section);
  });
  $$("[data-admin-section-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.adminSectionPanel !== section;
  });
  const operationsGrid = $("#adminOperationsGrid");
  if (operationsGrid) operationsGrid.hidden = !["requests", "properties"].includes(section);
  const leadBadge = $("#sidebarLeadBadge");
  const requestBadge = $("#sidebarRequestBadge");
  const valuationBadge = $("#sidebarValuationBadge");
  const taskBadge = $("#sidebarTaskBadge");
  const whatsappBadge = $("#sidebarWhatsappBadge");
  if (leadBadge) leadBadge.textContent = String(state.leads.filter((lead) => lead.status === "new").length);
  if (requestBadge) requestBadge.textContent = String(state.requests.filter((request) => request.status === "pending").length);
  if (valuationBadge) valuationBadge.textContent = String(state.valuations.filter((valuation) => ["new", "in_review", "in_analysis"].includes(valuation.status)).length);
  if (taskBadge) taskBadge.textContent = String(state.tasks.filter((task) => ["pending", "in_progress"].includes(task.status)).length);
  if (whatsappBadge) whatsappBadge.textContent = String(state.whatsapp.overview?.counts?.unread || 0);
  $("#adminPanel")?.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
}

function setAdminSection(section) {
  const previousSection = state.adminSection;
  const listingForm = $("#listingForm");
  if (previousSection === "properties" && section !== "properties" && listingForm?.dataset.saving === "true") {
    showToast("Espera a que termine de guardarse la publicación.");
    return;
  }
  if (previousSection === "properties" && section !== "properties") {
    resetListingForm(true);
  }
  state.adminSection = section || "dashboard";
  if (state.adminSection === "whatsapp") startWhatsappPolling();
  else stopWhatsappPolling();
  updateAdminShell();
  $("#adminPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const panelStaticEnglish = {
  "Centro de control": "Control center",
  "Publicaciones": "Listings",
  "Nueva publicación": "New listing",
  "Inventario": "Inventory",
  "Desarrollos públicos": "Public developments",
  "Contactos y cuentas": "Contacts and accounts",
  "Campañas y mailing": "Campaigns and mailing",
  "Conexión, chatbot y chats": "Connection, chatbot and chats",
  "Generar e historial": "Generate and history",
  "Crear contacto": "Create contact",
  "Crear campaña": "Create campaign",
  "Crear usuario": "Create user",
  "Generar PDF": "Generate PDF",
  "Solicitudes": "Requests",
  "Asesorías": "Advisory",
  "Catálogos": "Catalogs",
  "Herramientas IA": "AI tools",
  "Campañas preparadas": "Prepared campaigns",
  "Nombre": "Name",
  "Correo": "Email",
  "Objetivo": "Objective",
  "Segmento": "Segment",
  "Canal": "Channel",
  "Propiedad": "Property",
  "Programar": "Schedule",
  "Mensaje": "Message",
  "Guardar campaña": "Save campaign",
  "Generar texto con IA": "Generate copy with AI",
  "Tipo de ficha": "Sheet type",
  "Institucional": "Institutional",
  "Neutro": "Neutral",
  "Moneda": "Currency",
  "Mostrar precio": "Show price",
  "Mostrar dirección exacta": "Show exact address",
  "Vista previa": "Preview",
  "Generar institucional": "Generate institutional",
  "Generar neutro": "Generate neutral",
  "Historial de fichas": "Sheet history",
  "Eliminar todas": "Delete all",
  "Dónde se publica": "Publish in",
  "Estado de publicación": "Listing status",
  "Buscar publicaciones": "Search listings",
  "Imagenes de la propiedad": "Property images",
  "Galería y orden de publicación": "Gallery and display order",
  "Guardar publicación": "Save listing",
  "Nueva publicación": "New listing",
  "Calidad": "Quality",
  "Accesos rápidos": "Quick actions",
  "Configuración": "Settings",
  "Roles / usuarios internos": "Roles / internal users",
  "Vender mi propiedad": "Sell my property",
  "Solicitar valoración": "Request valuation",
  "Notificaciones": "Notifications",
};

function translatePanelStaticCopy() {
  if (!$("#panelView")) return;
  $$("#panelView h2, #panelView h3, #panelView label > span, #panelView legend, #panelView option, #panelView button > span, #panelView .admin-sidebar-subnav button, #panelView .admin-sidebar-subnav a").forEach((element) => {
    if (element.dataset.i18n || element.childElementCount) return;
    const original = element.dataset.panelOriginal || element.textContent.trim();
    if (!element.dataset.panelOriginal) element.dataset.panelOriginal = original;
    element.textContent = state.lang === "en" ? panelStaticEnglish[original] || original : original;
  });
}

async function renderPanel() {
  if (!state.session) return;
  const isAdmin = state.session.role === "admin";
  $("#panelRoleBadge").textContent = isAdmin ? t("adminRole") : t("sellerRole");
  $("#panelTitle").textContent = isAdmin ? t("adminPanelTitle") : t("sellerPanelTitle");
  $("#panelSubtitle").textContent = isAdmin ? t("adminPanelSubtitle") : t("sellerPanelSubtitle");
  $("#adminPanel").hidden = !isAdmin;
  $("#sellerPanel").hidden = isAdmin;
  $("#adminNotificationButton").hidden = !isAdmin;
  $("#sellerNotificationButton").hidden = isAdmin;
  if (isAdmin) {
    renderStats();
    updateAdminShell();
  }
  translatePanelStaticCopy();
  refreshIcons();
  await loadPanelData();
  refreshLocationSelects();
  if (isAdmin) {
    renderStats();
    renderAdminInsights();
    renderCatalogParentOptions();
    renderLocationCatalogs();
    renderAdminPrompts();
    renderAdminLeads();
    renderAdminContacts();
    renderAdminRequests();
    renderAdminListingFilters();
    renderAdminListings();
    renderAdminValuations();
    renderAdminTasks();
    renderAdminMatches();
    renderAdminAnalytics();
    renderAdminMap();
    renderAdminSegments();
    renderOperationalModules();
    renderSettingsFields();
    renderWhatsappModule();
    updateAdminShell();
  } else {
    prepareSellerForm();
    renderSellerRequests();
    renderSellerServiceRequests();
    renderSellerNotifications();
  }
  bindMapPickers();
  if (isAdmin) void restoreListingDraft();
  translatePanelStaticCopy();
  refreshIcons();
}

function updateAuthNav() {
  const loginButton = $("#loginOpen");
  if (!loginButton) return;
  if (!state.session) {
    loginButton.textContent = t("navLogin");
    return;
  }
  loginButton.textContent = state.session.role === "admin" ? t("adminPanelShort") : t("sellerPanelShort");
}

function updateHeaderVisibility() {
  const header = $("#mainHeader");
  if (!header || document.body.classList.contains("panel-open")) return;
  const current = window.scrollY || 0;
  const atTop = current < 24;
  const scrollingDown = current > lastScrollY;
  header.classList.toggle("is-sticky", !atTop);
  header.classList.toggle("is-hidden", !atTop && scrollingDown && current > 220 && !$("#mainNav").classList.contains("open"));
  document.body.classList.toggle("at-top", atTop);
  lastScrollY = current;
}

const localizedRoutes = {
  "/": "/en/",
  "/propiedades": "/en/properties",
  "/propiedades/destacadas-cancun": "/en/properties/featured-cancun",
  "/propiedades/casas-cancun": "/en/properties/homes-cancun",
  "/propiedades/departamentos-cancun": "/en/properties/condos-cancun",
  "/propiedades/comerciales-cancun": "/en/properties/commercial-cancun",
  "/propiedades/desarrollos-cancun": "/en/properties/developments-cancun",
  "/preventas-cancun": "/en/cancun-presales",
  "/propiedades-en-renta-cancun": "/en/cancun-rentals",
  "/propiedades/puerto-cancun": "/en/properties/puerto-cancun",
  "/propiedades/puerto-cancun/casas": "/en/properties/puerto-cancun/homes",
  "/propiedades/puerto-cancun/departamentos": "/en/properties/puerto-cancun/condos",
  "/propiedades/puerto-cancun/terrenos": "/en/properties/puerto-cancun/land",
  "/propiedades/zona-hotelera": "/en/properties/hotel-zone",
  "/propiedades/cancun-centro": "/en/properties/downtown-cancun",
  "/propiedades/playa-mujeres": "/en/properties/playa-mujeres",
  "/propiedades/isla-mujeres": "/en/properties/isla-mujeres",
  "/propiedades/riviera-maya": "/en/properties/riviera-maya",
  "/zonas-cancun": "/en/cancun-areas",
  "/comprar-casa-cancun": "/en/buy-property-cancun",
  "/nosotros": "/en/about",
  "/contacto": "/en/contact",
  "/vender-casa-cancun": "/en/sell-property-cancun",
  "/valuacion-inmobiliaria-cancun": "/en/property-valuation-cancun",
  "/faq-inmobiliario-cancun": "/en/cancun-real-estate-faq",
};

function localizedRoute(pathname, lang = state.lang) {
  const [path, suffix = ""] = String(pathname || "").split(/(?=[?#])/);
  if (lang === "en") return `${localizedRoutes[path] || path}${suffix}`;
  const spanish = Object.entries(localizedRoutes).find(([, english]) => english === path)?.[0];
  return `${spanish || path}${suffix}`;
}

function updateLocalizedLinks() {
  $$("a[href^='/']").forEach((link) => {
    const original = link.dataset.routeBase || link.getAttribute("href");
    link.dataset.routeBase = localizedRoute(original, "es");
    link.href = localizedRoute(link.dataset.routeBase, state.lang);
  });
}

function applyTranslations() {
  document.documentElement.lang = state.lang;
  document.body.dataset.lang = state.lang;
  state.currency = state.lang === "en" ? "USD" : "MXN";
  $$("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });
  $$("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  $("#languageToggle").textContent = state.lang === "es" ? "English" : "Español";
  const panelLanguageLabel = $("#panelLanguageToggle span");
  if (panelLanguageLabel) panelLanguageLabel.textContent = state.lang === "es" ? "English" : "Español";
  $$('[data-password-visibility]').forEach(updatePasswordVisibilityButton);
  updateLocalizedLinks();
  if ($("#aboutNavLink")) $("#aboutNavLink").href = state.lang === "en" ? "/en/about" : "/nosotros";
  if ($("#sellNavLink")) $("#sellNavLink").href = state.lang === "en" ? "/en/sell-property-cancun" : "/vender-casa-cancun";
  if ($("#heroSellButton")) $("#heroSellButton").href = state.lang === "en" ? "/en/sell-property-cancun" : "/vender-casa-cancun";
  if ($("#sellCtaButton")) $("#sellCtaButton").href = state.lang === "en" ? "/en/sell-property-cancun" : "/vender-casa-cancun";
  renderReleaseInfo();
  refreshLocationSelects();
  renderCatalogParentOptions();
  renderLocationCatalogs();
  bindMapPickers();
  updateAuthNav();
  renderProperties();
  if (state.detailPropertyId) {
    const property = state.properties.find((item) => item.id === state.detailPropertyId);
    if (property) renderPropertyDetail(property);
  }
  if (!$("#panelView").hidden) {
    void renderPanel();
  }
  translatePanelStaticCopy();
  refreshIcons();
}

function toggleLanguage() {
  const nextLanguage = state.lang === "es" ? "en" : "es";
  localStorage.setItem(keys.lang, nextLanguage);
  const alternate = String(document.body.dataset.alternateUrl || "").trim();
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.assign(alternate || localizedRoute(currentPath, nextLanguage));
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }
  $$("i[data-lucide]").forEach((element) => {
    const icon = fallbackIcons[element.dataset.lucide];
    if (!icon || element.dataset.rendered === "true") return;
    element.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`;
    element.dataset.rendered = "true";
  });
}

function openAuth(tab = "login") {
  $("#authModal").hidden = false;
  document.body.classList.add("modal-open");
  switchAuthTab(tab);
  if (state.platform?.databaseStatus && state.platform.databaseReady !== true) {
    setFormMessage(tab === "register" ? $("#registerMessage") : $("#loginMessage"), t("loginUnavailable"), true);
  }
  void initializeGoogleAuth().catch(() => {
    setFormMessage($("#googleAuthMessage"), t("googleLoginUnavailable"), true);
  });
}

function closeAuth() {
  $("#authModal").hidden = true;
  document.body.classList.remove("modal-open");
  $("#loginMessage").textContent = "";
  $("#registerMessage").textContent = "";
  $("#googleAuthMessage").textContent = "";
  $("#passwordUpdateMessage").textContent = "";
  $("#loginMessage").classList.remove("error");
  $("#registerMessage").classList.remove("error");
  $("#googleAuthMessage").classList.remove("error");
  $("#passwordUpdateMessage").classList.remove("error");
}

function switchAuthTab(tab) {
  $$("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  $$(".auth-form").forEach((form) => {
    form.classList.toggle("active", form.id === `${tab}Form`);
  });
  const googleBox = $("#googleAuthBox");
  if (googleBox && state.config.googleClientId) googleBox.hidden = tab !== "login";
}

async function handleGoogleCredential(response) {
  const message = $("#googleAuthMessage");
  setFormMessage(message, "");
  try {
    const data = await api("/api/auth/google", {
      method: "POST",
      body: { credential: response.credential },
    });
    state.session = data.user;
    closeAuth();
    updateAuthNav();
    await showPanel();
  } catch (error) {
    setFormMessage(message, t("googleLoginError"), true);
  }
}

async function initializeGoogleAuth() {
  const box = $("#googleAuthBox");
  const button = $("#googleSignInButton");
  if (!box || !button) return;
  if (!state.config.googleClientId) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  if (state.googleReady) return;
  await scriptOnce("https://accounts.google.com/gsi/client", "googleIdentityScript");
  if (!window.google?.accounts?.id) return;
  window.google.accounts.id.initialize({
    client_id: state.config.googleClientId,
    callback: handleGoogleCredential,
  });
  window.google.accounts.id.renderButton(button, {
    theme: "outline",
    size: "large",
    width: Math.min(360, button.clientWidth || 320),
    text: "continue_with",
  });
  state.googleReady = true;
}

async function showPanel() {
  $("#siteShell").hidden = true;
  $("#panelView").hidden = false;
  document.body.classList.add("panel-open");
  if (window.innerWidth <= 980) state.sidebarCollapsed = true;
  await renderPanel();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function hidePanel() {
  const listingForm = $("#listingForm");
  if (listingForm?.dataset.saving === "true") {
    showToast("Espera a que termine de guardarse la publicación.");
    return;
  }
  if (listingForm) resetListingForm(true);
  $("#panelView").hidden = true;
  $("#siteShell").hidden = false;
  document.body.classList.remove("panel-open");
  updateAuthNav();
  window.scrollTo({ top: 0, behavior: "auto" });
  updateHeaderVisibility();
}

function setFormMessage(element, text, error = false) {
  if (!element) return;
  element.classList.toggle("error", error);
  element.setAttribute("role", error ? "alert" : "status");
  element.setAttribute("aria-live", error ? "assertive" : "polite");
  element.textContent = text;
}

function installImageFallbacks() {
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.fallbackApplied === "true") return;
    if (!/^https?:\/\//i.test(image.currentSrc || image.src)) return;
    image.dataset.fallbackApplied = "true";
    image.src = fallbackImage;
  }, true);
}

async function loginSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#loginMessage");
  setFormMessage(message, "");
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: {
        username: form.username.value.trim(),
        password: form.password.value,
      },
    });
    state.session = data.user;
    if (data.user.mustUpdatePassword) {
      const updateForm = $("#passwordUpdateForm");
      updateForm.username.value = form.username.value.trim();
      updateForm.currentPassword.value = form.password.value;
      updateForm.newPassword.value = "";
      switchAuthTab("passwordUpdate");
      setFormMessage($("#passwordUpdateMessage"), t("passwordUpgradeRequired"), true);
      return;
    }
    closeAuth();
    updateAuthNav();
    await showPanel();
  } catch (error) {
    if (error.status === 503 || error.code === "DATABASE_UNAVAILABLE") {
      setFormMessage(message, t("loginUnavailable"), true);
      return;
    }
    if (error.status === 401 && form.username.value.includes("@")) {
      switchAuthTab("register");
      $("#registerForm").email.value = form.username.value.trim();
      setFormMessage($("#registerMessage"), t("accountPrompt"));
      return;
    }
    setFormMessage(message, error.status === 429 ? error.message : t("loginError"), true);
  }
}

async function registerSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#registerMessage");
  setFormMessage(message, "");
  try {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        preferredContact: form.preferredContact.value,
        password: form.password.value,
      },
    });
    state.session = data.user;
    setFormMessage(message, t("accountCreated"));
    form.reset();
    closeAuth();
    updateAuthNav();
    await showPanel();
  } catch (error) {
    const text = error.status === 503 || error.code === "DATABASE_UNAVAILABLE"
      ? t("loginUnavailable")
      : error.status === 409
        ? t("accountExists")
        : error.message;
    setFormMessage(message, text, true);
  }
}

function updatePasswordVisibilityButton(button) {
  const input = button.closest(".password-input-wrap")?.querySelector("input");
  if (!input) return;
  const visible = input.type === "text";
  const label = t(visible ? "hidePassword" : "showPassword");
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
  button.setAttribute("aria-pressed", String(visible));
  button.innerHTML = `<i data-lucide="${visible ? "eye-off" : "eye"}"></i>`;
}

function installPasswordVisibilityToggles() {
  $$('input[type="password"]').forEach((input) => {
    if (input.dataset.passwordVisibilityReady === "true") return;
    input.dataset.passwordVisibilityReady = "true";
    const wrapper = document.createElement("span");
    wrapper.className = "password-input-wrap";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.append(input);
    const button = document.createElement("button");
    button.className = "password-visibility-button";
    button.type = "button";
    button.dataset.passwordVisibility = "true";
    button.addEventListener("click", () => {
      input.type = input.type === "password" ? "text" : "password";
      updatePasswordVisibilityButton(button);
      refreshIcons();
      input.focus({ preventScroll: true });
    });
    wrapper.append(button);
    updatePasswordVisibilityButton(button);
  });
  refreshIcons();
}

async function passwordUpdateSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#passwordUpdateMessage");
  setFormMessage(message, "");
  try {
    await api("/api/auth/update-password", {
      method: "POST",
      body: {
        username: form.username.value.trim(),
        currentPassword: form.currentPassword.value,
        newPassword: form.newPassword.value,
      },
    });
    const username = form.username.value.trim();
    form.reset();
    if (state.session) {
      state.session.mustUpdatePassword = false;
      closeAuth();
      updateAuthNav();
      await showPanel();
      return;
    }
    switchAuthTab("login");
    $("#loginForm").username.value = username;
    $("#loginForm").password.value = "";
    setFormMessage($("#loginMessage"), t("passwordUpdated"));
  } catch (error) {
    const text = error.code === "ADMIN_PASSWORD_ENV_MANAGED" ? t("adminPasswordManaged") : error.message;
    setFormMessage(message, text, true);
  }
}

async function sellerRequestSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.saving === "true") return;
  const message = $("#sellerFormMessage");
  const button = form.querySelector('[type="submit"]');
  const idempotencyKey = form.dataset.idempotencyKey || globalThis.crypto?.randomUUID?.() || `seller-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  form.dataset.idempotencyKey = idempotencyKey;
  form.dataset.saving = "true";
  form.dataset.persistentMediaDirty = "true";
  saveSellerDraft();
  setFormMessage(message, "");
  setButtonLoading(button, true, "Enviando solicitud...");
  setFormMessage(message, "Guardando la información de forma segura...");
  const slowTimer = window.setTimeout(() => {
    setFormMessage(message, "La conexión está tardando más de lo normal. Tu borrador permanece guardado; no vuelvas a enviar.");
  }, 12000);
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    delete payload.imageFile;
    Object.assign(payload, await getFormImagePayload(form));
    await api("/api/seller/requests", {
      method: "POST",
      body: payload,
      headers: { "Idempotency-Key": idempotencyKey },
      timeoutMs: 60000,
    });
    clearSellerDraft();
    form.reset();
    form.dataset.currentImages = "[]";
    refreshLocationSelects();
    resetMapPickerForForm(form);
    updateSellerImagePreview([]);
    await renderPanel();
    setFormMessage($("#sellerFormMessage"), t("requestSent"));
  } catch (error) {
    setFormMessage(message, `${error.message} Tu borrador sigue guardado para reintentar.`, true);
  } finally {
    window.clearTimeout(slowTimer);
    form.dataset.saving = "false";
    setButtonLoading(button, false);
  }
}

async function leadFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = form.querySelector("[data-lead-message]") || form.querySelector(".form-message");
  if (message) setFormMessage(message, "");
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    await api("/api/leads", {
      method: "POST",
      body: {
        ...payload,
        sourcePath: `${window.location.pathname}${window.location.hash || ""}`,
      },
    });
    form.reset();
    if (message) setFormMessage(message, t("leadSent"));
  } catch (error) {
    if (message) setFormMessage(message, error.message, true);
    else showToast(error.message, "error");
  }
}

function parseKeywordInput(value) {
  const seen = new Set();
  return String(value || "")
    .split(",")
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => {
      const normalized = item.toLocaleLowerCase("es-MX");
      if (!item || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 40);
}

function renderListingKeywordChips() {
  const input = $("#listingKeywords");
  const container = $("[data-keyword-chips]");
  if (!input || !container) return;
  const keywords = parseKeywordInput(input.value);
  input.value = keywords.join(", ");
  container.innerHTML = keywords
    .map((keyword) => `<button type="button" data-remove-keyword="${escapeHtml(keyword)}"><span>${escapeHtml(keyword)}</span><i data-lucide="x"></i></button>`)
    .join("");
  refreshIcons();
}

function updateListingDescriptionCounter() {
  const textarea = formField($("#listingForm"), "description");
  const counter = $("#listingDescriptionCounter");
  if (textarea && counter) counter.textContent = `${textarea.value.length.toLocaleString("es-MX")} / ${DESCRIPTION_MAX_LENGTH.toLocaleString("es-MX")} caracteres`;
}

function listingDraftSnapshot(form) {
  const fields = {};
  Array.from(form.elements).forEach((field) => {
    if (!field.name || field.type === "file" || field.type === "submit" || field.type === "button") return;
    if (field.type === "radio") {
      if (field.checked) fields[field.name] = field.value;
      return;
    }
    fields[field.name] = field.type === "checkbox" ? field.checked : field.value;
  });
  return {
    fields,
    images: safeParseImages(form.dataset.currentImages),
    mediaDirty: form.dataset.mediaDirty === "true",
    idempotencyKey: form.dataset.idempotencyKey || "",
    savedAt: new Date().toISOString(),
  };
}

function saveListingDraft() {
  const form = $("#listingForm");
  if (!form || state.session?.role !== "admin") return;
  const snapshot = listingDraftSnapshot(form);
  localStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify({ ...snapshot, images: [] }));
  if (form.dataset.persistentMediaDirty === "true") {
    form.dataset.persistentMediaDirty = "false";
    void queueDraftOperation(() => writePersistentDraft(LISTING_DRAFT_KEY, snapshot));
  }
  form.dataset.dirty = "true";
}

function clearListingDraft() {
  localStorage.removeItem(LISTING_DRAFT_KEY);
  void queueDraftOperation(() => deletePersistentDraft(LISTING_DRAFT_KEY));
  const form = $("#listingForm");
  if (form) form.dataset.dirty = "false";
}

async function restoreListingDraft() {
  const form = $("#listingForm");
  if (!form || form.dataset.draftRestored === "true") return;
  form.dataset.draftRestored = "true";
  try {
    const localDraft = JSON.parse(localStorage.getItem(LISTING_DRAFT_KEY) || "null");
    const richDraft = await readPersistentDraft(LISTING_DRAFT_KEY);
    const draft = localDraft || richDraft;
    const sameEntity = richDraft && (!localDraft || (richDraft.fields?.id || "") === (localDraft.fields?.id || ""));
    const sameNewDraft = richDraft && (!localDraft || richDraft.idempotencyKey === localDraft.idempotencyKey);
    if (draft && sameEntity && sameNewDraft && Array.isArray(richDraft.images)) {
      draft.images = richDraft.images;
      draft.mediaDirty = richDraft.mediaDirty;
    }
    if (!draft?.fields || !Object.values(draft.fields).some((value) => value !== "" && value !== false)) return;
    const source = draft.fields;
    if (draft.idempotencyKey) form.dataset.idempotencyKey = draft.idempotencyKey;
    setLocationFormValues(form, source);
    Object.entries(source).forEach(([name, value]) => {
      const field = formField(form, name);
      if (!field || LOCATION_FIELD_ORDER.includes(name)) return;
      if (field.type === "checkbox") field.checked = Boolean(value);
      else if (field.type === "radio") {
        form.querySelectorAll(`[name="${CSS.escape(name)}"]`).forEach((option) => {
          option.checked = option.value === value;
        });
      }
      else field.value = value ?? "";
    });
    const sourceProperty = state.properties.find((property) => property.id === source.id);
    const restoredImages = draft.mediaDirty ? (Array.isArray(draft.images) ? draft.images : []) : sourceProperty ? storedImages(sourceProperty) : (draft.images || []);
    form.dataset.currentImages = JSON.stringify(restoredImages);
    form.dataset.removeImage = restoredImages.length ? "false" : draft.mediaDirty ? "true" : "false";
    form.dataset.mediaDirty = draft.mediaDirty ? "true" : "false";
    updateListingImagePreview(restoredImages);
    form.dataset.dirty = "true";
    renderListingKeywordChips();
    updateListingDescriptionCounter();
    updateMapPickerForForm(form);
    showToast("Se recuperó el borrador local que estaba pendiente de guardar.");
  } catch {
    localStorage.removeItem(LISTING_DRAFT_KEY);
  }
}

function resetListingForm(clearDraft = true) {
  const form = $("#listingForm");
  form.reset();
  formField(form, "id").value = "";
  form.dataset.currentImages = "[]";
  form.dataset.removeImage = "false";
  form.dataset.mediaDirty = "false";
  form.dataset.contentDirty = "false";
  form.dataset.persistentMediaDirty = "false";
  delete form.dataset.idempotencyKey;
  if (formField(form, "status")) formField(form, "status").value = "active";
  if (formField(form, "isPublic")) formField(form, "isPublic").checked = true;
  refreshLocationSelects();
  resetMapPickerForForm(form);
  updateListingImagePreview([]);
  if ($("#saveListingImages")) $("#saveListingImages").hidden = true;
  setListingQualityPreview(null);
  setFormMessage($("#listingFormMessage"), "");
  renderListingKeywordChips();
  updateListingDescriptionCounter();
  if (clearDraft) clearListingDraft();
}

function setListingQualityPreview(property) {
  const score = $("#listingQualityPreview");
  const copy = $(".listing-side-panel [data-i18n='propertyQualityMissing']")?.closest("p");
  if (!score) return;
  if (!property) {
    score.textContent = "0%";
    if (copy) copy.textContent = t("propertyQualityMissing");
    return;
  }
  score.textContent = `${property.qualityScore || 0}%`;
  if (copy) {
    const missing = Array.isArray(property.qualityMissing) && property.qualityMissing.length ? property.qualityMissing.join(", ") : qualityLevelLabel(property.qualityLevel);
    copy.textContent = `${t("propertyQualityMissing")}: ${missing}`;
  }
}

function renderImagePreview(preview, images, interactive = false) {
  if (!preview) return;
  const list = Array.isArray(images) ? images.filter(Boolean) : images ? [images] : [];
  const grid = preview.querySelector(".image-preview-grid");
  if (list.length) {
    grid.innerHTML = list
      .map((src, index) => interactive
        ? `<article class="image-preview-item" draggable="true" data-image-index="${index}">
            <span class="image-order">${index === 0 ? "PORTADA" : index + 1}</span>
            <img src="${escapeHtml(src)}" alt="Vista previa ${index + 1}" loading="lazy" />
            <div class="image-preview-actions">
              <button type="button" data-move-image="up" data-image-index="${index}" aria-label="Mover imagen a la izquierda" ${index === 0 ? "disabled" : ""}><i data-lucide="arrow-left"></i></button>
              <button type="button" data-move-image="down" data-image-index="${index}" aria-label="Mover imagen a la derecha" ${index === list.length - 1 ? "disabled" : ""}><i data-lucide="arrow-right"></i></button>
              <button type="button" class="danger" data-remove-listing-image="${index}" aria-label="Eliminar esta imagen"><i data-lucide="trash-2"></i></button>
            </div>
          </article>`
        : `<img src="${escapeHtml(src)}" alt="Property preview ${index + 1}" loading="lazy" />`)
      .join("");
    preview.hidden = false;
    if (interactive) refreshIcons();
  } else {
    grid.innerHTML = "";
    preview.hidden = true;
  }
}

function updateSellerImagePreview(images) {
  renderImagePreview($("#sellerImagePreview"), images);
}

function updateListingImagePreview(images) {
  renderImagePreview($("#listingImagePreview"), images, true);
}

function setListingImages(images) {
  const form = $("#listingForm");
  const list = Array.isArray(images) ? images.filter(Boolean).slice(0, IMAGE_MAX_COUNT) : [];
  form.dataset.currentImages = JSON.stringify(list);
  form.dataset.removeImage = list.length ? "false" : "true";
  form.dataset.mediaDirty = "true";
  form.dataset.persistentMediaDirty = "true";
  const saveButton = $("#saveListingImages");
  if (saveButton) saveButton.hidden = !formField(form, "id")?.value;
  updateListingImagePreview(list);
  saveListingDraft();
}

async function instagramPostSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const property = state.properties.find((item) => item.id === form.propertyId.value);
  if (!property) {
    setFormMessage($("#instagramPostMessage"), "Selecciona una propiedad.", true);
    return;
  }
  setButtonLoading(button, true, "Generando publicación...");
  try {
    const data = await api("/api/admin/ai/generate", {
      method: "POST",
      body: {
        tool: "instagram",
        propertyId: property.id,
        objective: form.objective.value,
        tone: form.tone.value,
        hashtags: form.hashtags.value,
      },
      timeoutMs: 45000,
    });
    form.caption.value = data.result?.caption || data.result?.social || String(data.result || "");
    setFormMessage(
      $("#instagramPostMessage"),
      data.provider === "openai"
        ? "Borrador generado con ChatGPT. Revísalo antes de publicarlo."
        : data.warning || "Borrador generado localmente. Configura OPENAI_API_KEY para usar ChatGPT."
    );
  } catch (error) {
    setFormMessage($("#instagramPostMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function copyInstagramPost() {
  const caption = $("#instagramPostForm")?.elements.caption.value.trim();
  if (!caption) {
    setFormMessage($("#instagramPostMessage"), "Genera o escribe un texto antes de copiarlo.", true);
    return;
  }
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(caption);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = caption;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) {
      setFormMessage($("#instagramPostMessage"), "No se pudo copiar automáticamente. Selecciona el texto y cópialo manualmente.", true);
      return;
    }
  }
  showToast("Texto de Instagram copiado.");
}

function moveListingImage(fromIndex, toIndex) {
  const form = $("#listingForm");
  const images = safeParseImages(form.dataset.currentImages);
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= images.length || toIndex >= images.length || fromIndex === toIndex) return;
  const [image] = images.splice(fromIndex, 1);
  images.splice(toIndex, 0, image);
  setListingImages(images);
}

async function saveListingImagesOnly() {
  const form = $("#listingForm");
  const id = formField(form, "id")?.value;
  if (!id) {
    setFormMessage($("#listingFormMessage"), "Guarda primero la propiedad para crear su galería.", true);
    return;
  }
  const button = $("#saveListingImages");
  const images = safeParseImages(form.dataset.currentImages);
  const currentProperty = state.properties.find((property) => property.id === id);
  setButtonLoading(button, true, "Guardando galería...");
  try {
    const data = await api(`/api/admin/properties/${encodeURIComponent(id)}/images`, {
      method: "PATCH",
      body: {
        images,
        removeImage: images.length === 0,
        expectedUpdatedAt: currentProperty?.updatedAt || null,
      },
      timeoutMs: 60000,
    });
    const saved = data.property;
    const index = state.properties.findIndex((property) => property.id === saved.id);
    if (index >= 0) state.properties.splice(index, 1, saved);
    form.dataset.currentImages = JSON.stringify(storedImages(saved));
    form.dataset.mediaDirty = "false";
    form.dataset.persistentMediaDirty = "true";
    updateListingImagePreview(storedImages(saved));
    button.hidden = true;
    if (form.dataset.contentDirty === "true") saveListingDraft();
    else clearListingDraft();
    renderAdminListings();
    renderProperties();
    setFormMessage($("#listingFormMessage"), "Galería guardada. La primera imagen es ahora la portada publicada.");
    showToast("Galería y orden actualizados.");
  } catch (error) {
    setFormMessage($("#listingFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function validateImageFile(file) {
  if (!file) return;
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error(t("invalidImageType"));
  }
  if (file.size > IMAGE_ORIGINAL_MAX_BYTES) {
    throw new Error(t("imageTooLarge"));
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(t("apiError")));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(t("invalidImageType")));
    };
    image.src = url;
  });
}

async function compressImageFile(file) {
  validateImageFile(file);
  const image = await loadImageElement(file);
  const maxSide = 1400;
  const baseRatio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  for (const scale of [1, 0.84, 0.7]) {
    const ratio = baseRatio * scale;
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.78, 0.66, 0.54, 0.44]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob && blob.size <= IMAGE_MAX_BYTES) return blob;
    }
  }
  throw new Error(t("imageTooLarge"));
}

async function readImageFile(file) {
  const blob = await compressImageFile(file);
  return {
    imageDataUrl: await blobToDataUrl(blob),
    imageType: blob.type || "image/webp",
    imageSize: blob.size,
  };
}

async function readImageFiles(files) {
  const list = Array.from(files || []);
  if (list.length > IMAGE_MAX_COUNT) {
    throw new Error(t("tooManyImages"));
  }
  const images = new Array(list.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < list.length) {
      const index = cursor;
      cursor += 1;
      images[index] = await readImageFile(list[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(3, list.length) }, worker));
  return { images };
}

async function getFormImagePayload(form) {
  const cached = safeParseImages(form.dataset.currentImages);
  if (cached.length) return { images: cached };
  const files = formField(form, "imageFile")?.files || [];
  if (!files.length) return {};
  return readImageFiles(files);
}

async function getListingImagePayload(form) {
  const images = safeParseImages(form.dataset.currentImages);
  if (formField(form, "id")?.value && form.dataset.mediaDirty !== "true") return { preserveImages: true };
  return images.length ? { images } : { removeImage: true };
}

async function listingSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const field = (name) => formField(form, name);
  if (form.dataset.saving === "true") return;
  const submit = form.querySelector('[type="submit"]');
  const id = field("id").value;
  const message = $("#listingFormMessage");
  setFormMessage(message, "");
  if (!form.reportValidity()) return;
  const priceUsd = field("priceUsd").value === "" ? null : Number(field("priceUsd").value);
  const priceMxn = field("priceMxn").value === "" ? null : Number(field("priceMxn").value);
  if (priceUsd === null && priceMxn === null) {
    setFormMessage(message, t("missingPrice"), true);
    return;
  }
  if (!Number.isFinite(priceUsd ?? priceMxn) || (priceUsd !== null && priceUsd < 0) || (priceMxn !== null && priceMxn < 0)) {
    setFormMessage(message, "Revisa los precios ingresados.", true);
    return;
  }
  const latitude = field("latitude").value === "" ? null : Number(field("latitude").value);
  const longitude = field("longitude").value === "" ? null : Number(field("longitude").value);
  if ((latitude === null) !== (longitude === null) || (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
    setFormMessage(message, "Ingresa una latitud y longitud válidas, o deja ambas vacías.", true);
    return;
  }
  if (field("description").value.length > DESCRIPTION_MAX_LENGTH || field("descriptionEn").value.length > DESCRIPTION_MAX_LENGTH) {
    setFormMessage(message, `La descripción no debe superar ${DESCRIPTION_MAX_LENGTH.toLocaleString("es-MX")} caracteres.`, true);
    return;
  }
  const keywords = parseKeywordInput(field("keywords").value);
  const currentProperty = id ? state.properties.find((property) => property.id === id) : null;
  const payload = {
    title: field("title").value.trim(),
    titleEn: field("titleEn").value.trim(),
    publicationSection: form.querySelector('[name="publicationSection"]:checked')?.value || "properties",
    type: field("type").value,
    state: field("state").value,
    city: field("city").value,
    zone: field("zone").value,
    neighborhood: field("neighborhood").value,
    address: field("address").value.trim(),
    latitude,
    longitude,
    mapPlace: field("mapPlace").value,
    locationPrecision: latitude !== null && longitude !== null ? "exact" : "approximate",
    googleMapsUrl: form.querySelector("[data-open-map]")?.href || "",
    operation: field("operation").value,
    status: field("status").value,
    isPublic: field("isPublic").checked,
    priceUsd,
    priceMxn,
    beds: Number(field("beds").value || 0),
    baths: Number(field("baths").value || 0),
    parking: Number(field("parking").value || 0),
    area: Number(field("area").value || 0),
    lot: Number(field("lot").value || 0),
    mls: field("mls").value.trim(),
    amenities: field("amenities").value.trim(),
    keywords,
    featured: field("featured").checked,
    description: field("description").value.trim(),
    descriptionEn: field("descriptionEn").value.trim(),
    badges: ["new"],
    expectedUpdatedAt: currentProperty?.updatedAt || null,
  };
  const idempotencyKey = id ? "" : form.dataset.idempotencyKey || globalThis.crypto?.randomUUID?.() || `listing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  if (!id) form.dataset.idempotencyKey = idempotencyKey;
  form.dataset.saving = "true";
  form.dataset.persistentMediaDirty = "true";
  saveListingDraft();
  setButtonLoading(submit, true, "Guardando publicación...");
  setFormMessage(message, "Guardando publicación, por favor espera...");
  const slowTimer = window.setTimeout(() => {
    setFormMessage(message, "El guardado está tardando más de lo normal. No cierres esta ventana.");
  }, 12000);
  try {
    Object.assign(payload, await getListingImagePayload(form));
    const data = await api(id ? `/api/admin/properties/${encodeURIComponent(id)}` : "/api/admin/properties", {
      method: id ? "PUT" : "POST",
      body: payload,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      timeoutMs: 60000,
    });
    const saved = data.property;
    const existingIndex = state.properties.findIndex((property) => property.id === saved.id);
    if (existingIndex >= 0) state.properties.splice(existingIndex, 1, saved);
    else state.properties.unshift(saved);
    clearListingDraft();
    resetListingForm(true);
    delete form.dataset.idempotencyKey;
    renderAdminListingFilters();
    renderAdminListings();
    renderProperties();
    const savedMessage = `Publicación guardada correctamente · ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
    setFormMessage(message, savedMessage);
    showToast(savedMessage);
    void api("/api/admin/stats").then((stats) => {
      state.stats = stats;
      renderStats();
    }).catch(() => null);
  } catch (error) {
    const errorMessage = error.message || "No se pudo guardar la publicación. Revisa la información e intenta nuevamente.";
    setFormMessage(message, errorMessage, true);
    showToast(errorMessage, "error");
  } finally {
    window.clearTimeout(slowTimer);
    form.dataset.saving = "false";
    setButtonLoading(submit, false);
  }
}

async function translateListingToEnglish() {
  const form = $("#listingForm");
  const button = $("#translateListingToEnglish");
  const title = formField(form, "title").value.trim();
  const description = formField(form, "description").value.trim();
  if (!title || !description) {
    setFormMessage($("#listingFormMessage"), "Completa primero el título y la descripción en español.", true);
    return;
  }
  setButtonLoading(button, true, "Traduciendo...");
  try {
    const result = await api("/api/admin/ai/translate-property", {
      method: "POST",
      body: { title, description },
      timeoutMs: 60000,
    });
    formField(form, "titleEn").value = result.titleEn;
    formField(form, "descriptionEn").value = result.descriptionEn;
    saveListingDraft();
    setFormMessage($("#listingFormMessage"), "Traducción generada. Revísala antes de guardar.");
  } catch (error) {
    setFormMessage($("#listingFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function editListing(id) {
  const property = state.properties.find((item) => item.id === id);
  if (!property) return;
  const form = $("#listingForm");
  const field = (name) => formField(form, name);
  field("id").value = property.id;
  field("title").value = property.titleEs || property.title || "";
  field("titleEn").value = property.titleEn || "";
  const publicationSection = property.publicationSection || (property.type === "Desarrollo" ? "developments" : "properties");
  const publicationField = form.querySelector(`[name="publicationSection"][value="${publicationSection}"]`);
  if (publicationField) publicationField.checked = true;
  field("type").value = property.type;
  setLocationFormValues(form, property);
  field("operation").value = property.operation;
  field("status").value = property.status || "active";
  field("isPublic").checked = property.isPublic !== false;
  field("priceUsd").value = property.priceUsd || "";
  field("priceMxn").value = property.priceMxn || "";
  field("address").value = property.address || "";
  field("latitude").value = property.latitude ?? "";
  field("longitude").value = property.longitude ?? "";
  field("mapPlace").value = property.mapPlace || "";
  updateMapPickerForForm(form);
  if ((property.latitude === null || property.longitude === null) && property.address) {
    const picker = form.querySelector("[data-map-picker]");
    if (picker) void geocodeMapAddress(picker);
  }
  field("imageFile").value = "";
  form.dataset.currentImages = JSON.stringify(storedImages(property));
  form.dataset.removeImage = "false";
  form.dataset.mediaDirty = "false";
  form.dataset.contentDirty = "false";
  form.dataset.persistentMediaDirty = "true";
  updateListingImagePreview(storedImages(property));
  if ($("#saveListingImages")) $("#saveListingImages").hidden = true;
  field("beds").value = property.beds || "";
  field("baths").value = property.baths || "";
  field("parking").value = property.parking || "";
  field("area").value = property.area || "";
  field("lot").value = property.lot || "";
  field("mls").value = property.mls || "";
  field("amenities").value = Array.isArray(property.amenities) ? property.amenities.join(", ") : "";
  field("keywords").value = Array.isArray(property.keywords) ? property.keywords.join(", ") : "";
  field("featured").checked = Boolean(property.featured);
  field("description").value = property.descriptionEs || property.description || "";
  field("descriptionEn").value = property.descriptionEn || "";
  form.dataset.dirty = "false";
  renderListingKeywordChips();
  updateListingDescriptionCounter();
  setListingQualityPreview(property);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteListing(id) {
  if (!(await confirmAction(t("confirmDelete"), "Archivar publicación"))) return;
  try {
    await api(`/api/admin/properties/${encodeURIComponent(id)}`, { method: "DELETE" });
    await renderPanel();
    renderProperties();
    showToast(t("listingDeleted"));
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function updateListingStatus(id, status) {
  try {
    await api(`/api/admin/properties/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status, isPublic: status === "active" },
    });
    await renderPanel();
    renderProperties();
    showToast(t("listingSaved"));
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function toggleListingFeatured(id, featured) {
  try {
    await api(`/api/admin/properties/${encodeURIComponent(id)}/featured`, {
      method: "PATCH",
      body: { featured },
    });
    await renderPanel();
    renderProperties();
    showToast(featured ? "Propiedad destacada." : "Propiedad retirada de destacadas.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function duplicateListing(id) {
  try {
    await api(`/api/admin/properties/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
    await renderPanel();
    showToast("Se creó una copia en estado borrador.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function approveRequest(id) {
  try {
    await api(`/api/admin/requests/${encodeURIComponent(id)}/approve`, { method: "POST" });
    await renderPanel();
    renderProperties();
    showToast(t("requestApproved"));
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function rejectRequest(id) {
  try {
    await api(`/api/admin/requests/${encodeURIComponent(id)}/reject`, { method: "POST" });
    await renderPanel();
    showToast(t("requestRejected"));
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function updateLeadStatus(id, status) {
  try {
    await api(`/api/admin/leads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status },
    });
    await renderPanel();
    showToast(t("leadUpdated"));
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteLead(id) {
  if (!(await confirmAction(t("confirmDeleteLead"), "Eliminar solicitud"))) return;
  try {
    await api(`/api/admin/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
    await renderPanel();
    showToast(t("leadDeleted"));
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function respondToRequest(requestTable, requestId) {
  const modal = $("#responseModal");
  const form = $("#responseForm");
  const item =
    requestTable === "seller_request"
      ? state.requests.find((request) => request.id === requestId)
      : state.leads.find((lead) => lead.id === requestId);
  if (!modal || !form || !item) return;
  form.reset();
  form.requestTable.value = requestTable;
  form.requestId.value = requestId;
  form.status.value = item.status === "new" || item.status === "pending" ? "contacted" : item.status;
  ensureSelectOption(form.status, form.status.value);
  form.priority.value = item.priority || "medium";
  ensureSelectOption(form.assignedTo, item.assignedTo || "");
  form.assignedTo.value = item.assignedTo || "";
  $("#responseModalSubtitle").textContent =
    requestTable === "seller_request"
      ? `${item.sellerName} · ${item.title}`
      : `${item.name} · ${leadTypeLabel(item.leadType)}`;
  $("#responseRequestContext").innerHTML =
    requestTable === "seller_request"
      ? `
        <span class="status ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.sellerName)}</strong><br>${escapeHtml(item.email)}<br>${escapeHtml(item.phone)}</p>
        <p>${escapeHtml(displayLocation(item))}<br>${escapeHtml(item.type)} · ${escapeHtml(item.area)} m² · ${escapeHtml(item.beds)} recámaras</p>
        <p>${escapeHtml(item.description || "")}</p>
      `
      : `
        <span class="status ${escapeHtml(item.status)}">${escapeHtml(leadStatusLabel(item.status))}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.email || "")}<br>${escapeHtml(item.phone || "")}</p>
        ${renderLeadPayload(item)}
      `;
  const attachmentSelect = $("#responseAttachmentSelect");
  attachmentSelect.innerHTML = `<option value="">Sin adjunto</option>`;
  state.documents.forEach((document) => attachmentSelect.append(new Option(`PDF · ${document.title}`, `document:${document.id}`)));
  state.files.forEach((file) => attachmentSelect.append(new Option(`${file.category} · ${file.name}`, `file:${file.id}`)));
  try {
    const data = await api(`/api/admin/messages/${encodeURIComponent(requestTable)}/${encodeURIComponent(requestId)}`);
    const history = data.messages || [];
    $("#responseMessageHistory").innerHTML = history.length
      ? history
          .map(
            (message) => `
              <article class="timeline-message ${escapeHtml(message.sender_type || "")}">
                <small>${escapeHtml(message.sender_name || message.sender_type)} · ${escapeHtml(formatDate(message.created_at))}</small>
                <p>${escapeHtml(message.message)}</p>
              </article>
            `
          )
          .join("")
      : `<p class="empty-state compact">Todavía no hay mensajes.</p>`;
  } catch (error) {
    $("#responseMessageHistory").innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
  modal.hidden = false;
  document.body.classList.add("modal-open");
  refreshIcons();
}

function closeResponseModal() {
  $("#responseModal").hidden = true;
  document.body.classList.remove("modal-open");
  setFormMessage($("#responseFormMessage"), "");
}

async function responseFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = form.querySelector('[type="submit"]');
  setButtonLoading(submit, true, "Guardando...");
  setFormMessage($("#responseFormMessage"), "");
  try {
    const attachment = form.attachmentId.value;
    await api("/api/admin/messages", {
      method: "POST",
      body: {
        requestTable: form.requestTable.value,
        requestId: form.requestId.value,
        responseType: form.responseType.value,
        message: form.message.value.trim(),
        attachments: attachment ? [attachment] : [],
        status: form.status.value,
        priority: form.priority.value,
        assignedTo: form.assignedTo.value,
        nextAction: form.nextAction.value.trim(),
        createTask: form.createTask.checked,
        dueDate: form.dueDate.value,
        notifyUser: form.notifyUser.checked,
      },
    });
    closeResponseModal();
    await renderPanel();
    showToast("Respuesta guardada y registrada en el historial.");
  } catch (error) {
    setFormMessage($("#responseFormMessage"), error.message, true);
    showToast(error.message, "error");
  } finally {
    setButtonLoading(submit, false);
  }
}

async function handleSearch(event) {
  event.preventDefault();
  const text = $("#searchInput").value.trim();
  resetFilters();
  state.filters.text = text;
  $("#searchInput").value = text;
  try {
    await api("/api/metrics/search", { method: "POST" });
    if (text) {
      void api("/api/leads", {
        method: "POST",
        body: {
          leadType: "busqueda",
          name: "Busqueda web",
          sourcePath: window.location.pathname,
          query: text,
        },
      }).catch(() => null);
    }
  } catch {
    // Search still works client-side if the metric cannot be recorded.
  }
  renderProperties();
  $("#properties").scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyElementFilter(element) {
  resetFilters();
  const filter = element.dataset.filter;
  if (filter === "featured") state.filters.featured = true;
  if (filter === "sale") state.filters.operation = "sale";
  if (filter === "rent") state.filters.operation = "rent";
  if (element.dataset.type) state.filters.type = element.dataset.type;
  if (element.dataset.zone) state.filters.zone = element.dataset.zone;
  renderProperties();
  closeMobileNav();
  const target = hasCategoryFilter() ? $("#categoryPage") : $("#properties");
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyToolbarFilters() {
  state.filters.type = $("#filterType")?.value || "";
  state.filters.zone = $("#filterZone")?.value || "";
  state.filters.operation = $("#filterOperation")?.value || "";
  renderProperties();
}

function viewDetails(id) {
  const property = state.properties.find((item) => item.id === id);
  if (!property) return;
  openPropertyDetail(property);
}

function contactAdvisor(id) {
  const property = state.properties.find((item) => item.id === id);
  if (!property) return;
  openPropertyWhatsApp(property);
}

function propertyFacts(property) {
  return [
    displayLocation(property),
    property.type ? displayType(property.type) : "",
    property.beds ? `${property.beds} ${t("bedShort")}` : "",
    property.baths ? `${property.baths} ${t("bathShort")}` : "",
    property.area
      ? `${new Intl.NumberFormat(state.lang === "en" ? "en-US" : "es-MX").format(property.area)} ${t("sqmBuild")}`
      : "",
    property.lot
      ? `${new Intl.NumberFormat(state.lang === "en" ? "en-US" : "es-MX").format(property.lot)} ${t("sqmLot")}`
      : "",
    property.mls ? `${t("mls")} ${property.mls}` : "",
  ].filter(Boolean);
}

function openPropertyDetail(property) {
  state.detailPropertyId = property.id;
  renderPropertyDetail(property);
  $("#propertyDetailModal").hidden = false;
  document.body.classList.add("modal-open");
}

function closePropertyDetail() {
  state.detailPropertyId = null;
  $("#propertyDetailModal").hidden = true;
  document.body.classList.remove("modal-open");
}

function renderPropertyDetail(property) {
  const content = $("#propertyDetailContent");
  if (!content || !property) return;
  const description = localizedDescription(property) || "";
  const paragraphs = description
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const facts = propertyFacts(property)
    .map((fact) => `<span>${escapeHtml(fact)}</span>`)
    .join("");
  const images = storedImages(property);
  const galleryImages = images.length ? images : [fallbackImage];
  const gallery = galleryImages
    .map(
      (src, index) => `
        <figure class="property-detail-slide">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(`${localizedTitle(property)} ${index + 1}`)}" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" />
        </figure>
      `
    )
    .join("");

  content.innerHTML = `
    <div class="property-detail-layout">
      <div class="property-detail-image property-detail-gallery">
        <div class="property-detail-track">${gallery}</div>
        ${galleryImages.length > 1 ? `<span class="gallery-count">1 / ${galleryImages.length}</span>` : ""}
      </div>
      <div class="property-detail-copy">
        <p class="property-detail-price">${escapeHtml(formatPriceSummary(property))}</p>
        <h2 id="propertyDetailTitle">${escapeHtml(localizedTitle(property))}</h2>
        <div class="property-detail-meta">${facts}</div>
        <div class="property-detail-description">${paragraphs || `<p>${escapeHtml(t("noResults"))}</p>`}</div>
        <div class="property-detail-actions">
          <button class="primary-button" type="button" data-detail-contact="${escapeHtml(property.id)}">${escapeHtml(t("contactWhatsApp"))}</button>
        </div>
      </div>
    </div>
  `;
  refreshIcons();
}

function openPropertyWhatsApp(property) {
  void api("/api/leads", {
    method: "POST",
    body: {
      leadType: "contacto-propiedad",
      name: "Contacto por propiedad",
      sourcePath: window.location.pathname,
      propertyId: property.id,
      propertyTitle: localizedTitle(property),
      zone: property.zone,
      propertyType: property.type,
      budgetOrPrice: formatPriceSummary(property),
    },
  }).catch(() => null);
  void api("/api/analytics/events", {
    method: "POST",
    body: { eventType: "property_contact_clicked", propertyId: property.id, metadata: { title: localizedTitle(property) } },
  }).catch(() => null);
  const message = [
    "Hola, estoy interesado/a en esta propiedad:",
    "",
    localizedTitle(property),
    `Precio: ${formatPriceSummary(property)}`,
    `Ubicacion: ${displayLocation(property) || ""}`,
    `Tipo: ${displayType(property.type)}`,
    `Dormitorios: ${property.beds || 0}`,
    `Baños: ${property.baths || 0}`,
    `M2 construcción: ${property.area || 0}`,
    "",
    "Quisiera recibir más información.",
  ].join("\n");
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

function openGeneralWhatsApp() {
  void api("/api/leads", {
    method: "POST",
    body: {
      leadType: "solicitud-whatsapp-ayuda",
      name: "Solicitud WhatsApp",
      sourcePath: window.location.pathname,
    },
  }).catch(() => null);
  void api("/api/analytics/events", {
    method: "POST",
    body: { eventType: "whatsapp_clicked", metadata: { path: window.location.pathname } },
  }).catch(() => null);
  const message = "Hola, quiero recibir informacion de Puerto Cancun Center.";
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

function closeMobileNav() {
  $("#mainNav").classList.remove("open");
}

async function handleSellEntry(event) {
  event.preventDefault();
  if (state.session) {
    await showPanel();
    return;
  }
  openAuth("register");
}

function initializePropertyGallery() {
  const carousel = $("[data-property-carousel]");
  const modal = $("[data-property-gallery-modal]");
  if (!carousel || !modal || carousel.dataset.ready === "true") return;
  carousel.dataset.ready = "true";
  const slides = $$('[data-gallery-slide]');
  const modalImage = modal.querySelector("[data-gallery-modal-image]");
  const mainCounter = carousel.querySelector("[data-gallery-counter]");
  const modalCounter = modal.querySelector("[data-gallery-modal-counter]");
  let activeIndex = 0;
  let zoom = 1;

  const normalizeIndex = (index) => (index + slides.length) % slides.length;
  const loadDeferredImage = (image) => {
    if (!image?.dataset.gallerySrc) return;
    image.src = image.dataset.gallerySrc;
    delete image.dataset.gallerySrc;
  };
  const ensureImage = (index) => {
    const normalized = normalizeIndex(index);
    loadDeferredImage(slides[normalized]?.querySelector("img"));
    $$(`[data-gallery-go="${normalized}"] img`).forEach(loadDeferredImage);
  };
  if ("IntersectionObserver" in window) {
    const thumbnailObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadDeferredImage(entry.target);
        thumbnailObserver.unobserve(entry.target);
      });
    }, { rootMargin: "160px" });
    $$('[data-gallery-go] img[data-gallery-src]').forEach((image) => thumbnailObserver.observe(image));
  }
  const resetZoom = () => {
    zoom = 1;
    modalImage.style.transform = "scale(1)";
    modalImage.dataset.zoom = "1";
  };
  const showImage = (index) => {
    activeIndex = normalizeIndex(index);
    ensureImage(activeIndex);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    $$('[data-gallery-go]').forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.galleryGo) === activeIndex);
    });
    const current = `${activeIndex + 1} / ${slides.length}`;
    if (mainCounter) mainCounter.textContent = current;
    if (modalCounter) modalCounter.textContent = current;
    const image = slides[activeIndex]?.querySelector("img");
    if (image && modalImage) {
      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
    }
    window.setTimeout(() => ensureImage(activeIndex + 1), 0);
    resetZoom();
  };
  const move = (direction) => showImage(activeIndex + direction);
  const openGallery = () => {
    showImage(activeIndex);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector("[data-close-property-gallery]")?.focus();
  };
  const closeGallery = () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    resetZoom();
    carousel.querySelector("[data-open-property-gallery]")?.focus();
  };
  const handleGalleryAction = (event) => {
    const target = event.target;
    if (target.closest("[data-gallery-previous]")) move(-1);
    else if (target.closest("[data-gallery-next]")) move(1);
    else if (target.closest("[data-gallery-go]")) showImage(Number(target.closest("[data-gallery-go]").dataset.galleryGo));
    else if (target.closest("[data-open-property-gallery]") || target.closest("[data-gallery-slide] img")) openGallery();
  };
  carousel.addEventListener("click", handleGalleryAction);
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-close-property-gallery]")) {
      closeGallery();
      return;
    }
    if (event.target.closest("[data-gallery-zoom-in]")) {
      zoom = Math.min(3, zoom + 0.5);
      modalImage.style.transform = `scale(${zoom})`;
      modalImage.dataset.zoom = String(zoom);
      return;
    }
    if (event.target.closest("[data-gallery-zoom-out]")) {
      zoom = Math.max(1, zoom - 0.5);
      modalImage.style.transform = `scale(${zoom})`;
      modalImage.dataset.zoom = String(zoom);
      return;
    }
    if (event.target.closest("[data-gallery-zoom-reset]")) {
      resetZoom();
      return;
    }
    handleGalleryAction(event);
  });
  const bindSwipe = (element) => {
    if (!element) return;
    let startX = null;
    element.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
    });
    element.addEventListener("pointerup", (event) => {
      if (startX === null || zoom > 1) return;
      const distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
    });
    element.addEventListener("pointercancel", () => {
      startX = null;
    });
  };
  bindSwipe(carousel.querySelector(".property-gallery-stage"));
  bindSwipe(modal.querySelector(".property-gallery-modal-stage"));
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") closeGallery();
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
    if (event.key === "+" || event.key === "=") modal.querySelector("[data-gallery-zoom-in]")?.click();
    if (event.key === "-") modal.querySelector("[data-gallery-zoom-out]")?.click();
  });
  showImage(0);
}

function bindEvents() {
  document.addEventListener("click", async (event) => {
    const link = event.target.closest('a[href^="/api/admin/documents/"][href$="/download"], a[href^="/api/seller/documents/"][href$="/download"]');
    if (!link) return;
    event.preventDefault();
    if (link.dataset.downloading === "true") return;
    link.dataset.downloading = "true";
    link.setAttribute("aria-busy", "true");
    try {
      await downloadFile(link.getAttribute("href"), "ficha-propiedad.pdf");
      showToast("PDF descargado correctamente.");
    } catch (error) {
      showToast(error.message || "No se pudo descargar el PDF.", "error");
    } finally {
      link.dataset.downloading = "false";
      link.removeAttribute("aria-busy");
    }
  });

  $("#languageToggle").addEventListener("click", toggleLanguage);
  $("#panelLanguageToggle")?.addEventListener("click", toggleLanguage);

  $("#menuToggle").addEventListener("click", () => {
    $("#mainNav").classList.toggle("open");
    updateHeaderVisibility();
  });

  $$(".brand").forEach((brand) => {
    brand.addEventListener("click", (event) => {
      if (document.body.dataset.page !== "home" || !$("#siteShell") || $("#siteShell").hidden) return;
      event.preventDefault();
      closeMobileNav();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
  window.addEventListener("offline", () => updateNetworkStatus(false));
  window.addEventListener("online", () => updateNetworkStatus(true, true));
  window.addEventListener("beforeunload", (event) => {
    const hasUnsavedAdminDraft = $("#listingForm")?.dataset.dirty === "true";
    const hasUnsavedSellerDraft = $("#sellerRequestForm")?.dataset.dirty === "true";
    if (!hasUnsavedAdminDraft && !hasUnsavedSellerDraft) return;
    event.preventDefault();
    event.returnValue = "Tienes cambios sin guardar.";
  });

  $("#searchForm").addEventListener("submit", handleSearch);
  $("#guidedSearchForm")?.addEventListener("submit", guidedSearchSubmit);
  $$("[data-lead-form]").forEach((form) => {
    form.addEventListener("submit", leadFormSubmit);
  });
  $("#sortSelect").addEventListener("change", renderProperties);
  ["#filterType", "#filterZone", "#filterOperation"].forEach((selector) => {
    $(selector).addEventListener("change", applyToolbarFilters);
  });
  $("#clearFilters").addEventListener("click", () => {
    resetFilters();
    renderProperties();
  });
  $("#categoryInfoButton").addEventListener("click", () => {
    $("#properties").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $$(
    "#mainNav a[data-filter], #mainNav a[data-type], #mainNav a[data-zone], .zone-card, .type-tile, .more-grid button, .footer a[data-zone], .footer a[data-filter], .footer a[data-type], .feature-copy a[data-filter], .presale-feature a[data-type]"
  ).forEach((element) => {
    element.addEventListener("click", (event) => {
      event.preventDefault();
      if (document.body.dataset.page === "seo") {
        const href = element.getAttribute("href") || "#properties";
        window.location.href = href.startsWith("#") ? `/${href}` : href;
        return;
      }
      applyElementFilter(element);
    });
  });

  $("#loginOpen").addEventListener("click", async () => {
    if (state.session) await showPanel();
    else openAuth("login");
  });
  $("#authClose").addEventListener("click", closeAuth);
  $("#authModal").addEventListener("click", (event) => {
    if (event.target.id === "authModal") closeAuth();
  });
  $("#propertyDetailClose").addEventListener("click", closePropertyDetail);
  $("#propertyDetailModal").addEventListener("click", (event) => {
    if (event.target.id === "propertyDetailModal") closePropertyDetail();
  });
  $("#openCompare")?.addEventListener("click", openCompareModal);
  $("#clearCompare")?.addEventListener("click", () => {
    state.compare = [];
    localStorage.setItem(keys.compare, "[]");
    renderProperties();
  });
  $("#compareModalClose")?.addEventListener("click", () => {
    $("#compareModal").hidden = true;
    document.body.classList.remove("modal-open");
  });
  $("#compareModal")?.addEventListener("click", (event) => {
    if (event.target.id === "compareModal") {
      $("#compareModal").hidden = true;
      document.body.classList.remove("modal-open");
    }
  });
  $$("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.authTab;
      if (tab === "passwordUpdate") {
        $("#passwordUpdateForm").username.value = $("#loginForm").username.value.trim();
        $("#passwordUpdateForm").currentPassword.value = $("#loginForm").password.value;
      }
      switchAuthTab(tab);
    });
  });
  $("#loginForm").addEventListener("submit", loginSubmit);
  $("#registerForm").addEventListener("submit", registerSubmit);
  $("#passwordUpdateForm").addEventListener("submit", passwordUpdateSubmit);

  $("#backToSite").addEventListener("click", hidePanel);
  $("#logoutButton").addEventListener("click", async () => {
    stopWhatsappPolling();
    await api("/api/auth/logout", { method: "POST" }).catch(() => null);
    state.session = null;
    state.requests = [];
    state.leads = [];
    hidePanel();
  });

  $("#sellerRequestForm").addEventListener("submit", sellerRequestSubmit);
  $("#sellerRequestForm").addEventListener("input", () => {
    window.clearTimeout(sellerDraftTimer);
    sellerDraftTimer = window.setTimeout(saveSellerDraft, 500);
  });
  $("#sellerRequestForm").addEventListener("change", () => {
    window.clearTimeout(sellerDraftTimer);
    sellerDraftTimer = window.setTimeout(saveSellerDraft, 300);
  });
  $("#sellerServiceForm")?.addEventListener("submit", sellerServiceSubmit);
  $("#sellerReplyForm")?.addEventListener("submit", sellerReplySubmit);
  $("#cancelSellerReply")?.addEventListener("click", closeSellerReply);
  $("#sellerReplyModal")?.addEventListener("click", (event) => {
    if (event.target.id === "sellerReplyModal") closeSellerReply();
  });
  $("#closeSellerService")?.addEventListener("click", () => {
    $("#sellerServiceCard").hidden = true;
  });
  $$("[data-seller-flow]").forEach((button) => {
    button.addEventListener("click", () => openSellerFlow(button.dataset.sellerFlow));
  });
  $("#sellerNotificationButton")?.addEventListener("click", () => {
    $("#sellerNotificationDrawer").hidden = false;
  });
  $("#closeSellerNotifications")?.addEventListener("click", () => {
    $("#sellerNotificationDrawer").hidden = true;
  });
  $("#sellerRequestForm").elements.imageFile.addEventListener("change", async (event) => {
    const files = event.target.files;
    const message = $("#sellerFormMessage");
    setFormMessage(message, "");
    if (!files.length) {
      updateSellerImagePreview(safeParseImages(event.currentTarget.form.dataset.currentImages).map((image) => image.imageDataUrl || image));
      return;
    }
    try {
      const payload = await readImageFiles(files);
      event.currentTarget.form.dataset.currentImages = JSON.stringify(payload.images);
      event.currentTarget.form.dataset.mediaDirty = "true";
      event.currentTarget.form.dataset.persistentMediaDirty = "true";
      updateSellerImagePreview(payload.images.map((image) => image.imageDataUrl));
      saveSellerDraft();
      setFormMessage(message, `${payload.images.length} imagen${payload.images.length === 1 ? "" : "es"} optimizada${payload.images.length === 1 ? "" : "s"} y protegida${payload.images.length === 1 ? "" : "s"} en el borrador.`);
    } catch (error) {
      event.target.value = "";
      event.currentTarget.form.dataset.currentImages = "[]";
      event.currentTarget.form.dataset.mediaDirty = "true";
      event.currentTarget.form.dataset.persistentMediaDirty = "true";
      updateSellerImagePreview([]);
      setFormMessage(message, error.message, true);
    }
  });
  $("#clearSellerImage").addEventListener("click", () => {
    const form = $("#sellerRequestForm");
    formField(form, "imageFile").value = "";
    form.dataset.currentImages = "[]";
    form.dataset.mediaDirty = "true";
    form.dataset.persistentMediaDirty = "true";
    updateSellerImagePreview([]);
    saveSellerDraft();
    setFormMessage($("#sellerFormMessage"), t("imageRemoved"));
  });
  $("#listingForm").addEventListener("submit", listingSubmit);
  $("#translateListingToEnglish")?.addEventListener("click", () => void translateListingToEnglish());
  $("#adminListingSearch")?.addEventListener("input", (event) => {
    window.clearTimeout(adminListingSearchTimer);
    adminListingSearchTimer = window.setTimeout(() => {
      state.adminListingFilters.missingCover = false;
      state.adminListingFilters.search = event.target.value;
      renderAdminListings();
    }, 350);
  });
  [
    ["#adminListingTypeFilter", "type"],
    ["#adminListingZoneFilter", "zone"],
    ["#adminListingOperationFilter", "operation"],
    ["#adminListingStatusFilter", "status"],
    ["#adminListingQualityFilter", "quality"],
  ].forEach(([selector, key]) => {
    $(selector)?.addEventListener("change", (event) => {
      state.adminListingFilters.missingCover = false;
      state.adminListingFilters[key] = event.target.value;
      renderAdminListings();
    });
  });
  $("#clearAdminListingSearch")?.addEventListener("click", () => {
    state.adminListingFilters = { search: "", type: "", zone: "", operation: "", status: "", quality: "", missingCover: false };
    renderAdminListingFilters();
    renderAdminListings();
  });
  $("#adminInsights")?.addEventListener("click", (event) => {
    if (!event.target.closest("[data-show-incomplete-listings]")) return;
    state.adminListingFilters = { search: "", type: "", zone: "", operation: "", status: "", quality: "incomplete", missingCover: false };
    setAdminSection("properties");
    renderAdminListingFilters();
    renderAdminListings();
    $("#adminListingQualityFilter")?.focus();
  });
  $("[data-add-keyword]")?.addEventListener("click", renderListingKeywordChips);
  $("#listingKeywords")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    renderListingKeywordChips();
  });
  $("[data-keyword-chips]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-keyword]");
    if (!button) return;
    const input = $("#listingKeywords");
    input.value = parseKeywordInput(input.value).filter((keyword) => keyword !== button.dataset.removeKeyword).join(", ");
    renderListingKeywordChips();
    saveListingDraft();
  });
  $("#listingForm").addEventListener("input", (event) => {
    if (event.target?.name !== "imageFile") event.currentTarget.dataset.contentDirty = "true";
    updateListingDescriptionCounter();
    window.clearTimeout(listingDraftTimer);
    listingDraftTimer = window.setTimeout(saveListingDraft, 500);
  });
  $("#listingForm").addEventListener("change", (event) => {
    if (event.target?.name !== "imageFile") event.currentTarget.dataset.contentDirty = "true";
    window.clearTimeout(listingDraftTimer);
    listingDraftTimer = window.setTimeout(saveListingDraft, 300);
  });
  $("#locationCatalogForm").addEventListener("submit", locationCatalogSubmit);
  $("#catalogSearch")?.addEventListener("input", (event) => {
    state.catalogFilters.search = event.target.value;
    renderLocationCatalogs();
  });
  $("#catalogTypeFilter")?.addEventListener("change", (event) => {
    state.catalogFilters.type = event.target.value;
    renderLocationCatalogs();
  });
  $("#clearCatalogSearch")?.addEventListener("click", () => {
    state.catalogFilters = { search: "", type: "" };
    if ($("#catalogSearch")) $("#catalogSearch").value = "";
    if ($("#catalogTypeFilter")) $("#catalogTypeFilter").value = "";
    renderLocationCatalogs();
  });
  $("#catalogNewLocationButton")?.addEventListener("click", () => {
    resetCatalogForm();
    $("#locationCatalogForm")?.elements.name.focus({ preventScroll: true });
    $("#catalogEditor")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  $$('[data-open-location-catalog]').forEach((button) => button.addEventListener("click", () => {
    saveListingDraft();
    setAdminSection("catalogs");
    $("#catalogSearch")?.focus();
  }));
  $("#valuationForm")?.addEventListener("submit", valuationSubmit);
  $("#taskForm")?.addEventListener("submit", taskSubmit);
  $("#contactForm")?.addEventListener("submit", contactSubmit);
  $("#buyerForm")?.addEventListener("submit", buyerSubmit);
  $("#campaignForm")?.addEventListener("submit", campaignSubmit);
  $("#instagramPostForm")?.addEventListener("submit", instagramPostSubmit);
  $("#copyInstagramPost")?.addEventListener("click", () => void copyInstagramPost());
  $("#aiToolForm")?.addEventListener("submit", aiToolSubmit);
  $("#pdfForm")?.addEventListener("submit", pdfSubmit);
  $("#mediaUploadForm")?.addEventListener("submit", mediaUploadSubmit);
  $("#internalUserForm")?.addEventListener("submit", internalUserSubmit);
  $("#settingsForm")?.addEventListener("submit", settingsSubmit);
  $("#refreshSystemHealth")?.addEventListener("click", (event) => void refreshSystemHealth(event.currentTarget));
  $("#whatsappChatbotForm")?.addEventListener("submit", whatsappChatbotSubmit);
  $("#whatsappMessageForm")?.addEventListener("submit", whatsappMessageSubmit);
  $("#refreshWhatsapp")?.addEventListener("click", () => void refreshWhatsappData({ includeLists: true }));
  $("#connectWhatsapp")?.addEventListener("click", () => void connectWhatsapp(false));
  $("#resetWhatsapp")?.addEventListener("click", () => void connectWhatsapp(true));
  $("#disconnectWhatsapp")?.addEventListener("click", () => void disconnectWhatsapp());
  $("#whatsappChatSearch")?.addEventListener("input", () => {
    window.clearTimeout(whatsappSearchTimer);
    whatsappSearchTimer = window.setTimeout(renderWhatsappChats, 180);
  });
  $("#whatsappLeadStageFilter")?.addEventListener("change", renderWhatsappLeads);
  $$('[data-whatsapp-tab]').forEach((button) => {
    button.addEventListener("click", () => setWhatsappTab(button.dataset.whatsappTab));
  });
  $("#exportContactsCsv")?.addEventListener("click", exportContactsCsv);
  $("#contactSearch")?.addEventListener("input", renderAdminContacts);
  $("#contactTypeFilter")?.addEventListener("change", renderAdminContacts);
  $("#mediaSearch")?.addEventListener("input", renderMediaLibrary);
  $("#mediaTypeFilter")?.addEventListener("change", renderMediaLibrary);
  ["#smartMapLayer", "#smartMapZone", "#smartMapStatus", "#smartMapType"].forEach((selector) => {
    $(selector)?.addEventListener("change", renderAdminMap);
  });
  $("#toggleBuyerForm")?.addEventListener("click", () => {
    $("#buyerForm").hidden = false;
    $("#buyerForm").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#cancelBuyerForm")?.addEventListener("click", () => {
    $("#buyerForm").reset();
    $("#buyerForm").hidden = true;
  });
  $("#toggleUserForm")?.addEventListener("click", () => {
    $("#internalUserForm").reset();
    $("#internalUserForm").elements.id.value = "";
    $("#internalUserForm").hidden = false;
  });
  $("#cancelUserForm")?.addEventListener("click", () => {
    $("#internalUserForm").reset();
    $("#internalUserForm").hidden = true;
  });
  $("#generateCampaignCopy")?.addEventListener("click", () => void generateCampaignCopy());
  $("#copyAiResult")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#aiResult").value);
    showToast("Resultado copiado.");
  });
  $("#applyAiResult")?.addEventListener("click", () => {
    if (!$("#aiResult").value.trim()) return;
    $("#listingForm").description.value = $("#aiResult").value;
    setAdminSection("properties");
    showToast("Resultado aplicado a la descripción. Revísalo antes de guardar.");
  });
  $("#saveAiNote")?.addEventListener("click", () => {
    showToast("Resultado conservado en el editor. Selecciona un contacto o solicitud para asociarlo mediante una tarea.");
  });
  $("#pdfDocumentType")?.addEventListener("change", (event) => {
    $$("[data-pdf-target]").forEach((field) => {
      field.hidden = field.dataset.pdfTarget !== event.target.value;
    });
    previewPdf();
  });
  $("#pdfPropertySelect")?.addEventListener("change", previewPdf);
  $("#pdfValuationSelect")?.addEventListener("change", previewPdf);
  $("#previewPdf")?.addEventListener("click", previewPdf);
  $("#pdfBrandMode")?.addEventListener("change", previewPdf);
  $("#deleteAllDocuments")?.addEventListener("click", () => void deleteAllDocuments());
  $$("[data-settings-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      $$("[data-settings-tab]").forEach((item) => item.classList.toggle("active", item === button));
      renderSettingsFields(button.dataset.settingsTab);
    });
  });
  $("#responseForm")?.addEventListener("submit", responseFormSubmit);
  $("#responseModalClose")?.addEventListener("click", closeResponseModal);
  $("#cancelResponse")?.addEventListener("click", closeResponseModal);
  $("#responseModal")?.addEventListener("click", (event) => {
    if (event.target.id === "responseModal") closeResponseModal();
  });
  $("#adminNotificationButton")?.addEventListener("click", () => {
    $("#adminNotificationDrawer").hidden = false;
  });
  $("#closeAdminNotifications")?.addEventListener("click", () => {
    $("#adminNotificationDrawer").hidden = true;
  });
  $("#locationCatalogForm").elements.type.addEventListener("change", () => {
    const form = $("#locationCatalogForm");
    renderCatalogParentOptions();
    if (!form.elements.id.value) {
      const meta = catalogTypeMeta(form.elements.type.value);
      $("#catalogFormTitle").textContent = `Agregar ${meta.label.toLowerCase()}`;
      $("#catalogFormContext").textContent = form.elements.type.value === "state"
        ? "Los estados no necesitan una ubicación superior."
        : "Ahora selecciona la ubicación superior para mantener el catálogo ordenado.";
    }
  });
  $("#resetCatalogForm")?.addEventListener("click", resetCatalogForm);
  $("#resetListingForm").addEventListener("click", () => resetListingForm(true));
  $("#saveListingImages")?.addEventListener("click", saveListingImagesOnly);
  $("#clearListingImage").addEventListener("click", () => {
    const form = $("#listingForm");
    formField(form, "imageFile").value = "";
    setListingImages([]);
    setFormMessage($("#listingFormMessage"), t("imageRemoved"));
  });
  formField($("#listingForm"), "imageFile").addEventListener("change", async (event) => {
    const files = event.target.files;
    const form = $("#listingForm");
    const message = $("#listingFormMessage");
    setFormMessage(message, "");
    const currentImages = safeParseImages(form.dataset.currentImages);
    if (!files.length) {
      updateListingImagePreview(form.dataset.removeImage === "true" ? [] : currentImages);
      return;
    }
    try {
      const payload = await readImageFiles(files);
      const added = payload.images.map((image) => image.imageDataUrl);
      if (currentImages.length + added.length > IMAGE_MAX_COUNT) throw new Error(t("tooManyImages"));
      setListingImages([...currentImages, ...added]);
      event.target.value = "";
      setFormMessage(message, `${added.length} imagen${added.length === 1 ? "" : "es"} agregada${added.length === 1 ? "" : "s"}. Guarda la publicacion para confirmar los cambios.`);
    } catch (error) {
      event.target.value = "";
      updateListingImagePreview(form.dataset.removeImage === "true" ? [] : currentImages);
      setFormMessage(message, error.message, true);
    }
  });
  $("#listingImagePreview")?.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove-listing-image]");
    if (remove) {
      const images = safeParseImages($("#listingForm").dataset.currentImages);
      images.splice(Number(remove.dataset.removeListingImage), 1);
      setListingImages(images);
      setFormMessage($("#listingFormMessage"), "Imagen eliminada de la galeria. Guarda la publicacion para confirmar el cambio.");
      return;
    }
    const move = event.target.closest("[data-move-image]");
    if (move) {
      const index = Number(move.dataset.imageIndex);
      moveListingImage(index, move.dataset.moveImage === "up" ? index - 1 : index + 1);
    }
  });
  let draggedListingImageIndex = null;
  $("#listingImagePreview")?.addEventListener("dragstart", (event) => {
    const item = event.target.closest("[data-image-index]");
    if (!item) return;
    draggedListingImageIndex = Number(item.dataset.imageIndex);
    item.classList.add("is-dragging");
  });
  $("#listingImagePreview")?.addEventListener("dragend", (event) => {
    event.target.closest("[data-image-index]")?.classList.remove("is-dragging");
    draggedListingImageIndex = null;
  });
  $("#listingImagePreview")?.addEventListener("dragover", (event) => event.preventDefault());
  $("#listingImagePreview")?.addEventListener("drop", (event) => {
    event.preventDefault();
    const target = event.target.closest("[data-image-index]");
    if (target && draggedListingImageIndex !== null) moveListingImage(draggedListingImageIndex, Number(target.dataset.imageIndex));
  });

  $$("[data-seller-help]").forEach((button) => {
    button.addEventListener("click", openGeneralWhatsApp);
  });

  $$("[data-admin-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const sectionMap = {
        adminRequestsCard: "requests",
        adminListingsCard: "properties",
        adminCatalogsCard: "catalogs",
        adminPromptsCard: "prompts",
        adminLeadsCard: "leads",
        adminContactsCard: "contacts",
        adminPdfCard: "pdf",
        adminMarketingCard: "marketing",
        adminRolesCard: "roles",
        listingForm: "properties",
      };
      if (sectionMap[button.dataset.adminJump]) {
        setAdminSection(sectionMap[button.dataset.adminJump]);
      }
      const target = document.getElementById(button.dataset.adminJump);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $$("[data-admin-section]").forEach((button) => {
    button.addEventListener("click", () => setAdminSection(button.dataset.adminSection));
  });

  $("#adminSidebarToggle")?.addEventListener("click", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    updateAdminShell();
  });

  $$("[data-lead-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.leadFilter = button.dataset.leadFilter;
      state.adminLeadStatusFilter = "all";
      state.adminLeadPriorityFilter = "all";
      renderAdminLeads();
    });
  });

  $$("[data-task-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.taskFilter = button.dataset.taskFilter;
      renderAdminTasks();
    });
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-location-select]");
    if (select) handleLocationSelectChange(select);
  });

  document.addEventListener("click", (event) => {
    const adminMetric = event.target.closest("[data-admin-metric]");
    if (adminMetric) openAdminMetric(adminMetric.dataset.adminMetric);

    const clearDrilldown = event.target.closest("[data-clear-admin-drilldown]");
    if (clearDrilldown?.dataset.clearAdminDrilldown === "requests") {
      state.adminRequestFilter = "all";
      renderAdminRequests();
    }
    if (clearDrilldown?.dataset.clearAdminDrilldown === "leads") {
      state.adminLeadStatusFilter = "all";
      state.adminLeadPriorityFilter = "all";
      renderAdminLeads();
    }

    const sellerAccess = event.target.closest("[data-seller-access]");
    if (sellerAccess) {
      event.preventDefault();
      if (state.session) void showPanel();
      else openAuth(sellerAccess.dataset.sellerAccess === "login" ? "login" : "register");
    }

    const detail = event.target.closest("[data-detail]");
    if (detail) viewDetails(detail.dataset.detail);

    const contact = event.target.closest("[data-contact]");
    if (contact) contactAdvisor(contact.dataset.contact);

    const detailContact = event.target.closest("[data-detail-contact]");
    if (detailContact) contactAdvisor(detailContact.dataset.detailContact);

    const favorite = event.target.closest("[data-favorite]");
    if (favorite) toggleFavorite(favorite.dataset.favorite);

    const compare = event.target.closest("[data-compare]");
    if (compare) toggleCompare(compare.dataset.compare);

    const approve = event.target.closest("[data-approve]");
    if (approve) void approveRequest(approve.dataset.approve);

    const reject = event.target.closest("[data-reject]");
    if (reject) void rejectRequest(reject.dataset.reject);

    const edit = event.target.closest("[data-edit-listing]");
    if (edit) editListing(edit.dataset.editListing);

    const remove = event.target.closest("[data-delete-listing]");
    if (remove) void deleteListing(remove.dataset.deleteListing);

    const statusListing = event.target.closest("[data-status-listing]");
    if (statusListing) void updateListingStatus(statusListing.dataset.statusListing, statusListing.dataset.statusValue);

    const featureListing = event.target.closest("[data-feature-listing]");
    if (featureListing) void toggleListingFeatured(featureListing.dataset.featureListing, featureListing.dataset.featureValue === "true");

    const duplicateListingButton = event.target.closest("[data-duplicate-listing]");
    if (duplicateListingButton) void duplicateListing(duplicateListingButton.dataset.duplicateListing);

    const catalogLevel = event.target.closest("[data-catalog-level]");
    if (catalogLevel) {
      state.catalogFilters.type = catalogLevel.dataset.catalogLevel || "";
      if ($("#catalogTypeFilter")) $("#catalogTypeFilter").value = state.catalogFilters.type;
      renderLocationCatalogs();
    }

    const newLocation = event.target.closest("[data-new-location]");
    if (newLocation) {
      resetCatalogForm();
      $("#locationCatalogForm")?.elements.name.focus({ preventScroll: true });
      $("#catalogEditor")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const addLocationChild = event.target.closest("[data-add-location-child]");
    if (addLocationChild) prepareChildLocation(addLocationChild.dataset.addLocationChild);

    const deleteLocation = event.target.closest("[data-delete-location]");
    if (deleteLocation) void deleteLocationOption(deleteLocation.dataset.deleteLocation);

    const editLocation = event.target.closest("[data-edit-location]");
    if (editLocation) editLocationOption(editLocation.dataset.editLocation);

    const toggleLocation = event.target.closest("[data-toggle-location]");
    if (toggleLocation) void toggleLocationOption(toggleLocation.dataset.toggleLocation);

    const leadStatus = event.target.closest("[data-lead-status]");
    if (leadStatus) void updateLeadStatus(leadStatus.dataset.leadId, leadStatus.dataset.leadStatus);

    const deleteLeadButton = event.target.closest("[data-delete-lead]");
    if (deleteLeadButton) void deleteLead(deleteLeadButton.dataset.deleteLead);

    const respondLead = event.target.closest("[data-respond-lead]");
    if (respondLead) void respondToRequest("lead_request", respondLead.dataset.respondLead);

    const respondRequest = event.target.closest("[data-respond-request]");
    if (respondRequest) void respondToRequest("seller_request", respondRequest.dataset.respondRequest);

    const taskStatus = event.target.closest("[data-task-status]");
    if (taskStatus) void updateTaskStatus(taskStatus.dataset.taskStatus, taskStatus.dataset.taskStatusValue);

    const taskFrom = event.target.closest("[data-task-from]");
    if (taskFrom) void createTaskFromButton(taskFrom);

    const campaignSent = event.target.closest("[data-campaign-sent]");
    if (campaignSent) void markCampaignSent(campaignSent.dataset.campaignSent);

    const deleteCampaignButton = event.target.closest("[data-delete-campaign]");
    if (deleteCampaignButton) void deleteCampaign(deleteCampaignButton.dataset.deleteCampaign);

    const deleteDocumentButton = event.target.closest("[data-delete-document]");
    if (deleteDocumentButton) void deleteDocument(deleteDocumentButton.dataset.deleteDocument);

    const deleteMediaButton = event.target.closest("[data-delete-media]");
    if (deleteMediaButton) void deleteMedia(deleteMediaButton.dataset.deleteMedia);

    const useMediaButton = event.target.closest("[data-use-media]");
    if (useMediaButton) void useMediaInListing(useMediaButton.dataset.useMedia);

    const editUserButton = event.target.closest("[data-edit-user]");
    if (editUserButton) editInternalUser(editUserButton.dataset.editUser);

    const toggleUserButton = event.target.closest("[data-toggle-user]");
    if (toggleUserButton) void toggleInternalUser(toggleUserButton.dataset.toggleUser);

    const readSeller = event.target.closest("[data-read-seller-notification]");
    if (readSeller) void readSellerNotification(readSeller.dataset.readSellerNotification);

    const readAdmin = event.target.closest("[data-read-admin-notification]");
    if (readAdmin) void readAdminNotification(readAdmin.dataset.readAdminNotification);

    const adminSectionLink = event.target.closest("[data-admin-section-link]");
    if (adminSectionLink) setAdminSection(adminSectionLink.dataset.adminSectionLink);

    const sendCampaignEmailButton = event.target.closest("[data-send-campaign-email]");
    if (sendCampaignEmailButton) void sendCampaignEmail(sendCampaignEmailButton.dataset.sendCampaignEmail, sendCampaignEmailButton);

    const whatsappChat = event.target.closest("[data-whatsapp-chat]");
    if (whatsappChat) void openWhatsappChat(whatsappChat.dataset.whatsappChat);

    const whatsappBotToggle = event.target.closest("[data-whatsapp-bot-toggle]");
    if (whatsappBotToggle) void toggleWhatsappChatbot(whatsappBotToggle);

    const whatsappLeadSave = event.target.closest("[data-save-whatsapp-lead]");
    if (whatsappLeadSave) void saveWhatsappLead(whatsappLeadSave);

    const sellerReply = event.target.closest("[data-seller-reply]");
    if (sellerReply) {
      const requestTable = sellerReply.dataset.requestTable || "seller_request";
      void sellerReplyToAdvisor(requestTable, sellerReply.dataset.sellerReply);
    }

    const mapProperty = event.target.closest("[data-map-property]");
    if (mapProperty) focusMapProperty(mapProperty.dataset.mapProperty);

    const pdfValuation = event.target.closest("[data-pdf-valuation]");
    if (pdfValuation) {
      setAdminSection("pdf");
      $("#pdfDocumentType").value = "valuation";
      $$("[data-pdf-target]").forEach((field) => {
        field.hidden = field.dataset.pdfTarget !== "valuation";
      });
      $("#pdfValuationSelect").value = pdfValuation.dataset.pdfValuation;
      previewPdf();
    }

    const pdfProperty = event.target.closest("[data-pdf-property]");
    if (pdfProperty) {
      setAdminSection("pdf");
      $("#pdfDocumentType").value = "property";
      $$("[data-pdf-target]").forEach((field) => {
        field.hidden = field.dataset.pdfTarget !== "property";
      });
      $("#pdfPropertySelect").value = pdfProperty.dataset.pdfProperty;
      previewPdf();
    }

    const generatePropertyPdfButton = event.target.closest("[data-generate-property-pdf]");
    if (generatePropertyPdfButton) {
      void generatePropertyPdf(
        generatePropertyPdfButton.dataset.generatePropertyPdf,
        generatePropertyPdfButton.dataset.pdfMode,
        generatePropertyPdfButton
      );
    }

    const generateSelectedPropertyPdfButton = event.target.closest("[data-generate-selected-property-pdf]");
    if (generateSelectedPropertyPdfButton) {
      void generatePropertyPdf(
        $("#pdfPropertySelect").value,
        generateSelectedPropertyPdfButton.dataset.generateSelectedPropertyPdf,
        generateSelectedPropertyPdfButton
      );
    }
  });

  $("#whatsappButton").addEventListener("click", () => {
    openGeneralWhatsApp();
  });
}

async function init() {
  const renderedLanguage = document.body.dataset.lang || (window.location.pathname.startsWith("/en") ? "en" : "es");
  if (storedLanguage && storedLanguage !== renderedLanguage && document.body.dataset.alternateUrl) {
    window.location.replace(document.body.dataset.alternateUrl);
    return;
  }
  installImageFallbacks();
  installPasswordVisibilityToggles();
  bindEvents();
  initializePropertyGallery();
  updateNetworkStatus(navigator.onLine);
  try {
    await loadPublicData();
  } catch (error) {
    console.error(error);
    showToast(t("apiError"), "error");
  }
  applyTranslations();
  updateHeaderVisibility();
  void initializeGoogleAuth().catch(() => null);
}

init();
