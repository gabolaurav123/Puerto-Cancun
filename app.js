const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
const IMAGE_MAX_COUNT = 8;
const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const WHATSAPP_NUMBER = "5219982166563";
const LOCATION_FIELD_ORDER = ["state", "city", "zone", "neighborhood"];

const keys = {
  lang: "pcc.lang",
  currency: "pcc.currency",
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
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>',
  "map-pin": '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
  map: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" x2="9" y1="3" y2="18"></line><line x1="15" x2="15" y1="6" y2="21"></line>',
  menu: '<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>',
  "message-circle":
    '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"></path>',
  plus: '<path d="M5 12h14"></path><path d="M12 5v14"></path>',
  search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>',
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
    teamTitle: "Conoce al equipo de Puerto Cancún Center",
    teamRoleSales: "Asesor inmobiliario senior",
    teamRoleListings: "Coordinadora de propiedades",
    teamRoleInvestment: "Consultor de inversión",
    sellTitle: "Quieres vender una propiedad?",
    sellCopy:
      "Crea una cuenta, envía tu solicitud y el equipo administrativo revisará la información antes de publicar.",
    startSellerRequest: "Iniciar solicitud",
    footerCommunities: "Comunidades",
    footerBuy: "Compra de propiedad",
    footerSell: "Asesoría de venta",
    footerAbout: "Nosotros",
    saleProperty: "Venta de propiedad",
    aboutPuerto: "Sobre Puerto Cancún Center",
    location: "Ubicación",
    legalCopy:
      "Los precios de los inmuebles se expresan en Pesos Mexicanos (MXN), moneda oficial para operaciones inmobiliarias en México. Los precios en Dólares de Estados Unidos (USD) se presentan como referencia.",
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
    propertyType: "Tipo de propiedad",
    zone: "Zona",
    stateField: "Estado",
    cityField: "Ciudad / municipio",
    neighborhoodField: "Colonia / desarrollo",
    price: "Precio",
    currency: "Moneda",
    address: "Dirección",
    mapPickerTitle: "Ubicacion en mapa",
    mapPickerCopy: "Selecciona o confirma la ubicacion aproximada del inmueble.",
    mapPickerHelp:
      "Si no ves el mapa interactivo, escribe la direccion o pega coordenadas; al guardar quedaran vinculadas a la propiedad.",
    useCurrentLocation: "Usar mi ubicacion",
    openGoogleMaps: "Abrir Google Maps",
    latitudeField: "Latitud",
    longitudeField: "Longitud",
    locationDetected: "Ubicacion detectada. Revisa el mapa antes de guardar.",
    locationUnavailable: "No se pudo obtener tu ubicacion. Puedes escribir las coordenadas manualmente.",
    bedrooms: "Recámaras",
    bathrooms: "Baños",
    area: "M2 construcción",
    description: "Descripción",
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
    imageHelp: "JPG, PNG o WEBP. Maximo 8 imagenes de 1.5 MB cada una.",
    currentImage: "Imagen actual",
    selectedImage: "Imagenes seleccionadas",
    removeImage: "Quitar imagenes",
    imageRemoved: "Imagenes quitadas. Puedes seleccionar otras antes de guardar.",
    imageTooLarge: "La imagen no debe superar 1.5 MB.",
    tooManyImages: "Solo puedes cargar hasta 8 imagenes por publicacion.",
    invalidImageType: "La imagen debe ser JPG, JPEG, PNG o WEBP.",
    missingPrice: "Agrega al menos un precio: USD o MXN.",
    markFeatured: "Marcar como destacada",
    saveListing: "Guardar publicación",
    newListing: "Nueva publicación",
    authTitle: "Acceso Puerto Cancún Center",
    createAccount: "Crear cuenta",
    emailOrUser: "Correo o usuario",
    password: "Contraseña",
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
    adminPromptLibraryTitle: "Herramientas IA internas para publicaciones y asesorías",
    adminPromptLibraryCopy:
      "Usa estos textos como apoyo interno para valorar, redactar y revisar propiedades antes de publicar. No son una sección pública.",
    adminPromptsEmpty: "No hay herramientas internas configuradas.",
    adminScrollableHint: "Desplaza dentro de esta lista para ver más.",
    adminListingsHint: "Edita, revisa y elimina publicaciones existentes.",
    adminInsightPending: "Pendientes por revisar",
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
    catalogState: "Estado",
    catalogCity: "Ciudad / municipio",
    catalogZone: "Zona",
    catalogNeighborhood: "Colonia / desarrollo",
    saveCatalog: "Guardar catálogo",
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
    accountExists: "Ya existe una cuenta con ese correo.",
    accountCreated: "Cuenta creada. Bienvenido al panel de vendedor.",
    listingSaved: "Publicación guardada.",
    listingDeleted: "Publicación eliminada.",
    requestApproved: "Solicitud aprobada y publicada.",
    requestRejected: "Solicitud rechazada.",
    whatsAppPending: "Abrir WhatsApp",
    statProperties: "Publicaciones",
    statRequests: "Solicitudes pendientes",
    statUsers: "Cuentas vendedor",
    statVisits: "Visitas demo",
    edit: "Editar",
    delete: "Borrar",
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
    confirmDelete: "Eliminar esta publicación?",
    apiError: "No se pudo conectar con la base de datos. Revisa DATABASE_URL y el servidor.",
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
    teamRoleSales: "Senior real estate advisor",
    teamRoleListings: "Property coordinator",
    teamRoleInvestment: "Investment consultant",
    sellTitle: "Want to sell a property?",
    sellCopy: "Create an account, submit your request, and the admin team will review it before publishing.",
    startSellerRequest: "Start request",
    footerCommunities: "Communities",
    footerBuy: "Property purchase",
    footerSell: "Seller advisory",
    footerAbout: "About",
    saleProperty: "Property sale",
    aboutPuerto: "About Puerto Cancun Center",
    location: "Location",
    legalCopy:
      "Property prices are expressed in Mexican Pesos (MXN), the official currency for real estate operations in Mexico. Prices in United States Dollars (USD) are shown as a reference.",
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
    propertyType: "Property type",
    zone: "Area",
    stateField: "State",
    cityField: "City / municipality",
    neighborhoodField: "Neighborhood / development",
    price: "Price",
    currency: "Currency",
    address: "Address",
    mapPickerTitle: "Map location",
    mapPickerCopy: "Select or confirm the approximate property location.",
    mapPickerHelp: "If the interactive map is unavailable, type the address or paste coordinates; they will be saved with the property.",
    useCurrentLocation: "Use my location",
    openGoogleMaps: "Open Google Maps",
    latitudeField: "Latitude",
    longitudeField: "Longitude",
    locationDetected: "Location detected. Review the map before saving.",
    locationUnavailable: "Could not get your location. You can enter coordinates manually.",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    area: "Built m2",
    description: "Description",
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
    imageHelp: "JPG, PNG or WEBP. Up to 8 images, 1.5 MB each.",
    currentImage: "Current image",
    selectedImage: "Selected images",
    removeImage: "Remove images",
    imageRemoved: "Images removed. You can select others before saving.",
    imageTooLarge: "Image must not exceed 1.5 MB.",
    tooManyImages: "You can upload up to 8 images per listing.",
    invalidImageType: "Image must be JPG, JPEG, PNG, or WEBP.",
    missingPrice: "Add at least one price: USD or MXN.",
    markFeatured: "Mark as featured",
    saveListing: "Save listing",
    newListing: "New listing",
    authTitle: "Puerto Cancun Center access",
    createAccount: "Create account",
    emailOrUser: "Email or user",
    password: "Password",
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
    adminPromptLibraryTitle: "Internal AI tools for listings and advisory",
    adminPromptLibraryCopy:
      "Use these texts as internal support to value, write, and review properties before publishing. This is not a public section.",
    adminPromptsEmpty: "No internal tools configured.",
    adminScrollableHint: "Scroll inside this list to see more.",
    adminListingsHint: "Edit, review, and delete existing listings.",
    adminInsightPending: "Pending review",
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
    catalogState: "State",
    catalogCity: "City / municipality",
    catalogZone: "Area",
    catalogNeighborhood: "Neighborhood / development",
    saveCatalog: "Save catalog",
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
    accountExists: "An account already exists with that email.",
    accountCreated: "Account created. Welcome to the seller panel.",
    listingSaved: "Listing saved.",
    listingDeleted: "Listing deleted.",
    requestApproved: "Request approved and published.",
    requestRejected: "Request rejected.",
    whatsAppPending: "Open WhatsApp",
    statProperties: "Listings",
    statRequests: "Pending requests",
    statUsers: "Seller accounts",
    statVisits: "Demo visits",
    edit: "Edit",
    delete: "Delete",
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
    confirmDelete: "Delete this listing?",
    apiError: "Could not connect to the database. Check DATABASE_URL and the server.",
  },
};

