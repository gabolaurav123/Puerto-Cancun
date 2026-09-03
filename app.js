const IMAGE_MAX_BYTES = 240 * 1024;
const IMAGE_ORIGINAL_MAX_BYTES = 12 * 1024 * 1024;
const IMAGE_MAX_COUNT = 20;
const VIDEO_MAX_BYTES = 45 * 1024 * 1024;
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
  "/assets/cancun-hotel-zone-hero-1280.webp";

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
    navResources: "Recursos",
    resourceMortgage: "Calculadora hipotecaria",
    resourceBlog: "Blog",
    resourceBuyerRequirements: "Búsquedas de clientes",
    footerBlog: "Blog inmobiliario",
    navAbout: "Nosotros",
    menuAllZones: "Ver todas las zonas",
    navSell: "Vender",
    navLogin: "Iniciar sesión",
    heroKicker: "Propiedades de lujo en Cancún",
    heroTitle: "Compra o vende tu propiedad en Cancún",
    heroSubtitle:
      "Te ayudamos a validar precios, preparar tu propiedad, encontrar compradores reales y tomar mejores decisiones inmobiliarias en Cancún.",
    heroSellCta: "Quiero vender mi propiedad",
    sellerOptionsEyebrow: "ELIGE CÓMO EMPEZAR",
    sellerOptionsTitle: "¿Cómo quieres vender tu propiedad?",
    sellerOptionsCopy: "Elige una solicitud breve sin cuenta o regístrate para publicar más información, guardar avances y dar seguimiento desde tu panel de vendedor.",
    guestSaleName: "Venta sin registro",
    guestSaleSummary: "Título, tipo, ubicación y fotos. No necesitas crear una cuenta.",
    guidedSaleName: "Venta con registro",
    guidedSaleSummary: "La opción más completa para presentar y seguir tu propiedad.",
    guidedSaleBenefitDetails: "Agrega información detallada y más fotografías.",
    guidedSaleBenefitProgress: "Guarda avances sin perder lo que ya capturaste.",
    guidedSaleBenefitPanel: "Consulta solicitudes y seguimiento en tu panel de vendedor.",
    valuationSaleName: "Solicitar valoración",
    valuationSaleSummary: "Valida el precio antes de preparar la publicación.",
    guestSaleEyebrow: "VENTA SIN REGISTRO",
    guestSaleTitle: "Envíanos los datos esenciales",
    guestSaleIntro: "No necesitas una cuenta. Un asesor revisará la información antes de solicitarte cualquier dato adicional.",
    guestLocation: "Ubicación",
    guestImages: "Imágenes de la propiedad",
    guestImagesHelp: "Puedes seleccionar varias fotos JPG, PNG o WEBP.",
    optionalDescription: "Descripción opcional",
    continueContact: "Enviar solicitud",
    confirmSendRequest: "Confirmar y enviar",
    contactPreferenceEyebrow: "ÚLTIMO PASO",
    contactPreferenceTitle: "¿Por dónde prefieres que te contactemos?",
    contactPreferenceCopy: "Si precisamos más datos sobre tu propiedad, te contactaremos únicamente por el medio que elijas.",
    countryPrefix: "Prefijo",
    nationalNumber: "Número nacional",
    guestConsent: "Acepto el aviso de privacidad y que un asesor me contacte sobre esta solicitud.",
    back: "Volver",
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
    keywordSearchLabel: "Buscar propiedades por palabra clave",
    keywordSearchPlaceholder: "Título, MLS, zona o palabra clave",
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
    trustSignalsLabel: "Señales de confianza",
    trustInventoryTitle: "Inventario revisado",
    trustInventoryCopy: "Precio, moneda, ubicación y disponibilidad se presentan sujetos a verificación documental.",
    trustPrivacyTitle: "Datos protegidos",
    trustPrivacyCopy: "Los formularios explican su finalidad y permiten ejercer derechos de privacidad.",
    trustTrackingTitle: "Atención identificable",
    trustTrackingCopy: "Cada solicitud queda registrada para que el equipo pueda dar seguimiento por el canal elegido.",
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
      "Cada inmueble conserva la moneda original definida en su publicación, USD o MXN. Cualquier conversión se entrega únicamente como referencia vigente y puede solicitarse a un asesor.",
    rights: "Todos los derechos reservados.",
    privacyNotice: "Aviso de privacidad",
    termsConditions: "Términos y condiciones",
    cookiePolicy: "Política de cookies",
    saveFavorite: "Guardar favorito",
    removeFavorite: "Quitar favorito",
    addComparison: "Agregar a comparación",
    removeComparison: "Quitar de comparación",
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
    publishDevelopment: "Publicar desarrollo",
    saveDevelopmentChanges: "Guardar cambios del desarrollo",
    inventoryOf: "de",
    developmentEntity: "Desarrollo",
    unverifiedInventory: "Sin verificar",
    verifiedDayAgo: "Verificada hace 1 día",
    verifiedDaysAgo: "Verificada hace {days} días",
    reviewAvailabilityDays: "Revisar disponibilidad · {days} días",
    noListingMatches: "No se encontraron publicaciones con esa búsqueda.",
    removeFeatured: "Quitar destacada",
    featureListing: "Destacar",
    duplicateListing: "Duplicar",
    institutionalPdf: "PDF institucional",
    neutralPdf: "PDF neutro",
    configurePdf: "Configurar PDF",
    publicDetail: "Ver detalle público",
    reviewQuality: "Revisar calidad",
    confirmAvailability: "Confirmar vigencia",
    listingHistory: "Historial",
    authTitle: "Acceso Puerto Cancún Center",
    authIntro: "Regístrate y anuncia con nosotros. Podrás enviar tu propiedad, agregar fotografías y seguir el proceso con un asesor.",
    createAccount: "Crear cuenta",
    emailOrUser: "Correo o usuario",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    currentPassword: "Contraseña actual",
    newPassword: "Nueva contraseña",
    passwordRule: "Usa 12 caracteres o más con mayúscula, minúscula, número y símbolo.",
    forgotPassword: "¿Olvidaste tu contraseña?",
    forgotPasswordIntro: "Te enviaremos un enlace seguro que vence en 45 minutos.",
    sendRecovery: "Enviar enlace de recuperación",
    resetPassword: "Crear nueva contraseña",
    cookieBannerTitle: "Tu privacidad importa",
    cookieBannerCopy: "Usamos cookies esenciales para seguridad, sesión e idioma. Las mediciones opcionales solo se activan con tu autorización.",
    cookieLearnMore: "Conocer la política de cookies",
    cookieEssential: "Solo esenciales",
    cookieAccept: "Aceptar medición",
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
    listingDeleted: "Registro eliminado del inventario activo. Puedes restaurarlo desde el filtro Archivada.",
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
    archiveListing: "Eliminar",
    restoreListing: "Restaurar",
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
    confirmDelete: "¿Eliminar este registro del inventario activo? Dejará de ser público, pero podrás restaurarlo desde el filtro Archivada.",
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
    navResources: "Resources",
    resourceMortgage: "Mortgage calculator",
    resourceBlog: "Blog",
    resourceBuyerRequirements: "Client requirements",
    footerBlog: "Real estate blog",
    navAbout: "About us",
    menuAllZones: "View all areas",
    navSell: "Sell",
    navLogin: "Log in",
    heroKicker: "Luxury properties in Cancun",
    heroTitle: "Buy or sell your Cancun property",
    heroSubtitle:
      "We help you validate pricing, prepare your property, find real buyers, and make better real estate decisions in Cancun.",
    heroSellCta: "I want to sell my property",
    sellerOptionsEyebrow: "CHOOSE HOW TO START",
    sellerOptionsTitle: "How would you like to sell your property?",
    sellerOptionsCopy: "Choose a brief request without an account, or register to add more details, save progress and track everything from your seller dashboard.",
    guestSaleName: "Sell without registering",
    guestSaleSummary: "Title, type, location and photos. No account is required.",
    guidedSaleName: "Registered sale",
    guidedSaleSummary: "The most complete option to present and track your property.",
    guidedSaleBenefitDetails: "Add detailed information and more photographs.",
    guidedSaleBenefitProgress: "Save your progress without losing completed information.",
    guidedSaleBenefitPanel: "Review requests and follow-up from your seller dashboard.",
    valuationSaleName: "Request valuation",
    valuationSaleSummary: "Validate the price before preparing the listing.",
    guestSaleEyebrow: "NO-ACCOUNT SALE",
    guestSaleTitle: "Send us the essential details",
    guestSaleIntro: "You do not need an account. An advisor will review the information before requesting anything else.",
    guestLocation: "Location",
    guestImages: "Property images",
    guestImagesHelp: "You can select multiple JPG, PNG or WEBP photos.",
    optionalDescription: "Optional description",
    continueContact: "Submit property",
    confirmSendRequest: "Confirm and send",
    contactPreferenceEyebrow: "FINAL STEP",
    contactPreferenceTitle: "How would you prefer us to contact you?",
    contactPreferenceCopy: "If we need more information about your property, we will contact you only through your selected channel.",
    countryPrefix: "Prefix",
    nationalNumber: "National number",
    guestConsent: "I accept the privacy notice and agree to be contacted by an advisor about this request.",
    back: "Back",
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
    keywordSearchLabel: "Search properties by keyword",
    keywordSearchPlaceholder: "Title, MLS, area or keyword",
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
    trustSignalsLabel: "Trust signals",
    trustInventoryTitle: "Reviewed inventory",
    trustInventoryCopy: "Price, currency, location and availability are presented subject to documentary verification.",
    trustPrivacyTitle: "Protected data",
    trustPrivacyCopy: "Forms explain their purpose and provide a way to exercise privacy rights.",
    trustTrackingTitle: "Traceable service",
    trustTrackingCopy: "Every request is recorded so the team can follow up through the selected channel.",
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
      "Each property keeps the original currency defined in its listing, USD or MXN. Any conversion is provided only as a current reference and may be requested from an advisor.",
    rights: "All rights reserved.",
    privacyNotice: "Privacy notice",
    termsConditions: "Terms and conditions",
    cookiePolicy: "Cookie policy",
    saveFavorite: "Save favorite",
    removeFavorite: "Remove favorite",
    addComparison: "Add to comparison",
    removeComparison: "Remove from comparison",
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
    publishDevelopment: "Publish development",
    saveDevelopmentChanges: "Save development changes",
    inventoryOf: "of",
    developmentEntity: "Development",
    unverifiedInventory: "Not verified",
    verifiedDayAgo: "Verified 1 day ago",
    verifiedDaysAgo: "Verified {days} days ago",
    reviewAvailabilityDays: "Review availability · {days} days",
    noListingMatches: "No listings match this search.",
    removeFeatured: "Remove featured status",
    featureListing: "Feature",
    duplicateListing: "Duplicate",
    institutionalPdf: "Institutional PDF",
    neutralPdf: "Neutral PDF",
    configurePdf: "Configure PDF",
    publicDetail: "View public page",
    reviewQuality: "Review quality",
    confirmAvailability: "Confirm availability",
    listingHistory: "History",
    authTitle: "Puerto Cancun Center access",
    authIntro: "Register and list with us. You can submit your property, add photos, and follow the process with an advisor.",
    createAccount: "Create account",
    emailOrUser: "Email or user",
    password: "Password",
    confirmPassword: "Confirm password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    currentPassword: "Current password",
    newPassword: "New password",
    passwordRule: "Use 12 or more characters with an uppercase letter, lowercase letter, number, and symbol.",
    forgotPassword: "Forgot your password?",
    forgotPasswordIntro: "We will email you a secure link that expires in 45 minutes.",
    sendRecovery: "Send recovery link",
    resetPassword: "Create new password",
    cookieBannerTitle: "Your privacy matters",
    cookieBannerCopy: "We use essential cookies for security, sessions, and language. Optional measurement starts only with your consent.",
    cookieLearnMore: "Read the cookie policy",
    cookieEssential: "Essential only",
    cookieAccept: "Accept measurement",
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
    listingDeleted: "Record removed from active inventory. You can restore it from the Archived filter.",
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
    archiveListing: "Delete",
    restoreListing: "Restore",
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
    confirmDelete: "Remove this record from active inventory? It will no longer be public, but you can restore it from the Archived filter.",
    apiError: "Could not connect to the database. Check DATABASE_URL and the server.",
    partialLoadError: "Some data took too long to respond. The portal remains available and you can retry.",
  },
};

const storedLanguage = localStorage.getItem(keys.lang);
const urlLanguage = window.location.pathname === "/en" || window.location.pathname.startsWith("/en/") ? "en" : "";
const initialLanguage = urlLanguage || storedLanguage || document.body.dataset.lang || "es";

const state = {
  lang: initialLanguage,
  csrfToken: "",
  session: null,
  properties: [],
  requests: [],
  guestSaleRequests: [],
  leads: [],
  contacts: [],
  valuations: [],
  tasks: [],
  matches: [],
  buyers: [],
  serviceRequests: [],
  notifications: [],
  favoriteProperties: [],
  savedSearches: [],
  alertCapabilities: { internal: { available: true }, email: { available: false }, whatsapp: { available: false } },
  tours: [],
  internalUsers: [],
  files: [],
  fileFolders: [],
  scopedLibrary: { scope: "property", folderId: "all" },
  documents: [],
  campaigns: [],
  blogPosts: [],
  blogContentImageFiles: [],
  blogPreviewObjectUrls: [],
  campaignRecipientEmails: new Set(),
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
  intelligence: { priorities: [], metrics: {} },
  integrations: [],
  dataQuality: { summary: {}, incomplete: [], duplicateContacts: [], duplicateProperties: [] },
  copilotFeatures: [],
  intelligentSearch: { active: false, ids: [], interpreted: null, exactMatch: true, message: "" },
  adminPrompts: [],
  locationOptions: [],
  adminSection: "dashboard",
  sellerSection: "sale",
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
  brochureImport: null,
  imageAnalysis: null,
  copilotFeedbackSummary: { rates: [], errors: [], topics: [] },
  pendingCopilotAction: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const formField = (form, name) => form?.elements?.namedItem(name) || form?.querySelector?.(`[name="${name}"]`) || null;

function listingFormRecordId(form = $("#listingForm")) {
  return String(form?.dataset.editingId || formField(form, "id")?.value || "");
}

function listingFormIsDevelopment(form = $("#listingForm")) {
  const mode = form?.dataset.listingMode;
  if (mode === "development" || mode === "property") return mode === "development";
  return formField(form, "publicationSection")?.value === "developments";
}

function setListingFormRecordId(form, id = "") {
  if (!form) return "";
  const value = String(id || "");
  const idField = formField(form, "id");
  if (idField) idField.value = value;
  if (value) form.dataset.editingId = value;
  else delete form.dataset.editingId;
  return value;
}

function selectedDevelopmentPropertyIds(form = $("#listingForm")) {
  try {
    const parsed = JSON.parse(form?.dataset.linkedPropertyIds || "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.map((id) => String(id || "").trim()).filter(Boolean))] : [];
  } catch (_error) {
    return [];
  }
}

function setSelectedDevelopmentPropertyIds(ids, form = $("#listingForm")) {
  if (!form) return [];
  const values = [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || "").trim()).filter(Boolean))];
  form.dataset.linkedPropertyIds = JSON.stringify(values);
  return values;
}

function developmentRecordId(property) {
  return property?.developmentData?.id || (property?.publicationSection === "developments" ? `dev-${property.id}` : "");
}

function renderDevelopmentPropertyLinker() {
  const form = $("#listingForm");
  const results = $("#developmentPropertyResults");
  const selection = $("#developmentLinkedSelection");
  const count = $("#developmentLinkedPropertyCount");
  if (!form || !results || !selection || !count) return;
  const selected = selectedDevelopmentPropertyIds(form);
  const selectedSet = new Set(selected);
  const query = normalizeSearchText($("#developmentPropertySearch")?.value || "");
  const currentRecordId = listingFormRecordId(form);
  const currentDevelopmentId = currentRecordId
    ? developmentRecordId(state.properties.find((property) => property.id === currentRecordId))
    : "";
  const available = state.properties
    .filter((property) => property.publicationSection !== "developments" && property.status !== "archived")
    .filter((property) => {
      if (!query) return true;
      return normalizeSearchText([
        property.titleEs, property.titleEn, property.mls, property.zone, property.city, property.address,
        property.parentDevelopment?.nameEs, property.parentDevelopment?.nameEn,
      ].filter(Boolean).join(" ")).includes(query);
    })
    .sort((a, b) => Number(selectedSet.has(b.id)) - Number(selectedSet.has(a.id)) || String(a.titleEs || "").localeCompare(String(b.titleEs || ""), "es"))
    .slice(0, 80);
  const selectedProperties = selected
    .map((id) => state.properties.find((property) => property.id === id))
    .filter(Boolean);
  count.textContent = `${selectedProperties.length} vinculada${selectedProperties.length === 1 ? "" : "s"}`;
  selection.innerHTML = selectedProperties.length
    ? selectedProperties.map((property) => `<button type="button" data-unlink-development-property="${escapeHtml(property.id)}"><span>${escapeHtml(property.titleEs)}</span><i data-lucide="x"></i></button>`).join("")
    : '<p class="empty-state compact">Todavía no hay propiedades vinculadas.</p>';
  results.innerHTML = available.length
    ? available.map((property) => {
        const linkedElsewhere = property.developmentId && property.developmentId !== currentDevelopmentId;
        const parentName = property.parentDevelopment?.nameEs || "";
        return `<label class="development-property-option ${selectedSet.has(property.id) ? "is-selected" : ""}">
          <input type="checkbox" data-link-development-property="${escapeHtml(property.id)}" ${selectedSet.has(property.id) ? "checked" : ""} />
          <span><strong>${escapeHtml(property.titleEs)}</strong><small>${escapeHtml([property.mls ? `MLS# ${property.mls}` : "", displayLocation(property)].filter(Boolean).join(" · "))}</small>${linkedElsewhere ? `<em>Actualmente vinculada a ${escapeHtml(parentName || "otro desarrollo")}; al guardar se moverá a este desarrollo.</em>` : ""}</span>
        </label>`;
      }).join("")
    : '<p class="empty-state">No se encontraron propiedades con esa búsqueda.</p>';
  refreshIcons();
}

const googleMapInstances = new WeakMap();
let lastScrollY = 0;
let adminListingSearchTimer = 0;
let listingDraftTimer = 0;
let sellerDraftTimer = 0;
let whatsappPollTimer = 0;
let whatsappSearchTimer = 0;
let adminGlobalSearchTimer = 0;
let draftDbPromise = null;
let draftWriteQueue = Promise.resolve();
const mapGeocodeTimers = new WeakMap();
const mapGeocodeControllers = new WeakMap();
const mapSuggestionTimers = new WeakMap();
const mapSuggestionControllers = new WeakMap();
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
  if (select.tagName === "INPUT") {
    if (!select.dataset.locationListId) {
      select.dataset.locationListId = `location-suggestions-${type}-${Math.random().toString(36).slice(2, 9)}`;
      select.setAttribute("list", select.dataset.locationListId);
    }
    let list = document.getElementById(select.dataset.locationListId);
    if (!list) {
      list = document.createElement("datalist");
      list.id = select.dataset.locationListId;
      select.after(list);
    }
    list.innerHTML = options.map((option) => `<option value="${escapeHtml(option.name)}"></option>`).join("");
    if (current) select.value = current;
    return;
  }
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
  if (select.tagName === "INPUT") {
    LOCATION_FIELD_ORDER.slice(currentIndex + 1).forEach((name) => {
      const field = formField(form, name);
      fillLocationSelect(field, field?.value || "");
    });
    updateMapPickerForForm(form);
    return;
  }
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
    formField(form, "location")?.value,
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
    formField(form, "location")?.value,
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

function applyGeocodedLocation(form, result) {
  if (!form || !result) return;
  const components = result.components || {};
  for (const [name, value] of Object.entries({
    state: components.state || "",
    city: components.city || "",
    zone: components.zone || "",
    neighborhood: components.neighborhood || "",
  })) {
    const field = formField(form, name);
    if (!field || !value) continue;
    field.value = value;
    if (field.dataset.locationSelect) fillLocationSelect(field, value);
  }
  const formattedAddress = String(result.formattedAddress || "").trim();
  if (!formattedAddress) return;
  const addressField = formField(form, "address");
  if (addressField && !addressField.dataset.locked) addressField.value = formattedAddress;
  if (formField(form, "location")) formField(form, "location").value = formattedAddress;
  if (formField(form, "mapPlace")) formField(form, "mapPlace").value = formattedAddress;
}

async function reverseGeocodeMapPosition(picker, latitude, longitude) {
  const form = picker?.closest("form");
  if (!form) return;
  mapGeocodeControllers.get(picker)?.abort();
  const controller = new AbortController();
  mapGeocodeControllers.set(picker, controller);
  setMapStatus(picker, state.lang === "en" ? "Identifying the selected location…" : "Identificando la ubicación seleccionada…");
  try {
    const response = await fetch(`/api/reverse-geocode?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Ubicación no identificada");
    if (controller.signal.aborted) return;
    applyGeocodedLocation(form, result);
    updateMapPicker(picker);
    setMapStatus(picker, state.lang === "en" ? "Location and address updated." : "Ubicación y dirección actualizadas.");
  } catch (error) {
    if (error.name === "AbortError") return;
    setMapStatus(picker, state.lang === "en" ? "The point was saved, but its address could not be identified." : "El punto quedó guardado, pero no se pudo identificar su dirección.", true);
  }
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
    applyGeocodedLocation(form, result);
    updateMapPicker(picker);
    setMapStatus(picker, t("mapAddressFound"));
  } catch (error) {
    if (error.name === "AbortError") return;
    setMapStatus(picker, t("mapAddressNotFound"), true);
  }
}

function hideMapAddressSuggestions(picker) {
  const suggestions = picker?.querySelector("[data-map-search-suggestions]");
  if (!suggestions) return;
  suggestions.hidden = true;
  suggestions.innerHTML = "";
  picker.querySelector("[data-map-search]")?.setAttribute("aria-expanded", "false");
}

function selectMapAddressSuggestion(picker, suggestion) {
  const form = picker?.closest("form");
  if (!form || !suggestion) return;
  const searchInput = picker.querySelector("[data-map-search]");
  if (searchInput) searchInput.value = suggestion.formattedAddress || "";
  setMapCoordinates(picker, suggestion.latitude, suggestion.longitude);
  applyGeocodedLocation(form, suggestion);
  updateMapPicker(picker);
  hideMapAddressSuggestions(picker);
  setMapStatus(picker, t("mapAddressFound"));
}

function renderMapAddressSuggestions(picker, items = []) {
  const container = picker?.querySelector("[data-map-search-suggestions]");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) {
    hideMapAddressSuggestions(picker);
    return;
  }
  items.forEach((suggestion) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "map-address-suggestion";
    option.setAttribute("role", "option");
    option.innerHTML = `
      <i data-lucide="map-pin"></i>
      <span>
        <strong>${escapeHtml(suggestion.formattedAddress || "")}</strong>
        <small>${escapeHtml([suggestion.components?.city, suggestion.components?.state].filter(Boolean).join(", "))}</small>
      </span>`;
    option.addEventListener("mousedown", (event) => event.preventDefault());
    option.addEventListener("click", () => selectMapAddressSuggestion(picker, suggestion));
    container.append(option);
  });
  container.hidden = false;
  picker.querySelector("[data-map-search]")?.setAttribute("aria-expanded", "true");
  refreshIcons();
}

async function loadMapAddressSuggestions(picker) {
  const searchInput = picker?.querySelector("[data-map-search]");
  const query = String(searchInput?.value || "").trim();
  if (query.length < 3) {
    mapSuggestionControllers.get(picker)?.abort();
    hideMapAddressSuggestions(picker);
    return;
  }
  mapSuggestionControllers.get(picker)?.abort();
  const controller = new AbortController();
  mapSuggestionControllers.set(picker, controller);
  try {
    const response = await fetch(`/api/geocode/suggestions?query=${encodeURIComponent(query)}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "No fue posible buscar ubicaciones");
    if (controller.signal.aborted || String(searchInput?.value || "").trim() !== query) return;
    renderMapAddressSuggestions(picker, result.suggestions || []);
  } catch (error) {
    if (error.name !== "AbortError") hideMapAddressSuggestions(picker);
  }
}

function scheduleMapAddressSuggestions(picker) {
  window.clearTimeout(mapSuggestionTimers.get(picker));
  mapSuggestionTimers.set(picker, window.setTimeout(() => void loadMapAddressSuggestions(picker), 280));
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
  window.clearTimeout(mapSuggestionTimers.get(picker));
  mapSuggestionControllers.get(picker)?.abort();
  mapSuggestionTimers.delete(picker);
  mapSuggestionControllers.delete(picker);
  hideMapAddressSuggestions(picker);
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
  const update = (latlng) => {
    setMapCoordinates(picker, latlng.lat, latlng.lng, "locationDetected");
    void reverseGeocodeMapPosition(picker, latlng.lat, latlng.lng);
  };
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
  const marker = new google.maps.Marker({ map, position: center, draggable: true });
  const updateFromLatLng = (latLng) => {
    marker.setPosition(latLng);
    setMapCoordinates(picker, latLng.lat(), latLng.lng());
    void reverseGeocodeMapPosition(picker, latLng.lat(), latLng.lng());
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
        <label class="map-search-field">
          <span data-i18n="mapSearchLabel">${escapeHtml(t("mapSearchLabel"))}</span>
          <div class="search-input-with-icon">
            <i data-lucide="search"></i>
            <input data-map-search type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" autocomplete="off" placeholder="${escapeHtml(t("mapSearchPlaceholder"))}" />
            <div class="map-address-suggestions" data-map-search-suggestions role="listbox" hidden></div>
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
    ["address", "location", "state", "city", "zone", "neighborhood"].forEach((name) => {
      const field = form?.elements[name];
      const schedule = () => {
        if (name === "location" && formField(form, "address")?.type === "hidden") formField(form, "address").value = field.value;
        scheduleMapAddressGeocode(picker);
      };
      field?.addEventListener("input", schedule);
      field?.addEventListener("change", schedule);
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
        (position) => {
          setMapCoordinates(picker, position.coords.latitude, position.coords.longitude, "locationDetected");
          void reverseGeocodeMapPosition(picker, position.coords.latitude, position.coords.longitude);
        },
        () => setFormMessage(form.querySelector(".form-message"), t("locationUnavailable"), true),
        { enableHighAccuracy: true, timeout: 9000 }
      );
    });
    picker.querySelector("[data-geocode-address]")?.addEventListener("click", () => {
      window.clearTimeout(mapGeocodeTimers.get(picker));
      void geocodeMapAddress(picker);
    });
    const mapSearch = picker.querySelector("[data-map-search]");
    const suggestionContainer = picker.querySelector("[data-map-search-suggestions]");
    const submitMapSearch = () => {
      const query = String(mapSearch?.value || "").trim();
      if (query) {
        hideMapAddressSuggestions(picker);
        void geocodeMapAddress(picker, query);
      }
    };
    picker.querySelector("[data-map-search-submit]")?.addEventListener("click", submitMapSearch);
    mapSearch?.addEventListener("input", () => scheduleMapAddressSuggestions(picker));
    mapSearch?.addEventListener("focus", () => {
      if (String(mapSearch.value || "").trim().length >= 3 && !suggestionContainer?.children.length) {
        scheduleMapAddressSuggestions(picker);
      } else if (suggestionContainer?.children.length) {
        suggestionContainer.hidden = false;
        mapSearch.setAttribute("aria-expanded", "true");
      }
    });
    mapSearch?.addEventListener("blur", () => {
      window.setTimeout(() => hideMapAddressSuggestions(picker), 140);
    });
    mapSearch?.addEventListener("keydown", (event) => {
      const options = [...(suggestionContainer?.querySelectorAll(".map-address-suggestion") || [])];
      const activeIndex = options.findIndex((option) => option.classList.contains("is-active"));
      if (["ArrowDown", "ArrowUp"].includes(event.key) && options.length) {
        event.preventDefault();
        options.forEach((option) => option.classList.remove("is-active"));
        const nextIndex = event.key === "ArrowDown"
          ? (activeIndex + 1) % options.length
          : (activeIndex <= 0 ? options.length - 1 : activeIndex - 1);
        options[nextIndex].classList.add("is-active");
        options[nextIndex].scrollIntoView({ block: "nearest" });
        return;
      }
      if (event.key === "Escape") {
        hideMapAddressSuggestions(picker);
        return;
      }
      if (event.key !== "Enter") return;
      event.preventDefault();
      if (activeIndex >= 0) options[activeIndex].click();
      else if (options.length === 1) options[0].click();
      else submitMapSearch();
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
  if (method !== "GET" && !state.csrfToken) {
    const sessionResponse = await fetch("/api/session", { credentials: "same-origin", cache: "no-store" });
    const sessionPayload = await sessionResponse.json().catch(() => ({}));
    state.csrfToken = sessionPayload.csrfToken || "";
    if (sessionPayload.user !== undefined) state.session = sessionPayload.user;
  }
  const securityHeaders = method === "GET" ? {} : { "X-CSRF-Token": state.csrfToken };
  const attempts = retry && method === "GET" ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(path, {
        credentials: "same-origin",
        cache: path === "/api/session" ? "no-store" : "default",
        headers: { "Content-Type": "application/json", ...securityHeaders, ...headers },
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

function safeParseImageMetadata(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value || "[]") : value;
    return Array.isArray(parsed)
      ? parsed.map((item) => ({
          descriptionEs: String(item?.descriptionEs || "").slice(0, 500),
          descriptionEn: String(item?.descriptionEn || "").slice(0, 500),
        }))
      : [];
  } catch {
    return [];
  }
}

function normalizedImageMetadata(metadata, count) {
  const list = safeParseImageMetadata(metadata).slice(0, count);
  while (list.length < count) list.push({ descriptionEs: "", descriptionEn: "" });
  return list;
}

function analyticsMetadata(extra = {}) {
  let visitorId = "";
  try {
    visitorId = sessionStorage.getItem("pcc.analyticsVisitor") || "";
    if (!visitorId) {
      visitorId = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      sessionStorage.setItem("pcc.analyticsVisitor", visitorId);
    }
  } catch {
    visitorId = `visitor-${Date.now()}`;
  }
  const params = new URLSearchParams(window.location.search);
  return {
    visitorId,
    path: window.location.pathname,
    lang: state.lang,
    referrer: document.referrer || "",
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    ...extra,
  };
}

function trackAnalyticsEvent(eventType, property = null, extra = {}) {
  return api("/api/analytics/events", {
    method: "POST",
    body: {
      eventType,
      propertyId: property?.id || "",
      metadata: analyticsMetadata({
        title: property ? localizedTitle(property) : "",
        zone: property?.zone || "",
        ...extra,
      }),
    },
  }).catch(() => null);
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
          <strong>10%</strong>
        </div>
        <div class="form-progress-track" role="progressbar" aria-label="${escapeHtml(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="10"><span></span></div>
        <small>${state.lang === "en" ? "Do not close this window while the information is being saved." : "No cierres esta ventana mientras se guarda la información."}</small>
      `;
      button.closest(".form-actions")?.insertAdjacentElement("afterend", indicator) || form.append(indicator);
    }
    let progress = 10;
    const bar = indicator.querySelector(".form-progress-track span");
    const value = indicator.querySelector("strong");
    bar.style.width = `${progress}%`;
    indicator.querySelector(".form-progress-track").setAttribute("aria-valuenow", String(progress));
    const timer = window.setInterval(() => {
      progress = Math.min(78, progress + 1);
      bar.style.width = `${progress}%`;
      value.textContent = `${progress}%`;
      indicator.querySelector(".form-progress-track").setAttribute("aria-valuenow", String(progress));
    }, 1200);
    formProgressTimers.set(form, timer);
    return;
  }
  const timer = formProgressTimers.get(form);
  if (timer) window.clearInterval(timer);
  formProgressTimers.delete(form);
  if (!indicator) return;
  indicator.querySelector(".form-progress-track span").style.width = "100%";
  indicator.querySelector(".form-progress-track").setAttribute("aria-valuenow", "100");
  indicator.querySelector("strong").textContent = "100%";
  indicator.querySelector(".form-progress-copy span").textContent = state.lang === "en" ? "Completed" : "Proceso completado";
  window.setTimeout(() => indicator.remove(), 650);
}

