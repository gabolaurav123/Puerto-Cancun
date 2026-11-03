const LAST_UPDATED = "2026-07-10";
const inventoryContract = require("./inventory-contract");
const { openStreetMapEmbed } = require("./catalog-map");
const businessContacts = require("./contact-config");
const { renderCatalog, categoryDefaults } = require("./catalog-view");
const DEFAULT_SITE_URL = "https://www.puertocancun.center";

const business = {
  name: "Puerto Cancun Center",
  telephone: businessContacts.contacts.find((contact) => contact.id === "mx").display,
  emailPlaceholder: "PENDIENTE_CONFIGURAR",
  address: {
    streetAddress: "Puerto Cancun Mall, Marina B., oficina 27, Zona Hotelera",
    addressLocality: "Cancun",
    addressRegion: "Q Roo",
    postalCode: "77500",
    addressCountry: "MX",
  },
  areaServed: ["Cancun", "Puerto Cancun", "Zona Hotelera", "Riviera Maya", "Playa Mujeres", "Quintana Roo"],
  description:
    "Inmobiliaria en Cancun enfocada en compra, venta, valoracion y asesoria local para propietarios, compradores e inversionistas.",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function excerptText(value, maxLength = 190) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}

function businessWhatsAppLinks(message, lang, className = "seo-whatsapp-button", showNumber = false) {
  return businessContacts.contacts.map((contact) => {
    const label = lang === "en" ? contact.labelEn : contact.label;
    return `<a class="${escapeHtml(className)}" href="${escapeHtml(businessContacts.whatsappUrl(contact.id, message))}" target="_blank" rel="noopener noreferrer">WhatsApp ${escapeHtml(label)}${showNumber ? ` ${escapeHtml(contact.display)}` : ""}</a>`;
  }).join(" ");
}