const state = {
  lang: localStorage.getItem(keys.lang) || "es",
  currency: localStorage.getItem(keys.currency) || "USD",
  session: null,
  properties: [],
  requests: [],
  adminPrompts: [],
  locationOptions: [],
  config: { googleClientId: "", googleMapsApiKey: "" },
  googleReady: false,
  stats: { properties: 0, pendingRequests: 0, users: 0, visits: 0, searches: 0 },
  filters: {
    text: "",
    type: "",
    zone: "",
    operation: "",
    featured: false,
  },
  detailPropertyId: null,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const googleMapInstances = new WeakMap();
let lastScrollY = 0;

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
  if (form && parentField && form.elements[parentField]?.value) {
    const parentValue = form.elements[parentField].value;
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
    LOCATION_FIELD_ORDER.forEach((name) => fillLocationSelect(form.elements[name]));
  });
  $$("[data-location-select]")
    .filter((select) => !select.form)
    .forEach((select) => fillLocationSelect(select));
}

function setLocationFormValues(form, source = {}) {
  LOCATION_FIELD_ORDER.forEach((name) => {
    const select = form.elements[name];
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
    fillLocationSelect(form.elements[name], "", { preserveUnknown: false });
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
  const latitude = form.elements.latitude?.value;
  const longitude = form.elements.longitude?.value;
  if (latitude && longitude) return `${latitude},${longitude}`;
  const parts = [
    form.elements.address?.value,
    form.elements.neighborhood?.value,
    form.elements.zone?.value,
    form.elements.city?.value,
    form.elements.state?.value,
  ].filter(Boolean);
  return parts.join(", ") || "Cancun, Quintana Roo";
}

function updateMapPicker(picker) {
  if (!picker) return;
  const form = picker.closest("form");
  const query = mapQueryFromForm(form);
  const encoded = encodeURIComponent(query);
  const frame = picker.querySelector("[data-map-frame]");
  const openLink = picker.querySelector("[data-open-map]");
  const placeInput = picker.querySelector("[data-map-place]");
  if (frame) frame.src = `https://www.google.com/maps?q=${encoded}&output=embed`;
  if (openLink) openLink.href = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  if (placeInput) placeInput.value = query;

  const instance = googleMapInstances.get(picker);
  if (instance && form?.elements.latitude?.value && form?.elements.longitude?.value) {
    const center = {
      lat: Number(form.elements.latitude.value),
      lng: Number(form.elements.longitude.value),
    };
    instance.map.setCenter(center);
    instance.marker.setPosition(center);
  }
}

function updateMapPickerForForm(form) {
  const picker = form?.querySelector("[data-map-picker]");
  if (picker) updateMapPicker(picker);
}

function setMapCoordinates(picker, latitude, longitude, messageKey = "") {
  const form = picker.closest("form");
  if (!form) return;
  form.elements.latitude.value = Number(latitude).toFixed(6);
  form.elements.longitude.value = Number(longitude).toFixed(6);
  updateMapPicker(picker);
  const message = form.querySelector(".form-message");
  if (message && messageKey) setFormMessage(message, t(messageKey));
}

async function initializeGoogleMaps() {
  if (!state.config.googleMapsApiKey || window.google?.maps) return;
  await scriptOnce(
    `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(state.config.googleMapsApiKey)}`,
    "googleMapsScript"
  );
}

async function enhanceMapPicker(picker) {
  if (!state.config.googleMapsApiKey || googleMapInstances.has(picker)) return;
  await initializeGoogleMaps();
  if (!window.google?.maps) return;
  const form = picker.closest("form");
  const latitude = Number(form?.elements.latitude?.value || 21.1619);
  const longitude = Number(form?.elements.longitude?.value || -86.8515);
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
  const marker = new google.maps.Marker({ map, position: center });
  map.addListener("click", (event) => {
    marker.setPosition(event.latLng);
    setMapCoordinates(picker, event.latLng.lat(), event.latLng.lng());
  });
  googleMapInstances.set(picker, { map, marker });
  picker.classList.add("has-google-map");
}

function bindMapPickers() {
  $$("[data-map-picker]").forEach((picker) => {
    if (picker.dataset.bound === "true") {
      updateMapPicker(picker);
      return;
    }
    picker.dataset.bound = "true";
    const form = picker.closest("form");
    ["address", "state", "city", "zone", "neighborhood", "latitude", "longitude"].forEach((name) => {
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
    updateMapPicker(picker);
    void enhanceMapPicker(picker).catch(() => null);
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
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
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

function formatPriceLines(property) {
  const preferred =
    state.currency === "MXN"
      ? [
          ["MXN", property.priceMxn],
          ["USD", property.priceUsd],
        ]
      : [
          ["USD", property.priceUsd],
          ["MXN", property.priceMxn],
        ];
  const firstAvailable = preferred.find(([, amount]) => amount !== null && amount !== undefined && amount !== "");
  if (!firstAvailable) return [];
  return [formatCurrencyLine(firstAvailable[0], firstAvailable[1], property.operation)];
}

function formatPriceSummary(property) {
  const lines = formatPriceLines(property);
  return lines.length ? lines.join(" / ") : "Precio por confirmar";
}

function selectedPrice(property) {
  const preferred =
    state.currency === "MXN"
      ? [
          ["MXN", property.priceMxn],
          ["USD", property.priceUsd],
        ]
      : [
          ["USD", property.priceUsd],
          ["MXN", property.priceMxn],
        ];
  return preferred.find(([, amount]) => amount !== null && amount !== undefined && amount !== "") || null;
}

function comparablePrice(property) {
  return Number(property.priceUsd || property.priceMxn || 0);
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
  const filters = state.filters;
  if (filters.type && property.type !== filters.type) return false;
  if (filters.zone && property.zone !== filters.zone) return false;
  if (filters.operation && property.operation !== filters.operation) return false;
  if (filters.featured && !property.featured) return false;
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
  $("#resultCount").textContent = `${properties.length} ${t("resultText")}`;

  if (!properties.length) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(t("noResults"))}</p>`;
    refreshIcons();
    return;
  }

  grid.innerHTML = properties
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

      return `
        <article class="property-card" id="property-${escapeHtml(property.id)}">
          <div class="property-image">
            <img src="${escapeHtml(primaryImage(property))}" alt="${escapeHtml(localizedTitle(property))}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" />
            <div class="badge-row">${badgeHtml}</div>
          </div>
          <div class="property-body">
            <p class="property-price">${escapeHtml(formatPriceSummary(property))}</p>
            <h3 class="property-title">${escapeHtml(localizedTitle(property))}</h3>
            <p class="property-location">${escapeHtml(displayLocation(property))}</p>
            <p class="property-meta">${escapeHtml(meta.join(" • "))}</p>
            <p class="property-description">${escapeHtml(truncateText(localizedDescription(property)))}</p>
            <div class="property-actions">
              <button class="mini-button primary" type="button" data-detail="${escapeHtml(property.id)}">${escapeHtml(t("viewDetails"))}</button>
              <button class="mini-button" type="button" data-contact="${escapeHtml(property.id)}">${escapeHtml(t("contactWhatsApp"))}</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
  refreshIcons();
  updatePropertyJsonLd();
}

function propertySchemaType(property) {
  if (property.type === "Casa") return "House";
  if (property.type === "Departamento") return "Apartment";
  return "Residence";
}

function updatePropertyJsonLd() {
  const existing = document.getElementById("property-jsonld");
  if (existing) existing.remove();
  if (!state.properties.length) return;

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Propiedades en venta y renta en Cancun",
    itemListElement: state.properties.slice(0, 24).map((property, index) => {
      const price = selectedPrice(property);
      const url = `${window.location.origin}/#property-${encodeURIComponent(property.id)}`;
      const listing = {
        "@type": "RealEstateListing",
        name: localizedTitle(property),
        url,
        description: localizedDescription(property),
        image: storedImages(property).length > 1 ? storedImages(property) : primaryImage(property),
        datePosted: property.createdAt,
        mainEntity: {
          "@type": propertySchemaType(property),
          name: localizedTitle(property),
          description: localizedDescription(property),
          numberOfRooms: property.beds || undefined,
          numberOfBathroomsTotal: property.baths || undefined,
          floorSize: property.area
            ? {
                "@type": "QuantitativeValue",
                value: property.area,
                unitCode: "MTK",
              }
            : undefined,
          containedInPlace: {
            "@type": "Place",
            name: displayLocation(property) || "Cancun",
          },
        },
      };
      if (price) {
        listing.offers = {
          "@type": "Offer",
          price: Number(price[1]),
          priceCurrency: price[0],
          availability: "https://schema.org/InStock",
          url,
        };
      }
      return {
        "@type": "ListItem",
        position: index + 1,
        url,
        item: listing,
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
  list.innerHTML = state.requests.map(renderRequestItem).join("");
}

function renderAdminRequests() {
  const list = $("#adminRequests");
  if (!list) return;
  const summary = $("#adminRequestSummary");
  if (summary) {
    const pending = state.requests.filter((request) => request.status === "pending").length;
    summary.textContent = `${state.requests.length} ${t("adminRequestSummary")} · ${pending ? `${pending} ${t("pending")}` : t("adminNoPending")}`;
  }
  if (!state.requests.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("noRequests"))}</p>`;
    return;
  }
  list.innerHTML = state.requests
    .map((request) => {
      const actions =
        request.status === "pending"
          ? `<div class="item-actions">
              <button class="mini-button primary" type="button" data-approve="${escapeHtml(request.id)}">${escapeHtml(t("approve"))}</button>
              <button class="mini-button" type="button" data-reject="${escapeHtml(request.id)}">${escapeHtml(t("reject"))}</button>
            </div>`
          : "";
      return `<div class="request-admin-entry">${renderRequestItem(request)}${actions}</div>`;
    })
    .join("");
}

function renderStats() {
  const stats = [
    [state.stats.properties, t("statProperties")],
    [state.stats.pendingRequests, t("statRequests")],
    [state.stats.users, t("statUsers")],
    [state.stats.visits, t("statVisits")],
  ];
  $("#statsGrid").innerHTML = stats
    .map(([value, label]) => `<article class="stat-card"><strong>${value}</strong><span>${escapeHtml(label)}</span></article>`)
    .join("");
}

function renderAdminInsights() {
  const container = $("#adminInsights");
  if (!container) return;
  const properties = state.properties;
  const pending = state.requests.filter((request) => request.status === "pending").length;
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
    <article class="insight-card priority">
      <span>${escapeHtml(t("adminInsightPending"))}</span>
      <strong>${pending}</strong>
      <p>${escapeHtml(pending ? t("adminRequestsTitle") : t("adminNoPending"))}</p>
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
  const types = ["state", "city", "zone", "neighborhood"];
  list.innerHTML = types
    .map((type) => {
      const options = locationOptionsByType(type);
      const titleKey =
        type === "state"
          ? "catalogState"
          : type === "city"
            ? "catalogCity"
            : type === "zone"
              ? "catalogZone"
              : "catalogNeighborhood";
      return `
        <article class="catalog-group">
          <h3>${escapeHtml(t(titleKey))}</h3>
          ${
            options.length
              ? options
                  .map(
                    (option) => `
                      <div class="catalog-entry">
                        <span>${escapeHtml(option.name)}</span>
                        <button class="text-button danger" type="button" data-delete-location="${escapeHtml(option.id)}">${escapeHtml(t("delete"))}</button>
                      </div>
                    `
                  )
                  .join("")
              : `<p class="empty-state">${escapeHtml(t("catalogEmpty"))}</p>`
          }
        </article>
      `;
    })
    .join("");
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
    parentSelect.append(new Option(option.name, option.id));
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
    await api("/api/admin/location-options", {
      method: "POST",
      body: {
        type: form.type.value,
        parentId: form.parentId.value,
        name: form.name.value.trim(),
      },
    });
    form.name.value = "";
    await refreshLocationOptions();
    setFormMessage(message, t("catalogSaved"));
  } catch (error) {
    setFormMessage(message, error.message, true);
  }
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

function renderAdminListings() {
  const list = $("#adminListings");
  if (!list) return;
  const properties = sortedProperties(state.properties);
  const summary = $("#adminListingSummary");
  if (summary) {
    const featured = properties.filter((property) => property.featured).length;
    summary.textContent = `${properties.length} ${t("adminListingSummary")} · ${featured} ${t("navFeatured")}`;
  }
  if (!properties.length) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(t("listingsEmpty"))}</p>`;
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
                <h3>${escapeHtml(localizedTitle(property))}</h3>
              </div>
              <strong>${escapeHtml(formatPriceSummary(property))}</strong>
            </div>
            <p>${escapeHtml(displayLocation(property))} · ${escapeHtml(displayType(property.type))} · ${escapeHtml(property.mls ? `${t("mls")} ${property.mls}` : "")}</p>
            <div class="listing-facts">
              <span>${escapeHtml(property.beds || 0)} ${escapeHtml(t("bedShort"))}</span>
              <span>${escapeHtml(property.baths || 0)} ${escapeHtml(t("bathShort"))}</span>
              <span>${escapeHtml(property.area || 0)} ${escapeHtml(t("sqmBuild"))}</span>
              <span>${escapeHtml(property.operation === "rent" ? t("rent") : t("sale"))}</span>
            </div>
            <p class="listing-excerpt">${escapeHtml(excerpt)}</p>
            ${
              hasMore
                ? `<details class="listing-more"><summary>${escapeHtml(t("showMore"))}</summary><p>${escapeHtml(description)}</p></details>`
                : ""
            }
            <div class="item-actions">
              <button class="mini-button primary" type="button" data-edit-listing="${escapeHtml(property.id)}">${escapeHtml(t("edit"))}</button>
              <button class="mini-button" type="button" data-delete-listing="${escapeHtml(property.id)}">${escapeHtml(t("delete"))}</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadPublicData() {
  const [propertiesData, sessionData, locationData, configData] = await Promise.all([
    api("/api/properties"),
    api("/api/session"),
    api("/api/location-options"),
    api("/api/config"),
  ]);
  state.properties = propertiesData.properties || [];
  state.session = sessionData.user;
  state.locationOptions = locationData.options || [];
  state.config = configData || state.config;
}

async function loadPanelData() {
  if (!state.session) return;
  if (state.session.role === "admin") {
    const [statsData, requestsData, propertiesData, promptsData] = await Promise.all([
      api("/api/admin/stats"),
      api("/api/admin/requests"),
      api("/api/properties"),
      api("/api/admin/prompts"),
    ]);
    state.stats = statsData;
    state.requests = requestsData.requests || [];
    state.properties = propertiesData.properties || [];
    state.adminPrompts = promptsData.prompts || [];
  } else {
    const requestsData = await api("/api/seller/requests");
    state.requests = requestsData.requests || [];
    state.adminPrompts = [];
  }
}

function prepareSellerForm() {
  const form = $("#sellerRequestForm");
  if (!form || !state.session || state.session.role !== "seller") return;
  if (!form.email.value) form.email.value = state.session.email || "";
  if (!form.phone.value) form.phone.value = state.session.phone || "";
  form.preferredContact.value = state.session.preferredContact || "email";
}

async function renderPanel() {
  if (!state.session) return;
  await loadPanelData();
  const isAdmin = state.session.role === "admin";
  $("#panelRoleBadge").textContent = isAdmin ? t("adminRole") : t("sellerRole");
  $("#panelTitle").textContent = isAdmin ? t("adminPanelTitle") : t("sellerPanelTitle");
  $("#panelSubtitle").textContent = isAdmin ? t("adminPanelSubtitle") : t("sellerPanelSubtitle");
  $("#adminPanel").hidden = !isAdmin;
  $("#sellerPanel").hidden = isAdmin;
  refreshLocationSelects();
  if (isAdmin) {
    renderStats();
    renderAdminInsights();
    renderCatalogParentOptions();
    renderLocationCatalogs();
    renderAdminPrompts();
    renderAdminRequests();
    renderAdminListings();
  } else {
    prepareSellerForm();
    renderSellerRequests();
  }
  bindMapPickers();
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

function applyTranslations() {
  document.documentElement.lang = state.lang;
  $$("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = t(key);
  });
  $$("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  $("#languageToggle").textContent = state.lang === "es" ? "English" : "Español";
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
  refreshIcons();
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
  $("#loginMessage").classList.remove("error");
  $("#registerMessage").classList.remove("error");
  $("#googleAuthMessage").classList.remove("error");
}

function switchAuthTab(tab) {
  $$("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  $$(".auth-form").forEach((form) => {
    form.classList.toggle("active", form.id === `${tab}Form`);
  });
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
  await renderPanel();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function hidePanel() {
  $("#panelView").hidden = true;
  $("#siteShell").hidden = false;
  document.body.classList.remove("panel-open");
  updateAuthNav();
  window.scrollTo({ top: 0, behavior: "auto" });
  updateHeaderVisibility();
}

function setFormMessage(element, text, error = false) {
  element.classList.toggle("error", error);
  element.textContent = text;
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
    closeAuth();
    updateAuthNav();
    await showPanel();
  } catch (error) {
    if (error.status === 401 && form.username.value.includes("@")) {
      switchAuthTab("register");
      $("#registerForm").email.value = form.username.value.trim();
      setFormMessage($("#registerMessage"), t("accountPrompt"));
      return;
    }
    setFormMessage(message, t("loginError"), true);
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
    setFormMessage(message, error.status === 409 ? t("accountExists") : error.message, true);
  }
}

async function sellerRequestSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $("#sellerFormMessage");
  setFormMessage(message, "");
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    delete payload.imageFile;
    Object.assign(payload, await getFormImagePayload(form));
    await api("/api/seller/requests", {
      method: "POST",
      body: payload,
    });
    form.reset();
    refreshLocationSelects();
    updateMapPickerForForm(form);
    updateSellerImagePreview([]);
    await renderPanel();
    setFormMessage($("#sellerFormMessage"), t("requestSent"));
  } catch (error) {
    setFormMessage(message, error.message, true);
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
        sourcePath: window.location.pathname,
      },
    });
    form.reset();
    if (message) setFormMessage(message, t("leadSent"));
  } catch (error) {
    if (message) setFormMessage(message, error.message, true);
    else alert(error.message);
  }
}

function resetListingForm() {
  const form = $("#listingForm");
  form.reset();
  form.elements.id.value = "";
  form.dataset.currentImages = "[]";
  form.dataset.removeImage = "false";
  refreshLocationSelects();
  updateMapPickerForForm(form);
  updateListingImagePreview([]);
  setFormMessage($("#listingFormMessage"), "");
}

function renderImagePreview(preview, images) {
  if (!preview) return;
  const list = Array.isArray(images) ? images.filter(Boolean) : images ? [images] : [];
  const grid = preview.querySelector(".image-preview-grid");
  if (list.length) {
    grid.innerHTML = list
      .map((src, index) => `<img src="${escapeHtml(src)}" alt="Property preview ${index + 1}" loading="lazy" />`)
      .join("");
    preview.hidden = false;
  } else {
    grid.innerHTML = "";
    preview.hidden = true;
  }
}

function updateSellerImagePreview(images) {
  renderImagePreview($("#sellerImagePreview"), images);
}

function updateListingImagePreview(images) {
  renderImagePreview($("#listingImagePreview"), images);
}

function validateImageFile(file) {
  if (!file) return;
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error(t("invalidImageType"));
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error(t("imageTooLarge"));
  }
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    validateImageFile(file);
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        imageDataUrl: reader.result,
        imageType: file.type,
        imageSize: file.size,
      });
    reader.onerror = () => reject(new Error(t("apiError")));
    reader.readAsDataURL(file);
  });
}