function updateFormProgress(button, progress, label, detail = "") {
  const form = button?.closest("form");
  const indicator = form?.querySelector(".form-progress[data-form-progress]");
  if (!indicator) return;
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const track = indicator.querySelector(".form-progress-track");
  indicator.querySelector(".form-progress-track span").style.width = `${safeProgress}%`;
  indicator.querySelector("strong").textContent = `${Math.round(safeProgress)}%`;
  indicator.querySelector(".form-progress-copy span").textContent = label;
  track.setAttribute("aria-valuenow", String(Math.round(safeProgress)));
  track.setAttribute("aria-label", label);
  if (detail) indicator.querySelector("small").textContent = detail;
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
  if (state.lang === "en") {
    return String(property.descriptionEn || "").trim()
      || "Request the complete English property description and current availability from a Puerto Cancun Center advisor.";
  }
  return property.descriptionEs || property.description || "";
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

function propertyPriceUnitLabel(property) {
  if (property?.priceUnit !== "sqm") return "";
  return state.lang === "en" ? " / m²" : " por m²";
}

function localizedPropertyPrice(property) {
  const currency = property.currency || (property.priceUsd !== null && property.priceUsd !== undefined ? "USD" : "MXN");
  const amount = property.price ?? (currency === "USD" ? property.priceUsd : property.priceMxn);
  return amount !== null && amount !== undefined && amount !== "" ? [currency, Number(amount)] : null;
}

function formatPriceLines(property) {
  const selected = localizedPropertyPrice(property);
  return selected ? [`${formatCurrencyLine(selected[0], selected[1], property.operation)}${propertyPriceUnitLabel(property)}`] : [];
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
  state.intelligentSearch = { active: false, ids: [], interpreted: null, exactMatch: true, message: "" };
  const intelligentStatus = $("#intelligentSearchStatus");
  if (intelligentStatus) intelligentStatus.hidden = true;
  const searchInput = $("#searchInput");
  if (searchInput) searchInput.value = "";
  const keywordSearch = $("#propertyKeywordSearch");
  if (keywordSearch) keywordSearch.value = "";
  syncFilterControls();
}

function syncFilterControls() {
  const type = $("#filterType");
  const zone = $("#filterZone");
  const operation = $("#filterOperation");
  if (type) type.value = state.filters.type || "";
  if (zone) zone.value = state.filters.zone || "";
  if (operation) operation.value = state.filters.operation || "";
  const keywordSearch = $("#propertyKeywordSearch");
  if (keywordSearch && keywordSearch.value !== (state.filters.text || "")) keywordSearch.value = state.filters.text || "";
}

function applyKeywordFilter(value) {
  state.filters.text = String(value || "").trim();
  state.intelligentSearch = { active: false, ids: [], interpreted: null, exactMatch: true, message: "" };
  const intelligentStatus = $("#intelligentSearchStatus");
  if (intelligentStatus) intelligentStatus.hidden = true;
  renderProperties();
}

function filterServerRenderedCategory() {
  const input = $("#categoryKeywordSearch");
  if (!input) return;
  const query = normalizeSearchText(input.value);
  const cards = $$("[data-category-property]");
  let count = 0;
  cards.forEach((card) => {
    const matches = !query || normalizeSearchText(card.dataset.categorySearch || "").includes(query);
    card.hidden = !matches;
    if (matches) count += 1;
  });
  const status = $("#categorySearchStatus");
  if (status) status.textContent = state.lang === "en" ? `${count} available listings` : `${count} propiedades disponibles`;
  const empty = $("#categorySearchEmpty");
  if (empty) empty.hidden = count > 0;
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
  if (
    property.publicationSection === "developments"
    && filters.type !== "Desarrollo"
    && !state.intelligentSearch.active
    && !filters.text
  ) return false;
  if (filters.type && property.type !== filters.type) return false;
  if (filters.zone && property.zone !== filters.zone) return false;
  if (filters.operation && property.operation !== filters.operation) return false;
  if (filters.featured && !property.featured) return false;
  if (state.intelligentSearch.active && !state.intelligentSearch.ids.includes(property.id)) return false;
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
      property.parentDevelopment?.nameEs,
      property.parentDevelopment?.nameEn,
      property.parentDevelopment?.developer,
      ...(Array.isArray(property.keywords) ? property.keywords : []),
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

function updateHomeEditorialImages() {
  const candidates = state.properties.filter((property) => /^\/media\/properties\//.test(primaryImage(property)));
  const usedProperties = new Set();
  const usedImages = new Set();
  const assignments = [
    [".type-grid .type-tile:nth-child(1)", (property) => property.type === "Casa"],
    [".type-grid .type-tile:nth-child(2)", (property) => property.type === "Departamento"],
    [".type-grid .type-tile:nth-child(3)", (property) => property.type === "Terreno"],
    [".zone-grid .zone-card:nth-child(1)", (property) => /puerto canc[uú]n/i.test(property.zone || "")],
    [".zone-grid .zone-card:nth-child(2)", (property) => /zona hotelera/i.test(property.zone || "")],
    [".zone-grid .zone-card:nth-child(3)", (property) => property.type === "Preventa" || property.publicationSection === "developments"],
  ];
  assignments.forEach(([selector, matches]) => {
    const image = document.querySelector(`${selector} img`);
    const property = candidates.find((candidate) => {
      const source = primaryImage(candidate);
      return matches(candidate) && !usedProperties.has(candidate.id) && !usedImages.has(source);
    }) || candidates.find((candidate) => {
      const source = primaryImage(candidate);
      return !usedProperties.has(candidate.id) && !usedImages.has(source);
    });
    if (!image || !property) return;
    const source = primaryImage(property);
    usedProperties.add(property.id);
    usedImages.add(source);
    image.src = optimizedMediaUrl(source, 640);
    image.alt = localizedTitle(property);
  });
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
  const guidedSearch = $("#guidedSearchForm");
  const propertyToolbar = $(".properties-section .property-toolbar");
  const propertyAlert = $("#propertyAlertForm");
  if (guidedSearch) guidedSearch.hidden = isHome;
  if (propertyToolbar) propertyToolbar.hidden = isHome;
  if (propertyAlert) propertyAlert.hidden = isHome;
  if (isHome) updateHomeEditorialImages();
  const propertiesTitle = $("#propertiesTitle");
  const catalogCta = $("#homeCatalogCta");
  if (propertiesTitle) propertiesTitle.textContent = isHome
    ? state.lang === "en" ? "Selected properties" : "Propiedades seleccionadas"
    : t("allProperties");
  $("#resultCount").textContent = isHome && properties.length > displayedProperties.length
    ? `${displayedProperties.length} ${state.lang === "en" ? "of" : "de"} ${properties.length} ${t("resultText")}`
    : `${properties.length} ${t("resultText")}`;
  if (catalogCta) {
    catalogCta.hidden = !isHome || properties.length === 0;
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
      const descriptionSummary = truncateText(localizedDescription(property), 190);
      const isFavorite = state.favorites.includes(property.id);
      const isCompared = state.compare.includes(property.id);
      const favoriteLabel = isFavorite ? t("removeFavorite") : t("saveFavorite");
      const compareLabel = isCompared ? t("removeComparison") : t("addComparison");

      return `
        <article class="property-card" id="property-${escapeHtml(property.id)}">
          <div class="property-image">
            <a href="${escapeHtml(propertyUrl || `/propiedades/${property.slug || property.id}`)}" aria-label="${escapeHtml(localizedTitle(property))}"><img src="${escapeHtml(optimizedMediaUrl(primaryImage(property), 640))}" alt="${escapeHtml(localizedTitle(property))}" width="640" height="420" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" /></a>
            <div class="badge-row">${badgeHtml}</div>
            <div class="property-save-actions">
              <button class="${isFavorite ? "active" : ""}" type="button" data-favorite="${escapeHtml(property.id)}" title="${escapeHtml(favoriteLabel)}" aria-label="${escapeHtml(favoriteLabel)}"><i data-lucide="heart"></i></button>
              <button class="${isCompared ? "active" : ""}" type="button" data-compare="${escapeHtml(property.id)}" title="${escapeHtml(compareLabel)}" aria-label="${escapeHtml(compareLabel)}"><i data-lucide="git-compare-arrows"></i></button>
            </div>
          </div>
          <div class="property-body">
            <p class="property-price">${escapeHtml(formatPriceSummary(property))}</p>
            <h3 class="property-title">${escapeHtml(localizedTitle(property))}</h3>
            <p class="property-location">${escapeHtml(displayLocation(property))}</p>
            <p class="property-meta">${escapeHtml(meta.join(" • "))}</p>
            <p class="property-description">${escapeHtml(descriptionSummary)}</p>
            <div class="property-actions">
              <a class="mini-button primary" href="${escapeHtml(propertyUrl || `/propiedades/${property.slug || property.id}`)}">${escapeHtml(state.lang === "en" ? "View property" : "Ver propiedad")}</a>
              <button class="mini-button icon-only" type="button" data-detail="${escapeHtml(property.id)}" title="${escapeHtml(state.lang === "en" ? "Quick view" : "Vista rapida")}" aria-label="${escapeHtml(state.lang === "en" ? "Quick view" : "Vista rapida")}"><i data-lucide="search"></i></button>
              <button class="mini-button icon-only" type="button" data-tour="${escapeHtml(property.id)}" title="${escapeHtml(state.lang === "en" ? "Request a tour" : "Solicitar visita")}" aria-label="${escapeHtml(state.lang === "en" ? "Request a tour" : "Solicitar visita")}"><i data-lucide="calendar-days"></i></button>
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

async function toggleFavorite(id) {
  const wasSaved = state.favorites.includes(id);
  const property = state.properties.find((item) => item.id === id);
  state.favorites = wasSaved
    ? state.favorites.filter((item) => item !== id)
    : [...state.favorites, id];
  localStorage.setItem(keys.favorites, JSON.stringify(state.favorites));
  renderProperties();
  void trackAnalyticsEvent(wasSaved ? "favorite_removed" : "favorite_added", property);
  if (state.session?.role !== "seller") {
    showToast(wasSaved ? "Propiedad eliminada de favoritos." : "Favorito guardado en este dispositivo. Inicia sesión para conservarlo en tu cuenta.");
    return;
  }
  try {
    await api(`/api/seller/favorites/${encodeURIComponent(id)}`, { method: wasSaved ? "DELETE" : "PUT" });
    state.favoriteProperties = wasSaved
      ? state.favoriteProperties.filter((item) => item.id !== id)
      : property && !state.favoriteProperties.some((item) => item.id === id)
        ? [property, ...state.favoriteProperties]
        : state.favoriteProperties;
    renderSellerFavorites();
    showToast(wasSaved ? "Propiedad eliminada de tu cuenta." : "Propiedad guardada en tu cuenta.");
  } catch (error) {
    state.favorites = wasSaved
      ? [...state.favorites, id]
      : state.favorites.filter((item) => item !== id);
    localStorage.setItem(keys.favorites, JSON.stringify(state.favorites));
    renderProperties();
    showToast(error.message, "error");
  }
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

function renderSellerFavorites() {
  const list = $("#sellerFavorites");
  if (!list) return;
  const properties = Array.isArray(state.favoriteProperties) ? state.favoriteProperties : [];
  list.innerHTML = properties.length
    ? properties.map((property) => `
        <article class="seller-property-row">
          <img src="${escapeHtml(optimizedMediaUrl(primaryImage(property), 320))}" alt="${escapeHtml(localizedTitle(property))}" loading="lazy" />
          <div>
            <span>${escapeHtml(formatPriceSummary(property))}</span>
            <h3>${escapeHtml(localizedTitle(property))}</h3>
            <p>${escapeHtml(displayLocation(property))}</p>
            <div class="item-actions">
              <a class="mini-button primary" href="${escapeHtml(state.lang === "en" ? property.urlEn : property.urlEs)}">${state.lang === "en" ? "View property" : "Ver propiedad"}</a>
              <button class="mini-button" type="button" data-favorite="${escapeHtml(property.id)}"><i data-lucide="heart-off"></i><span>Quitar</span></button>
            </div>
          </div>
        </article>`).join("")
    : `<div class="empty-state action-empty"><i data-lucide="heart"></i><p>No tienes propiedades favoritas en esta cuenta.</p><a class="mini-button primary" href="/#properties">Explorar propiedades</a></div>`;
}

function savedSearchSummary(search) {
  const filters = search.filters || {};
  return [
    filters.propertyType || filters.type,
    filters.location || filters.zone,
    filters.maxPrice ? `Hasta ${new Intl.NumberFormat("es-MX").format(filters.maxPrice)} ${filters.currency || ""}` : "",
    filters.bedrooms ? `${filters.bedrooms}+ recámaras` : "",
  ].filter(Boolean).join(" · ") || search.query || "Sin filtros adicionales";
}

function renderSellerSavedSearches() {
  const list = $("#sellerSavedSearches");
  if (!list) return;
  const searches = Array.isArray(state.savedSearches) ? state.savedSearches : [];
  list.innerHTML = searches.length
    ? searches.map((search) => `
        <article class="saved-search-row">
          <div>
            <span class="status ${search.alertsEnabled ? "active" : "draft"}">${search.alertsEnabled ? "Alertas activas" : "Sin alertas"}</span>
            <h3>${escapeHtml(search.name)}</h3>
            <p>${escapeHtml(savedSearchSummary(search))}</p>
            <div class="saved-search-channels">
              <span class="status active">Panel</span>
              <span class="status ${search.emailEnabled ? "active" : "draft"}">Correo ${search.emailEnabled ? "activo" : "inactivo"}</span>
              <span class="status ${search.whatsappEnabled ? "active" : "draft"}">WhatsApp ${search.whatsappEnabled ? "activo" : "inactivo"}</span>
            </div>
            <small>${search.lastRunAt ? `Última ejecución: ${escapeHtml(formatDate(search.lastRunAt))}` : "Todavía no se ha ejecutado"}</small>
          </div>
          <div class="item-actions">
            <button class="mini-button primary" type="button" data-run-saved-search="${escapeHtml(search.id)}"><i data-lucide="search"></i><span>Buscar ahora</span></button>
            <button class="mini-button" type="button" data-toggle-saved-alert="${escapeHtml(search.id)}" data-alert-value="${search.alertsEnabled ? "false" : "true"}"><i data-lucide="${search.alertsEnabled ? "bell-off" : "bell-ring"}"></i><span>${search.alertsEnabled ? "Pausar alertas" : "Activar alertas"}</span></button>
            <button class="mini-button" type="button" data-rename-saved-search="${escapeHtml(search.id)}"><i data-lucide="pencil"></i><span>Renombrar</span></button>
            <button class="mini-button" type="button" data-toggle-saved-channel="email" data-saved-search-id="${escapeHtml(search.id)}" data-channel-value="${search.emailEnabled ? "false" : "true"}"><i data-lucide="mail"></i><span>${search.emailEnabled ? "Quitar correo" : "Usar correo"}</span></button>
            <button class="mini-button" type="button" data-toggle-saved-channel="whatsapp" data-saved-search-id="${escapeHtml(search.id)}" data-channel-value="${search.whatsappEnabled ? "false" : "true"}"><i data-lucide="message-circle"></i><span>${search.whatsappEnabled ? "Quitar WhatsApp" : "Usar WhatsApp"}</span></button>
            <button class="mini-button danger" type="button" data-delete-saved-search="${escapeHtml(search.id)}"><i data-lucide="trash-2"></i><span>Eliminar</span></button>
          </div>
        </article>`).join("")
    : `<div class="empty-state action-empty"><i data-lucide="search"></i><p>Guarda una búsqueda para repetirla y recibir nuevas coincidencias.</p></div>`;
}

function renderSellerAlertCapabilities() {
  const target = $("#sellerAlertCapabilities");
  if (!target) return;
  const email = state.alertCapabilities.email || {};
  const whatsapp = state.alertCapabilities.whatsapp || {};
  target.innerHTML = `<strong>Entrega disponible:</strong> Panel interno · Correo: ${email.available ? "disponible" : escapeHtml(email.reason || "pendiente")} · WhatsApp: ${whatsapp.available ? "disponible" : escapeHtml(whatsapp.reason || "pendiente")}`;
}

function tourStatusLabel(status) {
  return ({ requested: "Solicitada", contacted: "Contactada", confirmed: "Confirmada", completed: "Realizada", cancelled: "Cancelada" })[status] || "Solicitada";
}

function renderSellerTours() {
  const list = $("#sellerTours");
  if (!list) return;
  const tours = Array.isArray(state.tours) ? state.tours : [];
  list.innerHTML = tours.length
    ? tours.map((tour) => `
        <article class="seller-tour-row">
          <div>
            <span class="status ${escapeHtml(tour.status || "requested")}">${escapeHtml(tourStatusLabel(tour.status))}</span>
            <h3>${escapeHtml(tour.property_title || "Propiedad")}</h3>
            <p>${tour.preferred_date ? `Fecha solicitada: ${escapeHtml(formatDate(tour.preferred_date))}` : "Fecha por coordinar"}${tour.preferred_time ? ` · ${escapeHtml(tour.preferred_time)}` : ""}</p>
            ${tour.comments ? `<small>${escapeHtml(tour.comments)}</small>` : ""}
          </div>
        </article>`).join("")
    : `<div class="empty-state action-empty"><i data-lucide="calendar-days"></i><p>No has solicitado visitas todavía.</p><a class="mini-button primary" href="/#properties">Buscar una propiedad</a></div>`;
}

function renderAdminTours() {
  const list = $("#adminTours");
  if (!list) return;
  const tours = Array.isArray(state.tours) ? state.tours : [];
  list.innerHTML = tours.length
    ? tours.map((tour) => `
        <article class="admin-tour-row">
          <div><span class="status ${escapeHtml(tour.status || "requested")}">${escapeHtml(tourStatusLabel(tour.status))}</span><h3>${escapeHtml(tour.property_title || "Propiedad")} ${tour.mls ? `· MLS# ${escapeHtml(tour.mls)}` : ""}</h3><p>${escapeHtml(tour.name || "")} · ${escapeHtml(tour.phone || "")}${tour.email ? ` · ${escapeHtml(tour.email)}` : ""}</p><small>${tour.preferred_date ? escapeHtml(formatDate(tour.preferred_date)) : "Fecha por coordinar"}${tour.preferred_time ? ` · ${escapeHtml(tour.preferred_time)}` : ""}</small></div>
          <label><span>Estado</span><select data-admin-tour-status="${escapeHtml(tour.id)}"><option value="requested" ${tour.status === "requested" ? "selected" : ""}>Solicitada</option><option value="contacted" ${tour.status === "contacted" ? "selected" : ""}>Contactada</option><option value="confirmed" ${tour.status === "confirmed" ? "selected" : ""}>Confirmada</option><option value="completed" ${tour.status === "completed" ? "selected" : ""}>Realizada</option><option value="cancelled" ${tour.status === "cancelled" ? "selected" : ""}>Cancelada</option></select></label>
        </article>`).join("")
    : `<p class="empty-state">No hay solicitudes de visita.</p>`;
}

async function updateAdminTourStatus(id, status) {
  try {
    const data = await api(`/api/admin/tours/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } });
    state.tours = state.tours.map((tour) => tour.id === id ? { ...tour, ...data.tour } : tour);
    renderAdminTours();
    showToast("Estado de visita actualizado.");
  } catch (error) {
    showToast(error.message, "error");
    renderAdminTours();
  }
}