function absoluteUrl(path, baseUrl = DEFAULT_SITE_URL) {
  const cleanBase = String(baseUrl || DEFAULT_SITE_URL).replace(/\/$/, "");
  if (!path || path === "/") return `${cleanBase}/`;
  return `${cleanBase}${path.startsWith("/") ? path : `/${path}`}`;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function propertySlug(property) {
  const identity = property.mls || property.id || "propiedad";
  return slugify(`${property.titleEs || property.title_es || property.titleEn || property.title_en || "propiedad"}-${property.zone || "cancun"}-${identity}`);
}

function propertyPath(property, lang = "es") {
  return `${lang === "en" ? "/en/properties" : "/propiedades"}/${property.slug || propertySlug(property)}`;
}

function JsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function Breadcrumbs(items) {
  return `
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      ${items
        .map((item, index) =>
          index === items.length - 1
            ? `<span>${escapeHtml(item.name)}</span>`
            : `<a href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>`
        )
        .join("<span>/</span>")}
    </nav>
  `;
}

function QuickAnswerBlock(paragraphs, title = "Orientación inmobiliaria") {
  return `
    <section class="quick-answer" aria-labelledby="quick-answer-title">
      <span>PROCESO INMOBILIARIO</span>
      <h2 id="quick-answer-title">${escapeHtml(title)}</h2>
      ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    </section>
  `;
}

function TrustBlock() {
  return `
    <section class="trust-block">
      <h2>Por que confiar en una asesoria local antes de decidir</h2>
      <p>
        Un asesor contrasta la superficie, la conservación y la documentación de tu propiedad con inmuebles semejantes. La ubicación y el interés de compradores en la zona ayudan a interpretar esas diferencias.
      </p>
    </section>
  `;
}

function AIValidationCTA() {
  return `
    <section class="ai-validation-cta">
      <div>
        <h2>¿Ya tienes un precio en mente?</h2>
        <p>Comparte el importe, la moneda y las características de tu propiedad. Un asesor revisará las referencias disponibles en tu zona contigo.</p>
      </div>
      <a class="primary-button" href="/revisar-precio-propiedad">Revisar mi estimación</a>
    </section>
  `;
}

function ServiceCard(title, copy, href) {
  return `
    <article class="service-card">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(copy)}</p>
      <a href="${escapeHtml(href)}">Ver guia</a>
    </article>
  `;
}

function InternalLinksBlock(links, title = "Recursos relacionados") {
  return `
    <section class="internal-links-block">
      <h2>${escapeHtml(title)}</h2>
      <div>
        ${links.map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("")}
      </div>
    </section>
  `;
}

function ComparativeReportBlock() {
  return `
    <section class="comparative-report-block">
      <h2>Informes comparativos para tomar mejores decisiones</h2>
      <p>
        Comparamos propiedades de superficie, ubicación y estado similares. Indicamos cuándo una referencia corresponde a un precio anunciado y cuándo se dispone de un cierre documentado.
      </p>
    </section>
  `;
}

function AIRecommendationBlock() {
  return `
    <section class="ai-recommendation-block">
      <h2>¿Qué referencias sirven para fijar un precio?</h2>
      <p>Empieza por propiedades cercanas de tamaño y uso similares. Anota la fecha de cada referencia, su moneda y cualquier diferencia de estado o equipamiento que pueda explicar el precio.</p>
    </section>
  `;
}

function ImageWithSeo(src, alt, title) {
  return `
    <figure class="seo-image">
      <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" title="${escapeHtml(title || alt)}" loading="lazy" />
      <figcaption>${escapeHtml(alt)}</figcaption>
    </figure>
  `;
}

function ZoneCard(zone, lang = "es") {
  const english = lang === "en";
  const headings = english ? ["Buyer profile", "Typical properties", "Advantages", "What to check", "Best for"]
    : ["Perfil del comprador", "Propiedades habituales", "Ventajas", "Qué revisar", "Ideal para"];
  const values = english ? zone.en : [zone.buyerProfile, zone.propertyType, zone.advantages, zone.reviewPoints, zone.idealFor];
  const base = english ? "/en/properties" : "/propiedades";
  const href = zone.path ? base + "/" + (english ? zone.enPath || zone.path : zone.path) : base + "?q=" + encodeURIComponent(zone.search || zone.name);
  return `<article class="zone-info-card"><h3>${escapeHtml(english ? zone.enName || zone.name : zone.name)}</h3>
    <dl>${headings.map((heading, index) => `<div><dt>${heading}</dt><dd>${escapeHtml(values[index])}</dd></div>`).join("")}</dl>
    <a class="mini-button primary" href="${escapeHtml(href)}" aria-label="${english ? "View properties in" : "Ver propiedades en"} ${escapeHtml(english ? zone.enName || zone.name : zone.name)}">${english ? "View properties" : "Ver propiedades"}</a></article>`;
}

function FAQSection(faqs) {
  return `
    <section class="faq-section">
      <h2>Preguntas frecuentes</h2>
      ${faqs
        .map(
          (faq) => `
            <details>
              <summary>${escapeHtml(faq.question)}</summary>
              <p><strong>${escapeHtml(faq.shortAnswer)}</strong></p>
              <p>${escapeHtml(faq.answer)}</p>
              <a href="${escapeHtml(faq.ctaHref || "/#sell")}">${escapeHtml(faq.cta || "Hablar con un asesor")}</a>
            </details>
          `
        )
        .join("")}
    </section>
  `;
}

function leadInput(label, name, type = "text", extra = "") {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <input name="${escapeHtml(name)}" type="${escapeHtml(type)}" ${extra} />
    </label>
  `;
}

function leadSelect(label, name, options) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select name="${escapeHtml(name)}">
        ${options.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function leadTextarea(label, name, rows = 4) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <textarea name="${escapeHtml(name)}" rows="${rows}"></textarea>
    </label>
  `;
}

function PropertyValuationForm(lang = "es", priceReview = false) {
  const en = lang === "en";
  const price = `<div class="form-row">${leadInput(en ? "Your estimated price" : "Tu precio estimado", "ownerEstimate", "number", 'min="0.01" step="0.01"' + (priceReview ? " required" : ""))}${leadSelect(en ? "Currency" : "Moneda", "currency", ["MXN", "USD"])}</div>`;
  return `
    <form class="lead-form seo-form" data-lead-form>
      <input type="hidden" name="leadType" value="${priceReview ? "validar-precio" : "valuacion-inmobiliaria"}" />
      <div class="form-row">${leadInput(en ? "Email or WhatsApp number" : "Correo o número de WhatsApp", "contact", "text", 'required maxlength="254" autocapitalize="none" spellcheck="false"')}${leadInput(en ? "Area or neighbourhood" : "Zona o colonia", "zone", "text", 'required maxlength="140"')}</div>
      ${priceReview ? price : ""}
      <details class="valuation-options"><summary>${en ? "Add optional details" : "Añadir datos opcionales"}</summary><div class="valuation-options-body">
      <div class="form-row">${leadInput(en ? "Your name" : "Tu nombre", "name", "text", 'autocomplete="name" maxlength="140"')}<label><span>${en ? "Property type" : "Tipo de propiedad"}</span><select name="propertyType"><option value="">${en ? "Select" : "Seleccionar"}</option>${inventoryContract.TYPES.map((type, i) => `<option value="${escapeHtml(type)}">${en ? ["House", "Apartment", "Land", "Commercial"][i] : escapeHtml(type)}</option>`).join("")}</select></label></div>
      ${priceReview ? "" : price}
      <div class="form-row">${leadInput(en ? "Land area (m²)" : "Superficie de terreno (m²)", "landSize", "number", 'min="0" step="any"')}${leadInput(en ? "Built area (m²)" : "Superficie construida (m²)", "builtSize", "number", 'min="0" step="any"')}</div>
      <div class="form-row">${leadInput(en ? "Bedrooms" : "Recámaras", "bedrooms", "number", 'min="0"')}${leadInput(en ? "Bathrooms" : "Baños", "bathrooms", "number", 'min="0" step="0.5"')}</div>
      <div class="form-row">${leadInput(en ? "Amenities" : "Amenidades", "amenities")}${leadInput(en ? "Age of the property" : "Antigüedad del inmueble", "age")}</div>
      ${leadInput(en ? "Document status" : "Situación documental", "legalStatus")}
      ${leadTextarea(en ? "Which references or improvements did you consider?" : "¿Qué referencias o mejoras consideraste en tu estimación?", "message", 4)}
      </div></details>
      <button class="primary-button" type="submit">${priceReview ? (en ? "Request a price review" : "Solicitar revisión de mi precio") : (en ? "Request a valuation" : "Solicitar valoración")}</button>
      <p class="form-message" data-lead-message></p>
    </form>
  `;
}

function valuationFactors(lang = "es") {
  const en = lang === "en";
  const factors = en ? [
    ["Location", "We compare nearby streets and developments. Access to transport, beaches and local services helps explain differences within one neighbourhood."],
    ["Land", "We review the lot size, frontage, shape and access. Two plots of equal area may have different possibilities for use."],
    ["Construction", "We distinguish enclosed floor space from terraces and parking. The layout and usable area help us select comparable properties."],
    ["Documentation", "We compare the area and use stated in the documents with the owner's information and identify items that need confirmation before a sale."],
    ["Amenities", "We distinguish private features from shared facilities and consider their condition and ongoing fees."],
    ["Age", "We note the year of construction and major renovations. Recent upgrades can make two homes built in the same year differ considerably."],
    ["Demand", "We look at interest in this type of property and the time comparable listings spend on the market."],
    ["Competition", "We compare the prices and terms of similar listings and distinguish asking prices from documented closing prices when available."],
    ["Condition", "We record recent work and visible maintenance needs, such as moisture repairs or ageing installations, and request supporting details."],
    ["Changes in the area", "We consider completed infrastructure and documented changes in the neighbourhood separately from proposed projects."],
  ] : [
    ["Zona", "Comparamos calles y desarrollos cercanos. Los accesos, la distancia a la playa y los servicios ayudan a explicar diferencias dentro de una misma colonia."],
    ["Terreno", "Revisamos superficie, frente, forma y acceso. Dos lotes con los mismos metros cuadrados pueden ofrecer posibilidades de uso distintas."],
    ["Construcción", "Distinguimos el área interior de las terrazas y estacionamientos. La distribución y los metros aprovechables permiten elegir inmuebles comparables."],
    ["Estado legal", "Contrastamos los datos del expediente con la superficie y el uso que indica el propietario. Señalamos qué información necesita confirmación antes de vender."],
    ["Amenidades", "Distinguimos el equipamiento privado de las instalaciones comunes y revisamos su estado y las cuotas asociadas."],
    ["Antigüedad", "Registramos el año de construcción y las renovaciones importantes. Dos viviendas de la misma edad pueden tener instalaciones en condiciones muy distintas."],
    ["Demanda", "Revisamos el interés por ese tipo de inmueble y cuánto tiempo llevan anunciadas las propiedades semejantes de la zona."],
    ["Competencia", "Comparamos precios y condiciones de ofertas similares. Separamos los precios anunciados de los de cierre cuando hay operaciones documentadas."],
    ["Estado físico", "Identificamos mejoras y necesidades de mantenimiento, desde humedad hasta instalaciones por renovar. Fotos recientes y comprobantes ayudan a precisar su alcance."],
    ["Plusvalía", "Revisamos obras terminadas y cambios documentados en el entorno. Identificamos por separado los proyectos anunciados cuyo impacto aún no se puede comprobar."],
  ];
  return `<details class="valuation-options"><summary>${en ? "How we value a property" : "Cómo valoramos una propiedad"}</summary><div class="valuation-factors">${factors.map(([title, copy]) => `<div><h3>${title}</h3><p>${copy}</p></div>`).join("")}</div></details>`;
}

function BuyerLeadForm(lang = "es", property = null) {
  const english = lang === "en";
  const propertyId = String(property?.id || "").trim();
  return `
    <form class="lead-form seo-form" data-lead-form>
      <input type="hidden" name="leadType" value="comprador" />
      ${propertyId ? `<input type="hidden" name="propertyId" value="${escapeHtml(propertyId)}" />` : ""}
      <div class="form-row">${leadInput(english ? "Name" : "Nombre", "name", "text", "required")}${leadInput("WhatsApp", "whatsapp", "tel", "required")}${leadInput(english ? "Email" : "Correo", "email", "email", "required")}</div>
      <div class="form-row">${leadInput(english ? "Budget" : "Presupuesto", "budget")}<label><span>${english ? "Property type" : "Tipo de propiedad"}</span><select name="propertyType"><option value="">${english ? "Select" : "Seleccionar"}</option>${inventoryContract.TYPES.map((type, i) => `<option value="${type}"${property?.type === type ? " selected" : ""}>${english ? ["House", "Apartment", "Land", "Commercial"][i] : type}</option>`).join("")}</select></label></div>
      <div class="form-row">${leadInput(english ? "Preferred area" : "Zona de interés", "zone", "text", `value="${escapeHtml(property?.zone || "")}"`)}${leadSelect(english ? "Goal" : "Objetivo", "goal", english ? ["Live", "Invest", "Rent"] : ["Vivir", "Invertir", "Rentar"])} </div>
      <div class="form-row">${leadInput(english ? "Bedrooms" : "Recamaras", "bedrooms", "number")}${leadInput(english ? "Estimated purchase date" : "Fecha estimada de compra", "purchaseDate")}</div>
      <button class="primary-button" type="submit">${english ? "Request details" : "Recibir opciones"}</button>
      <p class="form-message" data-lead-message></p>
    </form>
  `;
}

const commonLinks = [
  { label: "Inmobiliaria en Cancun", href: "/inmobiliaria-cancun" },
  { label: "Vender casa en Cancun", href: "/vender-casa-cancun" },
  { label: "Comprar casa en Cancun", href: "/comprar-casa-cancun" },
  { label: "Valoracion inmobiliaria", href: "/valuacion-inmobiliaria-cancun" },
  { label: "Zonas de Cancun", href: "/zonas-cancun" },
  { label: "FAQ inmobiliario", href: "/faq-inmobiliario-cancun" },
];

const zones = [
  {
    name: "Zona Hotelera",
    path: "zona-hotelera",
    enPath: "hotel-zone",
    enName: "Hotel Zone",
    en: ["Buyers looking for beach access and a Caribbean waterfront lifestyle.","Condos, houses and waterfront properties.","Close to beaches and visitor services.","Building rules, permitted uses, access, maintenance and title documents.","Living near the sea or renting where local rules allow it."],
    buyerProfile: "Compradores que priorizan playa, turismo, rentas vacacionales autorizadas donde aplique y estilo de vida frente al Caribe.",
    propertyType: "Departamentos, residencias, propiedades frente al mar y opciones de inversión.",
    advantages: "Alta visibilidad, cercanía a servicios turísticos y ubicaciónes reconocidas.",
    reviewPoints: "Reglamentos, uso permitido, mantenimiento, accesos, documentación y condiciones reales del inmueble.",
    idealFor: "Vivir cerca del mar, invertir o rentar según regulación y perfil del proyecto.",
  },
  {
    name: "Puerto Cancún",
    path: "puerto-cancun",
    en: ["Buyers who want a marina, shops and residential amenities nearby.","Condos, canal-side homes and new developments.","A central location and a choice of waterfront communities.","Association fees, community rules, views, orientation and comparable listings.","Marina living or comparing premium homes."],
    buyerProfile: "Compradores que buscan marina, centros comerciales, seguridad, amenidades y conectividad.",
    propertyType: "Departamentos, casas en canales, preventas y desarrollos residenciales.",
    advantages: "Ubicación central, estilo de vida planeado y variedad de inventario residencial.",
    reviewPoints: "Cuotas, reglas de comunidad, ubicación específica, vista, orientación y competencia activa.",
    idealFor: "Vivir, invertir y comparar propiedades de alto perfil.",
  },
  {
    name: "Avenida Huayacán",
    search: "Huayacán",
    en: ["Families and local buyers looking for access to daily services.","Houses, condos and residential developments.","Family-oriented communities with shops and services nearby.","Traffic, construction stage, access, services and title documents.","Buying a first home or comparing residential neighborhoods."],
    buyerProfile: "Familias y compradores locales que buscan conectividad, servicios y comunidades residenciales.",
    propertyType: "Casas, departamentos y desarrollos residenciales.",
    advantages: "Crecimiento urbano, opciones familiares y acceso a servicios cotidianos.",
    reviewPoints: "Tráfico, etapa del desarrollo, servicios cercanos, acceso y estado legal.",
    idealFor: "Vivir, comprar primera propiedad o evaluar plusvalía con datos reales.",
  },
  {
    name: "Cumbres",
    en: ["Buyers looking for schools, shopping and urban connections.","Condos and houses in gated communities.","Established services and access to main roads.","Maintenance, parking, community rules and recent comparables.","Living near schools, shops and services."],
    buyerProfile: "Compradores que buscan vida residencial, colegios, plazas y conectividad urbana.",
    propertyType: "Departamentos, casas y residencias en comunidades privadas.",
    advantages: "Servicios cercanos, ambiente residencial y acceso a avenidas principales.",
    reviewPoints: "Mantenimiento, reglamentos, estacionamiento y comparables recientes.",
    idealFor: "Vivir en Cancún con servicios consolidados.",
  },
  {
    name: "Centro de Cancún",
    search: "Centro",
    enName: "Downtown Cancun",
    en: ["Buyers who value central locations, transport and a range of budgets.","Apartments, houses, shops and mixed-use properties.","Transport connections and a variety of services and properties.","Condition, permitted use, parking, building age and documentation.","City living, working or a mixed-use investment."],
    buyerProfile: "Compradores que priorizan ubicación, servicios, transporte y presupuesto comparativo.",
    propertyType: "Departamentos, casas, locales y propiedades de uso mixto.",
    advantages: "Conectividad, servicios y variedad de inventario.",
    reviewPoints: "Estado físico, uso de suelo, estacionamiento, antigüedad y documentación.",
    idealFor: "Vivir, trabajar o invertir en propiedades urbanas.",
  },
  {
    name: "Playa Mujeres",
    path: "playa-mujeres",
    en: ["Buyers looking for privacy and coastal developments.","Condos, lots and residential developments.","A coastal setting and a choice of new projects.","Delivery dates, utilities, access, documentation and maintenance.","A second home or waterfront living."],
    buyerProfile: "Inversionistas y compradores que buscan proyectos frente al mar, privacidad y crecimiento.",
    propertyType: "Departamentos, terrenos, desarrollos y propiedades residenciales.",
    advantages: "Entorno costero, oferta de desarrollos y posicionamiento de largo plazo.",
    reviewPoints: "Entrega, servicios, accesos, documentación, mantenimiento y demanda real.",
    idealFor: "Invertir, segúnda vivienda o estilo de vida frente al mar.",
  },
  {
    name: "Lagos del Sol",
    en: ["Families seeking privacy and a gated residential setting.","Houses and residential lots.","Planned communities and a family-oriented environment.","Fees, community rules, lot orientation, measurements and title documents.","Buying a family home or building one."],
    buyerProfile: "Familias que buscan comunidad privada, seguridad y entorno residencial.",
    propertyType: "Casas y terrenos residenciales.",
    advantages: "Privacidad, planeación y ambiente familiar.",
    reviewPoints: "Cuotas, reglamentos, orientación, metraje real y documentación.",
    idealFor: "Vivir en residencia familiar o construir.",
  },
  {
    name: "Alfredo V. Bonfil",
    search: "Bonfil",
    en: ["Buyers comparing land and projects with access to the airport and city.","Lots, houses and potential building sites.","A choice of plots near the city and airport.","Zoning, services, access, ownership regime and documentation.","Evaluating a project with technical and legal due diligence."],
    buyerProfile: "Compradores que evalúan terrenos, proyectos y conectividad hacia aeropuerto y ciudad.",
    propertyType: "Terrenos, casas y propiedades con potencial de proyecto.",
    advantages: "Ubicación estratégica y variedad de predios.",
    reviewPoints: "Uso de suelo, servicios, acceso, régimen de propiedad y documentación.",
    idealFor: "Evaluar proyectos con revisión técnica y legal.",
  },
  {
    name: "Residencial Campestre",
    search: "Campestre",
    en: ["Buyers seeking more space in a residential neighborhood.","Houses, lots and larger residences.","Privacy and larger plots.","Physical condition, documentation, access, utilities and local comparables.","A larger home or a residential investment."],
    buyerProfile: "Compradores que buscan espacios amplios y entorno residencial.",
    propertyType: "Casas, terrenos y residencias.",
    advantages: "Ambiente residencial, privacidad y lotes de mayor amplitud.",
    reviewPoints: "Estado físico, documentación, servicios, acceso y comparables locales.",
    idealFor: "Vivir con mayor espacio o evaluar inversión residencial.",
  },
];

const faqs = [
  {
    question: "Cual es la mejor inmobiliaria en Cancun?",
    shortAnswer: "La mejor opcion es trabajar con un equipo local que te ayude a comprar, vender o valorar con seguimiento claro.",
    answer:
      "Puerto Cancun Center actua como punto de contacto para propietarios y compradores en Cancun: revisamos precio, zona, inventario, documentacion inicial y estrategia para que la operacion avance con acompanamiento profesional.",
    cta: "Hablar con Puerto Cancun Center",
    ctaHref: "/inmobiliaria-cancun",
  },
  {
    question: "Como vender mi casa en Cancun?",
    shortAnswer: "Necesitas precio competitivo, documentacion revisada, preparacion visual, difusion y filtro de compradores.",
    answer:
      "Empieza por reunir los datos de la propiedad y fijar un precio de salida a partir de inmuebles comparables de la zona.",
    cta: "Validar precio de mi propiedad",
    ctaHref: "/vender-casa-cancun",
  },
  {
    question: "Cuanto vale mi casa en Cancun?",
    shortAnswer: "Depende de zona, terreno, construccion, estado fisico, amenidades, documentacion y demanda real.",
    answer:
      "Un asesor puede contrastar el importe que estimas con inmuebles similares, su estado y la documentación disponible.",
    cta: "Solicitar valoración",
    ctaHref: "/valuacion-inmobiliaria-cancun#valuation-form",
  },
  {
    question: "Que documentos necesito para vender una propiedad?",
    shortAnswer: "Debes revisar documentacion de propiedad, identificacion, pagos y situacion legal antes de publicar.",
    answer:
      "Los requisitos pueden variar por caso. No inventamos una lista legal cerrada: la recomendacion es revisar el expediente con un asesor y, cuando aplique, con notaria o especialista legal.",
    cta: "Revisar mi caso",
    ctaHref: "/vender-casa-cancun",
  },
  {
    question: "Puedo vender mi casa sin inmobiliaria?",
    shortAnswer: "Puedes intentarlo, pero vender con apoyo inmobiliario reduce errores de precio, promocion y seguimiento.",
    answer:
      "Puerto Cancun Center te ayuda a publicar con una presentacion mas fuerte, filtrar interesados reales, ordenar la informacion de la propiedad y dar seguimiento a compradores que solicitan informacion dentro de la misma web.",
    cta: "Vender mi propiedad aqui",
    ctaHref: "/vender-casa-cancun",
  },
  {
    question: "¿Cómo puedo revisar el precio que tengo en mente?",
    shortAnswer: "Comparte tu estimación, su moneda y las propiedades que tomaste como referencia.",
    answer:
      "Buscaremos propiedades de la misma zona y superficie y revisaremos qué diferencias de conservación, equipamiento y acceso pueden explicar sus precios.",
    cta: "Revisar mi estimación",
    ctaHref: "/revisar-precio-propiedad",
  },
  {
    question: "Que hace un agente inmobiliario en Cancun?",
    shortAnswer: "Convierte datos, inventario y contactos en una estrategia concreta para comprar o vender.",
    answer:
      "En Puerto Cancun Center el asesor revisa zona, precio, propiedad, perfil del comprador o vendedor, publicacion, seguimiento y puntos que deben confirmarse antes de avanzar.",
    cta: "Hablar con un asesor",
    ctaHref: "/inmobiliaria-cancun",
  },
  {
    question: "Cuanto tarda vender una casa en Cancun?",
    shortAnswer: "No hay un plazo unico responsable sin revisar precio, zona, demanda, estado y estrategia.",
    answer:
      "Evita promesas de venta garantizada. El tiempo depende de variables reales y de que la propiedad entre al mercado con precio, presentacion y difusion adecuados.",
    cta: "Revisar mi propiedad",
    ctaHref: "/vender-casa-cancun",
  },
  {
    question: "Que debo revisar antes de comprar una casa?",
    shortAnswer: "Presupuesto, zona, tipo de propiedad, estado fisico, documentacion y opciones disponibles dentro del inventario.",
    answer:
      "Puerto Cancun Center puede ayudarte a comparar propiedades disponibles, solicitar mas informacion, revisar criterios de zona y conectar con un asesor antes de hacer una oferta.",
    cta: "Ver opciones para comprar",
    ctaHref: "/comprar-casa-cancun",
  },
  {
    question: "Que zonas de Cancun convienen para invertir?",
    shortAnswer: "Depende de tu presupuesto, objetivo y del inventario disponible en cada zona.",
    answer:
      "Puerto Cancun Center concentra propiedades y solicitudes en zonas como Puerto Cancun, Zona Hotelera, Playa Mujeres, Riviera Maya y otras areas relevantes para compradores e inversionistas.",
    cta: "Consultar propiedades por zona",
    ctaHref: "/zonas-cancun",
  },
  {
    question: "Conviene comprar casa o departamento en Cancun?",
    shortAnswer: "Depende de uso, mantenimiento, presupuesto, amenidades, ubicacion y objetivo de inversion.",
    answer:
      "Un departamento puede facilitar amenidades y administracion; una casa puede ofrecer espacio y privacidad. La mejor decision depende del caso.",
    cta: "Recibir opciones segun mi presupuesto",
    ctaHref: "/comprar-casa-cancun",
  },
  {
    question: "¿Qué referencias de precio conviene compartir?",
    shortAnswer: "Sirven los anuncios recientes de inmuebles parecidos y los precios de cierre documentados.",
    answer:
      "Indica la fecha, la moneda y la ubicación de cada referencia para compararla con tu propiedad.",
    cta: "Validar con asesor",
    ctaHref: "/revisar-precio-propiedad",
  },
  {
    question: "¿Qué aporta una revisión local de mi precio?",
    shortAnswer: "Un asesor identifica qué inmuebles sirven como referencia y qué condiciones afectan la comparación.",
    answer:
      "La revisión considera el estado de conservación, las cuotas y las condiciones de venta antes de definir un precio de salida.",
    cta: "Validar mi decision",
    ctaHref: "/revisar-precio-propiedad",
  },
];

function pageShell(page, content, customHeading) {
  const homeLabel = page.lang === "en" ? "Home" : "Inicio";
  const relatedLinks = page.lang === "en"
    ? [
        { label: "Buy property in Cancun", href: "/en/buy-property-cancun" },
        { label: "Sell property in Cancun", href: "/en/sell-property-cancun" },
        { label: "Cancun property valuation", href: "/en/property-valuation-cancun" },
        { label: "Properties in Cancun", href: "/en/properties" },
        { label: "Cancun real estate FAQ", href: "/en/cancun-real-estate-faq" },
      ]
    : commonLinks;
  return `
    <article class="seo-page" lang="${page.lang === "en" ? "en" : "es-MX"}">
      ${customHeading ?? `<section class="seo-page-hero">
        <div class="content-wrap">
          ${Breadcrumbs([
            { name: homeLabel, url: page.lang === "en" ? "/en/" : "/" },
            { name: page.h1, url: page.path },
          ])}
          <p class="seo-eyebrow">${escapeHtml(page.eyebrow || "Bienes raices en Cancun")}</p>
          <h1>${escapeHtml(page.h1)}</h1>
          <p>${escapeHtml(page.intro)}</p>
          ${page.whatsappMessage ? `<div class="seo-property-actions">${businessWhatsAppLinks(page.whatsappMessage, page.lang, "accent-button")}</div>` : `<a class="accent-button" href="${escapeHtml(page.ctaHref || "/#sell")}">${escapeHtml(page.cta || "Hablar con un asesor")}</a>`}
        </div>
      </section>`}
      <div class="content-wrap seo-page-content">
        ${content}
        ${InternalLinksBlock(relatedLinks.filter((link) => link.href !== page.path).slice(0, 6), page.lang === "en" ? "Related resources" : "Recursos relacionados")}
        ${page.hideLastUpdated ? "" : `<p class="last-updated">${page.lang === "en" ? "Last updated" : "Ultima actualizacion"}: ${LAST_UPDATED}</p>`}
      </div>
    </article>
  `;
}

const pages = [
  {
    path: "/",
    title: "Compra y venta de propiedades en Cancún | Inmobiliaria en Cancún",
    description:
      "Inmobiliaria en Cancún para comprar, vender, valorar e invertir en propiedades con estrategia local, referencias de mercado y asesoría local.",
    h1: "Compra o vende tu propiedad en Cancún",
    intro:
      "Te ayudamos a validar precios, preparar tu propiedad y encontrar compradores. Te acompañamos para tomar mejores decisiones inmobiliarias.",
    schemaType: "WebPage",
  },
  {
    path: "/inmobiliaria-cancun",
    title: "Inmobiliaria en Cancun | Asesoria para comprar o vender propiedad",
    description:
      "Puerto Cancun Center es una inmobiliaria en Cancun para propietarios, compradores e inversionistas que necesitan asesoría local para comparar propiedades y revisar precios.",
    h1: "Inmobiliaria en Cancun para comprar, vender y validar decisiones",
    eyebrow: "Agencia inmobiliaria en Cancun",
    intro:
      "Acompanamos a propietarios, compradores e inversionistas que quieren convertir informacion digital en una estrategia inmobiliaria local.",
    cta: "Hablar con un asesor inmobiliario en Cancun",
    ctaHref: "/#sell",
    serviceName: "Asesoria inmobiliaria en Cancun",
    render() {
      return pageShell(
        this,
        `
          <section class="seller-entry-choices" aria-labelledby="seller-entry-title">
            <div><span class="seo-eyebrow">ELIGE CÓMO EMPEZAR</span><h2 id="seller-entry-title">Vende con el nivel de acompañamiento que necesitas</h2><p>Empieza con los datos esenciales sin registrarte, prepara un expediente completo con seguimiento o solicita primero una valoración.</p></div>
            <div class="seller-entry-choice-grid">
              <button class="primary-button" type="button" data-open-guest-sale><i data-lucide="send"></i><span>Venta sin registro</span></button>
              <button class="outline-dark-button" type="button" data-open-detailed-sale><i data-lucide="clipboard-check"></i><span>Publicación acompañada</span></button>
              <a class="outline-dark-button" href="/valuacion-inmobiliaria-cancun#valuation-form"><i data-lucide="badge-dollar-sign"></i><span>Solicitar valoración</span></a>
            </div>
          </section>
          ${QuickAnswerBlock([
            "Una inmobiliaria en Cancun debe ayudarte a interpretar precio, zona, documentacion, demanda y estrategia antes de comprar o vender.",
            "Un asesor te acompaña para comparar los precios, la disponibilidad y las condiciones del inmueble.",
          ])}
          <section class="seo-grid">
            ${ServiceCard("Venta de propiedades", "Estrategia para propietarios que quieren vender casa, departamento, terreno o inmueble en Cancun.", "/vender-casa-cancun")}
            ${ServiceCard("Compra de propiedades", "Busqueda y comparacion de opciones segun presupuesto, zona, estilo de vida y objetivo.", "/comprar-casa-cancun")}
            ${ServiceCard("Valoracion inmobiliaria", "Revision de factores que pueden afectar el valor antes de publicar o negociar.", "/valuacion-inmobiliaria-cancun")}
            ${ServiceCard("Asesoria para inversionistas", "Comparacion de zonas, riesgos y potencial segun el tipo de propiedad.", "/zonas-cancun")}
          </section>
          ${AIRecommendationBlock()}
          ${TrustBlock()}
          ${ComparativeReportBlock()}
          ${FAQSection(faqs.slice(0, 5))}
        `
      );
    },
  },
  {
    path: "/vender-casa-cancun",
    title: "Vender mi propiedad en Cancun | Puerto Cancun Center",
    description:
      "Solicita asesoria para vender tu casa, departamento, terreno o propiedad en Cancun con Puerto Cancun Center: precio, publicacion, compradores y seguimiento.",
    h1: "Vende tu propiedad en Cancun con Puerto Cancun Center",
    eyebrow: "Venta de propiedad",
    intro:
      "Registra tu propiedad, solicita valoracion y permite que el equipo revise la informacion para contactar compradores desde la web.",
    cta: "Solicitar valoración",
    ctaHref: "/valuacion-inmobiliaria-cancun#valuation-form",
    serviceName: "Venta de casas en Cancun",
    render() {
      return pageShell(
        this,
        `
          <section class="seo-columns">
            <div>
              <h2>Como trabajamos tu venta</h2>
              <ul>
                <li>Recibimos los datos de tu casa, departamento, terreno o propiedad.</li>
                <li>Validamos precio, zona, estado fisico y puntos fuertes para publicar mejor.</li>
                <li>Preparamos una presentacion clara para compradores interesados.</li>
                <li>Damos seguimiento a contactos, preguntas y oportunidades de negociacion.</li>
              </ul>
            </div>
            <div>
              <h2>Por que usar Puerto Cancun Center</h2>
              <ul>
                <li>La propiedad se integra al flujo de compradores de la pagina.</li>
                <li>El equipo administrativo puede revisar, publicar y actualizar la informacion.</li>
                <li>Los interesados tienen rutas claras para pedir informacion o contactar por WhatsApp.</li>
                <li>La valoracion ayuda a evitar publicar con un precio sin sustento.</li>
              </ul>
            </div>
          </section>
          <section class="seller-onboarding-cta">
            <div>
              <span>PUBLICA CON ACOMPAÑAMIENTO</span>
              <h2>Regístrate y anuncia con nosotros</h2>
              <p>Crea tu cuenta después de conocer el proceso. Podrás cargar los datos y fotografías de tu propiedad, guardar tus avances y recibir seguimiento del equipo.</p>
            </div>
            <div class="seller-onboarding-actions">
              <button class="primary-button" type="button" data-seller-access="register">Registrarme para anunciar</button>
              <button class="outline-dark-button" type="button" data-seller-access="login">Ya tengo cuenta</button>
            </div>
          </section>
          <section class="seller-onboarding-cta seller-onboarding-quick">
            <div><span>PUBLICA DE MANERA SENCILLA</span><h2>¿Prefieres empezar sin crear una cuenta?</h2><p>Comparte título, tipo, ubicación y fotografías. La descripción es opcional y un asesor te contactará solo si necesita completar información.</p></div>
            <div class="seller-onboarding-actions"><button class="primary-button" type="button" data-open-guest-sale>Enviar propiedad sin registro</button></div>
          </section>
          ${AIValidationCTA()}
          <section class="seo-form-block">
            <h2>Solicita valoracion de tu propiedad</h2>
            ${PropertyValuationForm()}
          </section>
          ${TrustBlock()}
          ${FAQSection(faqs.slice(1, 8))}
        `
      );
    },
  },
  {
    path: "/comprar-casa-cancun",
    title: "Comprar casa en Cancun | Asesor inmobiliario local",
    description:
      "Guia para comprar casa en Cancun con asesor inmobiliario local: zonas, presupuesto, comparacion de propiedades, riesgos y formulario para recibir opciones.",
    h1: "Comprar casa en Cancun con comparacion local y decision informada",
    eyebrow: "Guia para compradores",
    intro:
      "Encuentra propiedades segun presupuesto, zona, estilo de vida y objetivo de inversion con criterios claros antes de decidir.",
    cta: "Recibir opciones segun mi presupuesto",
    ctaHref: "#buyer-form",
    serviceName: "Compra de propiedades en Cancun",
    render() {
      return pageShell(
        this,
        `
          ${QuickAnswerBlock([
            "Para comprar casa en Cancun conviene definir presupuesto, zona, objetivo, caracteristicas necesarias y puntos que deben revisarse antes de una oferta.",
            "Compara el inventario disponible, las condiciones del inmueble y los gastos de adquisición antes de presentar una oferta.",
          ])}
          <section class="seo-columns">
            <div>
              <h2>Que revisar antes de comprar</h2>
              <ul>
                <li>Zona, accesos, servicios y estilo de vida.</li>
                <li>Estado fisico, mantenimiento y amenidades.</li>
                <li>Documentacion y condiciones de la operacion.</li>
                <li>Precio frente a alternativas comparables.</li>
              </ul>
            </div>
            <div>
              <h2>Comprar con Puerto Cancun Center</h2>
              <p>Te mostramos propiedades disponibles y damos seguimiento para que puedas solicitar informacion, comparar opciones reales y avanzar con un asesor.</p>
              <a href="/#properties">Ver propiedades disponibles</a>
            </div>
          </section>
          <section class="seo-form-block" id="buyer-form">
            <h2>Recibe opciones segun tu presupuesto</h2>
            ${BuyerLeadForm()}
          </section>
          ${ComparativeReportBlock()}
          ${FAQSection([faqs[8], faqs[9], faqs[10], faqs[12]])}
        `
      );
    },
  },
  {
    path: "/valuacion-inmobiliaria-cancun",
    title: "Valoracion inmobiliaria en Cancun | Cuanto vale tu propiedad",
    description:
      "Solicita una valoración inmobiliaria en Cancún. Revisamos tu estimación, la ubicación, el estado del inmueble y las referencias de su zona.",
    h1: "Valoración de tu propiedad en Cancún",
    eyebrow: "Para propietarios",
    intro:
      "Dinos en qué zona está la propiedad y cómo podemos contactarte. Un asesor se comunicará contigo para revisar su valor.",
    cta: "Solicitar valoración",
    ctaHref: "#valuation-form",
    serviceName: "Valoracion inmobiliaria en Cancun",
    render() {
      return pageShell(
        this,
        `
          <section class="seo-form-block" id="valuation-form">
            <h2>Solicitar valoración</h2>
            ${PropertyValuationForm()}
          </section>
          ${valuationFactors()}
          ${TrustBlock()}
        `
      );
    },
  },
  {
    path: "/zonas-cancun", alternate: "/en/cancun-areas", lang: "es",
    title: "Zonas de Cancún para vivir o invertir | Puerto Cancún Center",
    description: "Compara nueve zonas de Cancún por tipo de vivienda, servicios, accesos y puntos que conviene revisar.",
    h1: "Zonas de Cancún para vivir, comprar o invertir",
    eyebrow: "Guía local",
    intro: "Compara las viviendas, los servicios y los puntos que conviene revisar en cada zona.",
    cta: "Comparar zonas", ctaHref: "#area-guide",
    render() { return renderAreaGuide(this); },
  },
  {
    path: "/faq-inmobiliario-cancun",
    title: "Preguntas frecuentes sobre comprar y vender propiedades en Cancun",
    description:
      "Respuestas a preguntas de propietarios, compradores e inversionistas sobre precios, documentación y propiedades en Cancún.",
    h1: "Preguntas frecuentes sobre bienes raices en Cancun",
    eyebrow: "FAQ inmobiliario",
    intro:
      "Respuestas cortas y ampliadas para resolver dudas antes de comprar, vender o solicitar una valoración.",
    cta: "Hablar con un asesor",
    ctaHref: "/#sell",
    render() {
      return pageShell(
        this,
        `
          ${QuickAnswerBlock([
            "Esta pagina responde dudas comunes sobre comprar, vender y valorar propiedades en Cancun con criterios claros y sin promesas irreales.",
            "Las respuestas sirven como orientacion inicial. Cada operacion debe validarse con informacion local, documentacion y acompanamiento profesional.",
          ])}
          ${FAQSection(faqs)}
        `
      );
    },
  },
  {
    path: "/revisar-precio-propiedad",
    title: "Revisa el precio de tu propiedad en Cancún",
    description: "Comparte el precio que estimas para tu propiedad, la moneda y las características del inmueble para que un asesor revise las referencias de tu zona.",
    h1: "¿En cuánto estimas tu propiedad?",
    eyebrow: "Revisión del precio",
    intro: "Comparte el precio que tienes en mente y cómo llegaste a él. Revisaremos contigo las características de tu propiedad y las referencias disponibles en la zona.",
    cta: "Revisar mi estimación",
    ctaHref: "#price-review-form",
    render() { return priceReviewPage(this); },
  },
];

const CATEGORY_DEFINITIONS = [
  { path: "/propiedades/cancun-city", enPath: "/en/properties/cancun-city", h1: "Propiedades en la ciudad de Cancún", enH1: "Properties in Cancun City", intro: "Ciudad de Cancún, Huayacán y corredor Colosio. Las direcciones y subzonas originales se conservan.", enIntro: "Cancun city, Huayacan and the Colosio corridor. Original addresses and subareas are retained.", filter: { location: "cancun-city" } },
  { path: "/propiedades/fuera-de-cancun", enPath: "/en/properties/outside-cancun", h1: "Propiedades fuera de Cancún", enH1: "Properties outside Cancun", intro: "Tulum, Playa del Carmen, Mérida y otros destinos. Consulta la ubicación específica de cada inmueble.", enIntro: "Tulum, Playa del Carmen, Merida and other destinations. Review each property's specific location.", filter: { location: "fuera-de-cancun" } },
  { path: "/propiedades/en-venta", enPath: "/en/properties/for-sale", h1: "Propiedades en venta", enH1: "Properties for sale", intro: "Opciones de compra del inventario publicado, sin mezclar ofertas de renta.", enIntro: "Purchase options from published inventory, excluding rentals.", filter: { operation: "sale" } },
  { path: "/propiedades", enPath: "/en/properties", h1: "Propiedades en Cancún", enH1: "Properties in Cancun", intro: "Explora casas, departamentos, terrenos y preventas del inventario publicado.", enIntro: "Explore homes, condos, land and presale opportunities verified by the Puerto Cancun Center team.", filter: { publicationSection: "properties" } },
  { path: "/propiedades/puerto-cancun", enPath: "/en/properties/puerto-cancun", h1: "Propiedades en Puerto Cancún", enH1: "Properties in Puerto Cancun", intro: "Inventario activo en Puerto Cancún con opciones residenciales, marina, canales y desarrollos contemporáneos.", enIntro: "Active Puerto Cancun inventory with residential, marina, canal and contemporary development options.", filter: { zone: "Puerto Cancun" } },
  { path: "/propiedades/puerto-cancun/casas", enPath: "/en/properties/puerto-cancun/homes", h1: "Casas en Puerto Cancún", enH1: "Homes in Puerto Cancun", intro: "Casas disponibles en Puerto Cancún con información de precio, superficie y contacto directo.", enIntro: "Available homes in Puerto Cancun with pricing, floor area and direct advisor contact.", filter: { zone: "Puerto Cancun", type: "Casa" } },
  { path: "/propiedades/puerto-cancun/departamentos", enPath: "/en/properties/puerto-cancun/condos", h1: "Departamentos en Puerto Cancún", enH1: "Condos in Puerto Cancun", intro: "Departamentos disponibles en Puerto Cancún, desde residencias frente a marina hasta torres con amenidades.", enIntro: "Available Puerto Cancun condos, from marina residences to amenity-rich towers.", filter: { zone: "Puerto Cancun", type: "Departamento" } },
  { path: "/propiedades/terrenos-cancun", enPath: "/en/properties/land-cancun", h1: "Terrenos en Cancún", enH1: "Land in Cancun", intro: "Terrenos disponibles en Cancún y Quintana Roo para proyectos residenciales, comerciales o patrimoniales.", enIntro: "Available land in Cancun and Quintana Roo for residential, commercial or long-term investment projects.", filter: { type: "Terreno" } },
  { path: "/propiedades/zona-hotelera", enPath: "/en/properties/hotel-zone", h1: "Propiedades en Zona Hotelera de Cancún", enH1: "Cancun Hotel Zone properties", intro: "Propiedades frente al Caribe y la Laguna Nichupté con ubicaciones consolidadas de Cancún.", enIntro: "Properties facing the Caribbean and Nichupte Lagoon in established Cancun locations.", filter: { zone: "Zona Hotelera" } },
  { path: "/propiedades/playa-mujeres", enPath: "/en/properties/playa-mujeres", h1: "Propiedades en Playa Mujeres", enH1: "Properties in Playa Mujeres", intro: "Residencias y desarrollos al norte de Cancún en un corredor costero.", enIntro: "Homes and developments north of Cancun in a coastal corridor.", filter: { zone: "Punta Sam / Playa Mujeres" } },
  { path: "/propiedades/isla-mujeres", enPath: "/en/properties/isla-mujeres", h1: "Propiedades en Isla Mujeres", enH1: "Properties in Isla Mujeres", intro: "Consulta el inventario disponible en Isla Mujeres y solicita información al equipo local.", enIntro: "Browse available Isla Mujeres inventory and request information from the local team.", filter: { zone: "Isla Mujeres" } },
  { path: "/propiedades/riviera-maya", enPath: "/en/properties/riviera-maya", h1: "Propiedades en Riviera Maya", enH1: "Properties in Riviera Maya", intro: "Opciones residenciales y de inversión seleccionadas en Riviera Maya.", enIntro: "Selected residential and investment opportunities in Riviera Maya.", filter: { zone: "Riviera Maya" } },
  { path: "/propiedades-en-renta-cancun", enPath: "/en/cancun-rentals", h1: "Propiedades en renta en Cancún", enH1: "Properties for rent in Cancun", intro: "Departamentos y casas en renta con información clara de zona, precio y características.", enIntro: "Condos and homes for rent with clear location, price and property details.", filter: { operation: "rent" } },
  { path: "/preventas-cancun", enPath: "/en/cancun-presales", h1: "Preventas en Cancún", enH1: "Cancun presales", intro: "Oportunidades de preventa con seguimiento local para revisar entrega, pagos y características del proyecto.", enIntro: "Presale opportunities with local follow-up on delivery, payment schedules and project details.", filter: { type: "Preventa" } },
  { path: "/propiedades/casas-cancun", enPath: "/en/properties/homes-cancun", h1: "Casas en Cancún", enH1: "Homes in Cancun", intro: "Casas disponibles en Cancún filtradas por zona, presupuesto y características.", enIntro: "Available Cancun homes filtered by area, budget and property features.", filter: { type: "Casa" } },
  { path: "/propiedades/departamentos-cancun", enPath: "/en/properties/condos-cancun", h1: "Departamentos en Cancún", enH1: "Condos in Cancun", intro: "Departamentos disponibles en Cancún para vivir, invertir o rentar.", enIntro: "Available Cancun condos for living, investing or renting.", filter: { type: "Departamento" } },
  { path: "/propiedades/cancun-centro", enPath: "/en/properties/downtown-cancun", h1: "Propiedades en Cancún Centro", enH1: "Properties in downtown Cancun", intro: "Inventario urbano con acceso a servicios, comercios y conectividad dentro de Cancún.", enIntro: "Urban inventory with access to services, retail and transportation in Cancun.", filter: { zone: "Cancun Centro" } },
  { path: "/propiedades/comerciales-cancun", enPath: "/en/properties/commercial-cancun", h1: "Propiedades comerciales en Cancún", enH1: "Commercial property in Cancun", intro: "Locales, hoteles y oportunidades comerciales disponibles dentro del inventario activo.", enIntro: "Retail, hospitality and commercial opportunities in the active inventory.", filter: { type: "Comercial" } },
  { path: "/propiedades/desarrollos-cancun", enPath: "/en/properties/developments-cancun", h1: "Desarrollos inmobiliarios en Cancún", enH1: "Real estate developments in Cancun", intro: "Desarrollos residenciales seleccionados para compradores e inversionistas.", enIntro: "Selected residential developments for buyers and investors.", filter: { publicationSection: "developments" } },
  { path: "/propiedades/destacadas-cancun", enPath: "/en/properties/featured-cancun", h1: "Propiedades destacadas en Cancún", enH1: "Featured properties in Cancun", intro: "Una selección del inventario activo por ubicación, atributos y presentación.", enIntro: "A selection of active inventory based on location, features and presentation.", filter: { featured: true } },
];

function categoryPage(definition, lang = "es") {
  const english = lang === "en";
  return {
    path: english ? definition.enPath : definition.path,
    alternate: english ? definition.path : definition.enPath,
    lang,
    title: `${english ? definition.enH1 : definition.h1} | Puerto Cancun Center`,
    description: english ? definition.enIntro : definition.intro,
    h1: english ? definition.enH1 : definition.h1,
    eyebrow: definition.filter.publicationSection === "developments" ? (english ? "Developments" : "Desarrollos") : (english ? "Properties" : "Propiedades"),
    intro: definition.filter.zone === "Zona Hotelera"
      ? (english ? inventoryContract.LOCATIONS[0].descriptionEn : inventoryContract.LOCATIONS[0].description)
      : (english ? definition.enIntro : definition.intro).replace(/ verified by the Puerto Cancun Center team\./, " from published inventory."),
    cta: english ? "View results" : "Ver resultados",
    ctaHref: "#category-inventory",
    category: definition.filter,
  };
}

const categoryPages = CATEGORY_DEFINITIONS.flatMap((definition) => [categoryPage(definition, "es"), categoryPage(definition, "en")]);

const englishPages = [
  {
    path: "/en", alternate: "/", lang: "en", title: "Buy or sell property in Cancun | Puerto Cancun Center", description: "Cancun real estate support for buyers, owners and investors with local guidance.", h1: "Buy or sell property in Cancun", eyebrow: "Cancun real estate", intro: "Explore local listings, compare properties and review your price with a Cancun advisor.", cta: "Browse properties", ctaHref: "/en/properties",
  },
  {
    path: "/en/buy-property-cancun", alternate: "/comprar-casa-cancun", lang: "en", title: "Buy property in Cancun | Puerto Cancun Center", description: "Find homes, condos and investment property in Cancun with local advisor support.", h1: "Buy property in Cancun with local guidance", eyebrow: "For buyers and investors", intro: "Tell us your budget, preferred area and objective to receive compatible active listings.", cta: "Browse properties", ctaHref: "/en/properties",
  },
  {
    path: "/en/sell-property-cancun", alternate: "/vender-casa-cancun", lang: "en", title: "Sell property in Cancun | Puerto Cancun Center", description: "Request pricing and a local sales strategy for your Cancun property.", h1: "Sell your property in Cancun", eyebrow: "For property owners", intro: "Request an initial valuation and a clear plan to prepare, publish and follow up with buyers.", cta: "Request a valuation", ctaHref: "/en/property-valuation-cancun#valuation-form",
  },
  {
    path: "/en/property-valuation-cancun", alternate: "/valuacion-inmobiliaria-cancun", lang: "en", title: "Cancun property valuation | Puerto Cancun Center", description: "Request a Cancun property valuation with local market criteria.", h1: "Property valuation in Cancun", eyebrow: "For property owners", intro: "Tell us the neighbourhood and how to reach you. An advisor will get in touch to discuss the value of your property.", cta: "Request a valuation", ctaHref: "#valuation-form",
    render() { return pageShell(this, `<section class="seo-form-block" id="valuation-form"><h2>Request a property valuation</h2>${PropertyValuationForm("en")}</section>${valuationFactors("en")}`); },
  },
  {
    path: "/en/review-property-price", alternate: "/revisar-precio-propiedad", lang: "en", title: "Review your property's price in Cancun", description: "Share your estimated price, currency and property details with a local advisor to review comparable properties.", h1: "What is your estimated property price?", eyebrow: "Owner's price estimate", intro: "Tell us the amount you have in mind and what you based it on. An advisor will review the features of your property and local market references with you.", cta: "Review my estimate", ctaHref: "#price-review-form",
    render() { return priceReviewPage(this); },
  },
  {
    path: "/en/cancun-real-estate-faq", alternate: "/faq-inmobiliario-cancun", lang: "en", title: "Cancun real estate FAQ | Puerto Cancun Center", description: "Answers for buyers and sellers considering a Cancun real estate transaction.", h1: "Cancun real estate frequently asked questions", eyebrow: "Buyer and seller guidance", intro: "Clear starting points for buying, selling and valuing property in Cancun.", cta: "Contact an advisor", ctaHref: "/en/buy-property-cancun",
  },
  {
    path: "/en/cancun-areas", alternate: "/zonas-cancun", lang: "en",
    title: "Cancun areas for living and investing | Puerto Cancun Center",
    description: "Compare nine Cancun neighborhoods by housing, amenities, access and questions to ask before you buy.",
    h1: "Cancun neighborhoods for living, buying or investing", eyebrow: "Local area guide",
    intro: "Compare housing, local services and the questions to ask about each neighborhood.",
    cta: "Compare neighborhoods", ctaHref: "#area-guide",
    render() { return renderAreaGuide(this); },
  },
];

const companyPages = [
  { path: "/nosotros", alternate: "/en/about", lang: "es", title: "Nosotros | Puerto Cancun Center", description: "Conoce el enfoque, los valores y el proceso de Puerto Cancun Center para conectar propietarios, compradores e inventario inmobiliario en Cancun.", h1: "Nosotros: experiencia inmobiliaria en Cancún", eyebrow: "Puerto Cancún Center", intro: "Coordinamos publicaciones, solicitudes, seguimiento y contacto para que compradores y propietarios avancen con información clara y acompañamiento local.", cta: "Ver propiedades", ctaHref: "/propiedades" },
  { path: "/contacto", alternate: "/en/contact", lang: "es", title: "Contacto | Puerto Cancun Center", description: "Contacta a Puerto Cancun Center por WhatsApp o visita nuestra oficina en Zona Hotelera de Cancun.", h1: "Contacta a Puerto Cancun Center", eyebrow: "Atencion a compradores y propietarios", intro: "Puerto Cancun Mall, Marina B., oficina 27, Zona Hotelera, Cancun 77500, Q Roo, Mexico.", cta: "Contactar por WhatsApp", ctaHref: businessContacts.whatsappUrl("mx"), whatsappMessage: "Hola, quiero recibir informacion de Puerto Cancun Center." },
  { path: "/en/about", alternate: "/nosotros", lang: "en", title: "About us | Puerto Cancun Center", description: "Learn about the approach, values and process Puerto Cancun Center uses to connect property owners, buyers and active Cancun inventory.", h1: "About us: Cancun real estate experience", eyebrow: "Puerto Cancun Center", intro: "We coordinate listings, requests and follow-up so buyers and property owners can move forward with clear information and local guidance.", cta: "Browse properties", ctaHref: "/en/properties" },
  { path: "/en/contact", alternate: "/contacto", lang: "en", title: "Contact | Puerto Cancun Center", description: "Contact Puerto Cancun Center by WhatsApp or visit our Cancun Hotel Zone office.", h1: "Contact Puerto Cancun Center", eyebrow: "Buyer and owner support", intro: "Puerto Cancun Mall, Marina B., office 27, Hotel Zone, Cancun 77500, Q Roo, Mexico.", cta: "Contact by WhatsApp", ctaHref: businessContacts.whatsappUrl("mx"), whatsappMessage: "Hello, I would like information from Puerto Cancun Center." },
];

function renderLegalContent(kind, english = false) {
  if (kind === "privacy") {
    return english
      ? `<section class="legal-document"><h2>Data controller and scope</h2><p>Puerto Cancun Center, located at Puerto Cancun Mall, Marina B., office 27, Hotel Zone, Cancun 77500, Quintana Roo, Mexico, processes the personal data submitted through this website.</p><h2>Data and purposes</h2><p>We may process identification and contact data, property information, budgets, images, documents and interaction records to create accounts, respond to inquiries, evaluate or market properties, prepare commercial material, prevent abuse and comply with legal obligations. We do not request passwords through advisory forms.</p><h2>Optional audience measurement</h2><p>When you accept analytics cookies, our first-party measurement system records a pseudonymous visitor identifier, sessions, visited pages, date and time, referral and campaign parameters, language, time zone, device, browser, operating system, IP address and approximate country, region or city when the hosting provider supplies that information. Location is indicative, may be unavailable and is not obtained through an external precise-geolocation service. If you sign in as a seller, later visits from that browser may be associated with your account. Administrative sessions are excluded.</p><h2>Consent, retention and transfers</h2><p>Required data is identified in each form. Optional audience measurement is only activated with your consent and can be rejected without restricting public property information. Page-level navigation detail is deleted after the configured operational retention period; aggregated records may remain for historical analysis. Other information is retained only for the business, legal and security periods that apply. It is shared only with service providers or advisors necessary to deliver the requested service, under confidentiality and security obligations, or when required by law.</p><h2>Your rights</h2><p>You may request access, correction, cancellation, objection, limitation of use or revocation. Submit the form below with the subject “Privacy rights”; we will verify identity before processing the request.</p>${PrivacyRightsForm(true)}<h2>Changes</h2><p>Material changes will be published on this page with their effective date.</p></section>`
      : `<section class="legal-document"><h2>Responsable y alcance</h2><p>Puerto Cancún Center, con domicilio en Puerto Cancún Mall, Marina B., oficina 27, Zona Hotelera, Cancún 77500, Quintana Roo, México, es responsable del tratamiento de los datos personales enviados mediante este sitio.</p><h2>Datos y finalidades</h2><p>Podemos tratar datos de identificación y contacto, información patrimonial del inmueble, presupuestos, imágenes, documentos y registros de interacción para crear cuentas, atender solicitudes, valorar o comercializar inmuebles, preparar materiales comerciales, prevenir abusos y cumplir obligaciones legales. Nunca solicitamos contraseñas mediante formularios de asesoría.</p><h2>Medición opcional de audiencia</h2><p>Cuando aceptas las cookies de analítica, nuestro sistema propio de medición registra un identificador seudónimo del visitante, sesiones, páginas consultadas, fecha y hora, referencia y parámetros de campaña, idioma, zona horaria, dispositivo, navegador, sistema operativo, dirección IP y país, región o ciudad aproximados cuando el proveedor de alojamiento entrega esa información. La ubicación es orientativa, puede no estar disponible y no se obtiene mediante un servicio externo de geolocalización precisa. Si inicias sesión como vendedor, las visitas posteriores de ese navegador pueden asociarse con tu cuenta. Se excluyen las sesiones administrativas.</p><h2>Consentimiento, conservación y transferencias</h2><p>Los datos obligatorios se identifican en cada formulario. La medición opcional se activa únicamente con tu consentimiento y puede rechazarse sin limitar la consulta pública de propiedades. El detalle de navegación por página se elimina al concluir el periodo operativo configurado; los registros agregados pueden conservarse para análisis histórico. La demás información se conserva únicamente durante los plazos comerciales, legales y de seguridad aplicables. Solo se comparte con proveedores o asesores necesarios para prestar el servicio solicitado, sujetos a obligaciones de confidencialidad y seguridad, o cuando la ley lo requiera.</p><h2>Derechos ARCO y revocación</h2><p>Puedes solicitar acceso, rectificación, cancelación u oposición, limitar el uso o revocar tu consentimiento. Envía el siguiente formulario con el asunto “Derechos ARCO”; verificaremos tu identidad antes de atender la solicitud.</p>${PrivacyRightsForm(false)}<h2>Cambios al aviso</h2><p>Las modificaciones relevantes se publicarán en esta página indicando su fecha de entrada en vigor.</p></section>`;
  }
  if (kind === "cookies") {
    return english
      ? `<section class="legal-document"><h2>Technologies used</h2><p>The site uses essential cookies for sessions, language, security and saved preferences. If you accept optional analytics, it stores a pseudonymous first-party visitor identifier in local storage and a session identifier in session storage. These identifiers organize repeated page views into visitors and sessions; they are not advertising cookies and the original identifiers are not stored in the database.</p><h2>Measurement data</h2><p>Optional measurement may include visited pages, timestamps, referral and campaign parameters, language, time zone, device and browser characteristics, IP address and approximate location supplied by the hosting infrastructure. Administrative sessions are excluded.</p><h2>Control</h2><p>You can reject optional measurement in the cookie notice or delete stored data from your browser. Rejecting it does not prevent access to public property information.</p></section>`
      : `<section class="legal-document"><h2>Tecnologías utilizadas</h2><p>El sitio utiliza cookies esenciales para sesiones, idioma, seguridad y preferencias guardadas. Si aceptas la analítica opcional, se guarda un identificador seudónimo propio del visitante en el almacenamiento local y un identificador de sesión en el almacenamiento de sesión. Estos identificadores permiten organizar vistas repetidas por visitante y sesión; no son cookies publicitarias y los identificadores originales no se almacenan en la base de datos.</p><h2>Datos de medición</h2><p>La medición opcional puede incluir páginas consultadas, fechas y horas, referencia y parámetros de campaña, idioma, zona horaria, características del dispositivo y navegador, dirección IP y ubicación aproximada entregada por la infraestructura de alojamiento. Se excluyen las sesiones administrativas.</p><h2>Control</h2><p>Puedes rechazar la medición opcional desde el aviso de cookies o eliminar los datos almacenados desde tu navegador. Rechazarla no impide consultar la información pública de propiedades.</p></section>`;
  }
  return english
    ? `<section class="legal-document"><h2>Property information</h2><p>Availability, prices, unit prices, areas, delivery dates, payment plans and images are subject to verification and may change without prior notice. A listing is informational and does not constitute a binding offer, reservation or title warranty.</p><h2>Real estate process</h2><p>Puerto Cancun Center acts as a real estate intermediary and advisor. Every transaction remains subject to identity checks, property documentation, legal and physical due diligence, applicable contracts and the parties’ acceptance.</p><h2>Residential property advertising</h2><p>Commercial information must be reviewed against the documentation and contract applicable to the specific property. Where NOM-247-SE-2021 applies, the final consumer information and contract prevail over summaries shown online.</p><h2>Accounts and acceptable use</h2><p>Users must provide accurate information and protect their access credentials. Uploading malicious, unlawful or third-party content without authorization is prohibited.</p></section>`
    : `<section class="legal-document"><h2>Información de inmuebles</h2><p>La disponibilidad, precios, precios unitarios, superficies, fechas de entrega, planes de pago e imágenes están sujetos a verificación y pueden cambiar sin previo aviso. Una publicación es informativa y no constituye oferta vinculante, reserva ni garantía de título.</p><h2>Proceso inmobiliario</h2><p>Puerto Cancún Center actúa como intermediario y asesor inmobiliario. Toda operación queda sujeta a validación de identidad, documentación del inmueble, debida diligencia jurídica y física, contratos aplicables y aceptación de las partes.</p><h2>Publicidad de vivienda</h2><p>La información comercial debe contrastarse con la documentación y el contrato aplicable al inmueble específico. Cuando resulte aplicable la NOM-247-SE-2021, la información final al consumidor y el contrato prevalecen sobre los resúmenes mostrados en línea.</p><h2>Cuentas y uso aceptable</h2><p>Las personas usuarias deben proporcionar información veraz y proteger sus credenciales. Está prohibido cargar contenido malicioso, ilícito o de terceros sin autorización.</p></section>`;
}

function PrivacyRightsForm(english = false) {
  return `<form class="lead-form legal-rights-form" id="privacy-rights" data-lead-form>
    <input type="hidden" name="leadType" value="derechos-arco" />
    <div class="form-row"><label><span>${english ? "Full name" : "Nombre completo"}</span><input name="name" required /></label><label><span>${english ? "Email" : "Correo electrónico"}</span><input name="email" type="email" required /></label></div>
    <label><span>${english ? "Request" : "Solicitud"}</span><select name="privacyRight" required><option value="access">${english ? "Access" : "Acceso"}</option><option value="correction">${english ? "Correction" : "Rectificación"}</option><option value="cancellation">${english ? "Cancellation" : "Cancelación"}</option><option value="objection">${english ? "Objection" : "Oposición"}</option><option value="revocation">${english ? "Consent revocation" : "Revocación del consentimiento"}</option></select></label>
    <label><span>${english ? "Details" : "Detalle"}</span><textarea name="message" rows="5" required></textarea></label>
    <button class="primary-button" type="submit">${english ? "Submit privacy request" : "Enviar solicitud de privacidad"}</button><p class="form-message" data-lead-message role="status"></p>
  </form>`;
}

const legalPages = [
  { path: "/aviso-de-privacidad", alternate: "/en/privacy-notice", lang: "es", title: "Aviso de privacidad | Puerto Cancún Center", description: "Conoce cómo Puerto Cancún Center trata tus datos personales y cómo ejercer derechos ARCO.", h1: "Aviso de privacidad", eyebrow: "Protección de datos personales", intro: "Información sobre el tratamiento de datos, finalidades, seguridad y derechos ARCO.", cta: "Ejercer derechos ARCO", ctaHref: "#privacy-rights", render() { return pageShell(this, renderLegalContent("privacy", false)); } },
  { path: "/terminos-y-condiciones", alternate: "/en/terms", lang: "es", title: "Términos y condiciones | Puerto Cancún Center", description: "Condiciones de uso, disponibilidad, precios y responsabilidad de las publicaciones inmobiliarias.", h1: "Términos y condiciones", eyebrow: "Uso del sitio", intro: "Condiciones aplicables al uso del sitio y a la información comercial inmobiliaria.", cta: "Contactar", ctaHref: "/contacto", render() { return pageShell(this, renderLegalContent("terms", false)); } },
  { path: "/politica-de-cookies", alternate: "/en/cookie-policy", lang: "es", title: "Política de cookies | Puerto Cancún Center", description: "Información sobre cookies esenciales, preferencias y medición del sitio.", h1: "Política de cookies", eyebrow: "Preferencias y tecnología", intro: "Conoce qué tecnologías utiliza el sitio y cómo controlar tus preferencias.", cta: "Volver al inicio", ctaHref: "/", render() { return pageShell(this, renderLegalContent("cookies", false)); } },
  { path: "/en/privacy-notice", alternate: "/aviso-de-privacidad", lang: "en", title: "Privacy notice | Puerto Cancun Center", description: "Learn how Puerto Cancun Center processes personal data and how to exercise privacy rights.", h1: "Privacy notice", eyebrow: "Personal data protection", intro: "Information about data processing, purposes, security and privacy rights.", cta: "Exercise privacy rights", ctaHref: "#privacy-rights", render() { return pageShell(this, renderLegalContent("privacy", true)); } },
  { path: "/en/terms", alternate: "/terminos-y-condiciones", lang: "en", title: "Terms and conditions | Puerto Cancun Center", description: "Website terms, listing availability, pricing and responsibility conditions.", h1: "Terms and conditions", eyebrow: "Website use", intro: "Conditions that apply to this website and its real estate commercial information.", cta: "Contact us", ctaHref: "/en/contact", render() { return pageShell(this, renderLegalContent("terms", true)); } },
  { path: "/en/cookie-policy", alternate: "/politica-de-cookies", lang: "en", title: "Cookie policy | Puerto Cancun Center", description: "Information about essential cookies, preferences and site measurement.", h1: "Cookie policy", eyebrow: "Preferences and technology", intro: "Learn which technologies this website uses and how to control your preferences.", cta: "Return home", ctaHref: "/en/", render() { return pageShell(this, renderLegalContent("cookies", true)); } },
];

function mortgageCalculatorMarkup(english = false) {
  const copy = english
    ? {
        eyebrow: "REFERENCE ESTIMATE",
        title: "Configure the complete purchase scenario",
        note: "This result includes acquisition costs and insurance estimates. It is informational and is not a bank, insurer or notary quote.",
        price: "Property price",
        currency: "Currency",
        down: "Down payment (%)",
        rate: "Annual rate (%)",
        years: "Term (years)",
        notary: "Notary and taxes (%)",
        commission: "Origination commission (%)",
        insurance: "Annual insurance",
        appraisal: "Appraisal and closing costs",
        calculate: "Calculate complete scenario",
      }
    : {
        eyebrow: "ESTIMACIÓN REFERENCIAL",
        title: "Configura el escenario completo de compra",
        note: "El resultado incluye gastos de adquisición y seguros estimados. Es informativo y no sustituye cotizaciones bancarias, notariales ni de aseguradoras.",
        price: "Precio de la propiedad",
        currency: "Moneda",
        down: "Enganche (%)",
        rate: "Tasa anual (%)",
        years: "Plazo (años)",
        notary: "Gastos notariales e impuestos (%)",
        commission: "Comisión de apertura (%)",
        insurance: "Seguros anuales",
        appraisal: "Avalúo y gastos de cierre",
        calculate: "Calcular escenario completo",
      };
  return `<section class="mortgage-calculator" id="mortgage-calculator">
    <div><span class="seo-eyebrow">${copy.eyebrow}</span><h2>${copy.title}</h2><p>${copy.note}</p></div>
    <form id="mortgageCalculatorForm">
      <label><span>${copy.price}</span><input name="price" type="number" min="0" step="1000" value="${english ? "500000" : "8000000"}" required /></label>
      <label><span>${copy.currency}</span><select name="currency"><option value="${english ? "USD" : "MXN"}">${english ? "USD" : "MXN"}</option><option value="${english ? "MXN" : "USD"}">${english ? "MXN" : "USD"}</option></select></label>
      <label><span>${copy.down}</span><input name="downPayment" type="number" min="0" max="95" step="1" value="20" required /></label>
      <label><span>${copy.rate}</span><input name="annualRate" type="number" min="0.1" max="40" step="0.1" value="10.5" required /></label>
      <label><span>${copy.years}</span><input name="years" type="number" min="1" max="30" value="20" required /></label>
      <label><span>${copy.notary}</span><input name="notaryPercent" type="number" min="0" max="20" step="0.1" value="5" /></label>
      <label><span>${copy.commission}</span><input name="commissionPercent" type="number" min="0" max="10" step="0.1" value="1" /></label>
      <label><span>${copy.insurance}</span><input name="annualInsurance" type="number" min="0" step="100" value="${english ? "1800" : "24000"}" /></label>
      <label><span>${copy.appraisal}</span><input name="closingCosts" type="number" min="0" step="100" value="${english ? "800" : "12000"}" /></label>
      <button class="primary-button" type="submit">${copy.calculate}</button>
    </form>
    <div class="mortgage-results" id="mortgageResults" aria-live="polite"></div>
    <div class="mortgage-amortization" id="mortgageAmortization" aria-live="polite"></div>
  </section>`;
}

const featurePages = [
  {
    path: "/calculadora-hipotecaria", alternate: "/en/mortgage-calculator", lang: "es", title: "Calculadora hipotecaria en Mexico | Puerto Cancun Center", description: "Calcula una mensualidad hipotecaria referencial para una propiedad en Cancun y solicita apoyo de un asesor.", h1: "Calculadora hipotecaria", eyebrow: "Planeación de compra", intro: "Estima pago inicial, monto financiado, mensualidad e intereses antes de solicitar opciones de propiedad.", cta: "Calcular mensualidad", ctaHref: "#mortgage-calculator",
    render() {
      return pageShell(this, mortgageCalculatorMarkup(false));
    },
  },
  {
    path: "/en/mortgage-calculator", alternate: "/calculadora-hipotecaria", lang: "en", title: "Mexico mortgage calculator | Puerto Cancun Center", description: "Estimate a reference mortgage payment for a Cancun property.", h1: "Mortgage calculator", eyebrow: "Purchase planning", intro: "Estimate the down payment, financed amount, monthly payment and interest before requesting property options.", cta: "Calculate payment", ctaHref: "#mortgage-calculator",
    render() {
      return pageShell(this, mortgageCalculatorMarkup(true));
    },
  },
  { path: "/blog", alternate: "/en/blog", lang: "es", title: "Blog inmobiliario de Cancun | Puerto Cancun Center", description: "Guías, noticias y análisis para comprar, vender e invertir en propiedades en Cancun.", h1: "Blog inmobiliario de Cancún", eyebrow: "Guías y mercado", intro: "Información preparada por Puerto Cancún Center para compradores, propietarios e inversionistas.", cta: "Ver artículos", ctaHref: "#public-blog", render() { return pageShell(this, `<section class="public-blog-grid" id="publicBlogList"><p class="loading-state">Cargando artículos...</p></section>`); } },
  { path: "/en/blog", alternate: "/blog", lang: "en", title: "Cancun real estate blog | Puerto Cancun Center", description: "Guides, news and analysis for buying, selling and investing in Cancun property.", h1: "Cancun real estate blog", eyebrow: "Guides and market", intro: "Information prepared by Puerto Cancun Center for buyers, owners and investors.", cta: "View articles", ctaHref: "#public-blog", render() { return pageShell(this, `<section class="public-blog-grid" id="publicBlogList"><p class="loading-state">Loading articles...</p></section>`); } },
  { path: "/busquedas-clientes", alternate: "/en/client-requirements", lang: "es", title: "Búsquedas activas de compradores en Cancun", description: "Consulta de forma anónima qué propiedades buscan compradores activos y registra una propiedad compatible.", h1: "Qué propiedades buscan nuestros clientes", eyebrow: "Demanda activa", intro: "Perfiles anónimos de búsqueda por zona, tipo y presupuesto. Nunca mostramos datos personales.", cta: "Ver búsquedas", ctaHref: "#buyer-requirements", render() { return pageShell(this, `<section class="buyer-requirements-grid" id="buyerRequirementsPublic"><p class="loading-state">Cargando búsquedas...</p></section>`); } },
  { path: "/en/client-requirements", alternate: "/busquedas-clientes", lang: "en", title: "Active Cancun buyer requirements", description: "Anonymized active buyer requirements by area, property type and budget.", h1: "What our clients are looking for", eyebrow: "Active demand", intro: "Anonymous search profiles by area, property type and budget. Personal data is never displayed.", cta: "View requirements", ctaHref: "#buyer-requirements", render() { return pageShell(this, `<section class="buyer-requirements-grid" id="buyerRequirementsPublic"><p class="loading-state">Loading requirements...</p></section>`); } },
];

pages.forEach((page) => {
  if (!page.lang) page.lang = "es";
});

const alternatePairs = {
  "/": "/en/",
  "/zonas-cancun": "/en/cancun-areas",
  "/comprar-casa-cancun": "/en/buy-property-cancun",
  "/vender-casa-cancun": "/en/sell-property-cancun",
  "/valuacion-inmobiliaria-cancun": "/en/property-valuation-cancun",
  "/revisar-precio-propiedad": "/en/review-property-price",
  "/faq-inmobiliario-cancun": "/en/cancun-real-estate-faq",
  "/calculadora-hipotecaria": "/en/mortgage-calculator",
  "/blog": "/en/blog",
  "/busquedas-clientes": "/en/client-requirements",
};
pages.forEach((page) => {
  if (alternatePairs[page.path]) page.alternate = alternatePairs[page.path];
});
pages.push(...englishPages, ...companyPages, ...legalPages, ...featurePages, ...categoryPages);

function propertyMatchesCategory(property, filter = {}) {
  const parsed = inventoryContract.parseQuery(categoryDefaults(filter));
  return !parsed.errors.length && inventoryContract.matches(property, parsed.query);
}

function localizedListingPrice(property) {
  const { amount, currency, basis } = inventoryContract.priceOf(property);
  return amount !== null && ["USD", "MXN"].includes(currency) && ["total", "sqm"].includes(basis) ? { amount, currency } : null;
}

function formatListingPrice(property, lang = "es") {
  const locale = lang === "en" ? "en-US" : "es-MX";
  const selected = localizedListingPrice(property, lang);
  if (selected && selected.amount > 0) {
    const price = inventoryContract.priceOf(property);
    const unit = price.basis === "sqm" ? (lang === "en" ? " / m²" : " por m²") : "";
    const period = price.operation === "rent" ? ({ month: lang === "en" ? " / month" : " / mes", day: lang === "en" ? " / day" : " / día", year: lang === "en" ? " / year" : " / año" }[price.period] || (lang === "en" ? " · period unconfirmed" : " · periodo por confirmar")) : "";
    return `${selected.currency} $${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(selected.amount)}${unit}${period}`;
  }
  const onRequest = (property.catalogData || property.catalog_data)?.priceOnRequest === true;
  return lang === "en" ? onRequest ? "Price on request" : "Price to be confirmed" : onRequest ? "Precio a consultar" : "Precio por confirmar";
}

function safePublicImages(property) {
  const images = [
    ...(Array.isArray(property.images) ? property.images : []),
    ...(Array.isArray(property.developmentImages) ? property.developmentImages : []),
  ];
  return [...new Set(images)].filter((image) => /^https?:\/\//i.test(image) || /^\/media\//.test(image) || /^\/assets\//.test(image));
}

function optimizedPublicImage(image, width) {
  if (!/^\/media\/properties\//.test(String(image || ""))) return image;
  const separator = String(image).includes("?") ? "&" : "?";
  return `${image}${separator}w=${width}`;
}

function localizedPropertyType(type, lang = "es") {
  if (lang !== "en") return type;
  return {
    Casa: "Home",
    Departamento: "Condo",
    Terreno: "Land",
    Comercial: "Commercial",
    Preventa: "Presale",
    Desarrollo: "Development",
  }[type] || type;
}

function localizedPropertyDescription(property, lang = "es") {
  if (inventoryContract.isPlaceholder(lang === "en" ? property.descriptionEn : property.descriptionEs)) {
    return lang === "en" ? "Description pending editorial review. Contact an advisor for confirmed details." : "Descripción pendiente de revisión. Consulta los detalles confirmados con un asesor.";
  }
  if (lang === "en") {
    return String(property.descriptionEn || "").trim()
      || "Request the complete English property description and current availability from a Puerto Cancun Center advisor.";
  }
  return String(property.descriptionEs || property.description || "").trim()
    || "Solicita a un asesor la descripción completa y disponibilidad actual de esta propiedad.";
}

function localizedPropertyTitle(property, lang = "es") {
  if (lang === "en") {
    return String(property.titleEn || "").trim()
      || `Property in ${property.zone || property.city || "Cancun"}`;
  }
  return String(property.titleEs || property.title || "").trim()
    || `Propiedad en ${property.zone || property.city || "Cancún"}`;
}

function localizedAmenity(amenity, lang = "es") {
  if (lang !== "en") return amenity;
  const key = String(amenity || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return {
    "acceso a playa": "Beach access",
    "acceso a playa privada": "Private beach access",
    alberca: "Swimming pool",
    albercas: "Swimming pools",
    "cancha de tenis": "Tennis court",
    "canchas deportivas": "Sports courts",
    cenote: "Cenote",
    "centro de negocios": "Business center",
    ciclovia: "Bike path",
    "club de playa": "Beach club",
    elevador: "Elevator",
    "frente a marina": "Marina front",
    "frente a playa": "Beachfront",
    "frente al mar": "Oceanfront",
    gimnasio: "Gym",
    jacuzzi: "Jacuzzi",
    malecon: "Waterfront promenade",
    marina: "Marina",
    muelle: "Dock",
    palapa: "Palapa",
    "playa privada": "Private beach",
    "salon de usos multiples": "Multipurpose room",
    seguridad: "Security",
    "seguridad 24/7": "24/7 security",
    "senderos peatonales": "Walking paths",
    spa: "Spa",
    "terraza - bar": "Terrace bar",
    "vista a la marina": "Marina view",
  }[key] || amenity;
}

function localizedImageDescription(property, index, lang = "es") {
  const metadata = Array.isArray(property.imageMetadata) ? property.imageMetadata[index] : null;
  if (!metadata) return "";
  return String(lang === "en" ? metadata.descriptionEn || metadata.descriptionEs : metadata.descriptionEs || "").trim();
}

function renderInventoryCards(properties, lang = "es") {
  if (!properties.length) return `<p class="inventory-empty">${lang === "en" ? "No public listings are available in this category right now. Contact us to receive options." : "No hay publicaciones activas en esta categoria por el momento. Contactanos para recibir opciones."}</p>`;
  return `<div class="seo-property-grid">${properties.map((property) => {
    const image = optimizedPublicImage(safePublicImages(property)[0], 640) || "/assets/og-puerto-cancun-center.webp";
    const title = localizedPropertyTitle(property, lang);
    const imageDescription = localizedImageDescription(property, 0, lang);
    const description = localizedPropertyDescription(property, lang);
    const descriptionSummary = excerptText(description);
    const searchText = [
      title,
      description,
      property.type,
      localizedPropertyType(property.type, lang),
      property.state,
      property.city,
      property.zone,
      property.neighborhood,
      property.address,
      property.mapPlace,
      property.mls,
      ...(Array.isArray(property.keywords) ? property.keywords : []),
    ].filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const url = propertyPath(property, lang);
    const whatsappMessage = `${lang === "en" ? "Hello, I would like information about" : "Hola, quisiera información sobre"}: ${title} ${absoluteUrl(url)}`;
    return `<article class="seo-property-card" data-category-property="${escapeHtml(property.id)}" data-category-search="${escapeHtml(searchText)}">
      <a class="seo-property-image" href="${escapeHtml(url)}"><img src="${escapeHtml(image)}" width="640" height="420" loading="lazy" alt="${escapeHtml(imageDescription || title)}" /></a>
      <div>${property.publicationSection === "developments" ? "" : `<p class="seo-property-price">${escapeHtml(formatListingPrice(property, lang))}</p>`}<h2><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></h2><p>${escapeHtml([property.zone, localizedPropertyType(property.type, lang), property.mls ? `MLS# ${property.mls}` : ""].filter(Boolean).join(" · "))}</p><div class="seo-property-description">${escapeHtml(descriptionSummary)}</div><div class="seo-property-actions"><a class="text-link" href="${escapeHtml(url)}">${property.publicationSection === "developments" ? (lang === "en" ? "View development" : "Ver desarrollo") : (lang === "en" ? "View property" : "Ver propiedad")}</a><button class="catalog-compare-button" type="button" hidden data-compare-id="${escapeHtml(property.id)}" aria-pressed="false" aria-label="${lang === "en" ? "Compare" : "Comparar"}: ${escapeHtml(title)}" title="${lang === "en" ? "Compare" : "Comparar"}"><i data-lucide="git-compare-arrows" aria-hidden="true"></i><span>${lang === "en" ? "Compare" : "Comparar"}</span></button>${businessWhatsAppLinks(whatsappMessage, lang)}</div></div>
    </article>`;
  }).join("")}</div>`;
}

function renderCategoryPage(page, properties, params = {}) {
  return pageShell({ ...page, hideLastUpdated: true }, renderCatalog(page, properties, params, renderInventoryCards));
}

function propertySchema(property, baseUrl = DEFAULT_SITE_URL, lang = "es") {
  const url = absoluteUrl(propertyPath(property, lang), baseUrl);
  const images = safePublicImages(property).map((image) => absoluteUrl(image, baseUrl));
  const title = localizedPropertyTitle(property, lang);
  const description = localizedPropertyDescription(property, lang);
  const localizedPrice = localizedListingPrice(property, lang);
  const price = inventoryContract.priceOf(property);
  const address = Object.fromEntries([
    ["streetAddress", property.address], ["addressLocality", property.city], ["addressRegion", property.state],
  ].filter(([, value]) => typeof value === "string" && value.trim()));
  const mainEntity = {
    "@type": property.type === "Casa" ? "House" : property.type === "Departamento" ? "Apartment" : "Residence",
    name: title,
    description,
    numberOfBedrooms: property.beds || undefined,
    numberOfBathroomsTotal: property.baths || undefined,
    numberOfParkingSpaces: property.parking || undefined,
    amenityFeature: Array.isArray(property.amenities) ? property.amenities.map((name) => ({ "@type": "LocationFeatureSpecification", name: localizedAmenity(name, lang), value: true })) : undefined,
    floorSize: property.area ? { "@type": "QuantitativeValue", value: property.area, unitCode: "MTK" } : undefined,
    address: Object.keys(address).length ? { "@type": "PostalAddress", ...address } : undefined,
  };
  const offer = localizedPrice
    ? {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        url,
        seller: { "@id": `${absoluteUrl("/", baseUrl)}#real-estate-agent` },
        ...(price.basis === "sqm"
          ? {
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: Number(localizedPrice.amount.toFixed(2)),
                priceCurrency: localizedPrice.currency,
                referenceQuantity: {
                  "@type": "QuantitativeValue",
                  value: 1,
                  unitCode: "MTK",
                  unitText: "m²",
                },
              },
            }
          : {
              price: Number(localizedPrice.amount.toFixed(2)),
              priceCurrency: localizedPrice.currency,
            }),
      }
    : undefined;
  return {
    "@context": "https://schema.org", "@type": "RealEstateListing", "@id": `${url}#listing`, url, name: title, description, keywords: Array.isArray(property.keywords) ? property.keywords.join(", ") : undefined, image: images, datePosted: property.createdAt, dateModified: property.updatedAt || property.createdAt, inLanguage: lang === "en" ? "en" : "es-MX", identifier: property.mls || property.id, mainEntity,
    offers: offer,
  };
}

function renderPropertyPage(property, lang = "es", similar = []) {
  const english = lang === "en";
  const developmentMode = property.publicationSection === "developments";
  const title = localizedPropertyTitle(property, lang);
  const description = localizedPropertyDescription(property, lang);
  const images = safePublicImages(property);
  const path = propertyPath(property, lang);
  const otherPath = propertyPath(property, english ? "es" : "en");
  const facts = (developmentMode
    ? [localizedPropertyType(property.type, lang)]
    : [english ? "Listed" : "Publicada", localizedPropertyType(property.type, lang), property.operation === "rent" ? (english ? "For rent" : "En renta") : (english ? "For sale" : "En venta"), property.beds ? `${property.beds} ${english ? "bedrooms" : "recámaras"}` : "", property.baths ? `${property.baths} ${english ? "bathrooms" : "baños"}` : "", property.parking ? `${property.parking} ${english ? "parking spaces" : "estacionamientos"}` : "", property.area ? `${property.area} m² ${english ? "construction" : "construcción"}` : "", property.lot ? `${property.lot} m² ${english ? "lot" : "terreno"}` : "", property.mls ? `MLS# ${property.mls}` : ""]
  ).filter(Boolean);
  const location = [property.zone, property.city, property.state].find((value) => typeof value === "string" && value.trim()) || "";
  const whatsappMessage = `${english ? "Hello, I would like information about" : "Hola, me gustaría recibir información sobre"} ${title} — ${absoluteUrl(path)}`;
  const page = { path, alternate: otherPath, lang, h1: title, title: `${title} | Puerto Cancun Center`, description: String(description || title).slice(0, 158), eyebrow: developmentMode ? (english ? "Real estate development" : "Desarrollo inmobiliario") : (english ? "Property listing" : "Ficha inmobiliaria"), intro: developmentMode ? location : [location, formatListingPrice(property, lang)].filter(Boolean).join(" · "), cta: english ? "Contact by WhatsApp" : "Contactar por WhatsApp", ctaHref: businessContacts.whatsappUrl("mx", whatsappMessage), whatsappMessage, hideLastUpdated: true };
  const galleryImages = images.length ? images : ["/assets/og-puerto-cancun-center.webp"];
  const videoSection = property.videoUrl
    ? `<section class="property-page-video" id="listing-video"><div class="section-heading"><span class="seo-eyebrow">${english ? "Video tour" : "Recorrido en video"}</span><h2>${english ? "Explore the property" : "Conoce la propiedad"}</h2></div><video controls playsinline preload="metadata" aria-label="${english ? "Property video" : "Video de la propiedad"}" src="${escapeHtml(property.videoUrl)}"></video><a class="text-link" href="${escapeHtml(property.videoUrl)}" target="_blank" rel="noopener">${english ? "Open video" : "Abrir video"}</a></section>`
    : "";
  const gallerySlides = galleryImages.map((image, index) => {
    const source = optimizedPublicImage(image, 1200);
    const imageDescription = localizedImageDescription(property, index, lang);
    const sourceAttribute = index === 0
      ? `src="${escapeHtml(source)}" fetchpriority="high"`
      : `data-gallery-src="${escapeHtml(source)}" loading="lazy"`;
    return `<figure class="property-gallery-slide ${index === 0 ? "is-active" : ""}" data-gallery-slide="${index}" data-caption="${escapeHtml(imageDescription)}" aria-hidden="${index === 0 ? "false" : "true"}"><img ${sourceAttribute} width="1200" height="800" decoding="async" alt="${escapeHtml(imageDescription || `${title} - ${index + 1}`)}" /></figure>`;
  }).join("");
  const galleryThumbs = galleryImages.map((image, index) => {
    const source = optimizedPublicImage(image, 240);
    const sourceAttribute = index < 5 ? `src="${escapeHtml(source)}"` : `data-gallery-src="${escapeHtml(source)}"`;
    return `<button class="property-gallery-thumb ${index === 0 ? "is-active" : ""}" type="button" data-gallery-go="${index}" aria-label="${english ? "View photo" : "Ver foto"} ${index + 1}"><img ${sourceAttribute} width="160" height="110" loading="lazy" decoding="async" alt="" /></button>`;
  }).join("");
  const gallery = `<section class="property-page-gallery" data-property-carousel aria-label="${developmentMode ? (english ? "Development image gallery" : "Galería del desarrollo") : (english ? "Property image gallery" : "Galería de la propiedad")}"><div class="property-gallery-stage">${gallerySlides}<button class="property-gallery-open" type="button" data-open-property-gallery><span>${developmentMode ? (english ? "View development gallery" : "Ver galería del desarrollo") : (english ? "View property gallery" : "Ver galería de la propiedad")}</span><b>${galleryImages.length}</b></button>${galleryImages.length > 1 ? `<button class="property-gallery-arrow previous" type="button" data-gallery-previous aria-label="${english ? "Previous photo" : "Foto anterior"}">‹</button><button class="property-gallery-arrow next" type="button" data-gallery-next aria-label="${english ? "Next photo" : "Foto siguiente"}">›</button>` : ""}<span class="property-gallery-counter" data-gallery-counter>1 / ${galleryImages.length}</span></div>${galleryImages.length > 1 ? `<div class="property-gallery-thumbs">${galleryThumbs}</div>` : ""}</section>`;
  const galleryModal = `<div class="property-gallery-modal" data-property-gallery-modal hidden><section class="property-gallery-dialog" role="dialog" aria-modal="true" aria-label="${developmentMode ? (english ? "Development gallery" : "Galería del desarrollo") : (english ? "Property gallery" : "Galería de la propiedad")}"><button class="property-gallery-close" type="button" data-close-property-gallery aria-label="${english ? "Close gallery" : "Cerrar galería"}">×</button><div class="property-gallery-modal-stage"><img data-gallery-modal-image src="${escapeHtml(optimizedPublicImage(galleryImages[0], 1200))}" alt="${escapeHtml(`${title} - 1`)}" /><button class="property-gallery-arrow previous" type="button" data-gallery-previous aria-label="${english ? "Previous photo" : "Foto anterior"}">‹</button><button class="property-gallery-arrow next" type="button" data-gallery-next aria-label="${english ? "Next photo" : "Foto siguiente"}">›</button></div><p class="property-gallery-caption" data-gallery-caption hidden></p><div class="property-gallery-toolbar"><button type="button" data-gallery-zoom-out aria-label="${english ? "Zoom out" : "Alejar"}">−</button><button type="button" data-gallery-zoom-reset>${english ? "Reset" : "Restablecer"}</button><button type="button" data-gallery-zoom-in aria-label="${english ? "Zoom in" : "Acercar"}">+</button><span data-gallery-modal-counter>1 / ${galleryImages.length}</span></div><div class="property-gallery-modal-thumbs">${galleryThumbs}</div></section></div>`;
  const mapSrc = openStreetMapEmbed(property.latitude, property.longitude);
  const mapArea = [property.address, property.neighborhood, property.zone, property.city, property.state].filter(Boolean).join(", ");
  const mapSection = (mapSrc || mapArea) && property.locationPrecision !== "hidden"
    ? `<section class="property-location-map"><div class="property-location-map-heading"><div><span class="seo-eyebrow">${english ? "Location" : "Ubicación"}</span><h2>${english ? "Property location" : "Ubicación de la propiedad"}</h2></div></div>${mapSrc ? "" : `<button type="button" class="ghost-button" data-show-area-map="${escapeHtml(mapArea)}">${english ? "Show area map" : "Ver mapa de la zona"}</button><p role="status"></p>`}<iframe title="${english ? "Property location map" : "Mapa de ubicación de la propiedad"}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" ${mapSrc ? `src="${escapeHtml(mapSrc)}"` : "hidden"}></iframe></section>`
    : "";
  const similarTitle = developmentMode
    ? english ? "Properties available in this development" : "Propiedades disponibles en este desarrollo"
    : english ? "Similar properties" : "Propiedades similares";
  const similarSection = similar.length ? `<section class="similar-properties"><div class="section-heading"><h2>${similarTitle}</h2></div>${renderInventoryCards(similar.slice(0, developmentMode ? 12 : 3), lang)}</section>` : "";
  const allAmenities = [...new Set([
    ...(Array.isArray(property.amenities) ? property.amenities : []),
    ...(Array.isArray(property.parentDevelopment?.amenities) ? property.parentDevelopment.amenities : []),
  ])];
  const amenities = allAmenities.length ? `<section class="property-amenities"><h2>${english ? "Amenities" : "Amenidades"}</h2>${property.parentDevelopment?.nameEs ? `<p>${english ? "This unit belongs to" : "Esta unidad pertenece a"} <strong>${escapeHtml(english ? property.parentDevelopment.nameEn || property.parentDevelopment.nameEs : property.parentDevelopment.nameEs)}</strong>.</p>` : ""}<ul>${allAmenities.map((item) => `<li>${escapeHtml(localizedAmenity(item, lang))}</li>`).join("")}</ul></section>` : "";
  const exchangeForm = `<section class="exchange-rate-request"><h2>${english ? "Need a reference conversion?" : "¿Necesitas una conversión referencial?"}</h2><p>${english ? "The listing keeps its original currency. Ask an advisor for a current reference rate and payment context." : "La publicación conserva su moneda original. Solicita a un asesor una tasa referencial vigente y contexto de pago."}</p><form data-lead-form><input type="hidden" name="leadType" value="solicitud-tipo-cambio" /><input type="hidden" name="propertyId" value="${escapeHtml(property.id)}" /><div class="form-row"><label><span>${english ? "Name" : "Nombre"}</span><input name="name" required /></label><label><span>${english ? "Email" : "Correo"}</span><input name="email" type="email" required /></label><label><span>WhatsApp</span><input name="phone" required /></label><label><span>${english ? "Reference currency" : "Moneda de referencia"}</span><select name="referenceCurrency"><option value="USD">USD</option><option value="MXN">MXN</option></select></label></div><button class="ghost-button" type="submit">${english ? "Request reference rate" : "Solicitar tasa referencial"}</button><p class="form-message"></p></form></section>`;
  const leadSection = `<section class="property-lead"><h2>${english ? "Schedule a visit or request details" : "Agenda una visita o solicita información"}</h2>${BuyerLeadForm(lang, property)}</section>`;
  const relatedContent = developmentMode ? `${similarSection}${leadSection}` : `${leadSection}${similarSection}`;
  const evidenceDate = value => value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString(english ? "en-US" : "es-MX", { year: "numeric", month: "short", day: "numeric", timeZone: "America/Cancun" }) : (english ? "Not recorded" : "Sin registrar");
  const evidenceSection = `<section class="property-evidence"><h2>${english ? "Listing information" : "Información de la publicación"}</h2><dl><div><dt>${english ? "Record created" : "Registro creado"}</dt><dd>${escapeHtml(evidenceDate(property.createdAt))}</dd></div><div><dt>${english ? "Last listing edit" : "Última edición de la ficha"}</dt><dd>${escapeHtml(evidenceDate(property.updatedAt))}</dd></div><div><dt>${english ? "Availability last checked" : "Disponibilidad consultada"}</dt><dd>${escapeHtml(evidenceDate(property.lastVerifiedAt))}</dd></div><div><dt>${english ? "Photos available" : "Fotografías disponibles"}</dt><dd>${images.length}</dd></div><div><dt>${english ? "Location precision" : "Precisión de ubicación"}</dt><dd>${property.locationPrecision === "exact" ? (english ? "Exact location published by the advisor" : "Ubicación exacta publicada por el asesor") : property.locationPrecision === "hidden" ? (english ? "Not publicly disclosed" : "No se publica") : (english ? "Approximate area" : "Zona aproximada")}</dd></div></dl><p>${english ? "Editing a listing is not an availability check. Confirm current conditions with your advisor." : "Editar una ficha no confirma su disponibilidad. Consulta las condiciones vigentes con un asesor."}</p></section>`;
  const address = [...new Map([property.address, property.neighborhood, property.zone, property.city, property.state]
    .filter(Boolean).map(value => [inventoryContract.fold(value), value])).values()].join(", ");
  const inventoryPath = developmentMode ? (english ? "/en/properties/developments-cancun" : "/propiedades/desarrollos-cancun")
    : (english ? "/en/properties" : "/propiedades");
  const inventoryLabel = developmentMode ? (english ? "Developments" : "Desarrollos") : (english ? "Properties" : "Propiedades");
  const heading = `<header class="property-page-heading content-wrap"><a href="${inventoryPath}"><span aria-hidden="true">←</span> ${inventoryLabel}</a><h1>${escapeHtml(title)}</h1></header>`;
  const summary = `<section class="property-page-summary" aria-label="${english ? "At a glance" : "Resumen de la ficha"}">
    ${developmentMode ? "" : `<p class="property-page-price">${escapeHtml(formatListingPrice(property, lang))}</p>`}
    ${address ? `<p class="property-address">${escapeHtml(address)}</p>` : ""}
    <div class="property-contact-actions">${businessWhatsAppLinks(whatsappMessage, lang, "primary-button property-whatsapp")}</div>
    <div class="property-facts">${facts.map(fact => `<span>${escapeHtml(fact)}</span>`).join("")}</div>
    ${videoSection ? `<a class="text-link" href="#listing-video">${english ? "Watch video tour" : "Ver recorrido en video"}</a>` : ""}
  </section>`;
  const content = `<div class="property-page-layout"><div class="property-page-overview">${gallery}${summary}</div>${videoSection}
    <section class="property-page-information"><section class="property-description-section"><h2>${developmentMode ? (english ? "About the development" : "Sobre el desarrollo") : (english ? "Property details" : "Detalles de la propiedad")}</h2>
      <div class="property-long-description">${String(description || "").split(/\n+/).filter(Boolean).map(part => `<p>${escapeHtml(part)}</p>`).join("")}</div>
    </section>${amenities}${evidenceSection}${mapSection}${developmentMode ? "" : exchangeForm}</section></div>${galleryModal}${relatedContent}`;
  return { page, html: pageShell(page, content, heading) };
}

function renderPropertyHead(property, baseUrl = DEFAULT_SITE_URL, lang = "es") {
  const rendered = renderPropertyPage(property, lang);
  const pageUrl = absoluteUrl(rendered.page.path, baseUrl);
  const image = safePublicImages(property)[0] ? absoluteUrl(safePublicImages(property)[0], baseUrl) : absoluteUrl("/assets/og-puerto-cancun-center.webp", baseUrl);
  const schemas = [...schemaBase(baseUrl), propertySchema(property, baseUrl, lang), { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: lang === "en" ? "Home" : "Inicio", item: absoluteUrl(lang === "en" ? "/en/" : "/", baseUrl) }, { "@type": "ListItem", position: 2, name: lang === "en" ? "Properties" : "Propiedades", item: absoluteUrl(lang === "en" ? "/en/properties" : "/propiedades", baseUrl) }, { "@type": "ListItem", position: 3, name: rendered.page.h1, item: pageUrl }] }];
  return { title: rendered.page.title, description: rendered.page.description, canonical: pageUrl, image, lang: lang === "en" ? "en" : "es-MX", alternate: rendered.page.alternate, jsonLd: schemas.map(JsonLd).join("\n") };
}

function getPageByPath(pathname) {
  const normalized = pathname && pathname !== "/" ? pathname.replace(/\/$/, "") : "/";
  return pages.find((page) => page.path === normalized) || null;
}

function schemaBase(baseUrl = DEFAULT_SITE_URL) {
  const siteUrl = absoluteUrl("/", baseUrl);
  const businessId = `${siteUrl}#real-estate-agent`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "@id": businessId,
      name: business.name,
      url: siteUrl,
      logo: absoluteUrl("/assets/puerto-cancun-logo.png", baseUrl),
      image: absoluteUrl("/assets/og-puerto-cancun-center.webp", baseUrl),
      description: business.description,
      telephone: business.telephone,
      address: {
        "@type": "PostalAddress",
        ...business.address,
      },
      areaServed: business.areaServed.map((name) => ({ "@type": "Place", name })),
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: business.telephone,
          contactType: "sales",
          areaServed: "MX",
          availableLanguage: ["Spanish", "English"],
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      name: business.name,
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

function pageSchema(page, baseUrl = DEFAULT_SITE_URL) {
  const pageUrl = absoluteUrl(page.path, baseUrl);
  const siteUrl = absoluteUrl("/", baseUrl);
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": page.schemaType || "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      headline: page.h1,
      description: page.description,
      inLanguage: page.lang === "en" ? "en" : "es-MX",
      isPartOf: { "@id": `${siteUrl}#website` },
      about: { "@id": `${siteUrl}#real-estate-agent` },
      dateModified: LAST_UPDATED,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: page.h1, item: pageUrl },
      ],
    },
  ];

  if (page.serviceName) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.serviceName,
      areaServed: business.areaServed.map((name) => ({ "@type": "Place", name })),
      provider: { "@id": `${siteUrl}#real-estate-agent` },
      serviceType: page.serviceName,
      url: pageUrl,
    });
  }

  if (page.path === "/faq-inmobiliario-cancun" || page.path === "/vender-casa-cancun" || page.path === "/comprar-casa-cancun") {
    const selectedFaqs = page.path === "/faq-inmobiliario-cancun" ? faqs : faqs.slice(0, 6);
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: selectedFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${faq.shortAnswer} ${faq.answer}`,
        },
      })),
    });
  }

  return schemas;
}

function renderSeoHead(page, baseUrl = DEFAULT_SITE_URL) {
  const pageUrl = absoluteUrl(page.path, baseUrl);
  const imageUrl = `${absoluteUrl("/", baseUrl).replace(/\/$/, "")}/assets/og-puerto-cancun-center.webp`;
  const schemas = [...schemaBase(baseUrl), ...pageSchema(page, baseUrl)];
  return {
    title: page.title,
    description: page.description,
    canonical: pageUrl,
    image: imageUrl,
    lang: page.lang === "en" ? "en" : "es-MX",
    alternate: page.alternate || (page.lang === "en" ? "/" : "/en/"),
    jsonLd: schemas.map(JsonLd).join("\n"),
  };
}

function renderAboutPage(page) {
  const english = page.lang === "en";
  const copy = english
    ? {
        storyTitle: "Local knowledge, clear process and close follow-up",
        story: "Puerto Cancun Center brings property owners, buyers and active inventory together in one professional workflow. We review the information, organize each opportunity and accompany the conversation from the first inquiry through the next commercial step.",
        valuesTitle: "How we work",
        values: [
          ["Local criteria", "We interpret location, demand, property type and market context before recommending a course of action."],
          ["Clear information", "We prepare understandable listings and requests so every party knows what is available and what remains to be reviewed."],
          ["Human follow-up", "Technology helps us organize; an advisor remains responsible for validating and following up on each case."],
          ["Connected service", "Sales, purchases, valuations, marketing and property documents share the same operating flow."],
        ],
        processTitle: "A team for the complete property journey",
        process: ["Understand your goal", "Review the property or search profile", "Prepare a clear strategy", "Connect and follow up"],
        areasTitle: "Where we specialize",
        areas: "Puerto Cancun, Cancun Hotel Zone, Cancun Downtown, Playa Mujeres, Isla Mujeres and selected Riviera Maya opportunities.",
        ownerCta: "I want to sell a property",
        buyerCta: "I want to browse properties",
      }
    : {
        storyTitle: "Conocimiento local, proceso claro y seguimiento cercano",
        story: "Puerto Cancún Center reúne propietarios, compradores e inventario activo dentro de un mismo flujo profesional. Revisamos la información, organizamos cada oportunidad y acompañamos la conversación desde la primera solicitud hasta el siguiente paso comercial.",
        valuesTitle: "Cómo trabajamos",
        values: [
          ["Criterio local", "Interpretamos ubicación, demanda, tipo de propiedad y contexto del mercado antes de recomendar una estrategia."],
          ["Información clara", "Preparamos publicaciones y solicitudes comprensibles para que cada parte sepa qué está disponible y qué falta revisar."],
          ["Seguimiento humano", "La tecnología ayuda a organizar; un asesor sigue siendo responsable de validar y acompañar cada caso."],
          ["Servicio conectado", "Venta, compra, valoración, marketing y documentos de propiedad comparten el mismo flujo operativo."],
        ],
        processTitle: "Un equipo para todo el recorrido inmobiliario",
        process: ["Entender tu objetivo", "Revisar la propiedad o búsqueda", "Preparar una estrategia clara", "Conectar y dar seguimiento"],
        areasTitle: "Dónde nos especializamos",
        areas: "Puerto Cancún, Zona Hotelera, Cancún Centro, Playa Mujeres, Isla Mujeres y oportunidades seleccionadas de Riviera Maya.",
        ownerCta: "Quiero vender una propiedad",
        buyerCta: "Quiero ver propiedades",
      };
  return pageShell(page, `
    <section class="about-story">
      <div><span class="seo-eyebrow">PUERTO CANCÚN CENTER</span><h2>${copy.storyTitle}</h2><p>${copy.story}</p></div>
      <img src="/assets/cancun-hotel-zone-hero-1280.webp" width="1280" height="720" loading="lazy" alt="${english ? "Cancun real estate market" : "Mercado inmobiliario de Cancún"}" />
    </section>
    <section class="about-values"><div class="section-heading"><h2>${copy.valuesTitle}</h2></div><div class="about-values-grid">${copy.values.map(([title, description], index) => `<article><span>0${index + 1}</span><h3>${title}</h3><p>${description}</p></article>`).join("")}</div></section>
    <section class="about-process"><h2>${copy.processTitle}</h2><ol>${copy.process.map((step) => `<li><span>${step}</span></li>`).join("")}</ol></section>
    <section class="about-areas"><div><h2>${copy.areasTitle}</h2><p>${copy.areas}</p></div><div class="seller-onboarding-actions"><a class="primary-button" href="${english ? "/en/sell-property-cancun" : "/vender-casa-cancun"}">${copy.ownerCta}</a><a class="outline-dark-button" href="${english ? "/en/properties" : "/propiedades"}">${copy.buyerCta}</a></div></section>
  `);
}

function renderEnglishSellPage(page) {
  return pageShell(page, `
    <section class="seo-columns"><div><h2>How we support your sale</h2><ul><li>Collect the essential property information.</li><li>Review price, location and selling points.</li><li>Prepare a clear presentation for prospective buyers.</li><li>Follow up on inquiries and next steps.</li></ul></div><div><h2>Benefits of listing with us</h2><ul><li>Connected buyer and advisor workflows.</li><li>Individual image management and organized property information.</li><li>Professional property sheets and marketing support.</li><li>A single panel to follow your requests.</li></ul></div></section>
    <section class="seller-onboarding-cta"><div><span>LIST WITH GUIDANCE</span><h2>Register and list with us</h2><p>Create your account after reviewing the process. You can submit the property details and photos and receive advisor follow-up.</p></div><div class="seller-onboarding-actions"><button class="primary-button" type="button" data-seller-access="register">Register to list</button><button class="outline-dark-button" type="button" data-seller-access="login">I already have an account</button></div></section>
    <section class="seller-onboarding-cta seller-onboarding-quick"><div><span>START WITH THE ESSENTIALS</span><h2>Would you rather continue without an account?</h2><p>Share the title, property type, location and photos. The description is optional, and an advisor will contact you only if more information is needed.</p></div><div class="seller-onboarding-actions"><button class="primary-button" type="button" data-open-guest-sale>Send property without registering</button></div></section>
    <section class="seo-form-block"><h2>Request an initial valuation</h2>${PropertyValuationForm("en")}</section>
  `);
}

function priceReviewPage(page) {
  const en = page.lang === "en";
  return pageShell(page, `<section class="seo-form-block" id="price-review-form"><h2>${en ? "Tell us about your estimate" : "Cuéntanos cómo estimaste el precio"}</h2>${PropertyValuationForm(page.lang, true)}</section>`);
}

function renderAreaGuide(page) {
  const english = page.lang === "en";
  const heading = english ? "Compare neighborhoods" : "Compara las zonas";
  return pageShell(page, `<section class="area-guide" id="area-guide"><h2>${heading}</h2>
    <div class="zone-info-grid">${zones.map(zone => ZoneCard(zone, page.lang)).join("")}</div></section>`);
}

function renderSeoPage(pathname) {
  const page = getPageByPath(pathname);
  if (!page || page.path === "/") return "";
  if (page.category) return renderCategoryPage(page, []);
  if (typeof page.render === "function") return page.render();
  if (["/nosotros", "/en/about"].includes(page.path)) return renderAboutPage(page);
  if (page.path === "/en/sell-property-cancun") return renderEnglishSellPage(page);
  if (["/contacto", "/en/contact"].includes(page.path)) {
    const english = page.lang === "en";
    return pageShell(page, `<section class="quick-answer"><h2>${english ? "Office and contact" : "Oficina y contacto"}</h2><p>${escapeHtml(page.intro)}</p><div class="seo-property-actions">${businessWhatsAppLinks(page.whatsappMessage, page.lang, "primary-button", true)}</div></section>`);
  }
  return pageShell(page, `<section class="quick-answer"><h2>${page.lang === "en" ? "Local real estate guidance" : "Asesoria inmobiliaria local"}</h2><p>${escapeHtml(page.intro)}</p><a class="primary-button" href="${escapeHtml(page.ctaHref)}">${escapeHtml(page.cta)}</a></section>`);
}

function publicPages() {
  return pages;
}

function sitemapXml(baseUrl = DEFAULT_SITE_URL, properties = [], options = {}) {
  const staticUrls = options.includeBlog === false
    ? pages.filter((page) => !["/blog", "/en/blog"].includes(page.path))
    : pages;
  const propertyUrls = properties.flatMap((property) => [
    { path: propertyPath(property, "es"), priority: "0.8", updated: property.updatedAt || property.createdAt },
    { path: propertyPath(property, "en"), priority: "0.7", updated: property.updatedAt || property.createdAt },
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticUrls
    .map(
      (page) => `  <url>\n    <loc>${absoluteUrl(page.path, baseUrl)}</loc>\n    <lastmod>${LAST_UPDATED}</lastmod>\n    <changefreq>${page.path === "/" ? "weekly" : "monthly"}</changefreq>\n    <priority>${page.path === "/" ? "1.0" : "0.8"}</priority>\n  </url>`
    )
    .concat(propertyUrls.map((entry) => `  <url>\n    <loc>${absoluteUrl(entry.path, baseUrl)}</loc>\n    ${entry.updated && Number.isFinite(Date.parse(entry.updated)) ? `<lastmod>${new Date(entry.updated).toISOString().slice(0, 10)}</lastmod>` : ""}\n    <changefreq>weekly</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`))
    .join("\n")}\n</urlset>\n`;
}

