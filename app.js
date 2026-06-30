const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const WHATSAPP_NUMBER = "529986880710";

const keys = {
  lang: "pcc.lang",
  currency: "pcc.currency",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82";

const fallbackIcons = {
  "arrow-left": '<path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path>',
  "arrow-right": '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
  home: '<path d="m3 11 9-8 9 8"></path><path d="M5 10v10h14V10"></path><path d="M9 20v-6h6v6"></path>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><path d="M16 17l5-5-5-5"></path><path d="M21 12H9"></path>',
  "map-pin": '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>',
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
    heroTitle: "Expertos en bienes raíces",
    searchPlaceholder: "Ciudad, dirección, código postal",
    searchButton: "Buscar",
    contactToday: "Contáctanos Hoy",
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
    sellerContactTitle: "Datos de contacto para esta solicitud",
    propertyTitle: "Título de la propiedad",
    propertyType: "Tipo de propiedad",
    zone: "Zona",
    price: "Precio",
    currency: "Moneda",
    address: "Dirección",
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
    imageUpload: "Imagen de la propiedad",
    imageHelp: "JPG, PNG o WEBP. Máximo 1.5 MB.",
    currentImage: "Imagen actual",
    selectedImage: "Imagen seleccionada",
    removeImage: "Quitar imagen",
    imageRemoved: "Imagen quitada. Puedes seleccionar otra antes de guardar.",
    imageTooLarge: "La imagen no debe superar 1.5 MB.",
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
    adminJumpNew: "Nueva propiedad",
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
    sellerRole: "Cuenta de vendedor",
    adminRole: "Cuenta administradora",
    accountPrompt: "Completa estos datos para crear tu cuenta de vendedor.",
    requestSent: "Solicitud enviada. El administrador podrá revisarla en su panel.",
    loginError: "La contraseña no coincide con esa cuenta.",
    accountExists: "Ya existe una cuenta con ese correo.",
    accountCreated: "Cuenta creada. Bienvenido al panel de vendedor.",
    listingSaved: "Publicación guardada.",
    listingDeleted: "Publicación eliminada.",
    requestApproved: "Solicitud aprobada y publicada.",
    requestRejected: "Solicitud rechazada.",
    whatsAppPending: "Botón de WhatsApp listo. Falta configurar el número final.",
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
    heroTitle: "Real estate experts",
    searchPlaceholder: "City, address, zip code",
    searchButton: "Search",
    contactToday: "Contact Us Today",
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
    sellerContactTitle: "Contact details for this request",
    propertyTitle: "Property title",
    propertyType: "Property type",
    zone: "Area",
    price: "Price",
    currency: "Currency",
    address: "Address",
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
    imageUpload: "Property image",
    imageHelp: "JPG, PNG or WEBP. Maximum 1.5 MB.",
    currentImage: "Current image",
    selectedImage: "Selected image",
    removeImage: "Remove image",
    imageRemoved: "Image removed. You can select another one before saving.",
    imageTooLarge: "Image must not exceed 1.5 MB.",
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
    adminJumpNew: "New property",
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
    sellerRole: "Seller account",
    adminRole: "Admin account",
    accountPrompt: "Complete these details to create your seller account.",
    requestSent: "Request submitted. The administrator can review it in the panel.",
    loginError: "The password does not match that account.",
    accountExists: "An account already exists with that email.",
    accountCreated: "Account created. Welcome to the seller panel.",
    listingSaved: "Listing saved.",
    listingDeleted: "Listing deleted.",
    requestApproved: "Request approved and published.",
    requestRejected: "Request rejected.",
    whatsAppPending: "WhatsApp button ready. The final number still needs to be configured.",
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

function t(key) {
  return translations[state.lang][key] || translations.es[key] || key;
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
      property.zone,
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
        <article class="property-card">
          <div class="property-image">
            <img src="${escapeHtml(property.image || fallbackImage)}" alt="${escapeHtml(localizedTitle(property))}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" />
            <div class="badge-row">${badgeHtml}</div>
          </div>
          <div class="property-body">
            <p class="property-price">${escapeHtml(formatPriceSummary(property))}</p>
            <h3 class="property-title">${escapeHtml(localizedTitle(property))}</h3>
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
        request.image
          ? `<img class="request-thumb" src="${escapeHtml(request.image)}" alt="${escapeHtml(request.title)}" loading="lazy" />`
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
          <small>${escapeHtml(request.zone)} · ${escapeHtml(request.beds || 0)} ${escapeHtml(t("bedShort"))} · ${escapeHtml(request.baths || 0)} ${escapeHtml(t("bathShort"))}</small>
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
    .map(
      (property) => `
        <div class="listing-item detailed-listing">
          <img src="${escapeHtml(property.image || fallbackImage)}" alt="${escapeHtml(localizedTitle(property))}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" />
          <div class="listing-content">
            <div class="listing-heading">
              <div>
                <span class="status ${property.featured ? "approved" : ""}">${escapeHtml(property.featured ? t("navFeatured") : displayType(property.type))}</span>
                <h3>${escapeHtml(localizedTitle(property))}</h3>
              </div>
              <strong>${escapeHtml(formatPriceSummary(property))}</strong>
            </div>
            <p>${escapeHtml(property.zone)} · ${escapeHtml(displayType(property.type))} · ${escapeHtml(property.mls ? `${t("mls")} ${property.mls}` : "")}</p>
            <div class="listing-facts">
              <span>${escapeHtml(property.beds || 0)} ${escapeHtml(t("bedShort"))}</span>
              <span>${escapeHtml(property.baths || 0)} ${escapeHtml(t("bathShort"))}</span>
              <span>${escapeHtml(property.area || 0)} ${escapeHtml(t("sqmBuild"))}</span>
              <span>${escapeHtml(property.operation === "rent" ? t("rent") : t("sale"))}</span>
            </div>
            <p>${escapeHtml(localizedDescription(property))}</p>
            <div class="item-actions">
              <button class="mini-button primary" type="button" data-edit-listing="${escapeHtml(property.id)}">${escapeHtml(t("edit"))}</button>
              <button class="mini-button" type="button" data-delete-listing="${escapeHtml(property.id)}">${escapeHtml(t("delete"))}</button>
            </div>
          </div>
        </div>
      `
    )
    .join("");
}

async function loadPublicData() {
  const [propertiesData, sessionData] = await Promise.all([api("/api/properties"), api("/api/session")]);
  state.properties = propertiesData.properties || [];
  state.session = sessionData.user;
}

async function loadPanelData() {
  if (!state.session) return;
  if (state.session.role === "admin") {
    const [statsData, requestsData, propertiesData] = await Promise.all([
      api("/api/admin/stats"),
      api("/api/admin/requests"),
      api("/api/properties"),
    ]);
    state.stats = statsData;
    state.requests = requestsData.requests || [];
    state.properties = propertiesData.properties || [];
  } else {
    const requestsData = await api("/api/seller/requests");
    state.requests = requestsData.requests || [];
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
  if (isAdmin) {
    renderStats();
    renderAdminInsights();
    renderAdminRequests();
    renderAdminListings();
  } else {
    prepareSellerForm();
    renderSellerRequests();
  }
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
}

function closeAuth() {
  $("#authModal").hidden = true;
  document.body.classList.remove("modal-open");
  $("#loginMessage").textContent = "";
  $("#registerMessage").textContent = "";
  $("#loginMessage").classList.remove("error");
  $("#registerMessage").classList.remove("error");
}

function switchAuthTab(tab) {
  $$("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  $$(".auth-form").forEach((form) => {
    form.classList.toggle("active", form.id === `${tab}Form`);
  });
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
    updateSellerImagePreview("");
    await renderPanel();
    setFormMessage($("#sellerFormMessage"), t("requestSent"));
  } catch (error) {
    setFormMessage(message, error.message, true);
  }
}

function resetListingForm() {
  const form = $("#listingForm");
  form.reset();
  form.elements.id.value = "";
  form.dataset.currentImage = "";
  form.dataset.removeImage = "false";
  updateListingImagePreview("");
  setFormMessage($("#listingFormMessage"), "");
}

function updateSellerImagePreview(src) {
  const preview = $("#sellerImagePreview");
  if (!preview) return;
  const image = preview.querySelector("img");
  if (src) {
    image.src = src;
    preview.hidden = false;
  } else {
    image.removeAttribute("src");
    preview.hidden = true;
  }
}

function updateListingImagePreview(src) {
  const preview = $("#listingImagePreview");
  if (!preview) return;
  const image = preview.querySelector("img");
  if (src) {
    image.src = src;
    preview.hidden = false;
  } else {
    image.removeAttribute("src");
    preview.hidden = true;
  }
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

async function getFormImagePayload(form) {
  const file = form.elements.imageFile?.files?.[0];
  if (!file) return {};
  return readImageFile(file);
}

async function getListingImagePayload(form) {
  const file = form.elements.imageFile.files[0];
  if (!file) {
    return form.dataset.removeImage === "true" ? { removeImage: true } : {};
  }
  form.dataset.removeImage = "false";
  return readImageFile(file);
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
    zone: form.zone.value,
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
  form.zone.value = property.zone;
  form.operation.value = property.operation;
  form.priceUsd.value = property.priceUsd || "";
  form.priceMxn.value = property.priceMxn || "";
  form.elements.imageFile.value = "";
  form.dataset.currentImage = property.image || "";
  form.dataset.removeImage = "false";
  updateListingImagePreview(property.image || "");
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
    property.zone || "",
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

  content.innerHTML = `
    <div class="property-detail-layout">
      <div class="property-detail-image">
        <img src="${escapeHtml(property.image || fallbackImage)}" alt="${escapeHtml(localizedTitle(property))}" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImage)}';" />
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
    `Ubicación: ${property.zone || ""}`,
    `Tipo: ${displayType(property.type)}`,
    `Dormitorios: ${property.beds || 0}`,
    `Baños: ${property.baths || 0}`,
    `M2 construcción: ${property.area || 0}`,
    "",
    "Quisiera recibir más información.",
  ].join("\n");
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
  });

  $("#searchForm").addEventListener("submit", handleSearch);
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
    const file = event.target.files[0];
    const message = $("#sellerFormMessage");
    setFormMessage(message, "");
    if (!file) {
      updateSellerImagePreview("");
      return;
    }
    try {
      const payload = await readImageFile(file);
      updateSellerImagePreview(payload.imageDataUrl);
    } catch (error) {
      event.target.value = "";
      updateSellerImagePreview("");
      setFormMessage(message, error.message, true);
    }
  });
  $("#clearSellerImage").addEventListener("click", () => {
    const form = $("#sellerRequestForm");
    form.elements.imageFile.value = "";
    updateSellerImagePreview("");
    setFormMessage($("#sellerFormMessage"), t("imageRemoved"));
  });
  $("#listingForm").addEventListener("submit", listingSubmit);
  $("#resetListingForm").addEventListener("click", resetListingForm);
  $("#clearListingImage").addEventListener("click", () => {
    const form = $("#listingForm");
    form.elements.imageFile.value = "";
    form.dataset.currentImage = "";
    form.dataset.removeImage = "true";
    updateListingImagePreview("");
    setFormMessage($("#listingFormMessage"), t("imageRemoved"));
  });
  $("#listingForm").elements.imageFile.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    const form = $("#listingForm");
    const message = $("#listingFormMessage");
    setFormMessage(message, "");
    if (!file) {
      updateListingImagePreview(form.dataset.removeImage === "true" ? "" : form.dataset.currentImage || "");
      return;
    }
    try {
      const payload = await readImageFile(file);
      form.dataset.removeImage = "false";
      updateListingImagePreview(payload.imageDataUrl);
    } catch (error) {
      event.target.value = "";
      updateListingImagePreview(form.dataset.removeImage === "true" ? "" : form.dataset.currentImage || "");
      setFormMessage(message, error.message, true);
    }
  });

  $$("[data-admin-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.adminJump);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
  });

  $("#whatsappButton").addEventListener("click", () => {
    alert(t("whatsAppPending"));
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
}

init();