async function readImageFiles(files) {
  const list = Array.from(files || []);
  if (list.length > IMAGE_MAX_COUNT) {
    throw new Error(t("tooManyImages"));
  }
  const images = await Promise.all(list.map(readImageFile));
  return { images };
}

async function getFormImagePayload(form) {
  const files = form.elements.imageFile?.files || [];
  if (!files.length) return {};
  return readImageFiles(files);
}

async function getListingImagePayload(form) {
  const files = form.elements.imageFile.files;
  if (!files.length) {
    return form.dataset.removeImage === "true" ? { removeImage: true } : {};
  }
  form.dataset.removeImage = "false";
  return readImageFiles(files);
}

async function listingSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  const message = $("#listingFormMessage");
  setFormMessage(message, "");
  const priceUsd = form.priceUsd.value === "" ? null : Number(form.priceUsd.value);
  const priceMxn = form.priceMxn.value === "" ? null : Number(form.priceMxn.value);
  if (priceUsd === null && priceMxn === null) {
    setFormMessage(message, t("missingPrice"), true);
    return;
  }
  const payload = {
    title: form.title.value.trim(),
    type: form.type.value,
    state: form.state.value,
    city: form.city.value,
    zone: form.zone.value,
    neighborhood: form.neighborhood.value,
    address: form.address.value.trim(),
    latitude: form.latitude.value,
    longitude: form.longitude.value,
    mapPlace: form.mapPlace.value,
    operation: form.operation.value,
    priceUsd,
    priceMxn,
    beds: Number(form.beds.value || 0),
    baths: Number(form.baths.value || 0),
    area: Number(form.area.value || 0),
    featured: form.featured.checked,
    description: form.description.value.trim(),
    badges: ["new"],
  };
  try {
    Object.assign(payload, await getListingImagePayload(form));
    await api(id ? `/api/admin/properties/${encodeURIComponent(id)}` : "/api/admin/properties", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    resetListingForm();
    await renderPanel();
    renderProperties();
    alert(t("listingSaved"));
  } catch (error) {
    setFormMessage(message, error.message, true);
  }
}