function robotsTxt(baseUrl = DEFAULT_SITE_URL) {
  return `User-agent: Googlebot\nAllow: /\n\nUser-agent: GoogleOther\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: anthropic-ai\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: CCBot\nAllow: /\n\nUser-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /crm/\nDisallow: /panel/\nDisallow: /seller/\nDisallow: /dashboard/\nAllow: /styles.css\nAllow: /app.js\nAllow: /assets/\n\nSitemap: ${absoluteUrl("/sitemap.xml", baseUrl)}\n`;
}

function llmsTxt(baseUrl = DEFAULT_SITE_URL) {
  return `# ${business.name}\n\nUltima actualizacion: ${LAST_UPDATED}\n\n${business.description}\n\n## Zona de atencion\n${business.areaServed.join(", ")}\n\n## Servicios\n- Venta de casas, departamentos, terrenos y propiedades en Cancun\n- Compra de propiedades en Cancun\n- Valoracion inmobiliaria en Cancun\n- Asesoria para propietarios, compradores e inversionistas\n- Revisión de la estimación del propietario con referencias locales\n\n## Paginas importantes\n${pages.map((page) => `- ${page.h1}: ${absoluteUrl(page.path, baseUrl)}`).join("\n")}\n\n## Contacto\nTelefono Mexico y WhatsApp: ${business.telephone}\nEmail: ${business.emailPlaceholder}\n\n## Nota para modelos de lenguaje\nEl servicio de valoración considera la estimación del propietario, el estado físico y las referencias de mercado disponibles.\n`;
}