async function savedSearchSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const message = $("#savedSearchMessage");
  const values = Object.fromEntries(new FormData(form).entries());
  const filters = {
    propertyType: values.propertyType || "",
    location: values.location || "",
    maxPrice: Number(values.maxPrice || 0) || null,
    currency: values.currency || "",
  };
  setButtonLoading(button, true, "Guardando…");
  setFormMessage(message, "");
  try {
    const data = await api("/api/seller/saved-searches", {
      method: "POST",
      body: {
        name: values.name,
        query: values.query,
        filters,
        alertsEnabled: form.alertsEnabled.checked,
        emailEnabled: form.emailEnabled.checked,
        whatsappEnabled: form.whatsappEnabled.checked,
        consent: form.consent.checked,
      },
    });
    state.savedSearches = [data.savedSearch, ...state.savedSearches];
    form.reset();
    renderSellerSavedSearches();
    setFormMessage(message, "Búsqueda guardada en tu cuenta.");
    showToast("Búsqueda guardada.");
    refreshIcons();
  } catch (error) {
    setFormMessage(message, error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function runSavedSearch(id) {
  try {
    const data = await api(`/api/seller/saved-searches/${encodeURIComponent(id)}/run`, { method: "POST", body: { createAlerts: true } });
    state.intelligentSearch = { active: true, ids: (data.matches || []).map((property) => property.id), interpreted: null, exactMatch: true, message: "" };
    const search = state.savedSearches.find((item) => item.id === id);
    if (search) search.lastRunAt = new Date().toISOString();
    renderSellerSavedSearches();
    hidePanel();
    renderProperties();
    $("#properties")?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast(`${(data.matches || []).length} coincidencia${(data.matches || []).length === 1 ? "" : "s"} encontrada${(data.matches || []).length === 1 ? "" : "s"}.`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function toggleSavedSearchAlert(id, value) {
  try {
    const data = await api(`/api/seller/saved-searches/${encodeURIComponent(id)}`, { method: "PATCH", body: { alertsEnabled: value, consent: value } });
    state.savedSearches = state.savedSearches.map((item) => item.id === id ? data.savedSearch : item);
    renderSellerSavedSearches();
    refreshIcons();
    showToast(value ? "Alertas internas activadas." : "Alertas pausadas.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function renameSavedSearch(id) {
  const search = state.savedSearches.find((item) => item.id === id);
  if (!search) return;
  const name = window.prompt("Nuevo nombre de la búsqueda", search.name);
  if (!name || name.trim() === search.name) return;
  try {
    const data = await api(`/api/seller/saved-searches/${encodeURIComponent(id)}`, { method: "PATCH", body: { name: name.trim() } });
    state.savedSearches = state.savedSearches.map((item) => item.id === id ? data.savedSearch : item);
    renderSellerSavedSearches();
    refreshIcons();
    showToast("Búsqueda renombrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function toggleSavedSearchChannel(id, channel, value) {
  const capability = state.alertCapabilities[channel] || {};
  if (value && !capability.available) {
    showToast(capability.reason || "El canal todavía no está disponible; guardaremos la preferencia.", "error");
  }
  try {
    const body = { alertsEnabled: true, consent: true };
    body[channel === "email" ? "emailEnabled" : "whatsappEnabled"] = value;
    const data = await api(`/api/seller/saved-searches/${encodeURIComponent(id)}`, { method: "PATCH", body });
    state.savedSearches = state.savedSearches.map((item) => item.id === id ? data.savedSearch : item);
    renderSellerSavedSearches();
    refreshIcons();
    showToast(value ? `Preferencia de ${channel === "email" ? "correo" : "WhatsApp"} guardada.` : "Canal desactivado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteSavedSearch(id) {
  if (!window.confirm("¿Eliminar esta búsqueda guardada?")) return;
  try {
    await api(`/api/seller/saved-searches/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.savedSearches = state.savedSearches.filter((item) => item.id !== id);
    renderSellerSavedSearches();
    refreshIcons();
    showToast("Búsqueda eliminada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function openTourRequest(propertyId) {
  const property = state.properties.find((item) => item.id === propertyId);
  const modal = $("#tourRequestModal");
  const form = $("#tourRequestForm");
  if (!property || !modal || !form) return;
  form.reset();
  form.propertyId.value = property.id;
  form.name.value = state.session?.name || "";
  form.email.value = state.session?.email || "";
  form.phone.value = state.session?.phone || "";
  $("#tourPropertyTitle").textContent = localizedTitle(property);
  setFormMessage($("#tourRequestMessage"), "");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  form.name.focus();
}

function closeTourRequest() {
  const modal = $("#tourRequestModal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function openSellerOptions(event) {
  event?.preventDefault?.();
  const modal = $("#sellerOptionsModal");
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  refreshIcons();
}

function closeSellerOptions() {
  const modal = $("#sellerOptionsModal");
  if (modal) modal.hidden = true;
  if ($$(".modal-backdrop:not([hidden])").length === 0) document.body.classList.remove("modal-open");
}

function resetGuestSaleForm() {
  const form = $("#guestSaleForm");
  if (!form) return;
  form.reset();
  form.dataset.images = "[]";
  delete form.dataset.idempotencyKey;
  formField(form, "formStartedAt").value = String(Date.now());
  $("#guestSaleImagePreview").hidden = true;
  $("#guestSaleImagePreview .image-preview-grid").innerHTML = "";
  setFormMessage($("#guestSaleMessage"), "");
  resetMapPickerForForm(form);
  setGuestSaleStep("property");
  updateGuestContactFields();
}

function setGuestSaleStep(step) {
  $$('[data-guest-sale-step]').forEach((section) => {
    section.hidden = section.dataset.guestSaleStep !== step;
  });
}

function openGuestSale() {
  closeSellerOptions();
  resetGuestSaleForm();
  $("#guestSaleModal").hidden = false;
  document.body.classList.add("modal-open");
  $("#guestSaleForm [name=title]")?.focus();
  refreshIcons();
}

function closeGuestSale() {
  $("#guestSaleModal").hidden = true;
  if ($$(".modal-backdrop:not([hidden])").length === 0) document.body.classList.remove("modal-open");
}

function continueGuestSale() {
  const form = $("#guestSaleForm");
  if (!form) return;
  const requiredFields = [formField(form, "title"), formField(form, "type"), formField(form, "location")];
  const invalid = requiredFields.find((field) => !field?.reportValidity());
  if (invalid) return;
  setGuestSaleStep("contact");
  updateGuestContactFields();
  form.querySelector('[data-guest-contact-field="email"] input')?.focus();
}

function updateGuestContactFields() {
  const form = $("#guestSaleForm");
  if (!form) return;
  const method = form.querySelector('[name="preferredContact"]:checked')?.value || "email";
  const emailField = form.querySelector('[data-guest-contact-field="email"]');
  const whatsappField = form.querySelector('[data-guest-contact-field="whatsapp"]');
  emailField.hidden = method !== "email";
  whatsappField.hidden = method !== "whatsapp";
  formField(form, "email").required = method === "email";
  formField(form, "phone").required = method === "whatsapp";
}

async function guestSaleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const message = $("#guestSaleMessage");
  const method = form.querySelector('[name="preferredContact"]:checked')?.value || "email";
  if (!form.dataset.idempotencyKey) form.dataset.idempotencyKey = crypto.randomUUID();
  setButtonLoading(button, true, state.lang === "en" ? "Sending..." : "Enviando...");
  setFormMessage(message, "");
  try {
    const body = Object.fromEntries(new FormData(form).entries());
    body.images = safeParseImages(form.dataset.images);
    body.preferredContact = method;
    body.consent = formField(form, "consent").checked;
    const data = await api("/api/guest-sale-requests", {
      method: "POST",
      headers: { "Idempotency-Key": form.dataset.idempotencyKey },
      body,
      timeoutMs: 90000,
    });
    setFormMessage(message, data.message || (state.lang === "en" ? "Request received." : "Solicitud recibida."));
    showToast(state.lang === "en" ? "Your property was sent for review." : "Tu propiedad fue enviada para revisión.");
    window.setTimeout(closeGuestSale, 1200);
  } catch (error) {
    setFormMessage(message, error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function openDetailedSale() {
  closeSellerOptions();
  if (state.session?.role === "seller") {
    await showPanel();
    setSellerSection("sale");
    return;
  }
  if (state.session?.role === "admin") {
    showToast(state.lang === "en" ? "Seller accounts use the guided listing form." : "El formulario acompañado está disponible para cuentas de vendedor.");
    return;
  }
  openAuth("register");
}

async function tourRequestSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const message = $("#tourRequestMessage");
  setButtonLoading(button, true, "Enviando…");
  setFormMessage(message, "");
  try {
    const values = Object.fromEntries(new FormData(form).entries());
    const data = await api("/api/tour-requests", { method: "POST", body: { ...values, consent: form.consent.checked } });
    setFormMessage(message, data.message || "Solicitud enviada.");
    showToast("Visita solicitada. Un asesor confirmará la disponibilidad.");
    if (state.session?.role === "seller") {
      state.tours = [{ ...values, id: data.id, status: data.status, property_title: $("#tourPropertyTitle").textContent }, ...state.tours];
      renderSellerTours();
    }
    window.setTimeout(closeTourRequest, 900);
  } catch (error) {
    setFormMessage(message, error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function setSellerSection(section = "sale") {
  const available = new Set(["sale", "requests", "favorites", "searches", "tours", "services", "service-form"]);
  state.sellerSection = available.has(section) ? section : "sale";
  $$('[data-seller-section]').forEach((button) => button.classList.toggle("active", button.dataset.sellerSection === state.sellerSection));
  $$('[data-seller-panel-section]').forEach((panel) => {
    panel.hidden = panel.dataset.sellerPanelSection !== state.sellerSection;
  });
  refreshIcons();
}

function openSellerFlow(flow) {
  if (flow === "sale") {
    $("#sellerServiceCard").hidden = true;
    setSellerSection("sale");
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
  setSellerSection("service-form");
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
                ? `<button class="mini-button" type="button" data-compose-email data-email="${escapeHtml(lead.email)}" data-email-name="${escapeHtml(lead.name || "")}" data-email-context="${escapeHtml(leadTypeLabel(lead.leadType))}">${escapeHtml(t("respondEmail"))}</button>`
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
              <span class="status score-${escapeHtml(contact.smartScore?.level || contact.leadScore || "cold")}">${escapeHtml(contact.smartScore ? `${contact.smartScore.value}/100 · ${scoreLabel(contact.smartScore.level)}` : scoreLabel(contact.leadScore))}</span>
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
          ${contact.smartSummary ? `<div class="contact-intelligence"><p><b>Resumen inteligente:</b> ${escapeHtml(contact.smartSummary)}</p><p><b>Siguiente acción:</b> ${escapeHtml(contact.recommendedAction || "")}</p><small>Los datos del perfil son confirmados; intención y score son inferencias operativas.</small></div>` : ""}
          <div class="item-actions">
            <button class="mini-button primary" type="button" data-contact-intelligence="${escapeHtml(contact.id)}"><i data-lucide="activity"></i> Ver historial</button>
            <button class="mini-button" type="button" data-edit-contact="${escapeHtml(contact.id)}">${escapeHtml(t("edit"))}</button>
            ${phoneUrl ? `<a class="mini-button primary" href="${escapeHtml(phoneUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("respondWhatsApp"))}</a>` : ""}
            ${contact.email ? `<button class="mini-button" type="button" data-compose-email data-email="${escapeHtml(contact.email)}" data-email-name="${escapeHtml(contact.name || "")}" data-email-context="${escapeHtml(contactTypeLabel(contact.contactType))}">${escapeHtml(t("respondEmail"))}</button>` : ""}
            <button class="mini-button danger" type="button" data-delete-contact="${escapeHtml(contact.id)}">Eliminar</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function guestSaleStatusLabel(status) {
  if (status === "contacted") return state.lang === "en" ? "Contacted" : "Contactada";
  if (status === "approved") return state.lang === "en" ? "Approved as draft" : "Aprobada como borrador";
  if (status === "archived") return state.lang === "en" ? "Archived" : "Archivada";
  return state.lang === "en" ? "Pending" : "Pendiente";
}

function guestSaleContactActions(request) {
  const whatsappNumber = leadPhoneForWhatsApp(request.phone);
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, te contactamos de Puerto Cancun Center acerca de ${request.title}. Queremos completar algunos datos de la propiedad.`)}`
    : "";
  return `
    ${request.email ? `<button class="mini-button" type="button" data-compose-email data-email="${escapeHtml(request.email)}" data-email-name="Propietario" data-email-context="Venta sin registro · ${escapeHtml(request.title)}"><i data-lucide="mail"></i> Contactar por correo</button>` : ""}
    ${whatsappUrl ? `<a class="mini-button whatsapp-action" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer"><i data-lucide="message-circle"></i> Contactar por WhatsApp</a>` : ""}
  `;
}

function renderAdminGuestRequests() {
  const list = $("#adminGuestRequests");
  if (!list) return;
  const requests = state.guestSaleRequests || [];
  const pending = requests.filter((request) => request.status === "pending").length;
  if ($("#adminGuestRequestSummary")) $("#adminGuestRequestSummary").textContent = `${requests.length} solicitudes · ${pending} pendientes`;
  list.innerHTML = requests.length
    ? requests.map((request) => `
      <article class="request-admin-entry guest-sale-request">
        <div class="request-item detailed-request">
          <div class="request-item-header"><div><span class="status ${escapeHtml(request.status)}">${escapeHtml(guestSaleStatusLabel(request.status))}</span><h3>${escapeHtml(request.title)}</h3></div><strong>${escapeHtml(displayType(request.type))}</strong></div>
          ${request.image ? `<img class="request-thumb" src="${escapeHtml(request.image)}" alt="${escapeHtml(request.title)}" loading="lazy" />` : ""}
          <div class="detail-grid compact"><div><span>Ubicación indicada</span><strong>${escapeHtml(request.location)}</strong><small>${escapeHtml(request.images.length)} imagen${request.images.length === 1 ? "" : "es"}</small></div><div><span>Contacto preferido</span><strong>${escapeHtml(request.preferredContact === "whatsapp" ? "WhatsApp" : "Correo")}</strong><small>${escapeHtml(request.email || request.phone || "")}</small></div></div>
          ${request.description ? `<p class="request-description">${escapeHtml(request.description)}</p>` : `<p class="request-description muted">Sin descripción; solicitar datos solo si son necesarios.</p>`}
          <p class="request-date">Recibida: ${escapeHtml(formatDate(request.createdAt))}</p>
        </div>
        <div class="item-actions">${guestSaleContactActions(request)}<button class="mini-button" type="button" data-respond-guest="${escapeHtml(request.id)}"><i data-lucide="messages-square"></i> Registrar seguimiento</button>${request.status !== "approved" ? `<button class="mini-button primary" type="button" data-approve-guest-request="${escapeHtml(request.id)}"><i data-lucide="file-plus-2"></i> Aprobar como borrador</button>` : ""}<button class="mini-button" type="button" data-guest-request-status="${escapeHtml(request.id)}" data-status-value="contacted">Marcar contactada</button><button class="mini-button" type="button" data-guest-request-status="${escapeHtml(request.id)}" data-status-value="archived">Archivar</button></div>
      </article>`).join("")
    : `<p class="empty-state">Todavía no hay solicitudes de venta sin registro.</p>`;
  refreshIcons();
}

function renderAdminGuestContacts() {
  const list = $("#adminGuestContacts");
  if (!list) return;
  const search = normalizeSearchText($("#guestContactSearch")?.value || "");
  const unique = new Map();
  (state.guestSaleRequests || []).forEach((request) => {
    const key = request.email ? `email:${request.email.toLowerCase()}` : `phone:${request.phone}`;
    if (!unique.has(key)) unique.set(key, request);
  });
  const contacts = [...unique.values()].filter((request) => !search || normalizeSearchText(`${request.email} ${request.phone} ${request.title} ${request.location}`).includes(search));
  if ($("#adminGuestContactSummary")) $("#adminGuestContactSummary").textContent = `${contacts.length} contactos sin cuenta`;
  list.innerHTML = contacts.length
    ? contacts.map((request) => `
      <article class="contact-entry guest-contact-entry"><div class="contact-main"><div><span class="status">SIN REGISTRO</span><h3>${escapeHtml(request.email || request.phone || "Contacto")}</h3><p>Propietario · ${escapeHtml(request.type)}</p></div><strong>${escapeHtml(formatDate(request.createdAt))}</strong></div><div class="lead-contact-grid"><div><span>Propiedad</span><strong>${escapeHtml(request.title)}</strong></div><div><span>Ubicación</span><strong>${escapeHtml(request.location)}</strong></div><div><span>Correo</span><strong>${escapeHtml(request.email || "-")}</strong></div><div><span>WhatsApp</span><strong>${escapeHtml(request.phone || "-")}</strong></div></div><div class="item-actions">${guestSaleContactActions(request)}</div></article>`).join("")
    : `<p class="empty-state">No se encontraron contactos sin registro.</p>`;
  refreshIcons();
}

async function updateGuestSaleRequestStatus(id, status, button) {
  setButtonLoading(button, true, "Guardando...");
  try {
    const data = await api(`/api/admin/guest-sale-requests/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } });
    state.guestSaleRequests = state.guestSaleRequests.map((request) => request.id === id ? data.request : request);
    renderAdminGuestRequests();
    renderAdminGuestContacts();
    updateAdminShell();
    showToast("Solicitud actualizada.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function approveGuestSaleRequest(id, button) {
  if (!id || button?.disabled) return;
  setButtonLoading(button, true, "Creando borrador...");
  try {
    const data = await api(`/api/admin/guest-sale-requests/${encodeURIComponent(id)}/approve`, {
      method: "POST",
    });
    state.guestSaleRequests = state.guestSaleRequests.map((request) => request.id === id ? data.request : request);
    if (data.property) {
      const existingIndex = state.properties.findIndex((property) => property.id === data.property.id);
      if (existingIndex >= 0) state.properties.splice(existingIndex, 1, data.property);
      else state.properties.unshift(data.property);
    }
    renderAdminGuestRequests();
    renderAdminGuestContacts();
    renderAdminListings();
    renderProperties();
    updateAdminShell();
    showToast("Solicitud aprobada. Se creó un borrador privado para completar y revisar antes de publicarlo.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

function closeContactIntelligenceModal() {
  const modal = $("#contactIntelligenceModal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function contactTimelineIcon(type) {
  return ({
    lead: "inbox",
    message: "message-square-text",
    valuation: "badge-dollar-sign",
    tour: "calendar-check",
    task: "list-checks",
    match: "git-compare-arrows",
    whatsapp: "message-circle",
    analytics: "mouse-pointer-click",
    saved_search: "search-check",
    favorite: "heart",
    audit: "shield-check",
    contact_created: "user-round-plus",
  })[type] || "circle-dot";
}

async function openContactIntelligence(id) {
  const modal = $("#contactIntelligenceModal");
  const content = $("#contactIntelligenceContent");
  if (!modal || !content) return;
  const knownContact = state.contacts.find((item) => item.id === id);
  $("#contactIntelligenceTitle").textContent = knownContact?.name || "Detalle del contacto";
  content.innerHTML = `<div class="loading-inline"><span class="loading-spinner"></span><span>Reconstruyendo historial desde registros reales...</span></div>`;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  try {
    const data = await api(`/api/admin/contacts/${encodeURIComponent(id)}/intelligence`);
    const contact = data.contact || {};
    const confirmed = data.confirmed || {};
    const inferred = data.inferred || {};
    const score = inferred.score || {};
    const summary = data.summary || {};
    const timeline = Array.isArray(data.timeline) ? data.timeline : [];
    const facts = [
      ["Correo", confirmed.email || "No registrado"],
      ["WhatsApp", confirmed.phone || "No registrado"],
      ["Tipo", contactTypeLabel(confirmed.contactType || "unclassified")],
      ["Zonas", Array.isArray(confirmed.preferredZones) && confirmed.preferredZones.length ? confirmed.preferredZones.join(", ") : "No registradas"],
      ["Tipo de propiedad", confirmed.propertyType || "No registrado"],
      ["Presupuesto", confirmed.budgetMax ? formatMaybePrice(confirmed.budgetMax) : "No registrado"],
      ["Consentimiento", confirmed.consentContact ? "Registrado" : "No confirmado"],
      ["Responsable", contact.assignedTo || "Sin asignar"],
    ];
    content.innerHTML = `
      <div class="contact-intelligence-hero">
        <div>
          <span class="status score-${escapeHtml(score.level || "cold")}">${escapeHtml(`${Number(score.value || 0)}/100 · ${scoreLabel(score.level || "cold")}`)}</span>
          <h3>${escapeHtml(contact.name || "Contacto")}</h3>
          <p>${escapeHtml(inferred.intent || "Intención por confirmar")}</p>
        </div>
        <div class="contact-intelligence-actions">
          ${contact.phone ? `<a class="mini-button whatsapp-action" href="https://wa.me/${leadPhoneForWhatsApp(contact.phone)}?text=${encodeURIComponent("Hola, soy asesor de Puerto Cancun Center. Quiero dar seguimiento a tu solicitud.")}" target="_blank" rel="noopener noreferrer"><i data-lucide="message-circle"></i> WhatsApp</a>` : ""}
          ${contact.email ? `<button class="mini-button" type="button" data-compose-email data-email="${escapeHtml(contact.email)}" data-email-name="${escapeHtml(contact.name || "")}" data-email-context="Seguimiento CRM"><i data-lucide="mail"></i> Correo</button>` : ""}
          <button class="mini-button" type="button" data-task-from="contact" data-task-title="${escapeHtml(`Seguimiento ${contact.name || "contacto"}`)}" data-related-id="${escapeHtml(contact.id)}"><i data-lucide="list-plus"></i> Crear tarea</button>
        </div>
      </div>
      <div class="contact-intelligence-layout">
        <section>
          <div class="contact-intelligence-heading"><span>DATOS CONFIRMADOS</span><small>Proceden del perfil o formularios guardados.</small></div>
          <dl class="contact-facts">${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>
        </section>
        <section>
          <div class="contact-intelligence-heading"><span>INFERENCIAS OPERATIVAS</span><small>No sustituyen la revisión de un asesor.</small></div>
          <div class="inference-panel"><strong>${escapeHtml(inferred.nextAction || "Completar datos del perfil.")}</strong><p>${score.factors?.length ? score.factors.map((factor) => escapeHtml(`${factor.label} (${factor.points > 0 ? "+" : ""}${factor.points})`)).join(" · ") : "Aún no hay señales suficientes para priorizar."}</p></div>
        </section>
      </div>
      <div class="contact-activity-kpis">
        ${[["Solicitudes", summary.leads], ["Valoraciones", summary.valuations], ["Visitas", summary.tours], ["Tareas", summary.tasks], ["WhatsApp", summary.whatsappChats], ["Búsquedas", summary.savedSearches], ["Favoritos", summary.favorites]].map(([label, value]) => `<div><strong>${Number(value || 0)}</strong><span>${escapeHtml(label)}</span></div>`).join("")}
      </div>
      <section class="contact-timeline-section">
        <div class="contact-intelligence-heading"><span>HISTORIAL REAL</span><small>${timeline.length} eventos vinculados por contacto, correo o teléfono.</small></div>
        ${timeline.length ? `<ol class="contact-timeline">${timeline.map((item) => `<li><i data-lucide="${contactTimelineIcon(item.type)}"></i><div><div><strong>${escapeHtml(item.title || "Actividad")}</strong><time>${escapeHtml(formatDate(item.date))}</time></div><p>${escapeHtml(item.detail || "")}</p>${item.status ? `<span class="status">${escapeHtml(item.status)}</span>` : ""}</div></li>`).join("")}</ol>` : `<p class="empty-state">Este contacto aún no tiene actividad vinculada.</p>`}
      </section>`;
    refreshIcons();
  } catch (error) {
    content.innerHTML = `<p class="form-message error">${escapeHtml(error.message)}</p>`;
  }
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
  const maxZoneInventory = Math.max(1, ...topZones.map(([, count]) => count));
  const overdueTasks = state.tasks.filter((task) => task.status === "overdue").length;
  const priorityActions = [
    [pending, "Solicitudes pendientes", "pending-requests", "message-circle"],
    [newLeads, "Leads sin atender", "new-leads", "inbox"],
    [incompleteProperties, "Fichas incompletas", "incomplete-properties", "file-warning"],
    [openTasks, "Tareas abiertas", "tasks", "list-checks"],
  ].sort((a, b) => b[0] - a[0]);

  container.innerHTML = `
    <section class="dashboard-operations" aria-labelledby="dashboardOperationsTitle">
      <div class="dashboard-operations-heading">
        <div><span class="eyebrow">OPERACIÓN EN VIVO</span><h3 id="dashboardOperationsTitle">Qué requiere atención ahora</h3></div>
        <span class="dashboard-health ${overdueTasks ? "warning" : "healthy"}">${overdueTasks ? `${overdueTasks} vencidas` : "Sin tareas vencidas"}</span>
      </div>
      <div class="dashboard-priority-list">
        ${priorityActions.map(([value, label, metric, icon], index) => `<button type="button" data-admin-metric="${metric}" class="dashboard-priority-item ${index === 0 && value ? "urgent" : ""}"><i data-lucide="${icon}"></i><span><b>${escapeHtml(label)}</b><small>${value ? "Abrir y gestionar" : "Sin pendientes"}</small></span><strong>${value}</strong></button>`).join("")}
      </div>
    </section>
    <section class="dashboard-inventory" aria-labelledby="dashboardInventoryTitle">
      <div class="dashboard-operations-heading"><div><span class="eyebrow">INVENTARIO</span><h3 id="dashboardInventoryTitle">Distribución por zona</h3></div><b>${properties.length} fichas</b></div>
      <div class="dashboard-zone-bars">
        ${topZones.length ? topZones.map(([zone, count]) => `<div><span>${escapeHtml(zone || "Sin zona")}</span><div><i style="width:${Math.max(8, Math.round((count / maxZoneInventory) * 100))}%"></i></div><b>${count}</b></div>`).join("") : `<p class="empty-state">Sin inventario disponible.</p>`}
      </div>
    </section>
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

function renderAdminIntelligence() {
  const container = $("#adminIntelligence");
  if (!container) return;
  const priorities = state.intelligence?.priorities || [];
  const metrics = state.intelligence?.metrics || {};
  container.innerHTML = `
    <div class="intelligence-summary">
      <article><span>Búsquedas inteligentes · 30 días</span><strong>${escapeHtml(metrics.aiSearches30Days || 0)}</strong></article>
      <article><span>Integraciones por revisar</span><strong>${escapeHtml(metrics.integrationIssues || 0)}</strong></article>
      <article><span>Última actualización</span><strong>${escapeHtml(formatDate(state.intelligence?.generatedAt || new Date()))}</strong></article>
    </div>
    <div class="intelligence-action-list">
      ${priorities.length ? priorities.map((item) => `<button type="button" data-intelligence-section="${escapeHtml(item.section)}" class="intelligence-action severity-${escapeHtml(item.severity || "ok")}"><span><b>${escapeHtml(item.label)}</b><small>${item.count ? "Requiere revisión" : "Sin pendientes"}</small></span><strong>${escapeHtml(item.count || 0)}</strong><i data-lucide="arrow-right"></i></button>`).join("") : `<p class="empty-state">No fue posible calcular las prioridades en este momento.</p>`}
    </div>`;
}

function renderAdminIntegrations() {
  const container = $("#adminIntegrations");
  if (!container) return;
  const labels = { connected: "Conectado", configured: "Configurado", action_required: "Requiere acción", disconnected: "Desconectado", pending: "Pendiente", fallback: "Respaldo activo", disabled: "Desactivado", error: "Error" };
  const icons = { database: "database", whatsapp: "message-circle", email: "mail", maps: "map", openai: "sparkles", storage: "hard-drive", translation: "languages", jobs: "workflow" };
  container.innerHTML = state.integrations.length
    ? state.integrations.map((item) => `<article class="integration-health-item status-${escapeHtml(item.status)}"><div class="integration-health-heading"><i data-lucide="${escapeHtml(icons[item.id] || "activity")}"></i><span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.detail)}</small></span><strong>${escapeHtml(labels[item.status] || item.status)}</strong></div>${item.id === "email" ? `<label class="integration-test-recipient"><span>Destinatario de prueba</span><input type="email" data-integration-recipient="email" placeholder="correo@dominio.com" autocomplete="email" /></label>` : ""}<div class="integration-test-footer"><span>${item.lastTest ? `<b>Última prueba:</b> ${escapeHtml(item.lastTest.message)}<small>${escapeHtml(formatDate(item.lastTest.testedAt))} · ${escapeHtml(item.lastTest.durationMs || 0)} ms</small>` : "Sin prueba manual registrada."}</span><button class="mini-button" type="button" data-test-integration="${escapeHtml(item.id)}"><i data-lucide="activity"></i>${item.id === "whatsapp" ? "Verificar estado" : "Probar"}</button></div></article>`).join("")
    : `<p class="empty-state">No hay diagnóstico disponible.</p>`;
}

async function testAdminIntegration(id, button) {
  const body = {};
  if (id === "email") body.recipient = $("[data-integration-recipient='email']")?.value.trim() || "";
  setButtonLoading(button, true, "Probando…");
  try {
    const data = await api(`/api/admin/integrations/${encodeURIComponent(id)}/test`, { method: "POST", body, timeoutMs: 30000, retry: false });
    showToast(data.diagnostic?.message || "Prueba completada.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
    await refreshAdminIntegrations().catch(() => null);
  }
}

function renderAdminDataQuality() {
  const container = $("#adminDataQuality");
  if (!container) return;
  const report = state.dataQuality || {};
  const summary = report.summary || {};
  container.innerHTML = `
    <div class="quality-summary-grid">
      <article><span>Propiedades revisadas</span><strong>${escapeHtml(summary.propertiesReviewed || 0)}</strong></article>
      <article><span>Fichas por mejorar</span><strong>${escapeHtml(summary.incompleteProperties || 0)}</strong></article>
      <article><span>Grupos de contactos posibles duplicados</span><strong>${escapeHtml(summary.duplicateContactGroups || 0)}</strong></article>
      <article><span>Grupos de propiedades posibles duplicadas</span><strong>${escapeHtml(summary.duplicatePropertyGroups || 0)}</strong></article>
    </div>
    <div class="data-quality-columns">
      <section><h3>Publicaciones incompletas</h3>${(report.incomplete || []).slice(0, 20).map((item) => `<button type="button" data-quality-property="${escapeHtml(item.id)}"><span><b>${escapeHtml(item.title)}</b><small>MLS# ${escapeHtml(item.mls || "-")} · ${escapeHtml((item.missing || []).join(", "))}</small></span><strong>${escapeHtml(item.score)}%</strong></button>`).join("") || `<p class="empty-state">No se detectaron fichas incompletas.</p>`}</section>
      <section><h3>Candidatos duplicados</h3>${[...(report.duplicateContacts || []), ...(report.duplicateProperties || [])].slice(0, 16).map((group) => `<article><b>${escapeHtml(group.key)}</b><span>${escapeHtml(group.candidates?.map((item) => item.name || item.title).join(" · ") || "")}</span><small>Revisión humana requerida; no se fusionó ni eliminó nada.</small></article>`).join("") || `<p class="empty-state">No se detectaron grupos duplicados.</p>`}</section>
    </div>`;
}

function renderCopilotContext() {
  const label = $("#copilotContextLabel");
  if (!label) return;
  const feature = state.copilotFeatures.find((item) => item.section === state.adminSection);
  label.textContent = `Contexto: ${feature?.name || state.adminSection || "Dashboard"}`;
}

function addCopilotMessage(role, content, meta = {}) {
  const conversation = $("#copilotConversation");
  if (!conversation) return;
  const article = document.createElement("div");
  article.className = `copilot-message ${role}`;
  article.innerHTML = `<strong>${role === "user" ? "Tú" : "Copilot"}</strong><p>${escapeHtml(content).replace(/\n/g, "<br>")}</p>${meta.suggestedSection ? `<button type="button" data-copilot-open-section="${escapeHtml(meta.suggestedSection)}">Abrir ${escapeHtml(meta.suggestedLabel || meta.suggestedSection)}</button>` : ""}${role === "assistant" && meta.responseId ? `<div class="copilot-feedback" data-copilot-feedback-group="${escapeHtml(meta.responseId)}"><span>¿Fue útil?</span><button type="button" data-copilot-feedback="positive" data-response-id="${escapeHtml(meta.responseId)}" title="Respuesta útil" aria-label="Respuesta útil"><i data-lucide="thumbs-up"></i></button><button type="button" data-copilot-feedback="negative" data-response-id="${escapeHtml(meta.responseId)}" title="Respuesta no útil" aria-label="Respuesta no útil"><i data-lucide="thumbs-down"></i></button></div>` : ""}`;
  conversation.append(article);
  conversation.scrollTop = conversation.scrollHeight;
}

function renderCopilotFeedbackSummary() {
  const container = $("#copilotFeedbackSummary");
  if (!container) return;
  const rates = state.copilotFeedbackSummary?.rates || [];
  const positive = Number(rates.find((item) => item.feedback === "positive")?.count || 0);
  const negative = Number(rates.find((item) => item.feedback === "negative")?.count || 0);
  const total = positive + negative;
  container.innerHTML = total
    ? `<span>Calidad del Copilot</span><strong>${Math.round((positive / total) * 100)}% útil</strong><small>${positive} positivas · ${negative} negativas</small>`
    : `<span>Calidad del Copilot</span><small>Aún no hay valoraciones.</small>`;
}

async function submitCopilotFeedback(responseId, feedback, button) {
  try {
    await api("/api/admin/copilot/feedback", { method: "POST", body: { responseId, feedback } });
    button.closest("[data-copilot-feedback-group]")?.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    const data = await api("/api/admin/copilot/feedback-summary", { timeoutMs: 15000, retry: false });
    state.copilotFeedbackSummary = data;
    renderCopilotFeedbackSummary();
    showToast("Valoración guardada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function copilotActionPayload(form) {
  const values = Object.fromEntries(new FormData(form).entries());
  const base = { title: values.title, description: values.note, note: values.note, entityType: values.entityType, entityId: values.entityId, assignedTo: values.assignedTo, dueDate: values.dueDate || null, status: values.status };
  if (values.actionType === "create_crm_note") base.contactId = values.entityId;
  if (values.actionType === "complete_task") base.taskId = values.entityId;
  if (values.actionType === "update_request_status") {
    base.requestId = values.entityId;
    base.requestTable = values.entityType === "lead" ? "lead_request" : "seller_request";
  }
  return { actionType: values.actionType, payload: base };
}

async function copilotActionPreviewSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Preparando…");
  setFormMessage($("#copilotActionMessage"), "");
  try {
    const data = await api("/api/admin/copilot/actions/preview", { method: "POST", body: copilotActionPayload(form) });
    state.pendingCopilotAction = data;
    $("#copilotActionChanges").innerHTML = `<strong>${escapeHtml(data.preview?.title || data.actionType)}</strong>${(data.preview?.changes || []).map((change) => `<div class="copilot-change"><span>${escapeHtml(change.field)}</span><del>${escapeHtml(change.from ?? "Sin valor")}</del><i data-lucide="arrow-right"></i><ins>${escapeHtml(change.to ?? "Sin valor")}</ins></div>`).join("")}`;
    $("#copilotActionPreview").hidden = false;
    refreshIcons();
  } catch (error) {
    setFormMessage($("#copilotActionMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function confirmCopilotAction() {
  const action = state.pendingCopilotAction;
  if (!action?.actionId) return;
  const button = $("#confirmCopilotAction");
  setButtonLoading(button, true, "Ejecutando…");
  try {
    await api(`/api/admin/copilot/actions/${encodeURIComponent(action.actionId)}/confirm`, { method: "POST" });
    state.pendingCopilotAction = null;
    $("#copilotActionPreview").hidden = true;
    $("#copilotActionForm").reset();
    setFormMessage($("#copilotActionMessage"), "Acción confirmada y registrada en auditoría.");
    await loadPanelData();
    renderAdminTasks();
    renderAdminContacts();
    renderAdminLeads();
    renderAdminTours();
    showToast("Acción completada.");
  } catch (error) {
    setFormMessage($("#copilotActionMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function cancelCopilotAction() {
  const action = state.pendingCopilotAction;
  if (action?.actionId) await api(`/api/admin/copilot/actions/${encodeURIComponent(action.actionId)}/cancel`, { method: "POST" }).catch(() => null);
  state.pendingCopilotAction = null;
  $("#copilotActionPreview").hidden = true;
  setFormMessage($("#copilotActionMessage"), "Acción cancelada. No se modificó información.");
}

async function refreshAdminIntelligence() {
  const data = await api("/api/admin/intelligence", { timeoutMs: 25000, retry: false });
  state.intelligence = data;
  renderAdminIntelligence();
  refreshIcons();
}

async function refreshAdminIntegrations() {
  const data = await api("/api/admin/integrations", { timeoutMs: 25000, retry: false });
  state.integrations = data.integrations || [];
  renderAdminIntegrations();
  refreshIcons();
}

async function refreshAdminDataQuality() {
  state.dataQuality = await api("/api/admin/data-quality", { timeoutMs: 25000, retry: false });
  renderAdminDataQuality();
}

function toggleAdminGlobalSearch(open = true) {
  const panel = $("#adminGlobalSearch");
  if (!panel) return;
  panel.hidden = !open;
  if (open) {
    renderAdminCommandPalette();
    $("#adminGlobalSearchInput")?.focus();
  } else {
    $("#adminGlobalSearchInput").value = "";
    $("#adminGlobalSearchResults").innerHTML = "";
  }
}

function renderAdminCommandPalette(query = "") {
  const results = $("#adminGlobalSearchResults");
  if (!results) return;
  const commands = [
    ["new-property", "plus", "Nueva propiedad", "Crear una publicación individual"],
    ["new-development", "building-2", "Nuevo desarrollo", "Crear una ficha maestra"],
    ["contacts", "user-plus", "Nuevo contacto", "Abrir CRM y formulario de contacto"],
    ["tasks", "list-plus", "Nueva tarea", "Abrir seguimiento y tareas"],
    ["blog", "file-plus-2", "Nuevo artículo", "Abrir editor del blog"],
    ["properties", "house", "Inventario", "Buscar y editar publicaciones"],
    ["mailing", "mail", "Mailing", "Preparar y enviar un correo"],
    ["copilot", "sparkles", "Abrir Copilot", "Consultar el manual inteligente"],
  ];
  const normalized = String(query || "").toLocaleLowerCase("es-MX").trim();
  const visible = commands.filter(([, , title, detail]) => !normalized || `${title} ${detail}`.toLocaleLowerCase("es-MX").includes(normalized));
  results.innerHTML = visible.length
    ? `<div class="command-palette-label">Acciones rápidas</div>${visible.map(([section, icon, title, detail]) => `<button type="button" data-global-result-section="${section}" data-global-result-id=""><i data-lucide="${icon}"></i><span><b>${title}</b><small>${detail}</small></span><kbd>Enter</kbd></button>`).join("")}`
    : `<p>No hay comandos con ese texto.</p>`;
  refreshIcons();
}

async function runAdminGlobalSearch() {
  const input = $("#adminGlobalSearchInput");
  const results = $("#adminGlobalSearchResults");
  if (!input || !results) return;
  const text = input.value.trim();
  if (text.length < 2) {
    renderAdminCommandPalette(text);
    return;
  }
  results.innerHTML = `<p class="is-loading">Buscando en módulos autorizados…</p>`;
  try {
    const data = await api(`/api/admin/global-search?q=${encodeURIComponent(text)}`, { timeoutMs: 15000, retry: false });
    results.innerHTML = data.results?.length
      ? data.results.map((item) => `<button type="button" data-global-result-section="${escapeHtml(item.section)}" data-global-result-id="${escapeHtml(item.id)}"><span><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.type)} · ${escapeHtml(item.detail || "")}</small></span><i data-lucide="arrow-right"></i></button>`).join("")
      : `<p>No encontramos resultados con ese dato.</p>`;
    refreshIcons();
  } catch (error) {
    results.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
  }
}

async function copilotSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const question = form.question.value.trim();
  const submit = form.querySelector('button[type="submit"]');
  if (!question) return;
  addCopilotMessage("user", question);
  form.question.value = "";
  setButtonLoading(submit, true, "Consultando…");
  setFormMessage($("#copilotMessage"), "Consultando documentación y herramientas seguras…");
  try {
    const data = await api("/api/admin/copilot/query", {
      method: "POST",
      body: { question, context: { module: state.adminSection, section: state.adminSection, entityType: state.detailPropertyId ? "property" : "", entityId: state.detailPropertyId || "" } },
      timeoutMs: 30000,
      retry: false,
    });
    const feature = state.copilotFeatures.find((item) => item.section === data.suggestedSection);
    addCopilotMessage("assistant", data.answer, { suggestedSection: data.suggestedSection, suggestedLabel: feature?.name, responseId: data.responseId });
    setFormMessage($("#copilotMessage"), data.fallback ? "Respuesta generada con el registro interno porque el proveedor de IA no estuvo disponible." : `Fuente: ${data.tool || "documentación interna"}.`);
  } catch (error) {
    addCopilotMessage("assistant", "Puerto Cancún Copilot no está disponible temporalmente. El resto del panel continúa funcionando.");
    setFormMessage($("#copilotMessage"), error.message, true);
  } finally {
    setButtonLoading(submit, false);
  }
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
  const inventory = state.properties.filter((property) =>
    state.adminSection === "developments"
      ? property.publicationSection === "developments"
      : property.publicationSection !== "developments"
  );
  const search = $("#adminListingSearch");
  if (search && search.value !== filters.search) search.value = filters.search;
  populateAdminListingFilter($("#adminListingTypeFilter"), inventory.map((item) => item.type), filters.type, "Todos");
  populateAdminListingFilter($("#adminListingZoneFilter"), inventory.map((item) => item.zone), filters.zone, "Todas");
  if ($("#adminListingOperationFilter")) $("#adminListingOperationFilter").value = filters.operation;
  if ($("#adminListingStatusFilter")) $("#adminListingStatusFilter").value = filters.status;
  if ($("#adminListingQualityFilter")) $("#adminListingQualityFilter").value = filters.quality;
}

function renderAdminListings() {
  const list = $("#adminListings");
  if (!list) return;
  const developmentInventory = state.adminSection === "developments";
  const inventory = sortedProperties(state.properties).filter((property) =>
    developmentInventory
      ? property.publicationSection === "developments"
      : property.publicationSection !== "developments"
  );
  const filters = state.adminListingFilters;
  const search = normalizeSearchText(filters.search);
  const properties = inventory.filter((property) => {
    if (!filters.status && property.status === "archived") return false;
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
        property.id, localizedTitle(property), property.titleEs, property.titleEn, property.zone, property.city, property.state,
        property.neighborhood, property.address, property.mapPlace, property.type, property.operation, property.status,
        property.mls, localizedDescription(property), ...(Array.isArray(property.keywords) ? property.keywords : []),
      ].join(" ")
    );
    return haystack.includes(search);
  });
  const summary = $("#adminListingSummary");
  if (summary) {
    const featured = inventory.filter((property) => property.featured).length;
    const archived = inventory.filter((property) => property.status === "archived").length;
    const current = inventory.length - archived;
    const noun = developmentInventory
      ? state.lang === "en" ? "developments" : "desarrollos"
      : state.lang === "en" ? "properties" : "propiedades";
    summary.textContent = state.lang === "en"
      ? `${properties.length} shown · ${current} active ${noun} · ${archived} removed · ${featured} featured`
      : `${properties.length} mostrados · ${current} ${noun} activos · ${archived} eliminados · ${featured} destacados`;
  }
  if (!properties.length) {
    const filtered = search || filters.type || filters.zone || filters.operation || filters.status || filters.quality || filters.missingCover;
    list.innerHTML = `<p class="empty-state">${escapeHtml(filtered ? t("noListingMatches") : t("listingsEmpty"))}</p>`;
    return;
  }
  list.innerHTML = properties
    .map((property) => {
      const developmentMode = property.publicationSection === "developments";
      const description = localizedDescription(property);
      const excerpt = truncateText(description, 180);
      const hasMore = description.length > excerpt.length;
      const freshnessDays = property.lastVerifiedAt
        ? Math.floor((Date.now() - new Date(property.lastVerifiedAt).getTime()) / 86400000)
        : null;
      const freshnessLabel = freshnessDays === null
        ? t("unverifiedInventory")
        : freshnessDays <= 30
          ? freshnessDays === 1 ? t("verifiedDayAgo") : t("verifiedDaysAgo").replace("{days}", freshnessDays)
          : t("reviewAvailabilityDays").replace("{days}", freshnessDays);
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
              <strong>${escapeHtml(developmentMode ? t("developmentEntity") : formatPriceSummary(property))}</strong>
            </div>
            <p>${escapeHtml([displayLocation(property), displayType(property.type), property.mls ? `${t("mls")} ${property.mls}` : ""].filter(Boolean).join(" · "))}</p>
            ${
              Array.isArray(property.keywords) && property.keywords.length
                ? `<div class="listing-keywords">${property.keywords.slice(0, 10).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>`
                : ""
            }
            <div class="listing-facts" ${developmentMode ? "hidden" : ""}>
              <span>${escapeHtml(property.beds || 0)} ${escapeHtml(t("bedShort"))}</span>
              <span>${escapeHtml(property.baths || 0)} ${escapeHtml(t("bathShort"))}</span>
              <span>${escapeHtml(property.area || 0)} ${escapeHtml(t("sqmBuild"))}</span>
              <span>${escapeHtml(property.operation === "rent" ? t("rent") : t("sale"))}</span>
              <span>${escapeHtml(t("qualityScore"))}: ${escapeHtml(property.qualityScore || 0)}% · ${escapeHtml(qualityLevelLabel(property.qualityLevel))}</span>
              <span class="inventory-freshness ${freshnessDays === null || freshnessDays > 90 ? "needs-review" : ""}">${escapeHtml(freshnessLabel)}</span>
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
              <button class="mini-button" type="button" data-status-listing="${escapeHtml(property.id)}" data-status-value="active">${escapeHtml(property.status === "archived" ? t("restoreListing") : t("markActive"))}</button>
              <button class="mini-button" type="button" data-status-listing="${escapeHtml(property.id)}" data-status-value="disabled">${escapeHtml(t("markDisabled"))}</button>
              <button class="mini-button" type="button" data-status-listing="${escapeHtml(property.id)}" data-status-value="sold">${escapeHtml(t("markSold"))}</button>
              <button class="mini-button" type="button" data-feature-listing="${escapeHtml(property.id)}" data-feature-value="${property.featured ? "false" : "true"}">${escapeHtml(property.featured ? t("removeFeatured") : t("featureListing"))}</button>
              <button class="mini-button" type="button" data-duplicate-listing="${escapeHtml(property.id)}">${escapeHtml(t("duplicateListing"))}</button>
              <button class="mini-button pdf-institutional-button" type="button" data-generate-property-pdf="${escapeHtml(property.id)}" data-pdf-mode="branded">${escapeHtml(t("institutionalPdf"))}</button>
              <button class="mini-button pdf-neutral-button" type="button" data-generate-property-pdf="${escapeHtml(property.id)}" data-pdf-mode="neutral">${escapeHtml(t("neutralPdf"))}</button>
              <button class="pdf-share-trigger mini" type="button" data-open-pdf-share="property" data-share-property="${escapeHtml(property.id)}" aria-label="Compartir ficha PDF de ${escapeHtml(localizedTitle(property))}" title="Compartir ficha PDF"><i data-lucide="share-2"></i></button>
              <button class="mini-button" type="button" data-pdf-property="${escapeHtml(property.id)}">${escapeHtml(t("configurePdf"))}</button>
              <button class="mini-button" type="button" data-detail="${escapeHtml(property.id)}">${escapeHtml(t("publicDetail"))}</button>
              <button class="mini-button" type="button" data-review-property-quality="${escapeHtml(property.id)}">${escapeHtml(t("reviewQuality"))}</button>
              <button class="mini-button" type="button" data-verify-property="${escapeHtml(property.id)}">${escapeHtml(t("confirmAvailability"))}</button>
              <button class="mini-button" type="button" data-property-history="${escapeHtml(property.id)}">${escapeHtml(t("listingHistory"))}</button>
              ${property.status === "archived" ? "" : `<button class="mini-button danger" type="button" data-delete-listing="${escapeHtml(property.id)}">${escapeHtml(developmentMode ? state.lang === "en" ? "Delete development" : "Eliminar desarrollo" : state.lang === "en" ? "Delete property" : "Eliminar propiedad")}</button>`}
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
            ${valuation.email ? `<button class="mini-button" type="button" data-compose-email data-email="${escapeHtml(valuation.email)}" data-email-name="${escapeHtml(valuation.ownerName || "")}" data-email-context="Valoracion inmobiliaria">${escapeHtml(t("respondEmail"))}</button>` : ""}
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
            ${task.reminderAt ? `<p class="task-reminder"><i data-lucide="bell-ring"></i> ${escapeHtml(formatDate(task.reminderAt))} · ${escapeHtml(task.reminderChannel || "panel")}</p>` : ""}
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
        reminderAt: form.reminderAt.value,
        reminderChannel: form.reminderChannel.value,
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
  const summary = $("#matchLiveSummary");
  if (!list) return;
  if (summary) {
    const high = state.matches.filter((match) => match.score >= 85).length;
    const contacts = new Set(state.matches.map((match) => match.contactId || match.contactName)).size;
    const properties = new Set(state.matches.map((match) => match.propertyId || match.propertyTitle)).size;
    summary.textContent = `${state.matches.length} coincidencias · ${high} de prioridad alta · ${contacts} compradores · ${properties} propiedades`;
  }
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
  const summary = state.analytics.summary || {};
  const funnel = state.analytics.funnel || [];
  const funnelMax = Math.max(1, ...funnel.map((item) => Number(item.count || 0)));
  const propertyRows = state.analytics.propertyEvents || [];
  const blocks = [
    [t("adminTopZones"), state.analytics.searchZones || [], "zone"],
    [t("tableSource"), state.analytics.leadSources || [], "source"],
    ["Propiedades por estado", state.analytics.propertyStatus || [], "status"],
    ["Inventario por zona", state.analytics.zoneInventory || [], "zone"],
    ["Tareas por estado", state.analytics.taskStatus || [], "status"],
    ["Campañas por estado", state.analytics.campaignStatus || [], "status"],
    ["Solicitudes por tipo", state.analytics.leadTypes || [], "lead_type"],
  ];
  const summaryCards = [
    ["Vistas", summary.views || 0, "eye"],
    ["Favoritos", summary.favorites || 0, "heart"],
    ["WhatsApp", summary.contacts || 0, "message-circle"],
    ["Visitas", summary.tours || 0, "calendar-days"],
    ["Formularios", summary.leads || 0, "inbox"],
    ["Conversión", `${summary.conversionRate || 0}%`, "trending-up"],
  ].map(([label, value, icon]) => `<article class="analytics-summary-card"><i data-lucide="${icon}"></i><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");
  const funnelMarkup = `<article class="analytics-card analytics-funnel-card"><h3>Embudo de conversión</h3><p class="analytics-note">Acciones registradas en el periodo seleccionado. No se estiman eventos ausentes.</p><div class="analytics-funnel">${funnel.length ? funnel.map((item) => `<div class="analytics-funnel-row"><span>${escapeHtml(item.label)}</span><div><i style="width:${Math.max(4, (Number(item.count || 0) / funnelMax) * 100)}%"></i></div><strong>${escapeHtml(item.count || 0)}</strong></div>`).join("") : `<p class="empty-state">Todavía no hay eventos para este periodo.</p>`}</div></article>`;
  const propertyTable = `<article class="analytics-card analytics-property-card"><h3>Rendimiento por propiedad</h3><div class="analytics-table-wrap"><table class="data-table"><thead><tr><th>Propiedad</th><th>Vistas</th><th>Visitantes</th><th>Favoritos</th><th>WhatsApp</th><th>Visitas</th><th>Leads</th></tr></thead><tbody>${propertyRows.length ? propertyRows.map((row) => `<tr><td><strong>${escapeHtml(row.title_es || "-")}</strong><small>${escapeHtml(row.zone || "")}</small></td><td>${escapeHtml(row.views || 0)}</td><td>${escapeHtml(row.unique_visitors || 0)}</td><td>${escapeHtml(row.favorites || 0)}</td><td>${escapeHtml(row.contacts || 0)}</td><td>${escapeHtml(row.tours || 0)}</td><td>${escapeHtml(row.leads || 0)}</td></tr>`).join("") : `<tr><td colspan="7" class="empty-state">No hay actividad atribuida a propiedades en este periodo.</td></tr>`}</tbody></table></div></article>`;
  const detailBlocks = blocks
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
  container.innerHTML = `<div class="analytics-summary-grid">${summaryCards}</div>${funnelMarkup}${propertyTable}<div class="analytics-breakdown-grid">${detailBlocks}</div>`;
}

async function refreshAdminAnalytics() {
  const period = $("#analyticsPeriod")?.value || "30";
  const zone = $("#analyticsZone")?.value || "";
  const params = new URLSearchParams({ period });
  if (zone) params.set("zone", zone);
  const data = await api(`/api/admin/analytics?${params.toString()}`, { timeoutMs: 25000, retry: false });
  state.analytics = data || {};
  renderAdminAnalytics();
  refreshIcons();
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
  const layerRecords = layer === "properties"
    ? properties
    : layer === "valuations"
      ? state.valuations.filter((item) => !selectedZone || item.zone === selectedZone)
      : state.leads.filter((item) => !selectedZone || item.payload?.zone === selectedZone);
  const liveSummary = $("#smartMapLiveSummary");
  if (liveSummary) {
    const layerLabel = layer === "properties" ? "propiedades" : layer === "valuations" ? "valoraciones" : "leads";
    liveSummary.textContent = `${layerRecords.length} ${layerLabel} en la vista actual${selectedZone ? ` · ${selectedZone}` : " · todas las zonas"}. Selecciona un resultado para centrar el mapa.`;
  }
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
    const records = layerRecords;
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
          .map((buyer) => `
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
                </div>
                <p>Revisa sus preferencias confirmadas antes de preparar una selección de propiedades.</p>
                <div class="item-actions">
                  ${buyer.phone ? `<a class="mini-button primary" href="https://wa.me/${leadPhoneForWhatsApp(buyer.phone)}" target="_blank" rel="noopener">Preparar WhatsApp</a>` : ""}
                  <button class="mini-button" type="button" data-task-from="buyer" data-task-title="${escapeHtml(`Seguimiento comprador ${buyer.contactName}`)}" data-related-id="${escapeHtml(buyer.contactId)}">Crear tarea</button>
                </div>
              </article>
            `)
          .join("")
      : `<p class="empty-state">Crea un perfil comprador para registrar presupuesto, zonas y objetivo de búsqueda.</p>`;
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

function closePropertyQualityModal() {
  const modal = $("#propertyQualityModal");
  if (modal) modal.hidden = true;
  document.body.classList.remove("modal-open");
}

function openPropertyQualityModal(title, html) {
  $("#propertyQualityTitle").textContent = title;
  $("#propertyQualityContent").innerHTML = html;
  $("#propertyQualityModal").hidden = false;
  document.body.classList.add("modal-open");
  refreshIcons();
}

async function reviewPropertyQuality(id) {
  const property = state.properties.find((item) => item.id === id);
  try {
    const data = await api(`/api/admin/properties/${encodeURIComponent(id)}/readiness`);
    const readiness = data.readiness || {};
    openPropertyQualityModal(`Calidad · ${property?.titleEs || "Publicación"}`, `
      <div class="quality-score-display"><strong>${Number(readiness.score || 0)}%</strong><span>${readiness.publishable ? "Lista para publicar" : "Requiere atención"}</span></div>
      <section><h3>Errores bloqueantes</h3>${readiness.blocking?.length ? `<ul>${readiness.blocking.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="quality-ok"><i data-lucide="circle-check"></i> No hay errores bloqueantes.</p>`}</section>
      <section><h3>Mejoras recomendadas</h3>${readiness.improvements?.length ? `<ul>${readiness.improvements.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p class="quality-ok"><i data-lucide="circle-check"></i> No hay mejoras pendientes.</p>`}</section>
      <p class="quality-review-note">La publicación no necesita 100% para publicarse; los bloqueos sí deben corregirse.</p>`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function verifyPropertyFreshness(id) {
  try {
    const data = await api(`/api/admin/properties/${encodeURIComponent(id)}/verify`, { method: "POST" });
    state.properties = state.properties.map((property) => property.id === id ? { ...property, ...data.property } : property);
    renderAdminListings();
    showToast("Vigencia confirmada y registrada en auditoría.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function showPropertyHistory(id) {
  const property = state.properties.find((item) => item.id === id);
  try {
    const data = await api(`/api/admin/properties/${encodeURIComponent(id)}/versions`);
    const versions = data.versions || [];
    openPropertyQualityModal(`Historial · ${property?.titleEs || "Publicación"}`, versions.length
      ? `<div class="property-version-list">${versions.map((version) => `<article><span>${escapeHtml(formatDate(version.created_at))}</span><strong>${escapeHtml(version.change_type || "actualización")}</strong><p>${escapeHtml(Object.keys(version.changed_fields || {}).join(", ") || "Cambio registrado")}</p><small>${escapeHtml(version.changed_by || "Sistema")}</small></article>`).join("")}</div>`
      : `<p class="empty-state">Todavía no hay versiones registradas para esta publicación.</p>`);
  } catch (error) {
    showToast(error.message, "error");
  }
}

function campaignContactsWithEmail() {
  const byEmail = new Map();
  state.contacts.forEach((contact) => {
    const email = String(contact.email || "").trim().toLowerCase();
    if (email && !byEmail.has(email)) byEmail.set(email, { ...contact, email });
  });
  return [...byEmail.values()].sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email), state.lang));
}

function renderCampaignRecipientPicker() {
  const form = $("#campaignForm");
  const picker = $("#campaignContactPicker");
  const list = $("#campaignRecipientList");
  const count = $("#campaignRecipientCount");
  if (!form || !picker || !list || !count) return;
  const mode = form.elements.recipientMode?.value || "segment";
  picker.hidden = mode !== "selected";
  const search = String($("#campaignRecipientSearch")?.value || "").trim().toLowerCase();
  const contacts = campaignContactsWithEmail().filter((contact) =>
    !search || `${contact.name || ""} ${contact.email}`.toLowerCase().includes(search)
  );
  list.innerHTML = contacts.length
    ? contacts.map((contact) => `
        <label class="mailing-contact-option">
          <input
            type="checkbox"
            name="recipientEmails"
            value="${escapeHtml(contact.email)}"
            ${state.campaignRecipientEmails.has(contact.email) ? "checked" : ""}
          />
          <span>
            <strong>${escapeHtml(contact.name || "Sin nombre")}</strong>
            <small>${escapeHtml(contact.email)} · ${escapeHtml(contactTypeLabel(contact.contactType))}</small>
          </span>
        </label>
      `).join("")
    : `<p class="empty-state">No hay correos registrados que coincidan con la busqueda.</p>`;
  count.textContent = `${state.campaignRecipientEmails.size} ${state.campaignRecipientEmails.size === 1 ? "correo seleccionado" : "correos seleccionados"}`;
  renderCampaignEmailPreview();
}

const campaignTemplateCopy = {
  property_spotlight: {
    subject: "Una propiedad seleccionada para ti en Cancún",
    message: "Hola,\n\nSeleccionamos una propiedad que puede coincidir con tu búsqueda en Cancún. Encontrarás su ubicación, características y precio vigente en la ficha vinculada.\n\nPodemos confirmar disponibilidad, resolver dudas y coordinar una visita.\n\nSaludos,\nEquipo Puerto Cancún Center",
  },
  personal_followup: {
    subject: "Seguimiento a tu proceso inmobiliario",
    message: "Hola,\n\nQueremos dar seguimiento a tu solicitud y confirmar si todavía podemos ayudarte con tu compra, venta o valoración inmobiliaria.\n\nResponde a este correo con el horario y medio de contacto que prefieres.\n\nSaludos,\nEquipo Puerto Cancún Center",
  },
  valuation: {
    subject: "Siguiente paso para valorar tu propiedad",
    message: "Hola,\n\nRecibimos la información de tu propiedad. Para preparar una valoración útil necesitamos confirmar ubicación, superficie, estado de conservación y condiciones de venta.\n\nUn asesor puede revisar contigo los datos pendientes y explicar el siguiente paso.\n\nSaludos,\nEquipo Puerto Cancún Center",
  },
  newsletter: {
    subject: "Actualización inmobiliaria de Cancún",
    message: "Hola,\n\nCompartimos una actualización breve con oportunidades, desarrollos y movimientos relevantes del mercado inmobiliario de Cancún.\n\nConsulta las propiedades vinculadas y solicita información al equipo para validar disponibilidad y condiciones vigentes.\n\nSaludos,\nEquipo Puerto Cancún Center",
  },
};

function applyCampaignTemplate() {
  const form = $("#campaignForm");
  if (!form) return;
  const preset = campaignTemplateCopy[form.elements.template?.value];
  if (!preset) {
    renderCampaignEmailPreview();
    return;
  }
  form.elements.name.value = preset.subject;
  form.elements.message.value = preset.message;
  renderCampaignEmailPreview();
}

function renderCampaignEmailPreview() {
  const form = $("#campaignForm");
  const subject = $("#campaignSubjectPreview");
  const body = $("#campaignBodyPreview");
  const audience = $("#campaignAudiencePreview");
  const count = $("#campaignCharacterCount");
  if (!form || !subject || !body || !audience || !count) return;
  const message = String(form.elements.message?.value || "").trim();
  subject.textContent = String(form.elements.name?.value || "").trim() || "Escribe un asunto";
  body.innerHTML = message
    ? message.split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("")
    : `<p>El contenido aparecerá aquí con el estilo institucional antes de enviarlo.</p>`;
  const selectedMode = form.elements.recipientMode?.value === "selected";
  audience.textContent = selectedMode
    ? `${state.campaignRecipientEmails.size} correos elegidos directamente`
    : `Segmento: ${form.elements.segment?.selectedOptions?.[0]?.textContent || "Todos los contactos"}`;
  count.textContent = `${message.length.toLocaleString("es-MX")} caracteres`;
}

function openEmailComposer(button) {
  const email = String(button.dataset.email || "").trim().toLowerCase();
  if (!email) return;
  const name = String(button.dataset.emailName || "").trim();
  const context = String(button.dataset.emailContext || "Seguimiento").trim();
  state.campaignRecipientEmails = new Set([email]);
  setAdminSection("mailing");
  const form = $("#campaignForm");
  if (!form) return;
  const selectedMode = form.querySelector('[name="recipientMode"][value="selected"]');
  if (selectedMode) selectedMode.checked = true;
  form.elements.name.value = `Seguimiento Puerto Cancun Center - ${context}`;
  form.elements.message.value = [
    `Hola ${name || ""},`,
    "",
    "Gracias por contactar a Puerto Cancun Center. Recibimos tu informacion y queremos ayudarte a continuar con tu proceso inmobiliario.",
    "",
    `Motivo del seguimiento: ${context}.`,
    "",
    "Quedamos atentos para resolver tus dudas y coordinar el siguiente paso.",
  ].join("\n");
  renderCampaignRecipientPicker();
  renderCampaignEmailPreview();
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.name.focus({ preventScroll: true });
  showToast(`Correo preparado para ${email}. Revisa el contenido y presiona Enviar correo ahora.`);
}

function renderOperationalModules() {
  renderMarketing();
  renderAdminBlogPosts();
  renderDocuments();
  renderMediaLibrary();
  renderScopedMediaLibrary();
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

function renderAdminBlogPosts() {
  const list = $("#adminBlogPosts");
  if (!list) return;
  const search = normalizeSearchText($("#blogAdminSearch")?.value || "");
  const posts = state.blogPosts.filter((post) =>
    !search || normalizeSearchText(`${post.titleEs} ${post.titleEn} ${post.slug}`).includes(search)
  );
  list.innerHTML = posts.length
    ? posts.map((post) => `
        <article class="blog-admin-row">
          ${post.coverImage ? `<img src="${escapeHtml(post.coverImage)}" alt="" loading="lazy" />` : `<div class="blog-cover-placeholder"><i data-lucide="newspaper"></i></div>`}
          <div>
            <span class="status status-${escapeHtml(post.status)}">${escapeHtml(post.status === "published" ? "Publicado" : post.status === "archived" ? "Archivado" : "Borrador")}</span>
            <h3>${escapeHtml(post.titleEs)}</h3>
            <p>/${escapeHtml(post.slug)} · ${escapeHtml(formatDate(post.updatedAt))}</p>
            <div class="item-actions">
              <button class="mini-button primary" type="button" data-edit-blog="${escapeHtml(post.id)}">Editar</button>
              ${post.status === "published" ? `<a class="mini-button" href="/blog/${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">Ver público</a>` : ""}
              <button class="mini-button danger" type="button" data-delete-blog="${escapeHtml(post.id)}">Archivar</button>
            </div>
          </div>
        </article>
      `).join("")
    : `<p class="empty-state">No hay artículos que coincidan con la búsqueda.</p>`;
  refreshIcons();
}

function clearBlogPreviewObjectUrls() {
  state.blogPreviewObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  state.blogPreviewObjectUrls = [];
}

function blogPreviewUrl(file) {
  const url = URL.createObjectURL(file);
  state.blogPreviewObjectUrls.push(url);
  return url;
}

function renderBlogMediaPreviews(post = null) {
  const form = $("#blogForm");
  const coverPreview = $("#blogCoverPreview");
  const contentPreview = $("#blogContentImagePreview");
  if (!form || !coverPreview || !contentPreview) return;
  clearBlogPreviewObjectUrls();
  const coverFile = formField(form, "coverFile").files?.[0];
  const coverSource = coverFile ? blogPreviewUrl(coverFile) : post?.coverImage || "";
  coverPreview.innerHTML = coverSource
    ? `<img src="${escapeHtml(coverSource)}" alt="Vista previa de la portada" />`
    : `<span>Sin portada seleccionada</span>`;
  const sources = state.blogContentImageFiles.length
    ? state.blogContentImageFiles.map((file) => ({ src: blogPreviewUrl(file), removable: true }))
    : (post?.contentImages || []).map((src) => ({ src, removable: false }));
  contentPreview.innerHTML = sources.length
    ? sources.map((item, index) => `<figure><img src="${escapeHtml(item.src)}" alt="Imagen interna ${index + 1}" />${item.removable ? `<button type="button" data-remove-blog-image="${index}" aria-label="Quitar imagen ${index + 1}"><i data-lucide="x"></i></button>` : ""}<figcaption>${item.removable ? `Nueva ${index + 1}` : `Actual ${index + 1}`}</figcaption></figure>`).join("")
    : `<p>Las imágenes internas aparecerán aquí antes de guardar.</p>`;
  refreshIcons();
}

function resetBlogForm() {
  const form = $("#blogForm");
  if (!form) return;
  form.reset();
  formField(form, "id").value = "";
  state.blogContentImageFiles = [];
  renderBlogMediaPreviews();
  setFormMessage($("#blogFormMessage"), "");
}

function editBlogPost(id) {
  const post = state.blogPosts.find((item) => item.id === id);
  const form = $("#blogForm");
  if (!post || !form) return;
  ["id", "slug", "titleEs", "titleEn", "excerptEs", "excerptEn", "contentEs", "contentEn", "status"].forEach((name) => {
    formField(form, name).value = post[name] || "";
  });
  state.blogContentImageFiles = [];
  renderBlogMediaPreviews(post);
  setAdminSection("blog");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function blogSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  const id = formField(form, "id").value;
  setButtonLoading(button, true, "Guardando artículo...");
  try {
    let coverImage;
    const coverFile = formField(form, "coverFile").files?.[0];
    if (coverFile) coverImage = (await readImageFile(coverFile)).imageDataUrl;
    let contentImages;
    if (state.blogContentImageFiles.length) {
      contentImages = await Promise.all(
        state.blogContentImageFiles.map(async (file) => (await readImageFile(file)).imageDataUrl)
      );
    } else if (formField(form, "clearContentImages").checked) {
      contentImages = [];
    }
    const payload = {
      titleEs: formField(form, "titleEs").value.trim(),
      titleEn: formField(form, "titleEn").value.trim(),
      slug: formField(form, "slug").value.trim(),
      excerptEs: formField(form, "excerptEs").value.trim(),
      excerptEn: formField(form, "excerptEn").value.trim(),
      contentEs: formField(form, "contentEs").value.trim(),
      contentEn: formField(form, "contentEn").value.trim(),
      status: formField(form, "status").value,
    };
    if (coverImage !== undefined) payload.coverImage = coverImage;
    if (contentImages !== undefined) payload.contentImages = contentImages;
    const data = await api(id ? `/api/admin/blog/${encodeURIComponent(id)}` : "/api/admin/blog", {
      method: id ? "PUT" : "POST",
      body: payload,
      timeoutMs: 60000,
    });
    const index = state.blogPosts.findIndex((post) => post.id === data.post.id);
    if (index >= 0) state.blogPosts.splice(index, 1, data.post);
    else state.blogPosts.unshift(data.post);
    resetBlogForm();
    renderAdminBlogPosts();
    showToast("Artículo guardado correctamente.");
  } catch (error) {
    setFormMessage($("#blogFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function translateBlogPost() {
  const form = $("#blogForm");
  const button = $("#translateBlogPost");
  const title = formField(form, "titleEs").value.trim();
  const description = formField(form, "contentEs").value.trim();
  if (!title || !description) {
    setFormMessage($("#blogFormMessage"), "Completa el título y contenido en español.", true);
    return;
  }
  setButtonLoading(button, true, "Traduciendo...");
  try {
    const translated = await api("/api/admin/ai/translate-property", { method: "POST", body: { title, description, entityType: "blog", entityId: formField(form, "id")?.value || "" }, timeoutMs: 60000 });
    formField(form, "titleEn").value = translated.titleEn;
    formField(form, "contentEn").value = translated.descriptionEn;
    if (!formField(form, "excerptEn").value) formField(form, "excerptEn").value = translated.descriptionEn.slice(0, 360);
    setFormMessage($("#blogFormMessage"), "Traducción generada. Revísala antes de publicar.");
  } catch (error) {
    setFormMessage($("#blogFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function deleteBlogPost(id) {
  try {
    await api(`/api/admin/blog/${encodeURIComponent(id)}`, { method: "DELETE" });
    const post = state.blogPosts.find((item) => item.id === id);
    if (post) post.status = "archived";
    renderAdminBlogPosts();
    showToast("Artículo archivado.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function propertySearchLabel(property) {
  const mls = property.mls ? `MLS# ${property.mls} · ` : "";
  return `${mls}${property.titleEs || property.title || "Sin título"} · ${displayLocation(property)}`;
}

function populatePropertyPicker(searchSelector, datalistSelector, selectSelector, matchesSelector, emptyLabel = "Sin propiedad") {
  const searchInput = $(searchSelector);
  const datalist = datalistSelector ? $(datalistSelector) : null;
  const select = $(selectSelector);
  const matchesPanel = $(matchesSelector);
  if (!searchInput || !select) return;
  const currentId = select.value;
  populateSelect(select, state.properties, propertySearchLabel, "id", emptyLabel);
  if (currentId) select.value = currentId;
  const labels = new Map();
  if (datalist) datalist.innerHTML = "";
  state.properties.forEach((property) => {
    const label = propertySearchLabel(property);
    labels.set(normalizeSearchText(label), property.id);
    if (datalist) {
      const option = document.createElement("option");
      option.value = label;
      datalist.append(option);
    }
  });
  if (select.value) {
    const selected = state.properties.find((property) => property.id === select.value);
    if (selected && !searchInput.matches(":focus")) searchInput.value = propertySearchLabel(selected);
  }
  const matchingProperties = () => {
    const normalized = normalizeSearchText(searchInput.value);
    if (!normalized) return [];
    return state.properties
      .filter((property) => {
        const mls = normalizeSearchText(property.mls);
        const title = normalizeSearchText(property.titleEs || property.title);
        return mls.startsWith(normalized) || title.includes(normalized) || normalizeSearchText(propertySearchLabel(property)).includes(normalized);
      })
      .slice(0, 8);
  };
  const renderMatches = () => {
    if (!matchesPanel) return;
    const matches = matchingProperties();
    matchesPanel.innerHTML = matches
      .map((property) => `<button type="button" data-property-picker-id="${escapeHtml(property.id)}"><strong>${escapeHtml(property.mls ? `MLS# ${property.mls}` : "Sin MLS")}</strong><span>${escapeHtml(property.titleEs || property.title || "Sin título")}</span><small>${escapeHtml(displayLocation(property))}</small></button>`)
      .join("");
    matchesPanel.hidden = !searchInput.value.trim();
    if (!matches.length && searchInput.value.trim()) {
      matchesPanel.innerHTML = `<p>No hay coincidencias por MLS o título.</p>`;
    }
  };
  searchInput.oninput = () => {
    const normalized = normalizeSearchText(searchInput.value);
    let id = labels.get(normalized) || "";
    if (!id && normalized) {
      const exact = state.properties.find((property) =>
        normalizeSearchText(property.mls) === normalized || normalizeSearchText(property.titleEs || property.title) === normalized
      );
      id = exact?.id || "";
    }
    select.value = id;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    renderMatches();
  };
  searchInput.onfocus = renderMatches;
  searchInput.onblur = () => window.setTimeout(() => {
    if (matchesPanel) matchesPanel.hidden = true;
  }, 160);
  if (matchesPanel) {
    matchesPanel.onclick = (event) => {
      const button = event.target.closest("[data-property-picker-id]");
      if (!button) return;
      select.value = button.dataset.propertyPickerId;
      const selected = state.properties.find((property) => property.id === select.value);
      searchInput.value = selected ? propertySearchLabel(selected) : "";
      matchesPanel.hidden = true;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      searchInput.focus();
    };
  }
  select.onchange = () => {
    const selected = state.properties.find((property) => property.id === select.value);
    if (selected) searchInput.value = propertySearchLabel(selected);
    else if (!searchInput.matches(":focus")) searchInput.value = "";
    renderMarketingSelectionPreviews();
  };
}

function renderMarketingPropertyPreview(selectSelector, previewSelector) {
  const select = $(selectSelector);
  const preview = $(previewSelector);
  if (!preview) return;
  const property = state.properties.find((item) => item.id === select?.value);
  preview.hidden = !property;
  if (!property) {
    preview.innerHTML = "";
    return;
  }
  preview.innerHTML = `
    <img src="${escapeHtml(optimizedMediaUrl(primaryImage(property), 640))}" alt="${escapeHtml(localizedTitle(property))}" />
    <div>
      <span class="eyebrow">${escapeHtml(property.mls ? `MLS# ${property.mls}` : "PROPIEDAD SELECCIONADA")}</span>
      <strong>${escapeHtml(localizedTitle(property))}</strong>
      <p>${escapeHtml(displayLocation(property))}</p>
      <b>${escapeHtml(formatPriceSummary(property))}</b>
    </div>`;
}

function renderMarketingSelectionPreviews() {
  renderMarketingPropertyPreview("#instagramPropertySelect", "#instagramPropertyPreview");
  renderMarketingPropertyPreview("#marketingPropertySelect", "#marketingPropertyPreview");
}

function setMarketingView(view) {
  const selected = ["content", "images", "networks"].includes(view) ? view : "content";
  $$('[data-marketing-view]').forEach((button) => {
    const active = button.dataset.marketingView === selected;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-marketing-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.marketingPanel !== selected;
  });
  if (selected === "content" || selected === "images") renderMarketingSelectionPreviews();
  window.requestAnimationFrame(() => window.lucide?.createIcons());
}

function populateOperationalSelects() {
  populateSelect($("#aiPropertySelect"), state.properties, (item) => item.titleEs, "id", "Sin propiedad");
  populatePropertyPicker("#instagramPropertySearch", "#instagramPropertySuggestions", "#instagramPropertySelect", "#instagramPropertyMatches", "Selecciona una propiedad");
  populatePropertyPicker("#marketingPropertySearch", "#marketingPropertySuggestions", "#marketingPropertySelect", "#marketingPropertyMatches", "Selecciona una propiedad");
  populatePropertyPicker("#campaignPropertySearch", "#campaignPropertySuggestions", "#campaignPropertySelect", "#campaignPropertyMatches", "Sin propiedad");
  populatePropertyPicker("#pdfPropertySearch", null, "#pdfPropertySelect", "#pdfPropertyMatches", "Selecciona una propiedad");
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
  renderMarketingSelectionPreviews();
}

function renderMarketing() {
  const kpis = $("#adminMarketing");
  const mailingKpis = $("#adminMailing");
  const list = $("#campaignList");
  const emailCampaigns = state.campaigns.filter((campaign) => campaign.channel === "email");
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
      operationCard("Publicaciones activas", state.properties.filter((property) => property.status === "active").length, "Contenido disponible"),
      operationCard("Propiedades destacadas", state.properties.filter((property) => property.featured).length, "Prioridad editorial"),
      operationCard("Desarrollos", state.properties.filter((property) => property.publicationSection === "developments").length, "Inventario para contenido"),
      operationCard("Instagram", state.instagramStatus?.connected ? "Conectado" : "Pendiente", "Estado del canal"),
    ].join("");
  }
  if (mailingKpis) {
    mailingKpis.innerHTML = [
      operationCard("Contactos con correo", state.contacts.filter((contact) => contact.email).length, "Destinatarios disponibles"),
      operationCard("Correos preparados", state.campaigns.filter((campaign) => campaign.channel === "email" && campaign.status !== "sent").length, "Borradores y programados"),
      operationCard("Correos enviados", state.campaigns.filter((campaign) => campaign.channel === "email" && campaign.status === "sent").length, "Historial completado"),
      operationCard("Envios parciales", state.campaigns.filter((campaign) => campaign.channel === "email" && campaign.status === "partial").length, "Requieren revision"),
    ].join("");
  }
  renderCampaignRecipientPicker();
  if (!list) return;
  list.innerHTML = emailCampaigns.length
    ? emailCampaigns
        .map(
          (campaign) => `
            <article class="wide-row compact-row">
              <div class="wide-row-main">
                <span class="status ${escapeHtml(campaign.status)}">${escapeHtml(campaign.status)}</span>
                <h3>${escapeHtml(campaign.name)}</h3>
                <p>${escapeHtml(campaign.recipientMode === "selected" ? `${(campaign.recipientEmails || []).length} destinatarios elegidos` : `Segmento: ${campaign.segment}`)} · ${escapeHtml(campaign.scheduledAt ? formatDate(campaign.scheduledAt) : "Sin programar")}</p>
              </div>
              <p>${escapeHtml(truncateText(campaign.message, 180))}</p>
              <div class="item-actions">
                <a class="mini-button" href="/api/admin/campaigns/${encodeURIComponent(campaign.id)}/export">Exportar CSV</a>
                ${campaign.channel === "email" && campaign.status !== "sent" ? `<button class="mini-button primary" type="button" data-send-campaign-email="${escapeHtml(campaign.id)}">Enviar mailing</button>` : ""}
                <button class="mini-button danger" type="button" data-delete-campaign="${escapeHtml(campaign.id)}">Eliminar</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No hay correos preparados. Crea el primero, selecciona el segmento y guardalo antes de enviarlo.</p>`;
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
                ${document.documentType === "property" ? `<button class="pdf-share-trigger mini" type="button" data-open-pdf-share="history" data-share-document="${escapeHtml(document.id)}" data-share-property="${escapeHtml(document.propertyId || "")}" aria-label="Compartir ficha PDF" title="Compartir ficha PDF"><i data-lucide="share-2"></i></button>` : ""}
                <button class="mini-button danger" type="button" data-delete-document="${escapeHtml(document.id)}">Eliminar</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">Aún no hay fichas. Selecciona una propiedad o valoración y genera el primer PDF.</p>`;
  refreshIcons();
}

function pdfSharePropertyCandidates(query = "") {
  const normalized = normalizeSearchText(query);
  return state.properties
    .filter((property) => property.publicationSection !== "developments")
    .filter((property) => !normalized || normalizeSearchText(`${property.mls || ""} ${localizedTitle(property)} ${displayLocation(property)}`).includes(normalized))
    .slice(0, 12);
}

function selectPdfShareProperty(propertyId) {
  const form = $("#pdfShareForm");
  const select = formField(form, "propertyId");
  const search = $("#pdfSharePropertySearch");
  const matches = $("#pdfSharePropertyMatches");
  const property = state.properties.find((item) => item.id === propertyId);
  if (!select || !property) return;
  select.value = property.id;
  if (search) search.value = propertySearchLabel(property);
  if (matches) matches.hidden = true;
  setFormMessage($("#pdfShareMessage"), "");
}

function renderPdfSharePropertyMatches(query = "") {
  const matches = $("#pdfSharePropertyMatches");
  if (!matches) return;
  const properties = pdfSharePropertyCandidates(query);
  matches.innerHTML = properties.length
    ? properties.map((property) => `<button type="button" data-select-pdf-share-property="${escapeHtml(property.id)}"><strong>${escapeHtml(property.mls ? `MLS# ${property.mls}` : "SIN MLS")}</strong><span>${escapeHtml(localizedTitle(property))}</span><small>${escapeHtml(displayLocation(property))}</small></button>`).join("")
    : `<p>No se encontraron propiedades con ese dato.</p>`;
  matches.hidden = false;
}

function closePdfShareModal() {
  const modal = $("#pdfShareModal");
  if (modal) modal.hidden = true;
  if ($$(".modal-backdrop:not([hidden])").length === 0) document.body.classList.remove("modal-open");
}

function openPdfShareModal(trigger) {
  const modal = $("#pdfShareModal");
  const form = $("#pdfShareForm");
  if (!modal || !form) return;
  form.reset();
  setFormMessage($("#pdfShareMessage"), "");
  const source = trigger?.dataset.openPdfShare || "selected";
  const documentId = trigger?.dataset.shareDocument || "";
  const existingDocument = state.documents.find((document) => document.id === documentId);
  const selectedPropertyId = trigger?.dataset.shareProperty
    || existingDocument?.propertyId
    || $("#pdfPropertySelect")?.value
    || "";
  const select = formField(form, "propertyId");
  select.innerHTML = `<option value="">Selecciona una propiedad</option>`;
  state.properties
    .filter((property) => property.publicationSection !== "developments")
    .forEach((property) => select.append(new Option(propertySearchLabel(property), property.id)));
  formField(form, "documentId").value = documentId;
  formField(form, "neutral").checked = existingDocument?.options?.brandMode === "neutral";
  const propertyField = form.querySelector("[data-pdf-share-property-field]");
  const locked = source === "property" || source === "history";
  if (propertyField) propertyField.hidden = locked;
  if (selectedPropertyId) selectPdfShareProperty(selectedPropertyId);
  else renderPdfSharePropertyMatches("");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  refreshIcons();
  if (!locked) $("#pdfSharePropertySearch")?.focus();
}

async function preparePdfShareDocument() {
  const form = $("#pdfShareForm");
  const propertyId = formField(form, "propertyId")?.value || "";
  const brandMode = formField(form, "neutral")?.checked ? "neutral" : "branded";
  const requestedDocumentId = formField(form, "documentId")?.value || "";
  const existingDocument = state.documents.find((document) => document.id === requestedDocumentId);
  if (!propertyId || !state.properties.some((property) => property.id === propertyId)) {
    throw new Error("Selecciona la propiedad que deseas compartir.");
  }
  if (existingDocument?.propertyId === propertyId && (existingDocument.options?.brandMode || "branded") === brandMode) {
    return existingDocument;
  }
  const data = await api("/api/admin/documents/generate", {
    method: "POST",
    body: {
      documentType: "property",
      propertyId,
      valuationId: "",
      options: pdfOptionsFromForm($("#pdfForm"), brandMode),
    },
    timeoutMs: 90000,
  });
  if (!data.document) throw new Error("No se pudo generar la ficha para compartir.");
  state.documents = [data.document, ...state.documents.filter((item) => item.id !== data.document.id)];
  formField(form, "documentId").value = data.document.id;
  renderDocuments();
  return data.document;
}

async function sharePdfThroughChannel(channel, button) {
  if (button?.dataset.loading === "true") return;
  const popup = window.open("/compartiendo-ficha", "_blank");
  if (popup) popup.opener = null;
  setButtonLoading(button, true, "Preparando...");
  setFormMessage($("#pdfShareMessage"), "Generando el enlace temporal y preparando la ficha...");
  try {
    const document = await preparePdfShareDocument();
    const data = await api(`/api/admin/documents/${encodeURIComponent(document.id)}/share`, { method: "POST" });
    let targetUrl = data.whatsappUrl;
    if (channel === "facebook") {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.shareUrl)}&quote=${encodeURIComponent(data.message || "")}`;
    } else if (channel === "instagram") {
      await navigator.clipboard?.writeText(data.message || data.shareUrl);
      targetUrl = "https://www.instagram.com/";
      showToast("Texto y enlace copiados. Pégalos en la publicación o mensaje de Instagram.");
    }
    if (popup) popup.location.replace(targetUrl);
    else {
      await navigator.clipboard?.writeText(data.message || data.shareUrl);
      showToast("El navegador bloqueó la ventana. El texto y el enlace quedaron copiados.");
    }
    setFormMessage($("#pdfShareMessage"), "Ficha preparada. El enlace permanecerá disponible durante 7 días.");
  } catch (error) {
    popup?.close();
    setFormMessage($("#pdfShareMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function renderMediaLibrary() {
  const library = $("#adminFiles");
  if (!library) return;
  const search = ($("#mediaSearch")?.value || "").toLowerCase();
  const filter = $("#mediaTypeFilter")?.value || "";
  const files = state.files.filter((file) => {
    if ((file.libraryScope || "general") !== "general") return false;
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
  const id = formField(form, "id")?.value || "";
  setButtonLoading(button, true);
  try {
    await api(id ? `/api/admin/contacts/${encodeURIComponent(id)}` : "/api/admin/contacts", {
      method: id ? "PATCH" : "POST",
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
    resetContactForm();
    await renderPanel();
    showToast(id ? "Contacto actualizado en el CRM." : "Contacto creado en el CRM.");
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
  const button = event.submitter || form.querySelector('[type="submit"]');
  const action = event.submitter?.value === "draft" ? "draft" : "send";
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.recipientEmails = [...state.campaignRecipientEmails];
  payload.status = "draft";
  setButtonLoading(button, true, action === "send" ? "Enviando..." : "Guardando...");
  let campaign = null;
  try {
    const created = await api("/api/admin/campaigns", {
      method: "POST",
      body: payload,
    });
    campaign = created.campaign;
    let delivery = null;
    if (action === "send") {
      delivery = await api(`/api/admin/campaigns/${encodeURIComponent(campaign.id)}/send-email`, {
        method: "POST",
        timeoutMs: 120000,
      });
    }
    form.reset();
    state.campaignRecipientEmails = new Set();
    renderCampaignEmailPreview();
    await renderPanel();
    if (delivery) {
      showToast(`Correo enviado desde la plataforma: ${delivery.sent} entregas${delivery.failed ? `, ${delivery.failed} fallidas` : ""}.`);
    } else {
      showToast("Borrador guardado con sus destinatarios. Puedes enviarlo cuando este listo.");
    }
  } catch (error) {
    if (campaign) {
      await renderPanel();
      const message = `El correo quedo guardado, pero no se pudo enviar: ${error.message}`;
      setFormMessage($("#campaignFormMessage"), message, true);
      showToast(message, "error");
    } else {
      setFormMessage($("#campaignFormMessage"), error.message, true);
    }
  } finally {
    setButtonLoading(button, false);
  }
}

function resetContactForm() {
  const form = $("#contactForm");
  if (!form) return;
  form.reset();
  formField(form, "id").value = "";
  if ($("#contactFormTitle")) $("#contactFormTitle").textContent = "Crear contacto";
  if ($("#saveContactButton")) $("#saveContactButton").textContent = "Crear contacto";
  if ($("#cancelContactEdit")) $("#cancelContactEdit").hidden = true;
  setFormMessage($("#contactFormMessage"), "");
}

function editContact(id) {
  const contact = state.contacts.find((item) => item.id === id);
  const form = $("#contactForm");
  if (!contact || !form) return;
  formField(form, "id").value = contact.id;
  formField(form, "name").value = contact.name || "";
  formField(form, "email").value = contact.email || "";
  formField(form, "phone").value = contact.phone || "";
  formField(form, "contactType").value = contact.contactType || "unclassified";
  formField(form, "zone").value = contact.preferredZones?.[0] || "";
  formField(form, "budgetMax").value = contact.budgetMax || "";
  formField(form, "assignedTo").value = contact.assignedTo || "";
  formField(form, "leadScore").value = contact.leadScore || "warm";
  formField(form, "notes").value = contact.notes || "";
  if ($("#contactFormTitle")) $("#contactFormTitle").textContent = "Editar contacto";
  if ($("#saveContactButton")) $("#saveContactButton").textContent = "Guardar cambios";
  if ($("#cancelContactEdit")) $("#cancelContactEdit").hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteContact(id) {
  const contact = state.contacts.find((item) => item.id === id);
  if (!contact) return;
  if (!(await confirmAction(
    `Se quitara a ${contact.name || "este contacto"} del CRM. La cuenta de acceso, si existe, no se eliminara.`,
    "Eliminar contacto"
  ))) return;
  await api(`/api/admin/contacts/${encodeURIComponent(id)}`, { method: "DELETE" });
  await renderPanel();
  showToast("Contacto eliminado del CRM.");
}

async function markCampaignSent(id) {
  await api(`/api/admin/campaigns/${encodeURIComponent(id)}`, { method: "PATCH", body: { status: "sent" } });
  await renderPanel();
  showToast("Campaña registrada como enviada.");
}

async function sendCampaignEmail(id, button) {
  const campaign = state.campaigns.find((item) => item.id === id);
  const target = campaign?.recipientMode === "selected"
    ? `${(campaign.recipientEmails || []).length} correos seleccionados`
    : `el segmento ${campaign?.segment || "seleccionado"}`;
  if (!(await confirmAction(`Se enviara este correo a ${target}.`, "Enviar correo"))) return;
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
  form.message.value = data.result.emailBody || data.result.whatsapp || JSON.stringify(data.result, null, 2);
  showToast("Borrador generado. Revísalo antes de guardarlo.");
}

async function generateMarketingKit() {
  const form = $("#instagramPostForm");
  const button = $("#generateMarketingKit");
  if (!form?.propertyId.value) {
    setFormMessage($("#instagramPostMessage"), "Selecciona una propiedad por título o MLS.", true);
    return;
  }
  setButtonLoading(button, true, "Generando paquete...");
  try {
    const data = await api("/api/admin/ai/generate", {
      method: "POST",
      body: {
        tool: "campaign",
        propertyId: form.propertyId.value,
        input: [
          `Objetivo: ${form.objective.value}.`,
          `Tono: ${form.tone.value}.`,
          `Hashtags: ${form.hashtags.value}.`,
          form.caption.value ? `Borrador actual: ${form.caption.value}` : "",
        ].filter(Boolean).join(" "),
      },
      timeoutMs: 60000,
    });
    $("#marketingGeneratedCopy").value = typeof data.result === "string" ? data.result : [
      data.result.emailSubject ? `ASUNTO\n${data.result.emailSubject}` : "",
      data.result.emailBody ? `CORREO\n${data.result.emailBody}` : "",
      data.result.social ? `REDES\n${data.result.social}` : "",
      data.result.whatsapp ? `WHATSAPP\n${data.result.whatsapp}` : "",
    ].filter(Boolean).join("\n\n");
    $("#marketingCopyOutput").hidden = false;
    setFormMessage($("#instagramPostMessage"), data.warning || "Paquete generado con IA. Revisa cada texto antes de publicarlo.", Boolean(data.warning));
  } catch (error) {
    setFormMessage($("#instagramPostMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function marketingCreativeSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = event.submitter || form.querySelector('[type="submit"]');
  if (!form.propertyId.value) {
    setFormMessage($("#marketingCreativeMessage"), "Selecciona una propiedad por título o MLS.", true);
    return;
  }
  setButtonLoading(button, true, "Componiendo pieza...");
  try {
    const data = await api("/api/admin/ai/generate-image", {
      method: "POST",
      body: Object.fromEntries(new FormData(form).entries()),
      timeoutMs: 120000,
    });
    const imageUrl = data.dataUrl || data.url;
    if (!imageUrl) throw new Error("No se recibió una imagen.");
    $("#marketingGeneratedImage").src = imageUrl;
    $("#marketingCreativeOutput").hidden = false;
    const download = $("#downloadMarketingImage");
    download.href = imageUrl;
    download.download = data.filename || "puerto-cancun-marketing.png";
    download.hidden = false;
    setFormMessage($("#marketingCreativeMessage"), "Pieza creada con la fotografía original de la propiedad. Revísala antes de descargarla o publicarla.");
  } catch (error) {
    setFormMessage($("#marketingCreativeMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
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
    setFormMessage($("#aiToolMessage"), data.provider === "openai"
      ? "Borrador generado con IA. Requiere revisión humana."
      : data.warning || "Borrador generado con reglas internas. Requiere revisión humana.", Boolean(data.warning));
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
      <span class="eyebrow">${form.brandMode.value === "neutral" ? "FICHA NEUTRA · UNA PÁGINA" : "FICHA COMERCIAL · PUERTO CANCÚN CENTER"}</span>
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
    if ($("#pdfPropertySearch")) $("#pdfPropertySearch").value = propertySearchLabel(property);
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

function setAiToolCategory(category) {
  $$('[data-ai-category]').forEach((button) => {
    const active = button.dataset.aiCategory === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $$('[data-ai-tool-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.aiToolPanel !== category;
  });
}

function selectAiTool(button) {
  const form = $("#aiToolForm");
  if (!form || !button?.dataset.aiTool) return;
  formField(form, "tool").value = button.dataset.aiTool;
  $$('[data-ai-tool]').forEach((item) => item.classList.toggle("active", item === button));
  const label = button.querySelector("strong")?.textContent || button.dataset.aiTool;
  $("#aiSelectedTool").innerHTML = `<b>Seleccionada:</b> ${escapeHtml(label)}`;
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

async function scopedMediaUploadSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const file = form.file.files[0];
  if (!file) return;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Subiendo...");
  setFormMessage($("#scopedMediaFormMessage"), "");
  try {
    const content = await fileToDataUrl(file);
    const scope = currentScopedLibraryScope();
    const data = await api("/api/admin/files", {
      method: "POST",
      body: {
        name: file.name,
        content,
        category: file.type.startsWith("image/") ? "reference_image" : "document",
        libraryScope: scope,
        folderId: form.folderId.value,
        relatedEntityId: form.relatedEntityId.value,
      },
    });
    state.files = [data.file, ...state.files.filter((item) => item.id !== data.file.id)];
    const folder = state.fileFolders.find((item) => item.id === data.file.folderId);
    if (folder) folder.fileCount += 1;
    form.file.value = "";
    renderScopedMediaLibrary();
    showToast("Archivo guardado en la biblioteca privada.");
  } catch (error) {
    setFormMessage($("#scopedMediaFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function scopedFolderSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type="submit"]');
  setButtonLoading(button, true, "Creando...");
  try {
    const data = await api("/api/admin/file-folders", {
      method: "POST",
      body: { name: form.name.value.trim(), scope: currentScopedLibraryScope() },
    });
    state.fileFolders.push(data.folder);
    state.scopedLibrary.folderId = data.folder.id;
    form.reset();
    renderScopedMediaLibrary();
    $("#scopedUploadFolder").value = data.folder.id;
    showToast("Carpeta creada.");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

function selectScopedFolder(folderId) {
  state.scopedLibrary.folderId = folderId || "all";
  renderScopedMediaLibrary();
  if (folderId && !["all", "root"].includes(folderId) && $("#scopedUploadFolder")) {
    $("#scopedUploadFolder").value = folderId;
  }
}

async function renameScopedFolder(id) {
  const folder = state.fileFolders.find((item) => item.id === id);
  if (!folder) return;
  const name = window.prompt("Nuevo nombre de la carpeta", folder.name)?.trim();
  if (!name || name === folder.name) return;
  try {
    const data = await api(`/api/admin/file-folders/${encodeURIComponent(id)}`, { method: "PATCH", body: { name } });
    Object.assign(folder, data.folder);
    renderScopedMediaLibrary();
    showToast("Carpeta renombrada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function deleteScopedFolder(id) {
  const folder = state.fileFolders.find((item) => item.id === id);
  if (!folder) return;
  if (!(await confirmAction(`Se eliminará la carpeta “${folder.name}”.`, "Eliminar carpeta"))) return;
  try {
    await api(`/api/admin/file-folders/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.fileFolders = state.fileFolders.filter((item) => item.id !== id);
    if (state.scopedLibrary.folderId === id) state.scopedLibrary.folderId = "all";
    renderScopedMediaLibrary();
    showToast("Carpeta eliminada.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function moveScopedFile(id, folderId) {
  const file = state.files.find((item) => item.id === id);
  if (!file || file.folderId === folderId) return;
  const previousFolderId = file.folderId;
  try {
    const data = await api(`/api/admin/files/${encodeURIComponent(id)}`, { method: "PATCH", body: { folderId } });
    Object.assign(file, data.file);
    const previousFolder = state.fileFolders.find((item) => item.id === previousFolderId);
    const nextFolder = state.fileFolders.find((item) => item.id === file.folderId);
    if (previousFolder) previousFolder.fileCount = Math.max(0, previousFolder.fileCount - 1);
    if (nextFolder) nextFolder.fileCount += 1;
    renderScopedMediaLibrary();
    showToast("Archivo movido.");
  } catch (error) {
    renderScopedMediaLibrary();
    showToast(error.message, "error");
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
  qr_expired: "QR vencido",
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
  dot.className = `whatsapp-connection-dot ${connection === "connected" ? "connected" : ["qr", "connecting", "reconnecting", "standby"].includes(connection) ? "pending" : ["error", "qr_expired"].includes(connection) ? "error" : ""}`;
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
    qr_expired: ["El codigo QR vencio", "Genera un codigo nuevo. El QR anterior ya no se muestra ni puede reutilizarse."],
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
  $("#whatsappDiagnostic").textContent = status.lastDiagnostic || status.lastError || "Sin diagnostico disponible.";
  const expiresAt = status.qrExpiresAt ? new Date(status.qrExpiresAt).getTime() : 0;
  const remainingSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0;
  $("#whatsappQrExpiry").textContent = connection === "qr" ? `${remainingSeconds} segundos` : connection === "qr_expired" ? "Vencido" : "No aplica";
  $("#connectWhatsapp").disabled = ["connecting", "qr", "connected"].includes(connection);
  $("#resetWhatsapp").disabled = connection === "connecting";
  $("#disconnectWhatsapp").disabled = connection === "disconnected";

  const form = $("#whatsappChatbotForm");
  const chatbot = overview.chatbot || {};
  if (form && form.dataset.loaded !== "true") {
    form.enabled.checked = chatbot.enabled === true;
    form.model.value = chatbot.model || "gpt-5-mini";
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
    setFormMessage($("#whatsappConnectionFormMessage"), "Solicitando el codigo QR a WhatsApp...");
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 400 : 1500));
      await refreshWhatsappData({ includeLists: false, silent: true });
      const status = state.whatsapp.overview?.status || {};
      if (["qr", "connected", "error", "qr_expired", "standby"].includes(status.connection)) break;
    }
    const status = state.whatsapp.overview?.status || {};
    if (status.connection === "qr") {
      setFormMessage($("#whatsappConnectionFormMessage"), "Codigo QR listo. Escanealo desde Dispositivos vinculados en WhatsApp.");
    } else if (status.connection === "connected") {
      setFormMessage($("#whatsappConnectionFormMessage"), "WhatsApp se conecto correctamente.");
    } else if (status.connection === "error") {
      throw new Error(status.lastError || "WhatsApp no pudo generar el codigo QR.");
    } else {
      setFormMessage($("#whatsappConnectionFormMessage"), "La solicitud sigue en curso. Usa Actualizar para consultar el estado.");
    }
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
  state.csrfToken = sessionData.csrfToken || state.csrfToken;
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
  const panelApi = (path) => api(path, { timeoutMs: 25000, retry: false });
  if (state.session.role === "admin") {
    const adminResults = await Promise.allSettled([
      panelApi("/api/admin/stats"),
      panelApi("/api/admin/requests"),
      panelApi("/api/admin/properties"),
      panelApi("/api/admin/prompts"),
      panelApi("/api/admin/leads"),
      panelApi("/api/admin/contacts"),
      panelApi("/api/admin/valuations"),
      panelApi("/api/admin/tasks"),
      panelApi("/api/admin/analytics"),
      panelApi("/api/admin/buyers"),
      panelApi("/api/admin/users"),
      panelApi("/api/admin/files?scope=general"),
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
      panelApi("/api/admin/blog"),
      panelApi("/api/admin/intelligence"),
      panelApi("/api/admin/integrations"),
      panelApi("/api/admin/data-quality"),
      panelApi("/api/admin/copilot/features"),
      panelApi("/api/admin/copilot/feedback-summary"),
      panelApi("/api/admin/tours"),
      panelApi("/api/admin/guest-sale-requests"),
      panelApi("/api/admin/file-folders?scope=property"),
      panelApi("/api/admin/file-folders?scope=development"),
      panelApi("/api/admin/files?scope=property"),
      panelApi("/api/admin/files?scope=development"),
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
      blogData,
      intelligenceData,
      integrationsData,
      dataQualityData,
      copilotFeaturesData,
      copilotFeedbackData,
      toursData,
      guestSaleRequestsData,
      propertyFoldersData,
      developmentFoldersData,
      propertyFilesData,
      developmentFilesData,
    ] = adminResults.map((result, index) => adminValue(index));
    if (adminResults[0].status === "fulfilled") state.stats = statsData;
    state.requests = requestsData.requests || state.requests;
    state.properties = propertiesData.properties || state.properties;
    state.adminPrompts = promptsData.prompts || state.adminPrompts;
    state.leads = leadsData.leads || state.leads;
    state.contacts = contactsData.contacts || state.contacts;
    state.valuations = valuationsData.valuations || state.valuations;
    state.tasks = tasksData.tasks || state.tasks;
    if (adminResults[8].status === "fulfilled") state.analytics = analyticsData || state.analytics;
    state.buyers = buyersData.buyers || state.buyers;
    state.internalUsers = usersData.users || state.internalUsers;
    state.files = [
      ...(filesData.files || state.files.filter((file) => (file.libraryScope || "general") === "general")),
      ...(propertyFilesData.files || state.files.filter((file) => file.libraryScope === "property")),
      ...(developmentFilesData.files || state.files.filter((file) => file.libraryScope === "development")),
    ];
    state.documents = documentsData.documents || state.documents;
    state.campaigns = campaignsData.campaigns || state.campaigns;
    if (adminResults[14].status === "fulfilled") state.instagramStatus = instagramStatusData || state.instagramStatus;
    state.settings = settingsData.settings || state.settings;
    state.notifications = notificationsData.notifications || state.notifications;
    if (adminResults[17].status === "fulfilled") state.whatsapp.overview = whatsappOverviewData;
    state.whatsapp.chats = whatsappChatsData.chats || state.whatsapp.chats;
    state.whatsapp.leads = whatsappLeadsData.leads || state.whatsapp.leads;
    state.activity = activityData.activity || state.activity;
    if (adminResults[21].status === "fulfilled") state.systemHealth = systemHealthData || state.systemHealth;
    state.blogPosts = blogData.posts || state.blogPosts;
    state.intelligence = intelligenceData.priorities ? intelligenceData : state.intelligence;
    state.integrations = integrationsData.integrations || state.integrations;
    state.dataQuality = dataQualityData.summary ? dataQualityData : state.dataQuality;
    state.copilotFeatures = copilotFeaturesData.features || state.copilotFeatures;
    state.copilotFeedbackSummary = copilotFeedbackData.rates ? copilotFeedbackData : state.copilotFeedbackSummary;
    state.tours = toursData.tours || state.tours;
    state.guestSaleRequests = guestSaleRequestsData.requests || state.guestSaleRequests;
    state.fileFolders = [
      ...(propertyFoldersData.folders || state.fileFolders.filter((folder) => folder.libraryScope === "property")),
      ...(developmentFoldersData.folders || state.fileFolders.filter((folder) => folder.libraryScope === "development")),
    ];
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
      panelApi("/api/seller/favorites"),
      panelApi("/api/seller/saved-searches"),
      panelApi("/api/seller/tours"),
      panelApi("/api/seller/alert-capabilities"),
    ]);
    const sellerValue = (index, fallback = {}) => sellerResults[index].status === "fulfilled" ? sellerResults[index].value : fallback;
    state.requests = sellerValue(0).requests || state.requests;
    state.serviceRequests = sellerValue(1).requests || state.serviceRequests;
    state.notifications = sellerValue(2).notifications || state.notifications;
    state.messages = sellerValue(3).messages || state.messages;
    state.favoriteProperties = sellerValue(4).favorites || state.favoriteProperties;
    state.favorites = state.favoriteProperties.map((property) => property.id);
    localStorage.setItem(keys.favorites, JSON.stringify(state.favorites));
    state.savedSearches = sellerValue(5).savedSearches || state.savedSearches;
    state.tours = sellerValue(6).tours || state.tours;
    state.alertCapabilities = sellerValue(7, state.alertCapabilities);
    const failedModules = sellerResults.filter((result) => result.status === "rejected").length;
    if (failedModules) showToast("Parte de tu panel tardó en responder. Conservamos la información disponible para que puedas reintentar.", "error");
    state.adminPrompts = [];
    state.leads = [];
    state.contacts = [];
    state.guestSaleRequests = [];
    state.valuations = [];
    state.tasks = [];
    state.matches = [];
    state.buyers = [];
    state.internalUsers = [];
    state.files = [];
    state.documents = [];
    state.campaigns = [];
    state.blogPosts = [];
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
    const active = button.dataset.adminSection === section
      || (button.dataset.adminSection === "properties" && section === "new-property")
      || (button.dataset.adminSection === "properties" && section === "property-files")
      || (button.dataset.adminSection === "developments" && section === "new-development")
      || (button.dataset.adminSection === "developments" && section === "development-files")
      || (button.dataset.adminSection === "requests" && section === "guest-requests")
      || (button.dataset.adminSection === "contacts" && section === "guest-contacts");
    button.classList.toggle("active", active);
  });
  $$("[data-admin-section-panel]").forEach((panel) => {
    panel.hidden = !String(panel.dataset.adminSectionPanel || "").split(/\s+/).includes(section);
  });
  $$("[data-admin-listing-view]").forEach((view) => {
    view.hidden = !String(view.dataset.adminListingView || "").split(/\s+/).includes(section);
  });
  const listingsTitle = $("#adminListingsTitle");
  if (listingsTitle) {
    const labels = {
      properties: state.lang === "en" ? "Property inventory" : "Inventario de propiedades",
      "new-property": state.lang === "en" ? "New property" : "Nueva propiedad",
      developments: state.lang === "en" ? "Development inventory" : "Inventario de desarrollos",
      "new-development": state.lang === "en" ? "New development" : "Nuevo desarrollo",
    };
    listingsTitle.textContent = labels[section] || (state.lang === "en" ? "Listing inventory" : "Inventario de publicaciones");
  }
  const operationsGrid = $("#adminOperationsGrid");
  if (operationsGrid) operationsGrid.hidden = !["requests", "guest-requests", "properties", "new-property", "developments", "new-development"].includes(section);
  $$(".admin-sidebar-subnav").forEach((subnav) => {
    const parent = subnav.previousElementSibling;
    const childSections = Array.from(subnav.querySelectorAll("[data-admin-section-link]")).map((item) => item.dataset.adminSectionLink);
    const belongsToSection = parent?.dataset.adminSection === section
      || childSections.includes(section)
      || (parent?.dataset.adminSection === "properties" && section === "new-property")
      || (parent?.dataset.adminSection === "developments" && section === "new-development");
    const open = belongsToSection && subnav.dataset.userCollapsed !== "true";
    subnav.classList.toggle("is-open", open);
    if (parent?.matches("[data-admin-section]")) parent.setAttribute("aria-expanded", String(open));
  });
  const leadBadge = $("#sidebarLeadBadge");
  const requestBadge = $("#sidebarRequestBadge");
  const valuationBadge = $("#sidebarValuationBadge");
  const taskBadge = $("#sidebarTaskBadge");
  const whatsappBadge = $("#sidebarWhatsappBadge");
  if (leadBadge) leadBadge.textContent = String(state.leads.filter((lead) => lead.status === "new").length);
  if (requestBadge) requestBadge.textContent = String(
    state.requests.filter((request) => request.status === "pending").length
    + state.guestSaleRequests.filter((request) => request.status === "pending").length
  );
  if (valuationBadge) valuationBadge.textContent = String(state.valuations.filter((valuation) => ["new", "in_review", "in_analysis"].includes(valuation.status)).length);
  if (taskBadge) taskBadge.textContent = String(state.tasks.filter((task) => ["pending", "in_progress"].includes(task.status)).length);
  if (whatsappBadge) whatsappBadge.textContent = String(state.whatsapp.overview?.counts?.unread || 0);
  $("#adminPanel")?.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
}

function configureListingFormMode(section = state.adminSection) {
  const form = $("#listingForm");
  if (!form) return;
  const developmentMode = section === "new-development";
  form.dataset.listingMode = developmentMode ? "development" : "property";
  formField(form, "publicationSection").value = developmentMode ? "developments" : "properties";
  const developmentLink = form.querySelector("[data-property-development-link]");
  const developmentPropertyLinker = form.querySelector("[data-development-property-linker]");
  const brochureImporter = form.querySelector("[data-development-brochure]");
  if (developmentLink) developmentLink.hidden = developmentMode;
  if (developmentPropertyLinker) developmentPropertyLinker.hidden = !developmentMode;
  if (brochureImporter) brochureImporter.hidden = true;
  form.querySelectorAll("[data-property-only]").forEach((container) => {
    container.hidden = developmentMode;
    container.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = developmentMode;
    });
  });

  const type = formField(form, "type");
  if (type) {
    const previous = type.value;
    const choices = developmentMode
      ? ["Desarrollo"]
      : ["Casa", "Departamento", "Terreno", "Comercial", "Preventa"];
    type.innerHTML = choices.map((choice) => `<option value="${choice}">${choice}</option>`).join("");
    type.value = choices.includes(previous) ? previous : choices[0];
  }

  const developmentSelect = formField(form, "developmentId");
  if (developmentSelect) {
    const current = developmentSelect.value;
    developmentSelect.innerHTML = `<option value="">Propiedad independiente / sin desarrollo</option>`;
    state.properties
      .filter((property) => property.publicationSection === "developments")
      .sort((a, b) => String(a.titleEs || "").localeCompare(String(b.titleEs || ""), "es"))
      .forEach((property) => {
        const developmentId = property.developmentData?.id || `dev-${property.id}`;
        developmentSelect.append(new Option(`${property.titleEs} · ${displayLocation(property)}`, developmentId));
      });
    if (current) developmentSelect.value = current;
  }

  const intro = $("#listingModeIntro");
  if (intro) {
    intro.innerHTML = developmentMode
      ? `<span class="eyebrow">DESARROLLO INMOBILIARIO</span><h3>Nuevo desarrollo</h3><p>Registra nombre, ubicación, galería y descripción en español e inglés. Las propiedades disponibles se vinculan por separado.</p>`
      : `<span class="eyebrow">PROPIEDAD INDIVIDUAL</span><h3>Nueva propiedad en venta o renta</h3><p>Registra los datos y fotografías de la unidad. Si pertenece a un desarrollo, vincúlala para reutilizar sus amenidades e imágenes generales.</p>`;
  }
  const imageLabel = formField(form, "imageFile")?.closest("label")?.querySelector("span");
  if (imageLabel) imageLabel.textContent = developmentMode ? "Imágenes generales del desarrollo" : "Imágenes propias de la unidad";
  const submitButton = $("#listingSubmitButton");
  const resetButton = $("#resetListingForm");
  const deleteButton = $("#deleteListingFromForm");
  const recordId = listingFormRecordId(form);
  const editing = Boolean(recordId);
  if (submitButton) {
    const translationKey = developmentMode
      ? editing ? "saveDevelopmentChanges" : "publishDevelopment"
      : "saveListing";
    submitButton.dataset.i18n = translationKey;
    submitButton.textContent = t(translationKey);
  }
  if (resetButton) {
    resetButton.hidden = developmentMode;
    resetButton.disabled = developmentMode;
    resetButton.dataset.i18n = "newListing";
    resetButton.textContent = t("newListing");
  }
  if (deleteButton) {
    deleteButton.hidden = !editing;
    deleteButton.dataset.deleteListing = editing ? recordId : "";
    const label = deleteButton.querySelector("span");
    if (label) {
      label.textContent = developmentMode
        ? state.lang === "en" ? "Delete development" : "Eliminar desarrollo"
        : state.lang === "en" ? "Delete property" : "Eliminar propiedad";
    }
  }
  if (developmentMode && !recordId) {
    formField(form, "status").value = "draft";
    formField(form, "isPublic").checked = false;
  }
  if (developmentMode) renderDevelopmentPropertyLinker();
}

function setAdminSection(section) {
  const requestedSection = /^[a-z0-9-]+$/i.test(String(section || "")) ? String(section) : "dashboard";
  const available = requestedSection === "dashboard" || $$(`[data-admin-section-panel~="${requestedSection}"]`).length > 0;
  section = available ? requestedSection : "dashboard";
  const previousSection = state.adminSection;
  const listingForm = $("#listingForm");
  const wasListingForm = ["new-property", "new-development"].includes(previousSection);
  const opensListingForm = ["new-property", "new-development"].includes(section);
  if (wasListingForm && !opensListingForm && listingForm?.dataset.saving === "true") {
    showToast("Espera a que termine de guardarse la publicación.");
    return;
  }
  if (wasListingForm && !opensListingForm) {
    resetListingForm(true);
  }
  state.adminSection = section || "dashboard";
  if (opensListingForm && listingForm) {
    configureListingFormMode(section);
  }
  if (["property-files", "development-files"].includes(state.adminSection)) {
    configureScopedLibrary(state.adminSection);
  }
  if (state.adminSection === "whatsapp") startWhatsappPolling();
  else stopWhatsappPolling();
  updateAdminShell();
  renderCopilotContext();
  if (["properties", "developments"].includes(state.adminSection)) {
    state.adminListingFilters = { search: "", type: "", zone: "", operation: "", status: "", quality: "", missingCover: false };
    renderAdminListingFilters();
    renderAdminListings();
  }
  $("#adminPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const panelStaticEnglish = {
  "Panel administrativo": "Admin panel",
  "Panel de vendedor": "Seller panel",
  "Centro de control": "Control center",
  "Publicaciones": "Listings",
  "Nueva publicación": "New listing",
  "Inventario": "Inventory",
  "Desarrollos públicos": "Public developments",
  "Contactos y cuentas": "Contacts and accounts",
  "Crear y enviar correos": "Create and send emails",
  "Instagram y contenido": "Instagram and content",
  "Conexión, chatbot y chats": "Connection, chatbot and chats",
  "Generar e historial": "Generate and history",
  "Crear contacto": "Create contact",
  "Crear correo": "Create email",
  "Asunto del correo": "Email subject",
  "Contenido del correo": "Email content",
  "Guardar correo": "Save email",
  "Crear usuario": "Create user",
  "Generar PDF": "Generate PDF",
  "Solicitudes": "Requests",
  "Asesorías": "Advisory",
  "Catálogos": "Catalogs",
  "Herramientas IA": "AI tools",
  "Correos preparados": "Prepared emails",
  "Destinatarios": "Recipients",
  "Usar el segmento seleccionado": "Use selected segment",
  "Elegir correos específicos": "Choose specific emails",
  "Buscar correos registrados": "Search registered emails",
  "Seleccionar visibles": "Select visible",
  "Quitar selección": "Clear selection",
  "Enviar correo ahora": "Send email now",
  "Guardar borrador": "Save draft",
  "Generar borrador con IA": "Generate draft with AI",
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
  $$("#panelView h2, #panelView h3, #panelView label > span, #panelView legend, #panelView option, #panelView button > span, #panelView .admin-sidebar-subnav button, #panelView .admin-sidebar-subnav a, #campaignForm button").forEach((element) => {
    if (element.id === "panelTitle") return;
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
  document.body.classList.toggle("admin-session", isAdmin);
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
    renderAdminIntelligence();
    renderAdminIntegrations();
    renderAdminDataQuality();
    renderCopilotContext();
    renderCopilotFeedbackSummary();
    renderCatalogParentOptions();
    renderLocationCatalogs();
    renderAdminPrompts();
    renderAdminLeads();
    renderAdminContacts();
    renderAdminRequests();
    renderAdminGuestRequests();
    renderAdminGuestContacts();
    renderAdminListingFilters();
    renderAdminListings();
    renderAdminValuations();
    renderAdminTasks();
    renderAdminAnalytics();
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
    renderSellerFavorites();
    renderSellerSavedSearches();
    renderSellerAlertCapabilities();
    renderSellerTours();
    setSellerSection(state.sellerSection || "sale");
  }
  bindMapPickers();
  if (isAdmin) void restoreListingDraft();
  translatePanelStaticCopy();
  refreshIcons();
}

function currentScopedLibraryScope() {
  return state.adminSection === "development-files" ? "development" : "property";
}

function scopedLibraryEntities(scope = currentScopedLibraryScope()) {
  const section = scope === "development" ? "developments" : "properties";
  return state.properties
    .filter((property) => property.publicationSection === section)
    .sort((a, b) => String(a.titleEs || "").localeCompare(String(b.titleEs || ""), "es"));
}

function configureScopedLibrary(section = state.adminSection) {
  const scope = section === "development-files" ? "development" : "property";
  if (state.scopedLibrary.scope !== scope) state.scopedLibrary.folderId = "all";
  state.scopedLibrary.scope = scope;
  const developmentMode = scope === "development";
  const english = state.lang === "en";
  if ($("#scopedLibraryEyebrow")) $("#scopedLibraryEyebrow").textContent = developmentMode ? english ? "DEVELOPMENTS" : "DESARROLLOS" : english ? "LISTINGS" : "PUBLICACIONES";
  if ($("#scopedLibraryTitle")) $("#scopedLibraryTitle").textContent = developmentMode ? english ? "Development files" : "Archivos de desarrollos" : english ? "Property files" : "Archivos de propiedades";
  if ($("#scopedEntityLabel")) $("#scopedEntityLabel").textContent = developmentMode ? english ? "Link to development" : "Asociar a desarrollo" : english ? "Link to property" : "Asociar a propiedad";
  renderScopedMediaLibrary();
}

function renderScopedMediaLibrary() {
  const library = $("#adminScopedFiles");
  const folderList = $("#scopedFolderList");
  const folderSelect = $("#scopedUploadFolder");
  const entitySelect = $("#scopedRelatedEntity");
  if (!library || !folderList || !folderSelect || !entitySelect) return;
  const scope = currentScopedLibraryScope();
  state.scopedLibrary.scope = scope;
  const folders = state.fileFolders.filter((folder) => folder.libraryScope === scope);
  const scopedFiles = state.files.filter((file) => file.libraryScope === scope);
  const english = state.lang === "en";
  const selectedFolder = state.scopedLibrary.folderId || "all";
  const folderButton = (id, icon, label, count) => `
    <div class="folder-strip-item ${selectedFolder === id ? "active" : ""}">
      <button type="button" data-library-folder="${escapeHtml(id)}"><i data-lucide="${icon}"></i><span>${escapeHtml(label)}</span><b>${count}</b></button>
    </div>`;
  folderList.innerHTML = [
    folderButton("all", "folders", english ? "All" : "Todos", scopedFiles.length),
    folderButton("root", "folder", english ? "Unfiled" : "Sin carpeta", scopedFiles.filter((file) => !file.folderId).length),
    ...folders.map((folder) => `
      <div class="folder-strip-item ${selectedFolder === folder.id ? "active" : ""}">
        <button type="button" data-library-folder="${escapeHtml(folder.id)}"><i data-lucide="folder"></i><span>${escapeHtml(folder.name)}</span><b>${folder.fileCount}</b></button>
        <div class="folder-actions">
          <button type="button" data-rename-media-folder="${escapeHtml(folder.id)}" title="Renombrar carpeta" aria-label="Renombrar ${escapeHtml(folder.name)}"><i data-lucide="pencil"></i></button>
          <button type="button" data-delete-media-folder="${escapeHtml(folder.id)}" title="Eliminar carpeta" aria-label="Eliminar ${escapeHtml(folder.name)}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>`),
  ].join("");
  const currentUploadFolder = folderSelect.value;
  folderSelect.innerHTML = `<option value="">${english ? "Unfiled" : "Sin carpeta"}</option>${folders.map((folder) => `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</option>`).join("")}`;
  if (folders.some((folder) => folder.id === currentUploadFolder)) folderSelect.value = currentUploadFolder;
  const currentEntity = entitySelect.value;
  const entities = scopedLibraryEntities(scope);
  entitySelect.innerHTML = `<option value="">${english ? "No link" : "Sin asociación"}</option>${entities.map((property) => `<option value="${escapeHtml(property.id)}">${escapeHtml(property.mls ? `MLS# ${property.mls} · ` : "")}${escapeHtml((english ? property.titleEn : property.titleEs) || property.titleEs || (english ? "Untitled" : "Sin título"))}</option>`).join("")}`;
  if (entities.some((property) => property.id === currentEntity)) entitySelect.value = currentEntity;
  const search = String($("#scopedMediaSearch")?.value || "").trim().toLowerCase();
  const type = $("#scopedMediaTypeFilter")?.value || "";
  const visibleFiles = scopedFiles.filter((file) => {
    const entity = state.properties.find((property) => property.id === file.relatedEntityId);
    const haystack = `${file.name} ${file.category} ${entity?.titleEs || ""} ${entity?.mls || ""}`.toLowerCase();
    const inFolder = selectedFolder === "all" || (selectedFolder === "root" ? !file.folderId : file.folderId === selectedFolder);
    const matchesType = !type
      || (type === "image" && file.mimeType.startsWith("image/"))
      || (type === "pdf" && file.mimeType === "application/pdf")
      || (type === "document" && !file.mimeType.startsWith("image/") && file.mimeType !== "application/pdf");
    return inFolder && matchesType && (!search || haystack.includes(search));
  });
  if ($("#scopedLibraryCount")) $("#scopedLibraryCount").textContent = english
    ? `${scopedFiles.length} file${scopedFiles.length === 1 ? "" : "s"}`
    : `${scopedFiles.length} archivo${scopedFiles.length === 1 ? "" : "s"}`;
  library.innerHTML = visibleFiles.length
    ? visibleFiles.map((file) => {
        const entity = state.properties.find((property) => property.id === file.relatedEntityId);
        const icon = file.mimeType === "application/pdf" ? "file-text" : "file";
        return `
          <article class="media-card scoped-media-card">
            <div class="media-card-preview">
              ${file.mimeType.startsWith("image/") ? `<img src="/api/admin/files/${encodeURIComponent(file.id)}/download?inline=1" alt="${escapeHtml(file.name)}" loading="lazy" />` : `<i data-lucide="${icon}"></i>`}
            </div>
            <div class="media-card-body">
              <strong title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</strong>
              <span>${escapeHtml(Math.max(1, Math.round(file.sizeBytes / 1024)))} KB · ${escapeHtml(formatDate(file.createdAt))}</span>
              <span title="${escapeHtml(entity?.titleEs || (english ? "No link" : "Sin asociación"))}">${escapeHtml(entity ? `${entity.mls ? `MLS# ${entity.mls} · ` : ""}${(english ? entity.titleEn : entity.titleEs) || entity.titleEs}` : english ? "No link" : "Sin asociación")}</span>
              <label class="media-folder-select"><span>${english ? "Folder" : "Carpeta"}</span><select data-move-library-file="${escapeHtml(file.id)}"><option value="">${english ? "Unfiled" : "Sin carpeta"}</option>${folders.map((folder) => `<option value="${escapeHtml(folder.id)}" ${file.folderId === folder.id ? "selected" : ""}>${escapeHtml(folder.name)}</option>`).join("")}</select></label>
              <div class="item-actions">
                <a class="mini-button" href="/api/admin/files/${encodeURIComponent(file.id)}/download?inline=1" target="_blank" rel="noopener">${english ? "Open" : "Abrir"}</a>
                <a class="mini-button" href="/api/admin/files/${encodeURIComponent(file.id)}/download">${english ? "Download" : "Descargar"}</a>
                <button class="mini-button danger" type="button" data-delete-media="${escapeHtml(file.id)}">${english ? "Delete" : "Eliminar"}</button>
              </div>
            </div>
          </article>`;
      }).join("")
    : `<p class="empty-state">${english ? "There are no files in this view." : "No hay archivos en esta vista."}</p>`;
  refreshIcons();
}

function updateAuthNav() {
  const loginButton = $("#loginOpen");
  if (!loginButton) return;
  if (!state.session) {
    loginButton.textContent = t("navLogin");
    loginButton.setAttribute("href", state.lang === "en" ? "/en/?auth=login" : "/?auth=login");
    return;
  }
  loginButton.textContent = state.session.role === "admin" ? t("adminPanelShort") : t("sellerPanelShort");
  loginButton.setAttribute("href", "/panel");
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
  "/propiedades/terrenos-cancun": "/en/properties/land-cancun",
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
  "/calculadora-hipotecaria": "/en/mortgage-calculator",
  "/blog": "/en/blog",
  "/busquedas-clientes": "/en/client-requirements",
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

function applyTranslations({ renderPanelContent = true } = {}) {
  document.documentElement.lang = state.lang;
  document.body.dataset.lang = state.lang;
  $$("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });
  $$("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  $$("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
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
  $$('[data-valuation-option]').forEach((link) => {
    link.href = state.lang === "en" ? "/en/property-valuation-cancun" : "/valuacion-inmobiliaria-cancun";
  });
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
  if (renderPanelContent && $("#panelView") && !$("#panelView").hidden) {
    void renderPanel();
  }
  translatePanelStaticCopy();
  refreshIcons();
}

function toggleLanguage() {
  const nextLanguage = state.lang === "es" ? "en" : "es";
  localStorage.setItem(keys.lang, nextLanguage);
  if (window.location.pathname === "/panel" || ($("#panelView") && !$("#panelView").hidden)) {
    state.lang = nextLanguage;
    applyTranslations();
    preparePersonalDataForms();
    return;
  }
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
    state.csrfToken = data.csrfToken || state.csrfToken;
    closeAuth();
    updateAuthNav();
    window.location.assign("/panel");
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
  if (!$("#panelView")) {
    window.location.assign("/panel");
    return;
  }
  $("#siteShell").hidden = true;
  $("#panelView").hidden = false;
  document.body.classList.add("panel-open");
  if (window.innerWidth <= 980) state.sidebarCollapsed = true;
  await renderPanel();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function hidePanel() {
  if (!$("#panelView")) {
    window.location.assign("/");
    return;
  }
  const listingForm = $("#listingForm");
  if (listingForm?.dataset.saving === "true") {
    showToast("Espera a que termine de guardarse la publicación.");
    return;
  }
  if (listingForm) resetListingForm(true);
  if (document.body.dataset.page === "panel") {
    window.location.assign("/");
    return;
  }
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
  const button = form.querySelector('button[type="submit"]');
  setFormMessage(message, "");
  try {
    setButtonLoading(button, true, state.lang === "en" ? "Signing in..." : "Iniciando sesión...");
    const data = await api("/api/auth/login", {
      method: "POST",
      body: {
        username: form.username.value.trim(),
        password: form.password.value,
      },
    });
    state.session = data.user;
    state.csrfToken = data.csrfToken || state.csrfToken;
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
    window.location.assign("/panel");
  } catch (error) {
    if (error.code === "DATABASE_UNAVAILABLE") {
      setFormMessage(message, t("loginUnavailable"), true);
      return;
    }
    if (error.code === "EMAIL_NOT_VERIFIED") {
      setFormMessage(message, state.lang === "en"
        ? "Confirm your email before signing in. Check the verification message we sent you."
        : "Confirma tu correo antes de iniciar sesión. Revisa el mensaje de verificación que te enviamos.", true);
      return;
    }
    if (error.status === 401 && form.username.value.includes("@")) {
      switchAuthTab("register");
      $("#registerForm").email.value = form.username.value.trim();
      setFormMessage($("#registerMessage"), t("accountPrompt"));
      return;
    }
    setFormMessage(message, error.status === 429 ? error.message : t("loginError"), true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function registerSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#registerMessage");
  const button = form.querySelector('button[type="submit"]');
  setFormMessage(message, "");
  try {
    setButtonLoading(button, true, state.lang === "en" ? "Creating account..." : "Creando cuenta...");
    const data = await api("/api/auth/register", {
      method: "POST",
      body: {
        firstName: form.firstName.value.trim(),
        lastName: form.lastName.value.trim(),
        email: form.email.value.trim(),
        phone: `${form.countryCode.value}${form.phone.value}`.replace(/[^\d+]/g, ""),
        preferredContact: form.preferredContact.value,
        password: form.password.value,
        confirmPassword: form.confirmPassword.value,
        consent: form.consent?.checked === true,
      },
    });
    const accountMessage = data.verificationRequired
      ? data.emailDeliveryPending
        ? state.lang === "en"
          ? "Account saved. Verification email delivery is pending; the team can resend it without losing your data."
          : "Cuenta guardada. El correo de verificación está pendiente; el equipo puede reenviarlo sin perder tus datos."
        : state.lang === "en"
          ? "Account created. Check your email to confirm it before signing in."
          : "Cuenta creada. Revisa tu correo y confírmalo antes de iniciar sesión."
      : state.lang === "en"
        ? "Account created. You can sign in now."
        : "Cuenta creada. Ya puedes iniciar sesión.";
    setFormMessage(message, accountMessage);
    form.reset();
    form.countryCode.value = "+52";
  } catch (error) {
    const text = error.code === "DATABASE_UNAVAILABLE"
      ? t("loginUnavailable")
      : error.status === 409
        ? t("accountExists")
        : error.message;
    setFormMessage(message, text, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function forgotPasswordSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#forgotMessage");
  const button = form.querySelector('button[type="submit"]');
  setFormMessage(message, "");
  try {
    setButtonLoading(button, true, state.lang === "en" ? "Sending..." : "Enviando...");
    const data = await api("/api/auth/forgot-password", { method: "POST", body: { email: form.email.value.trim() } });
    setFormMessage(message, data.message || (state.lang === "en" ? "Check your email." : "Revisa tu correo."));
  } catch (error) {
    setFormMessage(message, error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

async function resetPasswordSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#resetPasswordMessage");
  setFormMessage(message, "");
  try {
    await api("/api/auth/reset-password", {
      method: "POST",
      body: { token: form.token.value, password: form.password.value, confirmPassword: form.confirmPassword.value },
    });
    window.history.replaceState({}, "", window.location.pathname);
    switchAuthTab("login");
    setFormMessage($("#loginMessage"), state.lang === "en" ? "Password updated. You can now sign in." : "Contraseña actualizada. Ya puedes iniciar sesión.");
  } catch (error) {
    setFormMessage(message, error.message, true);
  }
}

function initializePasswordStrengthMeters() {
  $$("[data-password-meter]").forEach((meter) => {
    const input = meter.closest("label")?.querySelector('input[type="password"]');
    if (!input) return;
    const update = () => {
      const value = input.value;
      meter.value = [
        value.length >= 12,
        /[A-Z]/.test(value) && /[a-z]/.test(value),
        /\d/.test(value),
        /[^A-Za-z0-9]/.test(value),
      ].filter(Boolean).length;
    };
    input.addEventListener("input", update);
    update();
  });
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
        confirmNewPassword: form.confirmNewPassword.value,
      },
    });
    const username = form.username.value.trim();
    form.reset();
    if (state.session) {
      state.session.mustUpdatePassword = false;
      closeAuth();
      updateAuthNav();
      window.location.assign("/panel");
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
  const button = form.querySelector('button[type="submit"]');
  if (message) setFormMessage(message, "");
  const payload = Object.fromEntries(new FormData(form).entries());
  try {
    setButtonLoading(button, true, state.lang === "en" ? "Sending..." : "Enviando...");
    await api("/api/leads", {
      method: "POST",
      body: {
        ...payload,
        sourcePath: `${window.location.pathname}${window.location.hash || ""}`,
      },
    });
    form.reset();
    if (form.elements.formStartedAt) form.elements.formStartedAt.value = String(Date.now());
    if (message) setFormMessage(message, t("leadSent"));
  } catch (error) {
    if (message) setFormMessage(message, error.message, true);
    else showToast(error.message, "error");
  } finally {
    setButtonLoading(button, false);
  }
}

function preparePersonalDataForms() {
  const english = state.lang === "en";
  $$("[data-lead-form]").forEach((form) => {
    if (!form.elements.website) {
      const honeypot = document.createElement("label");
      honeypot.className = "form-honeypot";
      honeypot.setAttribute("aria-hidden", "true");
      honeypot.innerHTML = `<span>Website</span><input name="website" tabindex="-1" autocomplete="off" />`;
      form.prepend(honeypot);
    }
    if (!form.elements.formStartedAt) {
      const started = document.createElement("input");
      started.type = "hidden";
      started.name = "formStartedAt";
      started.value = String(Date.now());
      form.prepend(started);
    }
  });
  $$("[data-lead-form], #registerForm, #sellerRequestForm, #sellerServiceForm").forEach((form) => {
    if (!form) return;
    let consent = form.querySelector("[data-privacy-consent]");
    const checked = Boolean(consent?.querySelector('input[name="consent"]')?.checked);
    if (!consent) {
      consent = document.createElement("label");
      consent.className = "privacy-consent";
      consent.dataset.privacyConsent = "true";
      const submit = form.querySelector('button[type="submit"]');
      if (submit?.parentNode) submit.parentNode.insertBefore(consent, submit);
      else form.append(consent);
    }
    consent.innerHTML = `<input type="checkbox" name="consent" value="true" required ${checked ? "checked" : ""} /><span>${english ? "I have read and accept the" : "He leído y acepto el"} <a href="${english ? "/en/privacy-notice" : "/aviso-de-privacidad"}" target="_blank">${english ? "privacy notice" : "aviso de privacidad"}</a> ${english ? "and the" : "y los"} <a href="${english ? "/en/terms" : "/terminos-y-condiciones"}" target="_blank">${english ? "terms and conditions" : "términos y condiciones"}</a>.</span>`;
  });
}

function initializeCookiePreferences() {
  const banner = $("#cookieBanner");
  if (!banner) return;
  const stored = localStorage.getItem("pcc-cookie-consent");
  banner.hidden = Boolean(stored);
  banner.querySelectorAll("[data-cookie-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem("pcc-cookie-consent", button.dataset.cookieChoice === "all" ? "all" : "essential");
      banner.hidden = true;
    });
  });
}

const brochureFieldLabels = {
  title: "Título",
  description: "Descripción",
  developer: "Desarrollador",
  type: "Tipo",
  zone: "Zona",
  address: "Dirección",
  amenities: "Amenidades",
  priceFrom: "Precio desde",
  currency: "Moneda",
  status: "Estado",
  estimatedDelivery: "Fecha estimada de entrega",
  units: "Unidades",
  additionalInformation: "Información adicional",
};

function brochureDisplayValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined || value === "") return "No encontrado";
  return String(value);
}

function renderBrochureReview(fields) {
  const review = $("#brochureReview");
  const list = $("#brochureFieldList");
  if (!review || !list) return;
  const entries = Object.entries(fields || {}).filter(([key]) => brochureFieldLabels[key]);
  list.innerHTML = entries.map(([key, detail]) => {
    const structured = detail && typeof detail === "object" && !Array.isArray(detail) && Object.hasOwn(detail, "value")
      ? detail
      : { value: detail, confidence: null, page: null };
    const hasValue = structured.value !== null && structured.value !== undefined && structured.value !== "" && (!Array.isArray(structured.value) || structured.value.length);
    const confidence = Number.isFinite(Number(structured.confidence)) ? `${Math.round(Number(structured.confidence) * 100)}%` : "No disponible";
    return `<label class="brochure-field-row ${hasValue ? "" : "is-empty"}">
      <input type="checkbox" data-brochure-field="${escapeHtml(key)}" ${hasValue ? "checked" : "disabled"} />
      <span><strong>${escapeHtml(brochureFieldLabels[key])}</strong><small>Confianza: ${escapeHtml(confidence)}${structured.page ? ` · página ${escapeHtml(structured.page)}` : ""}</small></span>
      <textarea rows="${key === "description" || key === "additionalInformation" ? 4 : 2}" data-brochure-value="${escapeHtml(key)}" ${hasValue ? "" : "disabled"}>${escapeHtml(brochureDisplayValue(structured.value))}</textarea>
    </label>`;
  }).join("");
  review.hidden = false;
}

async function analyzeBrochure() {
  const file = $("#brochureFile")?.files?.[0];
  const button = $("#analyzeBrochure");
  const message = $("#brochureMessage");
  if (!file || file.type !== "application/pdf" || file.size > 15 * 1024 * 1024) {
    setFormMessage(message, "Selecciona un PDF válido de máximo 15 MB.", true);
    return;
  }
  setButtonLoading(button, true, "Analizando…");
  setFormMessage(message, "Validando el PDF y extrayendo únicamente datos explícitos…");
  try {
    const content = await blobToDataUrl(file);
    const developmentPropertyId = listingFormRecordId();
    const data = await api("/api/admin/developments/brochures/analyze", {
      method: "POST",
      body: { fileName: file.name, content, developmentPropertyId },
      timeoutMs: 60000,
      retry: false,
    });
    state.brochureImport = { id: data.importId, fields: data.fields || {} };
    renderBrochureReview(data.fields || {});
    setFormMessage(message, `${data.cached ? "Extracción recuperada de caché" : "Análisis completado"}. Revisa los campos antes de aplicarlos. ${data.imageExtractionLimitation || ""}`);
    refreshIcons();
  } catch (error) {
    setFormMessage(message, error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function parseBrochureEditableValue(key, value) {
  if (key === "amenities") return value.split(",").map((item) => item.trim()).filter(Boolean);
  if (["priceFrom", "units"].includes(key)) return Number(String(value).replace(/[^0-9.]/g, "")) || null;
  return value.trim() || null;
}

async function applyBrochureFields() {
  const form = $("#listingForm");
  if (!form || !state.brochureImport?.id) return;
  const selected = {};
  $$("[data-brochure-field]:checked").forEach((checkbox) => {
    const key = checkbox.dataset.brochureField;
    const input = $(`[data-brochure-value="${CSS.escape(key)}"]`);
    selected[key] = parseBrochureEditableValue(key, input?.value || "");
  });
  const assign = (name, value) => {
    const field = formField(form, name);
    if (!field || value === null || value === undefined || value === "") return;
    field.value = Array.isArray(value) ? value.join(", ") : value;
  };
  assign("title", selected.title);
  assign("description", selected.description);
  assign("developer", selected.developer);
  assign("zone", selected.zone);
  assign("address", selected.address);
  assign("developmentAmenities", selected.amenities);
  assign("amenities", selected.amenities);
  assign("price", selected.priceFrom);
  assign("currency", selected.currency);
  assign("deliveryDate", selected.estimatedDelivery);
  assign("units", selected.units);
  assign("investmentHighlights", selected.additionalInformation);
  updateListingDescriptionCounter();
  updateMapPickerForForm(form);
  saveListingDraft();
  try {
    await api(`/api/admin/developments/brochures/${encodeURIComponent(state.brochureImport.id)}/review`, { method: "PATCH", body: { status: "applied", reviewData: selected } });
    setFormMessage($("#brochureMessage"), "Campos aplicados al formulario. Revisa la ficha y guarda manualmente el desarrollo.");
    showToast("Datos del brochure aplicados al borrador.");
  } catch (error) {
    setFormMessage($("#brochureMessage"), `Los campos están en el formulario, pero no se pudo registrar la revisión: ${error.message}`, true);
  }
}

async function rejectBrochureFields() {
  const importId = state.brochureImport?.id;
  if (importId) {
    await api(`/api/admin/developments/brochures/${encodeURIComponent(importId)}/review`, { method: "PATCH", body: { status: "rejected", reviewData: {} } }).catch(() => null);
  }
  state.brochureImport = null;
  $("#brochureReview").hidden = true;
  if ($("#brochureFile")) $("#brochureFile").value = "";
  setFormMessage($("#brochureMessage"), "Extracción descartada. No se modificó el formulario.");
}

function renderListingImageAnalysis(data) {
  const panel = $("#listingImageAnalysis");
  const summary = $("#listingImageAnalysisSummary");
  const images = safeParseImages($("#listingForm")?.dataset.currentImages);
  if (!panel || !summary) return;
  const items = Array.isArray(data?.items) ? data.items : [];
  summary.innerHTML = items.length ? `<div class="image-analysis-grid">${items.map((item) => `
    <article class="image-analysis-row ${item.duplicateOf !== null && item.duplicateOf !== undefined ? "has-warning" : ""}">
      <img src="${escapeHtml(images[item.index] || fallbackImage)}" alt="Fotografía ${Number(item.index) + 1}" />
      <div><strong>${escapeHtml(item.classification || "Sin clasificar")}</strong><p>${escapeHtml(item.suggestedAlt || "Sin texto ALT sugerido")}</p><small>${item.width && item.height ? `${escapeHtml(item.width)} × ${escapeHtml(item.height)} · ` : ""}${item.lowResolution ? "Resolución baja · " : ""}${item.duplicateOf !== null && item.duplicateOf !== undefined ? `Posible duplicado de la foto ${Number(item.duplicateOf) + 1}` : "Sin duplicados detectados"}</small>${Array.isArray(item.tags) && item.tags.length ? `<div class="keyword-chips">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}</div>
    </article>`).join("")}</div>` : `<p class="empty-state">No hay fotografías analizables.</p>`;
  const coverButton = $("#useRecommendedCover");
  const orderButton = $("#applySuggestedImageOrder");
  coverButton.hidden = !items.length;
  orderButton.hidden = !items.length;
  coverButton.dataset.index = String(data?.recommendedCoverIndex ?? 0);
  panel.hidden = false;
  refreshIcons();
}

async function analyzeListingImages() {
  const form = $("#listingForm");
  const id = listingFormRecordId(form);
  const button = $("#analyzeListingImages");
  if (!id) {
    setFormMessage($("#listingFormMessage"), "Guarda primero la publicación y su galería antes de analizar fotografías.", true);
    return;
  }
  if (form.dataset.mediaDirty === "true") {
    setFormMessage($("#listingFormMessage"), "Guarda los cambios de la galería antes de ejecutar el análisis.", true);
    return;
  }
  setButtonLoading(button, true, "Analizando…");
  setFormMessage($("#listingFormMessage"), "Revisando resolución, duplicados y composición sin alterar los archivos…");
  try {
    const data = await api(`/api/admin/properties/${encodeURIComponent(id)}/analyze-images`, { method: "POST", timeoutMs: 90000, retry: false });
    state.imageAnalysis = data;
    renderListingImageAnalysis(data);
    setFormMessage($("#listingFormMessage"), data.provider === "openai" ? "Análisis visual completado. Revisa cada recomendación antes de aplicarla." : "Análisis técnico completado. Configura OpenAI para clasificación visual y ALT contextual.");
  } catch (error) {
    setFormMessage($("#listingFormMessage"), error.message, true);
  } finally {
    setButtonLoading(button, false);
  }
}

function useRecommendedCover() {
  const index = Number($("#useRecommendedCover")?.dataset.index || 0);
  if (!Number.isInteger(index) || index < 0) return;
  if (!window.confirm(`¿Usar la fotografía ${index + 1} como portada? El cambio se aplicará al guardar la galería.`)) return;
  moveListingImage(index, 0);
  showToast("Portada recomendada aplicada al borrador. Guarda la galería para confirmar.");
}

function applySuggestedImageOrder() {
  const form = $("#listingForm");
  const current = safeParseImages(form?.dataset.currentImages);
  const order = state.imageAnalysis?.suggestedOrder;
  if (!Array.isArray(order) || order.length !== current.length || new Set(order).size !== current.length) {
    showToast("La propuesta de orden no coincide con la galería actual.", "error");
    return;
  }
  if (!window.confirm("¿Aplicar el orden sugerido? Podrás revisarlo antes de guardar la galería.")) return;
  const metadata = normalizedImageMetadata(form.dataset.imageMetadata, current.length);
  setListingImages(
    order.map((index) => current[index]).filter(Boolean),
    order.map((index) => metadata[index]).filter(Boolean)
  );
  showToast("Orden sugerido aplicado al borrador.");
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
  fields.id = listingFormRecordId(form);
  fields.publicationSection = listingFormIsDevelopment(form) ? "developments" : "properties";
  fields.linkedPropertyIds = selectedDevelopmentPropertyIds(form);
  return {
    fields,
    images: safeParseImages(form.dataset.currentImages),
    imageMetadata: safeParseImageMetadata(form.dataset.imageMetadata),
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
    // IndexedDB can resolve after the administrator has already opened an
    // existing record or started a fresh form. Never let a late draft replace
    // the entity id or the work now visible on screen.
    if (listingFormRecordId(form) || form.dataset.dirty === "true") return;
    const draft = localDraft || richDraft;
    const sameEntity = richDraft && (!localDraft || (richDraft.fields?.id || "") === (localDraft.fields?.id || ""));
    const sameNewDraft = richDraft && (!localDraft || richDraft.idempotencyKey === localDraft.idempotencyKey);
    if (draft && sameEntity && sameNewDraft && Array.isArray(richDraft.images)) {
      draft.images = richDraft.images;
      draft.imageMetadata = richDraft.imageMetadata;
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
    setListingFormRecordId(form, source.id || "");
    setSelectedDevelopmentPropertyIds(source.linkedPropertyIds || [], form);
    const sourceProperty = state.properties.find((property) => property.id === source.id);
    const restoredImages = draft.mediaDirty ? (Array.isArray(draft.images) ? draft.images : []) : sourceProperty ? storedImages(sourceProperty) : (draft.images || []);
    form.dataset.currentImages = JSON.stringify(restoredImages);
    form.dataset.imageMetadata = JSON.stringify(normalizedImageMetadata(draft.imageMetadata, restoredImages.length));
    form.dataset.removeImage = restoredImages.length ? "false" : draft.mediaDirty ? "true" : "false";
    form.dataset.mediaDirty = draft.mediaDirty ? "true" : "false";
    updateListingImagePreview(restoredImages);
    configureListingFormMode(source.publicationSection === "developments" ? "new-development" : "new-property");
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
  setListingFormRecordId(form, "");
  form.dataset.currentImages = "[]";
  form.dataset.imageMetadata = "[]";
  form.dataset.removeImage = "false";
  form.dataset.mediaDirty = "false";
  form.dataset.contentDirty = "false";
  form.dataset.persistentMediaDirty = "false";
  setSelectedDevelopmentPropertyIds([], form);
  clearListingVideoObjectUrl(form);
  form.dataset.removeVideo = "false";
  delete form.dataset.existingVideoUrl;
  delete form.dataset.idempotencyKey;
  const deleteButton = $("#deleteListingFromForm");
  if (deleteButton) {
    deleteButton.hidden = true;
    deleteButton.dataset.deleteListing = "";
  }
  if (formField(form, "status")) formField(form, "status").value = "active";
  if (formField(form, "isPublic")) formField(form, "isPublic").checked = true;
  if (formField(form, "priceUnit")) formField(form, "priceUnit").value = "total";
  configureListingFormMode(state.adminSection);
  refreshLocationSelects();
  resetMapPickerForForm(form);
  updateListingImagePreview([]);
  renderListingVideoPreview();
  if ($("#developmentPropertySearch")) $("#developmentPropertySearch").value = "";
  if (listingFormIsDevelopment(form)) renderDevelopmentPropertyLinker();
  setFormMessage($("#listingVideoMessage"), "");
  if ($("#saveListingImages")) $("#saveListingImages").hidden = true;
  if ($("#analyzeListingImages")) $("#analyzeListingImages").hidden = true;
  if ($("#listingImageAnalysis")) $("#listingImageAnalysis").hidden = true;
  if ($("#brochureReview")) $("#brochureReview").hidden = true;
  if ($("#brochureFile")) $("#brochureFile").value = "";
  state.brochureImport = null;
  state.imageAnalysis = null;
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

function renderImagePreview(preview, images, interactive = false, metadata = []) {
  if (!preview) return;
  const list = Array.isArray(images) ? images.filter(Boolean) : images ? [images] : [];
  const grid = preview.querySelector(".image-preview-grid");
  const captions = normalizedImageMetadata(metadata, list.length);
  if (list.length) {
    grid.innerHTML = list
      .map((src, index) => interactive
        ? `<article class="image-preview-item" draggable="true" data-image-index="${index}">
            <span class="image-order">${index === 0 ? "PORTADA" : index + 1}</span>
            <img src="${escapeHtml(src)}" alt="Vista previa ${index + 1}" loading="lazy" />
            <label class="image-caption-field"><span>Descripción de imagen en español</span><textarea rows="2" maxlength="500" data-image-description="es" data-image-index="${index}" placeholder="Ej. Terraza principal con vista al mar">${escapeHtml(captions[index].descriptionEs)}</textarea></label>
            <label class="image-caption-field"><span>Image description in English</span><textarea rows="2" maxlength="500" data-image-description="en" data-image-index="${index}" placeholder="E.g. Main terrace with ocean view">${escapeHtml(captions[index].descriptionEn)}</textarea></label>
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
  const form = $("#listingForm");
  renderImagePreview($("#listingImagePreview"), images, true, safeParseImageMetadata(form?.dataset.imageMetadata));
  const analyze = $("#analyzeListingImages");
  if (analyze) analyze.hidden = !listingFormRecordId() || !Array.isArray(images) || images.length === 0;
}

function setListingImages(images, metadata = null) {
  const form = $("#listingForm");
  const list = Array.isArray(images) ? images.filter(Boolean).slice(0, IMAGE_MAX_COUNT) : [];
  form.dataset.currentImages = JSON.stringify(list);
  form.dataset.imageMetadata = JSON.stringify(normalizedImageMetadata(metadata ?? form.dataset.imageMetadata, list.length));
  form.dataset.removeImage = list.length ? "false" : "true";
  form.dataset.mediaDirty = "true";
  form.dataset.persistentMediaDirty = "true";
  const saveButton = $("#saveListingImages");
  if (saveButton) saveButton.hidden = !listingFormRecordId(form);
  updateListingImagePreview(list);
  saveListingDraft();
}

function clearListingVideoObjectUrl(form = $("#listingForm")) {
  if (!form?.dataset.videoObjectUrl) return;
  URL.revokeObjectURL(form.dataset.videoObjectUrl);
  delete form.dataset.videoObjectUrl;
}

function renderListingVideoPreview({ url = "", name = "", size = 0 } = {}) {
  const form = $("#listingForm");
  const preview = $("#listingVideoPreview");
  const video = preview?.querySelector("video");
  if (!form || !preview || !video) return;
  if (!url) {
    video.removeAttribute("src");
    video.load();
    preview.hidden = true;
    return;
  }
  video.src = url;
  video.poster = primaryImage(state.properties.find((property) => property.id === listingFormRecordId(form)) || {}) || fallbackImage;
  $("#listingVideoName").textContent = name || "Video publicado";
  $("#listingVideoSize").textContent = size ? `${(Number(size) / 1024 / 1024).toFixed(1)} MB` : "Disponible en la ficha pública";
  preview.hidden = false;
  refreshIcons();
}

async function ensureCsrfToken() {
  if (state.csrfToken) return state.csrfToken;
  const response = await fetch("/api/session", { credentials: "same-origin", cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  state.csrfToken = payload.csrfToken || "";
  if (payload.user !== undefined) state.session = payload.user;
  return state.csrfToken;
}

async function persistListingVideo(propertyId, form = $("#listingForm")) {
  const input = formField(form, "videoFile");
  const file = input?.files?.[0] || null;
  const removeVideo = form?.dataset.removeVideo === "true";
  if (!file && !removeVideo) return null;
  if (!file) {
    return api(`/api/admin/properties/${encodeURIComponent(propertyId)}/video`, { method: "DELETE" });
  }
  if (!["video/mp4", "video/webm"].includes(file.type) || file.size <= 0 || file.size > VIDEO_MAX_BYTES) {
    throw new Error("El video debe ser MP4 o WEBM y no superar 45 MB.");
  }
  const csrfToken = await ensureCsrfToken();
  const response = await fetch(`/api/admin/properties/${encodeURIComponent(propertyId)}/video`, {
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": file.type,
      "X-CSRF-Token": csrfToken,
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No fue posible guardar el video.");
  return data;
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
  const metadata = normalizedImageMetadata(form.dataset.imageMetadata, images.length + 1);
  const [caption] = metadata.splice(fromIndex, 1);
  images.splice(toIndex, 0, image);
  metadata.splice(toIndex, 0, caption);
  setListingImages(images, metadata);
}

async function saveListingImagesOnly() {
  const form = $("#listingForm");
  const id = listingFormRecordId(form);
  if (!id) {
    setFormMessage($("#listingFormMessage"), "Guarda primero la propiedad para crear su galería.", true);
    return;
  }
  const button = $("#saveListingImages");
  const images = safeParseImages(form.dataset.currentImages);
  const imageMetadata = normalizedImageMetadata(form.dataset.imageMetadata, images.length);
  const currentProperty = state.properties.find((property) => property.id === id);
  setButtonLoading(button, true, "Guardando galería...");
  try {
    const data = await api(`/api/admin/properties/${encodeURIComponent(id)}/images`, {
      method: "PATCH",
      body: {
        images,
        imageMetadata,
        removeImage: images.length === 0,
        expectedUpdatedAt: currentProperty?.updatedAt || null,
      },
      timeoutMs: 60000,
    });
    const saved = data.property;
    const index = state.properties.findIndex((property) => property.id === saved.id);
    if (index >= 0) state.properties.splice(index, 1, saved);
    form.dataset.currentImages = JSON.stringify(storedImages(saved));
    form.dataset.imageMetadata = JSON.stringify(normalizedImageMetadata(saved.imageMetadata, storedImages(saved).length));
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
  if (listingFormRecordId(form) && form.dataset.mediaDirty !== "true") return { preserveImages: true };
  return images.length
    ? { images, imageMetadata: normalizedImageMetadata(form.dataset.imageMetadata, images.length) }
    : { removeImage: true, imageMetadata: [] };
}

async function listingSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const field = (name) => formField(form, name);
  if (form.dataset.saving === "true") return;
  const submit = form.querySelector('[type="submit"]');
  const id = listingFormRecordId(form);
  const developmentMode = listingFormIsDevelopment(form);
  field("publicationSection").value = developmentMode ? "developments" : "properties";
  const message = $("#listingFormMessage");
  setFormMessage(message, "");
  if (!form.reportValidity()) return;
  const currency = developmentMode ? "USD" : field("currency").value === "MXN" ? "MXN" : "USD";
  const price = developmentMode ? null : field("price").value === "" ? null : Number(field("price").value);
  if (!developmentMode && price === null) {
    setFormMessage(message, t("missingPrice"), true);
    return;
  }
  if (!developmentMode && (!Number.isFinite(price) || price < 0)) {
    setFormMessage(message, "Revisa el precio ingresado.", true);
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
    publicationSection: developmentMode ? "developments" : "properties",
    developmentId: field("developmentId")?.value || "",
    linkedPropertyIds: developmentMode ? selectedDevelopmentPropertyIds(form) : [],
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
    operation: developmentMode ? "sale" : field("operation").value,
    status: field("status").value,
    isPublic: field("isPublic").checked,
    currency,
    price,
    priceUnit: developmentMode ? "total" : field("priceUnit").value === "sqm" ? "sqm" : "total",
    beds: developmentMode ? 0 : Number(field("beds").value || 0),
    baths: developmentMode ? 0 : Number(field("baths").value || 0),
    parking: developmentMode ? 0 : Number(field("parking").value || 0),
    area: developmentMode ? 0 : Number(field("area").value || 0),
    lot: developmentMode ? 0 : Number(field("lot").value || 0),
    mls: developmentMode ? "" : field("mls").value.trim(),
    amenities: developmentMode ? [] : field("amenities").value.trim(),
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
  const entityLabel = developmentMode ? "desarrollo" : "publicación";
  setButtonLoading(submit, true, `Guardando ${entityLabel}...`);
  updateFormProgress(submit, 18, `Preparando ${entityLabel}`, "Validando los datos y conservando el borrador local.");
  setFormMessage(message, `Guardando ${entityLabel}, por favor espera...`);
  const slowTimer = window.setTimeout(() => {
    setFormMessage(message, "El guardado está tardando más de lo normal. No cierres esta ventana.");
  }, 12000);
  let savedSuccessfully = false;
  let savedSection = payload.publicationSection;
  try {
    Object.assign(payload, await getListingImagePayload(form));
    updateFormProgress(submit, 42, "Preparando galería", "Las imágenes nuevas se validarán y protegerán en el servidor.");
    updateFormProgress(submit, 58, "Guardando en la base de datos", "No cierres esta ventana hasta recibir la confirmación.");
    const data = await api(id ? `/api/admin/properties/${encodeURIComponent(id)}` : "/api/admin/properties", {
      method: id ? "PUT" : "POST",
      body: payload,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      timeoutMs: 60000,
    });
    let saved = data.property;
    let videoWarning = "";
    if (field("videoFile")?.files?.length || form.dataset.removeVideo === "true") {
      updateFormProgress(submit, 78, "Guardando video", "El video se almacena por separado para mantener ligero el catálogo.");
      try {
        const videoResult = await persistListingVideo(saved.id, form);
        if (videoResult?.property) saved = videoResult.property;
      } catch (videoError) {
        videoWarning = ` La publicación se guardó, pero el video no pudo actualizarse: ${videoError.message}`;
      }
    }
    updateFormProgress(submit, 92, "Actualizando inventario", "La publicación ya fue guardada; estamos actualizando el panel.");
    savedSection = saved.publicationSection || savedSection;
    const existingIndex = state.properties.findIndex((property) => property.id === saved.id);
    if (existingIndex >= 0) state.properties.splice(existingIndex, 1, saved);
    else state.properties.unshift(saved);
    clearListingDraft();
    resetListingForm(true);
    delete form.dataset.idempotencyKey;
    renderAdminListingFilters();
    renderAdminListings();
    renderProperties();
    const savedMessage = `${developmentMode ? "Desarrollo" : "Publicación"} guardado correctamente · ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}.${videoWarning}`;
    setFormMessage(message, savedMessage);
    showToast(savedMessage);
    savedSuccessfully = true;
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
    if (savedSuccessfully) setAdminSection(savedSection === "developments" ? "developments" : "properties");
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
      body: { title, description, entityType: form.dataset.listingMode === "development" ? "development" : "property", entityId: listingFormRecordId(form) },
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
  const publicationSection = property.publicationSection || (property.type === "Desarrollo" ? "developments" : "properties");
  const editSection = publicationSection === "developments" ? "new-development" : "new-property";
  if (state.adminSection !== editSection) setAdminSection(editSection);
  const form = $("#listingForm");
  const field = (name) => formField(form, name);
  setListingFormRecordId(form, property.id);
  field("title").value = property.titleEs || property.title || "";
  field("titleEn").value = property.titleEnStored ?? property.titleEn ?? "";
  field("publicationSection").value = publicationSection;
  configureListingFormMode(editSection);
  if (publicationSection === "developments") {
    const targetDevelopmentId = developmentRecordId(property);
    setSelectedDevelopmentPropertyIds(
      state.properties
        .filter((candidate) => candidate.publicationSection !== "developments" && candidate.developmentId === targetDevelopmentId)
        .map((candidate) => candidate.id),
      form
    );
    renderDevelopmentPropertyLinker();
  } else {
    setSelectedDevelopmentPropertyIds([], form);
  }
  field("type").value = property.type;
  if (field("developmentId")) field("developmentId").value = property.developmentId || "";
  setLocationFormValues(form, property);
  field("operation").value = property.operation;
  field("status").value = property.status || "active";
  field("isPublic").checked = property.isPublic !== false;
  field("currency").value = property.currency || (property.priceUsd !== null && property.priceUsd !== undefined ? "USD" : "MXN");
  field("price").value = property.price ?? (field("currency").value === "USD" ? property.priceUsd : property.priceMxn) ?? "";
  field("priceUnit").value = property.priceUnit === "sqm" ? "sqm" : "total";
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
  form.dataset.imageMetadata = JSON.stringify(normalizedImageMetadata(property.imageMetadata, storedImages(property).length));
  form.dataset.removeImage = "false";
  form.dataset.mediaDirty = "false";
  form.dataset.contentDirty = "false";
  form.dataset.persistentMediaDirty = "true";
  updateListingImagePreview(storedImages(property));
  clearListingVideoObjectUrl(form);
  field("videoFile").value = "";
  form.dataset.removeVideo = "false";
  form.dataset.existingVideoUrl = property.videoUrl || "";
  renderListingVideoPreview(property.videoUrl ? { url: property.videoUrl, name: "Video publicado", size: property.videoSize } : {});
  setFormMessage($("#listingVideoMessage"), property.videoUrl ? "El video está publicado y aparecerá antes de la galería." : "");
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
  field("descriptionEn").value = property.descriptionEnStored ?? property.descriptionEn ?? "";
  setListingFormRecordId(form, property.id);
  form.dataset.dirty = "false";
  renderListingKeywordChips();
  updateListingDescriptionCounter();
  setListingQualityPreview(property);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteListing(id) {
  const property = state.properties.find((item) => item.id === id);
  const developmentMode = property?.publicationSection === "developments";
  const title = state.lang === "en"
    ? developmentMode ? "Delete development" : "Delete property"
    : developmentMode ? "Eliminar desarrollo" : "Eliminar propiedad";
  if (!(await confirmAction(t("confirmDelete"), title))) return;
  try {
    await api(`/api/admin/properties/${encodeURIComponent(id)}`, { method: "DELETE" });
    const editingCurrent = listingFormRecordId() === id;
    if (editingCurrent) {
      resetListingForm(true);
      setAdminSection(developmentMode ? "developments" : "properties");
    }
    await renderPanel();
    showToast(t("listingDeleted"));
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function updateListingStatus(id, status) {
  try {
    const data = await api(`/api/admin/properties/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status, isPublic: status === "active" },
    });
    const index = state.properties.findIndex((property) => property.id === id);
    if (index >= 0 && data.property) state.properties.splice(index, 1, data.property);
    renderProperties();
    renderAdminListingFilters();
    renderAdminListings();
    renderDevelopmentPropertyLinker();
    showToast(status === "active" ? "Publicación activada y visible en el sitio." : t("listingSaved"));
    void api("/api/admin/stats").then((stats) => {
      state.stats = stats;
      renderStats();
    }).catch(() => null);
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
  const item = requestTable === "seller_request"
    ? state.requests.find((request) => request.id === requestId)
    : requestTable === "guest_sale_request"
      ? state.guestSaleRequests.find((request) => request.id === requestId)
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
  const guestRequest = requestTable === "guest_sale_request";
  const guestCanReceiveEmail = guestRequest && Boolean(String(item.email || "").trim());
  const notifyLabel = form.notifyUser.closest("label");
  form.notifyUser.checked = !guestRequest || guestCanReceiveEmail;
  form.notifyUser.disabled = guestRequest && !guestCanReceiveEmail;
  notifyLabel.hidden = guestRequest && !guestCanReceiveEmail;
  const notifyCopy = notifyLabel.querySelector("span");
  if (notifyCopy) notifyCopy.textContent = guestCanReceiveEmail ? "Enviar aviso por correo al propietario" : "Notificar al propietario";
  $("#responseModalSubtitle").textContent = requestTable === "seller_request"
    ? `${item.sellerName} · ${item.title}`
    : guestRequest
      ? `Venta sin registro · ${item.title}`
      : `${item.name} · ${leadTypeLabel(item.leadType)}`;
  $("#responseRequestContext").innerHTML = requestTable === "seller_request"
      ? `
        <span class="status ${escapeHtml(item.status)}">${escapeHtml(item.status)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p><strong>${escapeHtml(item.sellerName)}</strong><br>${escapeHtml(item.email)}<br>${escapeHtml(item.phone)}</p>
        <p>${escapeHtml(displayLocation(item))}<br>${escapeHtml(item.type)} · ${escapeHtml(item.area)} m² · ${escapeHtml(item.beds)} recámaras</p>
        <p>${escapeHtml(item.description || "")}</p>
      ` : guestRequest
      ? `
        <span class="status ${escapeHtml(item.status)}">${escapeHtml(guestSaleStatusLabel(item.status))}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.location || "")}</p>
        <p><strong>${escapeHtml(item.preferredContact === "whatsapp" ? "WhatsApp" : "Correo")}</strong><br>${escapeHtml(item.email || item.phone || "")}</p>
        <p>${item.email
          ? "Puedes guardar la respuesta y enviarla al correo indicado en la misma acción."
          : "Esta persona eligió WhatsApp. La respuesta quedará en el historial y debe enviarse desde el botón de WhatsApp de la solicitud."}</p>
      ` : `
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
  modal.querySelector(".request-context-panel")?.scrollTo({ top: 0 });
  modal.querySelector(".response-form")?.scrollTo({ top: 0 });
  window.requestAnimationFrame(() => form.message.focus({ preventScroll: true }));
  refreshIcons();
}

function closeResponseModal() {
  $("#responseModal").hidden = true;
  if ($$(".modal-backdrop:not([hidden])").length === 0) document.body.classList.remove("modal-open");
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
    const data = await api("/api/admin/messages", {
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
    showToast(data.delivery?.emailSent
      ? "Respuesta guardada y enviada por correo."
      : data.delivery?.emailStatus === "configuration_required"
        ? "Respuesta guardada y aviso interno creado. Configura el correo para enviar avisos externos."
        : form.requestTable.value === "guest_sale_request"
          ? "Seguimiento guardado. No se afirmó un envío externo; contacta por el medio elegido cuando no exista correo disponible."
          : "Respuesta guardada, notificada en el panel y registrada en el historial.");
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
  void trackAnalyticsEvent("search_submitted", null, { title: text.slice(0, 220) });
  resetFilters();
  $("#searchInput").value = text;
  const status = $("#intelligentSearchStatus");
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  if (status) {
    status.hidden = false;
    status.className = "intelligent-search-status is-loading";
    status.innerHTML = `<i data-lucide="loader-circle"></i><span>Interpretando tu búsqueda y revisando el inventario real…</span>`;
    refreshIcons();
  }
  setButtonLoading(submit, true, "Buscando…");
  try {
    const result = await api("/api/search/intelligent", { method: "POST", body: { query: text }, timeoutMs: 25000, retry: false });
    state.intelligentSearch = {
      active: true,
      ids: (result.properties || []).map((property) => property.id),
      interpreted: result.interpreted || null,
      exactMatch: Boolean(result.exactMatch),
      message: result.message || "",
    };
    if (status) {
      const filterLabels = {
        operation: "Operación",
        propertyType: "Tipo",
        location: "Ubicación",
        minPrice: "Precio mínimo",
        maxPrice: "Precio máximo",
        currency: "Moneda",
        bedrooms: "Recámaras",
        bathrooms: "Baños",
        minArea: "Superficie mínima",
        amenities: "Amenidades",
        features: "Características",
      };
      const interpreted = Object.entries(result.interpreted || {})
        .filter(([key, value]) => key !== "sort" && value !== null && value !== "" && (!Array.isArray(value) || value.length))
        .slice(0, 6)
        .map(([key, value]) => `<span>${escapeHtml(filterLabels[key] || key)}: ${escapeHtml(Array.isArray(value) ? value.map((item) => String(item).replace(/_/g, " ")).join(", ") : value)}</span>`)
        .join("");
      status.className = `intelligent-search-status ${result.exactMatch ? "is-success" : "is-alternative"}`;
      status.innerHTML = `<strong>${escapeHtml(result.message || "")}</strong>${interpreted ? `<div class="intelligent-filter-chips">${interpreted}</div>` : ""}${result.fallback ? `<small>Se utilizó la interpretación local segura.</small>` : ""}`;
    }
  } catch (error) {
    state.filters.text = text;
    state.intelligentSearch = { active: false, ids: [], interpreted: null, exactMatch: true, message: "" };
    if (status) {
      status.className = "intelligent-search-status is-error";
      status.innerHTML = `<strong>No pudimos interpretar tu búsqueda.</strong><span>Aplicamos la búsqueda tradicional para que puedas continuar.</span>`;
    }
    void api("/api/metrics/search", { method: "POST" }).catch(() => null);
  } finally {
    setButtonLoading(submit, false);
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
  state.filters.text = $("#propertyKeywordSearch")?.value.trim() || "";
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
  void trackAnalyticsEvent("property_detail", property);
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
  const imageMetadata = normalizedImageMetadata(property.imageMetadata, galleryImages.length);
  const gallery = galleryImages
    .map(
      (src, index) => `
        <figure class="property-detail-slide">
          <img src="${escapeHtml(src)}" alt="${escapeHtml((state.lang === "en" ? imageMetadata[index].descriptionEn : imageMetadata[index].descriptionEs) || `${localizedTitle(property)} ${index + 1}`)}" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" />
          ${(state.lang === "en" ? imageMetadata[index].descriptionEn : imageMetadata[index].descriptionEs) ? `<figcaption>${escapeHtml(state.lang === "en" ? imageMetadata[index].descriptionEn : imageMetadata[index].descriptionEs)}</figcaption>` : ""}
        </figure>
      `
    )
    .join("");
  const mapsUrl = /^https?:\/\//i.test(String(property.googleMapsUrl || ""))
    ? property.googleMapsUrl
    : property.latitude && property.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.latitude},${property.longitude}`)}`
      : "";

  content.innerHTML = `
    <div class="property-detail-layout">
      ${property.videoUrl ? `<section class="property-detail-video"><span class="eyebrow">${escapeHtml(state.lang === "en" ? "VIDEO TOUR" : "RECORRIDO EN VIDEO")}</span><video controls playsinline preload="metadata" poster="${escapeHtml(primaryImage(property) || fallbackImage)}"><source src="${escapeHtml(property.videoUrl)}" type="${escapeHtml(property.videoMimeType || "video/mp4")}" /></video></section>` : ""}
      <div class="property-detail-image property-detail-gallery">
        <div class="property-detail-track">${gallery}</div>
        ${galleryImages.length > 1 ? `<span class="gallery-count">1 / ${galleryImages.length}</span>` : ""}
      </div>
      <div class="property-detail-copy">
        <p class="property-detail-price">${escapeHtml(formatPriceSummary(property))}</p>
        <h2 id="propertyDetailTitle">${escapeHtml(localizedTitle(property))}</h2>
        <div class="property-detail-meta">${facts}</div>
        ${mapsUrl ? `<a class="property-detail-map-link" href="${escapeHtml(mapsUrl)}" target="_blank" rel="noopener"><i data-lucide="map-pin"></i><span>${escapeHtml(state.lang === "en" ? "Open location in Google Maps" : "Abrir ubicacion en Google Maps")}</span></a>` : ""}
        <div class="property-detail-description">${paragraphs || `<p>${escapeHtml(t("noResults"))}</p>`}</div>
        <div class="property-detail-actions">
          <button class="ghost-button" type="button" data-tour="${escapeHtml(property.id)}"><i data-lucide="calendar-days"></i><span>${escapeHtml(state.lang === "en" ? "Request a tour" : "Solicitar visita")}</span></button>
          <button class="primary-button whatsapp-detail-button" type="button" data-detail-contact="${escapeHtml(property.id)}"><i data-lucide="message-circle"></i><span>${escapeHtml(t("contactWhatsApp"))}</span></button>
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
  void trackAnalyticsEvent("property_contact_clicked", property);
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

function openGeneralWhatsApp(event) {
  event?.preventDefault();
  void trackAnalyticsEvent("whatsapp_clicked");
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
    brand.addEventListener("click", () => {
      closeMobileNav();
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
  $("#propertyKeywordSearch")?.addEventListener("input", (event) => applyKeywordFilter(event.currentTarget.value));
  $("#categoryKeywordSearch")?.addEventListener("input", filterServerRenderedCategory);
  filterServerRenderedCategory();
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

  $("#loginOpen")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (state.session) window.location.assign("/panel");
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
  $("#tourRequestClose")?.addEventListener("click", closeTourRequest);
  $("#tourRequestModal")?.addEventListener("click", (event) => {
    if (event.target.id === "tourRequestModal") closeTourRequest();
  });
  $("#tourRequestForm")?.addEventListener("submit", tourRequestSubmit);
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
  $("#forgotForm")?.addEventListener("submit", forgotPasswordSubmit);
  $("#resetPasswordForm")?.addEventListener("submit", resetPasswordSubmit);

  $$('[data-open-seller-options]').forEach((element) => element.addEventListener("click", openSellerOptions));
  $$('[data-open-guest-sale]').forEach((element) => element.addEventListener("click", (event) => {
    event.preventDefault();
    openGuestSale();
  }));
  $$('[data-open-detailed-sale]').forEach((element) => element.addEventListener("click", (event) => {
    event.preventDefault();
    void openDetailedSale();
  }));
  $$('[data-close-seller-options]').forEach((element) => element.addEventListener("click", closeSellerOptions));
  $("#sellerOptionsModal")?.addEventListener("click", (event) => {
    if (event.target.id === "sellerOptionsModal") closeSellerOptions();
  });
  $$('[data-close-guest-sale]').forEach((element) => element.addEventListener("click", closeGuestSale));
  $("#guestSaleModal")?.addEventListener("click", (event) => {
    if (event.target.id === "guestSaleModal") closeGuestSale();
  });
  $("#continueGuestSale")?.addEventListener("click", continueGuestSale);
  $("#backGuestSale")?.addEventListener("click", () => setGuestSaleStep("property"));
  $("#guestSaleForm")?.addEventListener("submit", guestSaleSubmit);
  $("#guestSaleForm")?.querySelectorAll('[name="preferredContact"]').forEach((input) => input.addEventListener("change", updateGuestContactFields));
  formField($("#guestSaleForm"), "imageFile")?.addEventListener("change", async (event) => {
    const form = event.currentTarget.form;
    try {
      const payload = await readImageFiles(event.currentTarget.files);
      form.dataset.images = JSON.stringify(payload.images);
      renderImagePreview($("#guestSaleImagePreview"), payload.images.map((image) => image.imageDataUrl));
    } catch (error) {
      event.currentTarget.value = "";
      form.dataset.images = "[]";
      renderImagePreview($("#guestSaleImagePreview"), []);
      showToast(error.message, "error");
    }
  });
  $("#clearGuestSaleImages")?.addEventListener("click", () => {
    const form = $("#guestSaleForm");
    formField(form, "imageFile").value = "";
    form.dataset.images = "[]";
    renderImagePreview($("#guestSaleImagePreview"), []);
  });
  $$('[data-seller-section]').forEach((button) => button.addEventListener("click", () => setSellerSection(button.dataset.sellerSection)));
  $$('[data-close-pdf-share]').forEach((element) => element.addEventListener("click", closePdfShareModal));
  $("#pdfShareModal")?.addEventListener("click", (event) => {
    if (event.target.id === "pdfShareModal") closePdfShareModal();
  });
  $("#pdfSharePropertySearch")?.addEventListener("input", (event) => {
    formField($("#pdfShareForm"), "propertyId").value = "";
    renderPdfSharePropertyMatches(event.currentTarget.value);
  });
  $("#pdfSharePropertySearch")?.addEventListener("focus", (event) => renderPdfSharePropertyMatches(event.currentTarget.value));

  if (!$("#panelView")) {
    document.addEventListener("click", (event) => {
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
      if (favorite) void toggleFavorite(favorite.dataset.favorite);
      const compare = event.target.closest("[data-compare]");
      if (compare) toggleCompare(compare.dataset.compare);
      const tour = event.target.closest("[data-tour]");
      if (tour) openTourRequest(tour.dataset.tour);
    });
    $("#whatsappButton")?.addEventListener("click", openGeneralWhatsApp);
    return;
  }

  $("#openAdminGlobalSearch")?.addEventListener("click", () => toggleAdminGlobalSearch(true));
  $("#closeAdminGlobalSearch")?.addEventListener("click", () => toggleAdminGlobalSearch(false));
  $("#adminGlobalSearchInput")?.addEventListener("input", () => {
    window.clearTimeout(adminGlobalSearchTimer);
    adminGlobalSearchTimer = window.setTimeout(() => void runAdminGlobalSearch(), 220);
  });
  $("#adminGlobalSearchResults")?.addEventListener("click", (event) => {
    const result = event.target.closest("[data-global-result-section]");
    if (!result) return;
    toggleAdminGlobalSearch(false);
    setAdminSection(result.dataset.globalResultSection);
    if (result.dataset.globalResultSection === "properties" || result.dataset.globalResultSection === "developments") {
      state.adminListingFilters.search = result.dataset.globalResultId;
      renderAdminListings();
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      toggleAdminGlobalSearch(true);
    }
    if (event.key === "Escape" && !$("#adminGlobalSearch")?.hidden) toggleAdminGlobalSearch(false);
  });
  $("#copilotForm")?.addEventListener("submit", copilotSubmit);
  $("#copilotSuggestions")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copilot-question]");
    if (!button) return;
    const form = $("#copilotForm");
    form.question.value = button.dataset.copilotQuestion;
    form.requestSubmit();
  });
  $("#copilotConversation")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copilot-open-section]");
    if (button) setAdminSection(button.dataset.copilotOpenSection);
    const feedback = event.target.closest("[data-copilot-feedback]");
    if (feedback) void submitCopilotFeedback(feedback.dataset.responseId, feedback.dataset.copilotFeedback, feedback);
  });
  $("#copilotActionForm")?.addEventListener("submit", copilotActionPreviewSubmit);
  $("#confirmCopilotAction")?.addEventListener("click", () => void confirmCopilotAction());
  $("#cancelCopilotAction")?.addEventListener("click", () => void cancelCopilotAction());
  $("#refreshIntelligence")?.addEventListener("click", () => void refreshAdminIntelligence().catch((error) => showToast(error.message, "error")));
  $("#refreshIntegrations")?.addEventListener("click", () => void refreshAdminIntegrations().catch((error) => showToast(error.message, "error")));
  $("#refreshAnalytics")?.addEventListener("click", () => void refreshAdminAnalytics().catch((error) => showToast(error.message, "error")));
  ["#analyticsPeriod", "#analyticsZone"].forEach((selector) => $(selector)?.addEventListener("change", () => void refreshAdminAnalytics().catch((error) => showToast(error.message, "error"))));
  $("#refreshDataQuality")?.addEventListener("click", () => void refreshAdminDataQuality().catch((error) => showToast(error.message, "error")));
  $("#adminIntegrations")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-test-integration]");
    if (button) void testAdminIntegration(button.dataset.testIntegration, button);
  });
  $("#adminIntelligence")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-intelligence-section]");
    if (button) setAdminSection(button.dataset.intelligenceSection);
  });
  $("#adminDataQuality")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quality-property]");
    if (!button) return;
    setAdminSection("properties");
    state.adminListingFilters.search = button.dataset.qualityProperty;
    renderAdminListings();
  });

  $("#backToSite").addEventListener("click", hidePanel);
  $("#logoutButton").addEventListener("click", async () => {
    stopWhatsappPolling();
    await api("/api/auth/logout", { method: "POST" }).catch(() => null);
    state.session = null;
    state.csrfToken = "";
    state.requests = [];
    state.leads = [];
    window.location.replace("/");
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
  $("#savedSearchForm")?.addEventListener("submit", savedSearchSubmit);
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
  $("#analyzeBrochure")?.addEventListener("click", () => void analyzeBrochure());
  $("#applyBrochureFields")?.addEventListener("click", () => void applyBrochureFields());
  $("#rejectBrochureFields")?.addEventListener("click", () => void rejectBrochureFields());
  $("#analyzeListingImages")?.addEventListener("click", () => void analyzeListingImages());
  $("#useRecommendedCover")?.addEventListener("click", useRecommendedCover);
  $("#applySuggestedImageOrder")?.addEventListener("click", applySuggestedImageOrder);
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
  $("#cancelContactEdit")?.addEventListener("click", resetContactForm);
  $("#buyerForm")?.addEventListener("submit", buyerSubmit);
  $("#campaignForm")?.addEventListener("submit", campaignSubmit);
  $("#campaignForm")?.addEventListener("input", renderCampaignEmailPreview);
  $("#campaignForm")?.addEventListener("change", renderCampaignEmailPreview);
  $("#campaignTemplate")?.addEventListener("change", applyCampaignTemplate);
  $$('[name="recipientMode"]').forEach((input) => input.addEventListener("change", renderCampaignRecipientPicker));
  $("#campaignRecipientSearch")?.addEventListener("input", renderCampaignRecipientPicker);
  $("#campaignRecipientList")?.addEventListener("change", (event) => {
    const checkbox = event.target.closest('input[name="recipientEmails"]');
    if (!checkbox) return;
    if (checkbox.checked) state.campaignRecipientEmails.add(checkbox.value);
    else state.campaignRecipientEmails.delete(checkbox.value);
    renderCampaignRecipientPicker();
  });
  $("#selectAllCampaignRecipients")?.addEventListener("click", () => {
    $$('#campaignRecipientList input[name="recipientEmails"]').forEach((checkbox) => state.campaignRecipientEmails.add(checkbox.value));
    renderCampaignRecipientPicker();
  });
  $("#clearCampaignRecipients")?.addEventListener("click", () => {
    state.campaignRecipientEmails = new Set();
    renderCampaignRecipientPicker();
  });
  $("#instagramPostForm")?.addEventListener("submit", instagramPostSubmit);
  $("#copyInstagramPost")?.addEventListener("click", () => void copyInstagramPost());
  $("#marketingCreativeForm")?.addEventListener("submit", marketingCreativeSubmit);
  $("#generateMarketingKit")?.addEventListener("click", () => void generateMarketingKit());
  $("#copyMarketingKit")?.addEventListener("click", () => navigator.clipboard.writeText($("#marketingGeneratedCopy")?.value || "").then(() => showToast("Textos copiados.")));
  $$('[data-marketing-view]').forEach((button) => button.addEventListener("click", () => setMarketingView(button.dataset.marketingView)));
  $("#blogForm")?.addEventListener("submit", blogSubmit);
  formField($("#blogForm"), "coverFile")?.addEventListener("change", () => {
    const post = state.blogPosts.find((item) => item.id === formField($("#blogForm"), "id")?.value) || null;
    renderBlogMediaPreviews(post);
  });
  formField($("#blogForm"), "contentFiles")?.addEventListener("change", (event) => {
    const selected = Array.from(event.currentTarget.files || []);
    state.blogContentImageFiles = selected.slice(0, 8);
    if (selected.length > 8) showToast("Solo se utilizarán las primeras 8 imágenes internas.");
    formField($("#blogForm"), "clearContentImages").checked = false;
    renderBlogMediaPreviews();
  });
  $("#blogContentImagePreview")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-blog-image]");
    if (!button) return;
    state.blogContentImageFiles.splice(Number(button.dataset.removeBlogImage), 1);
    renderBlogMediaPreviews();
  });
  formField($("#blogForm"), "clearContentImages")?.addEventListener("change", (event) => {
    if (!event.currentTarget.checked) return;
    state.blogContentImageFiles = [];
    formField($("#blogForm"), "contentFiles").value = "";
    renderBlogMediaPreviews();
  });
  $("#translateBlogPost")?.addEventListener("click", () => void translateBlogPost());
  $("#resetBlogForm")?.addEventListener("click", resetBlogForm);
  $("#blogAdminSearch")?.addEventListener("input", renderAdminBlogPosts);
  $("#aiToolForm")?.addEventListener("submit", aiToolSubmit);
  $$('[data-ai-category]').forEach((button) => button.addEventListener("click", () => setAiToolCategory(button.dataset.aiCategory)));
  $$('[data-ai-tool]').forEach((button) => button.addEventListener("click", () => selectAiTool(button)));
  $("#pdfForm")?.addEventListener("submit", pdfSubmit);
  $("#mediaUploadForm")?.addEventListener("submit", mediaUploadSubmit);
  $("#scopedMediaUploadForm")?.addEventListener("submit", scopedMediaUploadSubmit);
  $("#scopedFolderForm")?.addEventListener("submit", scopedFolderSubmit);
  $("#internalUserForm")?.addEventListener("submit", internalUserSubmit);
  $("#settingsForm")?.addEventListener("submit", settingsSubmit);
  $("#refreshSystemHealth")?.addEventListener("click", (event) => void refreshSystemHealth(event.currentTarget));
  $("#whatsappChatbotForm")?.addEventListener("submit", whatsappChatbotSubmit);
  $("#whatsappMessageForm")?.addEventListener("submit", whatsappMessageSubmit);
  $("#refreshWhatsapp")?.addEventListener("click", () => void refreshWhatsappData({ includeLists: true }));
  $("#connectWhatsapp")?.addEventListener("click", () => void connectWhatsapp(true));
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
  $("#guestContactSearch")?.addEventListener("input", renderAdminGuestContacts);
  $("#mediaSearch")?.addEventListener("input", renderMediaLibrary);
  $("#mediaTypeFilter")?.addEventListener("change", renderMediaLibrary);
  $("#scopedMediaSearch")?.addEventListener("input", renderScopedMediaLibrary);
  $("#scopedMediaTypeFilter")?.addEventListener("change", renderScopedMediaLibrary);
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
  $("#deleteListingFromForm")?.addEventListener("click", (event) => {
    const id = event.currentTarget.dataset.deleteListing;
    if (id) void deleteListing(id);
  });
  $("#saveListingImages")?.addEventListener("click", saveListingImagesOnly);
  $("#clearListingImage").addEventListener("click", () => {
    const form = $("#listingForm");
    formField(form, "imageFile").value = "";
    setListingImages([]);
    setFormMessage($("#listingFormMessage"), t("imageRemoved"));
  });
  $("#developmentPropertySearch")?.addEventListener("input", renderDevelopmentPropertyLinker);
  $("#developmentPropertyResults")?.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-link-development-property]");
    if (!checkbox) return;
    const selected = new Set(selectedDevelopmentPropertyIds());
    if (checkbox.checked) selected.add(checkbox.dataset.linkDevelopmentProperty);
    else selected.delete(checkbox.dataset.linkDevelopmentProperty);
    setSelectedDevelopmentPropertyIds([...selected]);
    renderDevelopmentPropertyLinker();
    saveListingDraft();
  });
  $("#developmentLinkedSelection")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-unlink-development-property]");
    if (!button) return;
    setSelectedDevelopmentPropertyIds(selectedDevelopmentPropertyIds().filter((id) => id !== button.dataset.unlinkDevelopmentProperty));
    renderDevelopmentPropertyLinker();
    saveListingDraft();
  });
  formField($("#listingForm"), "videoFile")?.addEventListener("change", (event) => {
    const form = $("#listingForm");
    const file = event.currentTarget.files?.[0];
    clearListingVideoObjectUrl(form);
    if (!file) {
      renderListingVideoPreview(form.dataset.existingVideoUrl ? { url: form.dataset.existingVideoUrl, name: "Video publicado" } : {});
      return;
    }
    if (!["video/mp4", "video/webm"].includes(file.type) || file.size <= 0 || file.size > VIDEO_MAX_BYTES) {
      event.currentTarget.value = "";
      renderListingVideoPreview(form.dataset.existingVideoUrl ? { url: form.dataset.existingVideoUrl, name: "Video publicado" } : {});
      setFormMessage($("#listingVideoMessage"), "El video debe ser MP4 o WEBM y no superar 45 MB.", true);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    form.dataset.videoObjectUrl = objectUrl;
    form.dataset.removeVideo = "false";
    renderListingVideoPreview({ url: objectUrl, name: file.name, size: file.size });
    setFormMessage($("#listingVideoMessage"), "Video listo. Se guardará cuando confirmes la publicación.");
  });
  $("#removeListingVideo")?.addEventListener("click", () => {
    const form = $("#listingForm");
    clearListingVideoObjectUrl(form);
    formField(form, "videoFile").value = "";
    form.dataset.removeVideo = "true";
    renderListingVideoPreview();
    setFormMessage($("#listingVideoMessage"), "El video se eliminará cuando guardes los cambios.");
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
      const form = $("#listingForm");
      const images = safeParseImages(form.dataset.currentImages);
      const metadata = normalizedImageMetadata(form.dataset.imageMetadata, images.length);
      images.splice(Number(remove.dataset.removeListingImage), 1);
      metadata.splice(Number(remove.dataset.removeListingImage), 1);
      setListingImages(images, metadata);
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
        listingForm: "new-property",
      };
      if (sectionMap[button.dataset.adminJump]) {
        setAdminSection(sectionMap[button.dataset.adminJump]);
      }
      const target = document.getElementById(button.dataset.adminJump);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $$("[data-admin-section]").forEach((button) => {
    button.addEventListener("click", () => {
      const subnav = button.nextElementSibling?.matches(".admin-sidebar-subnav") ? button.nextElementSibling : null;
      if (subnav) {
        const isOpen = subnav.classList.contains("is-open");
        subnav.dataset.userCollapsed = state.adminSection === button.dataset.adminSection && isOpen ? "true" : "false";
      }
      setAdminSection(button.dataset.adminSection);
    });
  });
  $("#listingImagePreview")?.addEventListener("input", (event) => {
    const input = event.target.closest("[data-image-description]");
    if (!input) return;
    const form = $("#listingForm");
    const images = safeParseImages(form.dataset.currentImages);
    const metadata = normalizedImageMetadata(form.dataset.imageMetadata, images.length);
    const item = metadata[Number(input.dataset.imageIndex)];
    if (!item) return;
    if (input.dataset.imageDescription === "en") item.descriptionEn = input.value.slice(0, 500);
    else item.descriptionEs = input.value.slice(0, 500);
    form.dataset.imageMetadata = JSON.stringify(metadata);
    form.dataset.mediaDirty = "true";
    form.dataset.persistentMediaDirty = "true";
    const saveButton = $("#saveListingImages");
    if (saveButton) saveButton.hidden = !listingFormRecordId(form);
    saveListingDraft();
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
    const tourStatus = event.target.closest("[data-admin-tour-status]");
    if (tourStatus) void updateAdminTourStatus(tourStatus.dataset.adminTourStatus, tourStatus.value);
    const moveLibraryFile = event.target.closest("[data-move-library-file]");
    if (moveLibraryFile) void moveScopedFile(moveLibraryFile.dataset.moveLibraryFile, moveLibraryFile.value);
  });

  document.addEventListener("click", (event) => {
    const libraryFolder = event.target.closest("[data-library-folder]");
    if (libraryFolder) selectScopedFolder(libraryFolder.dataset.libraryFolder);

    const renameMediaFolder = event.target.closest("[data-rename-media-folder]");
    if (renameMediaFolder) void renameScopedFolder(renameMediaFolder.dataset.renameMediaFolder);

    const deleteMediaFolder = event.target.closest("[data-delete-media-folder]");
    if (deleteMediaFolder) void deleteScopedFolder(deleteMediaFolder.dataset.deleteMediaFolder);

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
    if (favorite) void toggleFavorite(favorite.dataset.favorite);

    const compare = event.target.closest("[data-compare]");
    if (compare) toggleCompare(compare.dataset.compare);

    const tour = event.target.closest("[data-tour]");
    if (tour) openTourRequest(tour.dataset.tour);

    const runSearch = event.target.closest("[data-run-saved-search]");
    if (runSearch) void runSavedSearch(runSearch.dataset.runSavedSearch);

    const toggleAlert = event.target.closest("[data-toggle-saved-alert]");
    if (toggleAlert) void toggleSavedSearchAlert(toggleAlert.dataset.toggleSavedAlert, toggleAlert.dataset.alertValue === "true");

    const renameSaved = event.target.closest("[data-rename-saved-search]");
    if (renameSaved) void renameSavedSearch(renameSaved.dataset.renameSavedSearch);

    const toggleChannel = event.target.closest("[data-toggle-saved-channel]");
    if (toggleChannel) void toggleSavedSearchChannel(toggleChannel.dataset.savedSearchId, toggleChannel.dataset.toggleSavedChannel, toggleChannel.dataset.channelValue === "true");

    const deleteSearch = event.target.closest("[data-delete-saved-search]");
    if (deleteSearch) void deleteSavedSearch(deleteSearch.dataset.deleteSavedSearch);

    const approve = event.target.closest("[data-approve]");
    if (approve) void approveRequest(approve.dataset.approve);

    const reject = event.target.closest("[data-reject]");
    if (reject) void rejectRequest(reject.dataset.reject);

    const edit = event.target.closest("[data-edit-listing]");
    if (edit) editListing(edit.dataset.editListing);

    const reviewQuality = event.target.closest("[data-review-property-quality]");
    if (reviewQuality) void reviewPropertyQuality(reviewQuality.dataset.reviewPropertyQuality);

    const verifyProperty = event.target.closest("[data-verify-property]");
    if (verifyProperty) void verifyPropertyFreshness(verifyProperty.dataset.verifyProperty);

    const propertyHistory = event.target.closest("[data-property-history]");
    if (propertyHistory) void showPropertyHistory(propertyHistory.dataset.propertyHistory);

    if (event.target.closest("[data-close-quality-review]") || event.target.id === "propertyQualityModal") closePropertyQualityModal();

    const editContactButton = event.target.closest("[data-edit-contact]");
    if (editContactButton) editContact(editContactButton.dataset.editContact);

    const contactIntelligenceButton = event.target.closest("[data-contact-intelligence]");
    if (contactIntelligenceButton) void openContactIntelligence(contactIntelligenceButton.dataset.contactIntelligence);

    if (event.target.closest("[data-close-contact-intelligence]") || event.target.id === "contactIntelligenceModal") closeContactIntelligenceModal();

    const deleteContactButton = event.target.closest("[data-delete-contact]");
    if (deleteContactButton) void deleteContact(deleteContactButton.dataset.deleteContact);

    const editBlogButton = event.target.closest("[data-edit-blog]");
    if (editBlogButton) editBlogPost(editBlogButton.dataset.editBlog);

    const deleteBlogButton = event.target.closest("[data-delete-blog]");
    if (deleteBlogButton) void deleteBlogPost(deleteBlogButton.dataset.deleteBlog);

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

    const respondGuest = event.target.closest("[data-respond-guest]");
    if (respondGuest) void respondToRequest("guest_sale_request", respondGuest.dataset.respondGuest);

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

    const openPdfShareButton = event.target.closest("[data-open-pdf-share]");
    if (openPdfShareButton) openPdfShareModal(openPdfShareButton);

    const selectPdfShareButton = event.target.closest("[data-select-pdf-share-property]");
    if (selectPdfShareButton) selectPdfShareProperty(selectPdfShareButton.dataset.selectPdfShareProperty);

    const pdfShareChannel = event.target.closest("[data-pdf-share-channel]");
    if (pdfShareChannel) void sharePdfThroughChannel(pdfShareChannel.dataset.pdfShareChannel, pdfShareChannel);

    const guestRequestStatus = event.target.closest("[data-guest-request-status]");
    if (guestRequestStatus) void updateGuestSaleRequestStatus(guestRequestStatus.dataset.guestRequestStatus, guestRequestStatus.dataset.statusValue, guestRequestStatus);

    const approveGuestRequest = event.target.closest("[data-approve-guest-request]");
    if (approveGuestRequest) void approveGuestSaleRequest(approveGuestRequest.dataset.approveGuestRequest, approveGuestRequest);

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
    if (adminSectionLink) {
      const subnav = adminSectionLink.closest(".admin-sidebar-subnav");
      if (subnav) subnav.dataset.userCollapsed = "false";
      setAdminSection(adminSectionLink.dataset.adminSectionLink);
    }

    const composeEmailButton = event.target.closest("[data-compose-email]");
    if (composeEmailButton) openEmailComposer(composeEmailButton);

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

  $("#whatsappButton")?.addEventListener("click", openGeneralWhatsApp);
}

function initializeMortgageCalculator() {
  const form = $("#mortgageCalculatorForm");
  const output = $("#mortgageResults");
  const tableOutput = $("#mortgageAmortization");
  if (!form || !output) return;
  const calculate = () => {
    const price = Math.max(0, Number(form.price.value || 0));
    const downPercent = Math.min(95, Math.max(0, Number(form.downPayment.value || 0)));
    const annualRate = Math.max(0, Number(form.annualRate.value || 0)) / 100;
    const years = Math.max(1, Number(form.years.value || 1));
    const notaryPercent = Math.max(0, Number(form.notaryPercent?.value || 0));
    const commissionPercent = Math.max(0, Number(form.commissionPercent?.value || 0));
    const annualInsurance = Math.max(0, Number(form.annualInsurance?.value || 0));
    const closingCosts = Math.max(0, Number(form.closingCosts?.value || 0));
    const downAmount = price * (downPercent / 100);
    const principal = price - downAmount;
    const months = years * 12;
    const monthlyRate = annualRate / 12;
    const payment = monthlyRate
      ? principal * (monthlyRate * (1 + monthlyRate) ** months) / ((1 + monthlyRate) ** months - 1)
      : principal / months;
    const insuranceMonthly = annualInsurance / 12;
    const total = payment * months;
    const notaryCosts = price * (notaryPercent / 100);
    const commission = principal * (commissionPercent / 100);
    const initialOutlay = downAmount + notaryCosts + commission + closingCosts;
    const format = (value) => `${form.currency.value} $${new Intl.NumberFormat(state.lang === "en" ? "en-US" : "es-MX", { maximumFractionDigits: 0 }).format(value)}`;
    output.innerHTML = `
      <article><span>${state.lang === "en" ? "Down payment" : "Enganche"}</span><strong>${escapeHtml(format(downAmount))}</strong></article>
      <article><span>${state.lang === "en" ? "Notary costs and taxes" : "Gastos notariales e impuestos"}</span><strong>${escapeHtml(format(notaryCosts))}</strong></article>
      <article><span>${state.lang === "en" ? "Origination commission" : "Comisión de apertura"}</span><strong>${escapeHtml(format(commission))}</strong></article>
      <article><span>${state.lang === "en" ? "Estimated initial outlay" : "Desembolso inicial estimado"}</span><strong>${escapeHtml(format(initialOutlay))}</strong></article>
      <article><span>${state.lang === "en" ? "Financed amount" : "Monto financiado"}</span><strong>${escapeHtml(format(principal))}</strong></article>
      <article><span>${state.lang === "en" ? "Mortgage monthly payment" : "Mensualidad hipotecaria"}</span><strong>${escapeHtml(format(payment))}</strong></article>
      <article><span>${state.lang === "en" ? "Monthly payment with insurance" : "Mensualidad con seguros"}</span><strong>${escapeHtml(format(payment + insuranceMonthly))}</strong></article>
      <article><span>${state.lang === "en" ? "Estimated interest" : "Intereses estimados"}</span><strong>${escapeHtml(format(Math.max(0, total - principal)))}</strong></article>
    `;
    if (!tableOutput) return;
    let balance = principal;
    const rows = [];
    for (let year = 1; year <= years; year += 1) {
      let annualPrincipal = 0;
      let annualInterest = 0;
      for (let month = 0; month < 12 && balance > 0.01; month += 1) {
        const interest = monthlyRate ? balance * monthlyRate : 0;
        const principalPayment = Math.min(balance, Math.max(0, payment - interest));
        annualInterest += interest;
        annualPrincipal += principalPayment;
        balance = Math.max(0, balance - principalPayment);
      }
      rows.push(`<tr><th scope="row"><span>${state.lang === "en" ? "Year" : "Año"}</span>${year}</th><td data-label="${state.lang === "en" ? "Principal" : "Capital"}">${escapeHtml(format(annualPrincipal))}</td><td data-label="${state.lang === "en" ? "Interest" : "Interés"}">${escapeHtml(format(annualInterest))}</td><td data-label="${state.lang === "en" ? "Balance" : "Saldo"}">${escapeHtml(format(balance))}</td></tr>`);
    }
    tableOutput.innerHTML = `<div class="mortgage-amortization-heading">
        <div><span class="seo-eyebrow">${state.lang === "en" ? "PAYMENT PROJECTION" : "PROYECCIÓN DE PAGOS"}</span><h3>${state.lang === "en" ? "Annual amortization" : "Amortización anual"}</h3><p>${state.lang === "en" ? "See how principal, interest and the outstanding balance change each year." : "Consulta cómo cambian el capital, los intereses y el saldo pendiente cada año."}</p></div>
        <dl class="mortgage-table-summary"><div><dt>${state.lang === "en" ? "Term" : "Plazo"}</dt><dd>${years} ${state.lang === "en" ? "years" : "años"}</dd></div><div><dt>${state.lang === "en" ? "Financed" : "Financiado"}</dt><dd>${escapeHtml(format(principal))}</dd></div><div><dt>${state.lang === "en" ? "Annual rate" : "Tasa anual"}</dt><dd>${escapeHtml(`${(annualRate * 100).toFixed(2)}%`)}</dd></div></dl>
      </div>
      <div class="mortgage-table-wrap"><table class="mortgage-table"><thead><tr><th>${state.lang === "en" ? "Year" : "Año"}</th><th>${state.lang === "en" ? "Principal paid" : "Capital pagado"}</th><th>${state.lang === "en" ? "Interest paid" : "Interés pagado"}</th><th>${state.lang === "en" ? "Remaining balance" : "Saldo restante"}</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>
      <p class="mortgage-disclaimer">${state.lang === "en" ? "Reference estimate only. Rates, taxes, insurance and fees vary by institution, property and transaction." : "Estimación exclusivamente referencial. Las tasas, impuestos, seguros y comisiones varían según institución, inmueble y operación."}</p>`;
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });
  form.addEventListener("input", calculate);
  calculate();
}

async function loadPublicBlog() {
  const list = $("#publicBlogList");
  if (!list) return;
  try {
    const data = await api(`/api/blog?lang=${encodeURIComponent(state.lang)}`);
    list.innerHTML = data.posts?.length
      ? data.posts.map((post) => {
          const title = state.lang === "en" ? post.titleEn : post.titleEs;
          const excerpt = state.lang === "en" ? post.excerptEn : post.excerptEs;
          const href = `${state.lang === "en" ? "/en/blog" : "/blog"}/${encodeURIComponent(post.slug)}`;
          return `<article class="public-blog-card">${post.coverImage ? `<a href="${href}"><img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(title)}" loading="lazy" /></a>` : ""}<div><span class="seo-eyebrow">${escapeHtml(formatDate(post.publishedAt || post.updatedAt))}</span><h2><a href="${href}">${escapeHtml(title)}</a></h2><p>${escapeHtml(excerpt || "")}</p><a class="text-link" href="${href}">${state.lang === "en" ? "Read article" : "Leer artículo"}</a></div></article>`;
        }).join("")
      : `<p class="empty-state">${state.lang === "en" ? "No articles have been published yet." : "Aún no hay artículos publicados."}</p>`;
  } catch (error) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

async function loadPublicBuyerRequirements() {
  const list = $("#buyerRequirementsPublic");
  if (!list) return;
  try {
    const data = await api("/api/public/buyer-requirements");
    list.innerHTML = data.requirements?.length
      ? data.requirements.map((requirement) => `<article class="buyer-requirement-card"><span class="status">${escapeHtml(requirement.urgency || "active")}</span><h2>${escapeHtml((requirement.propertyTypes || []).join(", ") || (state.lang === "en" ? "Property" : "Propiedad"))}</h2><p>${escapeHtml((requirement.preferredZones || []).join(", ") || "Cancún")}</p><dl><dt>${state.lang === "en" ? "Budget" : "Presupuesto"}</dt><dd>${escapeHtml([requirement.budgetMin, requirement.budgetMax].filter(Boolean).map((value) => `USD $${Number(value).toLocaleString()}`).join(" - ") || (state.lang === "en" ? "To be defined" : "Por definir"))}</dd><dt>${state.lang === "en" ? "Operation" : "Operación"}</dt><dd>${escapeHtml(requirement.operation || "sale")}</dd></dl><a class="primary-button" href="${state.lang === "en" ? "/en/sell-property-cancun" : "/vender-casa-cancun"}">${state.lang === "en" ? "I have a compatible property" : "Tengo una propiedad compatible"}</a></article>`).join("")
      : `<p class="empty-state">${state.lang === "en" ? "No public requirements are available right now." : "No hay búsquedas públicas activas en este momento."}</p>`;
  } catch (error) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
  }
}

async function init() {
  const renderedLanguage = document.body.dataset.lang || (window.location.pathname.startsWith("/en") ? "en" : "es");
  if (document.body.dataset.page !== "panel" && storedLanguage && storedLanguage !== renderedLanguage && document.body.dataset.alternateUrl) {
    const alternateUrl = new URL(document.body.dataset.alternateUrl, window.location.origin);
    alternateUrl.search = window.location.search;
    alternateUrl.hash = window.location.hash;
    window.location.replace(`${alternateUrl.pathname}${alternateUrl.search}${alternateUrl.hash}`);
    return;
  }
  installImageFallbacks();
  installPasswordVisibilityToggles();
  initializePasswordStrengthMeters();
  preparePersonalDataForms();
  initializeCookiePreferences();
  bindEvents();
  applyTranslations({ renderPanelContent: false });
  initializePropertyGallery();
  updateNetworkStatus(navigator.onLine);
  try {
    await loadPublicData();
  } catch (error) {
    console.error(error);
    showToast(t("apiError"), "error");
  }
  const authParams = new URLSearchParams(window.location.search);
  const requestedAuthTab = authParams.get("auth");
  const verificationToken = authParams.get("verifyToken");
  const resetToken = authParams.get("resetToken");
  if (verificationToken) {
    try {
      await api(`/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`);
      window.history.replaceState({}, "", window.location.pathname);
      openAuth("login");
      setFormMessage($("#loginMessage"), state.lang === "en" ? "Email confirmed. You can now sign in." : "Correo confirmado. Ya puedes iniciar sesión.");
    } catch (error) {
      openAuth("login");
      setFormMessage($("#loginMessage"), error.message, true);
    }
  } else if (resetToken) {
    $("#resetPasswordForm").token.value = resetToken;
    openAuth("resetPassword");
  } else if (requestedAuthTab === "login" || requestedAuthTab === "register") {
    openAuth(requestedAuthTab);
    window.history.replaceState({}, "", window.location.pathname);
  }
  applyTranslations({ renderPanelContent: document.body.dataset.page !== "panel" });
  if (document.body.dataset.page === "panel") {
    if (!state.session) {
      window.location.replace("/");
      return;
    }
    await showPanel();
  }
  initializeMortgageCalculator();
  void loadPublicBlog();
  void loadPublicBuyerRequirements();
  updateHeaderVisibility();
  void initializeGoogleAuth().catch(() => null);
}

init();