function editListing(id) {
  const property = state.properties.find((item) => item.id === id);
  if (!property) return;
  const form = $("#listingForm");
  form.elements.id.value = property.id;
  form.title.value = localizedTitle(property);
  form.type.value = property.type;
  setLocationFormValues(form, property);
  form.operation.value = property.operation;
  form.priceUsd.value = property.priceUsd || "";
  form.priceMxn.value = property.priceMxn || "";
  form.address.value = property.address || "";
  form.latitude.value = property.latitude ?? "";
  form.longitude.value = property.longitude ?? "";
  form.mapPlace.value = property.mapPlace || "";
  updateMapPickerForForm(form);
  form.elements.imageFile.value = "";
  form.dataset.currentImages = JSON.stringify(storedImages(property));
  form.dataset.removeImage = "false";
  updateListingImagePreview(storedImages(property));
  form.beds.value = property.beds || "";
  form.baths.value = property.baths || "";
  form.area.value = property.area || "";
  form.featured.checked = Boolean(property.featured);
  form.description.value = localizedDescription(property);
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteListing(id) {
  if (!confirm(t("confirmDelete"))) return;
  try {
    await api(`/api/admin/properties/${encodeURIComponent(id)}`, { method: "DELETE" });
    await renderPanel();
    renderProperties();
    alert(t("listingDeleted"));
  } catch (error) {
    alert(error.message);
  }
}

async function approveRequest(id) {
  try {
    await api(`/api/admin/requests/${encodeURIComponent(id)}/approve`, { method: "POST" });
    await renderPanel();
    renderProperties();
    alert(t("requestApproved"));
  } catch (error) {
    alert(error.message);
  }
}

async function rejectRequest(id) {
  try {
    await api(`/api/admin/requests/${encodeURIComponent(id)}/reject`, { method: "POST" });
    await renderPanel();
    alert(t("requestRejected"));
  } catch (error) {
    alert(error.message);
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

function bindEvents() {
  $("#currencySelect").value = state.currency;
  $("#currencySelect").addEventListener("change", (event) => {
    state.currency = event.target.value;
    localStorage.setItem(keys.currency, state.currency);
    renderProperties();
    if (!$("#panelView").hidden) void renderPanel();
  });

  $("#languageToggle").addEventListener("click", () => {
    state.lang = state.lang === "es" ? "en" : "es";
    localStorage.setItem(keys.lang, state.lang);
    applyTranslations();
  });

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

  $("#searchForm").addEventListener("submit", handleSearch);
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
  $("#sellNavLink").addEventListener("click", handleSellEntry);
  $("#sellCtaButton").addEventListener("click", handleSellEntry);
  $("#footerSellButton").addEventListener("click", handleSellEntry);

  $("#authClose").addEventListener("click", closeAuth);
  $("#authModal").addEventListener("click", (event) => {
    if (event.target.id === "authModal") closeAuth();
  });
  $("#propertyDetailClose").addEventListener("click", closePropertyDetail);
  $("#propertyDetailModal").addEventListener("click", (event) => {
    if (event.target.id === "propertyDetailModal") closePropertyDetail();
  });
  $$("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => switchAuthTab(button.dataset.authTab));
  });
  $("#loginForm").addEventListener("submit", loginSubmit);
  $("#registerForm").addEventListener("submit", registerSubmit);

  $("#backToSite").addEventListener("click", hidePanel);
  $("#logoutButton").addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => null);
    state.session = null;
    state.requests = [];
    hidePanel();
  });

  $("#sellerRequestForm").addEventListener("submit", sellerRequestSubmit);
  $("#sellerRequestForm").elements.imageFile.addEventListener("change", async (event) => {
    const files = event.target.files;
    const message = $("#sellerFormMessage");
    setFormMessage(message, "");
    if (!files.length) {
      updateSellerImagePreview([]);
      return;
    }
    try {
      const payload = await readImageFiles(files);
      updateSellerImagePreview(payload.images.map((image) => image.imageDataUrl));
    } catch (error) {
      event.target.value = "";
      updateSellerImagePreview([]);
      setFormMessage(message, error.message, true);
    }
  });
  $("#clearSellerImage").addEventListener("click", () => {
    const form = $("#sellerRequestForm");
    form.elements.imageFile.value = "";
    updateSellerImagePreview([]);
    setFormMessage($("#sellerFormMessage"), t("imageRemoved"));
  });
  $("#listingForm").addEventListener("submit", listingSubmit);
  $("#locationCatalogForm").addEventListener("submit", locationCatalogSubmit);
  $("#locationCatalogForm").elements.type.addEventListener("change", renderCatalogParentOptions);
  $("#resetListingForm").addEventListener("click", resetListingForm);
  $("#clearListingImage").addEventListener("click", () => {
    const form = $("#listingForm");
    form.elements.imageFile.value = "";
    form.dataset.currentImages = "[]";
    form.dataset.removeImage = "true";
    updateListingImagePreview([]);
    setFormMessage($("#listingFormMessage"), t("imageRemoved"));
  });
  $("#listingForm").elements.imageFile.addEventListener("change", async (event) => {
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
      form.dataset.removeImage = "false";
      updateListingImagePreview(payload.images.map((image) => image.imageDataUrl));
    } catch (error) {
      event.target.value = "";
      updateListingImagePreview(form.dataset.removeImage === "true" ? [] : currentImages);
      setFormMessage(message, error.message, true);
    }
  });

  $$("[data-seller-help]").forEach((button) => {
    button.addEventListener("click", openGeneralWhatsApp);
  });

  $$("[data-admin-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.adminJump);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-location-select]");
    if (select) handleLocationSelectChange(select);
  });

  document.addEventListener("click", (event) => {
    const detail = event.target.closest("[data-detail]");
    if (detail) viewDetails(detail.dataset.detail);

    const contact = event.target.closest("[data-contact]");
    if (contact) contactAdvisor(contact.dataset.contact);

    const detailContact = event.target.closest("[data-detail-contact]");
    if (detailContact) contactAdvisor(detailContact.dataset.detailContact);

    const approve = event.target.closest("[data-approve]");
    if (approve) void approveRequest(approve.dataset.approve);

    const reject = event.target.closest("[data-reject]");
    if (reject) void rejectRequest(reject.dataset.reject);

    const edit = event.target.closest("[data-edit-listing]");
    if (edit) editListing(edit.dataset.editListing);

    const remove = event.target.closest("[data-delete-listing]");
    if (remove) void deleteListing(remove.dataset.deleteListing);

    const deleteLocation = event.target.closest("[data-delete-location]");
    if (deleteLocation) void deleteLocationOption(deleteLocation.dataset.deleteLocation);
  });

  $("#whatsappButton").addEventListener("click", () => {
    openGeneralWhatsApp();
  });
}

async function init() {
  bindEvents();
  try {
    await loadPublicData();
  } catch (error) {
    console.error(error);
    alert(t("apiError"));
  }
  applyTranslations();
  updateHeaderVisibility();
  void initializeGoogleAuth().catch(() => null);
}

init();