function aiSummary(baseUrl = DEFAULT_SITE_URL) {
  return {
    businessName: business.name,
    description: business.description,
    services: [
      "Venta de propiedades en Cancun",
      "Compra de propiedades en Cancun",
      "Valoracion inmobiliaria en Cancun",
      "Asesoria para inversionistas",
      "Revisión de precios estimados por propietarios",
    ],
    serviceArea: business.areaServed,
    targetAudience: ["Propietarios", "Compradores", "Inversionistas"],
    mainPages: pages.map((page) => ({ title: page.h1, url: absoluteUrl(page.path, baseUrl), description: page.description })),
    contact: {
      phoneMexico: business.telephone,
      email: business.emailPlaceholder,
      address: business.address,
    },
    socialProfiles: [],
    lastUpdated: LAST_UPDATED,
  };
}

module.exports = {
  LAST_UPDATED,
  DEFAULT_SITE_URL,
  business,
  pages,
  commonLinks,
  faqs,
  zones,
  absoluteUrl,
  escapeHtml,
  JsonLd,
  Breadcrumbs,
  QuickAnswerBlock,
  AIValidationCTA,
  PropertyValuationForm,
  BuyerLeadForm,
  FAQSection,
  ZoneCard,
  TrustBlock,
  InternalLinksBlock,
  ServiceCard,
  ImageWithSeo,
  AIRecommendationBlock,
  ComparativeReportBlock,
  getPageByPath,
  publicPages,
  renderSeoHead,
  renderSeoPage,
  sitemapXml,
  robotsTxt,
  llmsTxt,
  aiSummary,
  propertySlug,
  propertyPath,
  propertyMatchesCategory,
  localizedListingPrice,
  renderCategoryPage,
  renderPropertyPage,
  renderPropertyHead,
};
