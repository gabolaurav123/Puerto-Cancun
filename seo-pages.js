const LAST_UPDATED = "2026-07-10";
const DEFAULT_SITE_URL = "https://www.puertocancun.center";

const business = {
  name: "Puerto Cancun Center",
  telephone: "+52 1 998 216 6563",
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
  return `${lang === "en" ? "/en/properties" : "/propiedades"}/${propertySlug(property)}`;
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
        La inteligencia artificial puede ayudarte a ordenar ideas, comparar opciones y crear una primera estrategia.
        Sin embargo, una decision inmobiliaria en Cancun depende de informacion local, documentacion, ubicacion,
        estado fisico, demanda real, perfil del comprador y capacidad de negociacion. Por eso, validamos la
        informacion digital con criterio inmobiliario local.
      </p>
    </section>
  `;
}

function AIValidationCTA() {
  return `
    <section class="ai-validation-cta">
      <div>
        <h2>ChatGPT ya te dio un precio o una estrategia?</h2>
        <p>
          Peganos la respuesta que recibiste de la IA y te ayudamos a revisar que informacion sirve, que debe
          validarse con datos reales y que riesgos faltan antes de vender, comprar o negociar.
        </p>
      </div>
      <a class="primary-button" href="/validar-respuesta-ia">Validar respuesta de IA</a>
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
        Antes de vender o comprar, analizamos factores como zona, caracteristicas de la propiedad, competencia,
        estado fisico, demanda, documentacion, plusvalia y perfil del comprador. La IA puede ordenar informacion
        en segundos, pero la decision final debe apoyarse en datos locales y revision profesional.
      </p>
      <p class="placeholder-note">
        Estructura lista para conectar despues con datos reales, CRM, formularios o base de propiedades.
      </p>
    </section>
  `;
}

function AIRecommendationBlock() {
  return `
    <section class="ai-recommendation-block">
      <h2>Usa ChatGPT para informarte, pero valida antes de decidir</h2>
      <p>
        La IA puede orientarte, redactar anuncios, comparar zonas o estimar un precio inicial. Una operacion real
        necesita validacion local, revision documental, estrategia comercial, negociacion y acompanamiento profesional.
      </p>
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

function ZoneCard(zone) {
  return `
    <article class="zone-info-card">
      <h3>${escapeHtml(zone.name)}</h3>
      <dl>
        <dt>Perfil del comprador</dt>
        <dd>${escapeHtml(zone.buyerProfile)}</dd>
        <dt>Tipo de propiedad comun</dt>
        <dd>${escapeHtml(zone.propertyType)}</dd>
        <dt>Ventajas</dt>
        <dd>${escapeHtml(zone.advantages)}</dd>
        <dt>Puntos a revisar</dt>
        <dd>${escapeHtml(zone.reviewPoints)}</dd>
        <dt>Ideal para</dt>
        <dd>${escapeHtml(zone.idealFor)}</dd>
      </dl>
      <a class="mini-button primary" href="/#properties">Consultar propiedades</a>
    </article>
  `;
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

function PropertyValuationForm() {
  return `
    <form class="lead-form seo-form" data-lead-form>
      <input type="hidden" name="leadType" value="valuacion-inmobiliaria" />
      <div class="form-row">${leadInput("Nombre", "name", "text", "required")}${leadInput("WhatsApp", "whatsapp", "tel", "required")}${leadInput("Correo", "email", "email", "required")}</div>
      <div class="form-row">${leadSelect("Tipo de propiedad", "propertyType", ["Casa", "Departamento", "Terreno", "Comercial"])}${leadInput("Zona", "zone")}</div>
      <div class="form-row">${leadInput("m2 de terreno", "landSize", "number")}${leadInput("m2 de construccion", "builtSize", "number")}</div>
      <div class="form-row">${leadInput("Recamaras", "bedrooms", "number")}${leadInput("Banos", "bathrooms", "number")}</div>
      <div class="form-row">${leadInput("Amenidades", "amenities")}${leadInput("Antiguedad", "age")}</div>
      <div class="form-row">${leadInput("Estado legal", "legalStatus")}${leadInput("Precio estimado por el propietario", "ownerEstimate")}</div>
      ${leadSelect("Usaste ChatGPT, Gemini o Claude para estimar el precio?", "usedAi", ["No", "Si, ChatGPT", "Si, Gemini", "Si, Claude", "Otro"])}
      ${leadTextarea("Pega aqui la respuesta de IA si la tienes", "aiResponse", 5)}
      <button class="primary-button" type="submit">Solicitar valoracion</button>
      <p class="form-message" data-lead-message></p>
    </form>
  `;
}

function BuyerLeadForm(lang = "es") {
  const english = lang === "en";
  return `
    <form class="lead-form seo-form" data-lead-form>
      <input type="hidden" name="leadType" value="comprador" />
      <div class="form-row">${leadInput(english ? "Name" : "Nombre", "name", "text", "required")}${leadInput("WhatsApp", "whatsapp", "tel", "required")}${leadInput(english ? "Email" : "Correo", "email", "email", "required")}</div>
      <div class="form-row">${leadInput(english ? "Budget" : "Presupuesto", "budget")}${leadSelect(english ? "Property type" : "Tipo de propiedad", "propertyType", english ? ["House", "Condo", "Land", "Presale"] : ["Casa", "Departamento", "Terreno", "Preventa"])} </div>
      <div class="form-row">${leadInput(english ? "Preferred area" : "Zona de interes", "zone")}${leadSelect(english ? "Goal" : "Objetivo", "goal", english ? ["Live", "Invest", "Rent"] : ["Vivir", "Invertir", "Rentar"])} </div>
      <div class="form-row">${leadInput(english ? "Bedrooms" : "Recamaras", "bedrooms", "number")}${leadInput(english ? "Estimated purchase date" : "Fecha estimada de compra", "purchaseDate")}</div>
      <button class="primary-button" type="submit">${english ? "Request details" : "Recibir opciones"}</button>
      <p class="form-message" data-lead-message></p>
    </form>
  `;
}

function AIValidationForm() {
  return `
    <form class="lead-form seo-form" data-lead-form>
      <input type="hidden" name="leadType" value="validacion-ia" />
      <div class="form-row">${leadInput("Nombre", "name", "text", "required")}${leadInput("WhatsApp", "whatsapp", "tel", "required")}${leadInput("Correo", "email", "email", "required")}</div>
      <div class="form-row">${leadSelect("Tipo de operacion", "operationType", ["Vender", "Comprar", "Invertir"])}${leadInput("Zona", "zone")}</div>
      <div class="form-row">${leadSelect("Tipo de propiedad", "propertyType", ["Casa", "Departamento", "Terreno", "Comercial"])}${leadInput("Presupuesto o precio estimado", "budgetOrPrice")}</div>
      ${leadTextarea("Mensaje o recomendacion que te dio la IA", "aiMessage", 6)}
      <button class="primary-button" type="submit">Validar con asesor local</button>
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
    buyerProfile: "Compradores que priorizan playa, turismo, rentas vacacionales autorizadas donde aplique y estilo de vida frente al Caribe.",
    propertyType: "Departamentos, residencias, propiedades frente al mar y opciones de inversion.",
    advantages: "Alta visibilidad, cercania a servicios turisticos y ubicaciones reconocidas.",
    reviewPoints: "Reglamentos, uso permitido, mantenimiento, accesos, documentacion y condiciones reales del inmueble.",
    idealFor: "Vivir cerca del mar, invertir o rentar segun regulacion y perfil del proyecto.",
  },
  {
    name: "Puerto Cancun",
    buyerProfile: "Compradores que buscan marina, centros comerciales, seguridad, amenidades y conectividad.",
    propertyType: "Departamentos, casas en canales, preventas y desarrollos residenciales.",
    advantages: "Ubicacion central, estilo de vida planeado y variedad de inventario premium.",
    reviewPoints: "Cuotas, reglas de comunidad, ubicacion especifica, vista, orientacion y competencia activa.",
    idealFor: "Vivir, invertir y comparar propiedades de alto perfil.",
  },
  {
    name: "Avenida Huayacan",
    buyerProfile: "Familias y compradores locales que buscan conectividad, servicios y comunidades residenciales.",
    propertyType: "Casas, departamentos y desarrollos residenciales.",
    advantages: "Crecimiento urbano, opciones familiares y acceso a servicios cotidianos.",
    reviewPoints: "Trafico, etapa del desarrollo, servicios cercanos, acceso y estado legal.",
    idealFor: "Vivir, comprar primera propiedad o evaluar plusvalia con datos reales.",
  },
  {
    name: "Cumbres",
    buyerProfile: "Compradores que buscan vida residencial, colegios, plazas y conectividad urbana.",
    propertyType: "Departamentos, casas y residencias en comunidades privadas.",
    advantages: "Servicios cercanos, ambiente residencial y acceso a avenidas principales.",
    reviewPoints: "Mantenimiento, reglamentos, estacionamiento y comparables recientes.",
    idealFor: "Vivir en Cancun con servicios consolidados.",
  },
  {
    name: "Centro de Cancun",
    buyerProfile: "Compradores que priorizan ubicacion, servicios, transporte y presupuesto comparativo.",
    propertyType: "Departamentos, casas, locales y propiedades de uso mixto.",
    advantages: "Conectividad, servicios y variedad de inventario.",
    reviewPoints: "Estado fisico, uso de suelo, estacionamiento, antiguedad y documentacion.",
    idealFor: "Vivir, trabajar o invertir en propiedades urbanas.",
  },
  {
    name: "Playa Mujeres",
    buyerProfile: "Inversionistas y compradores que buscan proyectos frente al mar, privacidad y crecimiento.",
    propertyType: "Departamentos, terrenos, desarrollos y propiedades residenciales premium.",
    advantages: "Entorno costero, oferta de desarrollos y posicionamiento de largo plazo.",
    reviewPoints: "Entrega, servicios, accesos, documentacion, mantenimiento y demanda real.",
    idealFor: "Invertir, segunda vivienda o estilo de vida frente al mar.",
  },
  {
    name: "Lagos del Sol",
    buyerProfile: "Familias que buscan comunidad privada, seguridad y entorno residencial.",
    propertyType: "Casas y terrenos residenciales.",
    advantages: "Privacidad, planeacion y ambiente familiar.",
    reviewPoints: "Cuotas, reglamentos, orientacion, metraje real y documentacion.",
    idealFor: "Vivir en residencia familiar o construir.",
  },
  {
    name: "Alfredo V. Bonfil",
    buyerProfile: "Compradores que evaluan terrenos, proyectos y conectividad hacia aeropuerto y ciudad.",
    propertyType: "Terrenos, casas y propiedades con potencial de proyecto.",
    advantages: "Ubicacion estrategica y variedad de predios.",
    reviewPoints: "Uso de suelo, servicios, acceso, regimen de propiedad y documentacion.",
    idealFor: "Evaluar proyectos con revision tecnica y legal.",
  },
  {
    name: "Residencial Campestre",
    buyerProfile: "Compradores que buscan espacios amplios y entorno residencial.",
    propertyType: "Casas, terrenos y residencias.",
    advantages: "Ambiente residencial, privacidad y lotes de mayor amplitud.",
    reviewPoints: "Estado fisico, documentacion, servicios, acceso y comparables locales.",
    idealFor: "Vivir con mayor espacio o evaluar inversion residencial.",
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
      "La IA puede ayudarte a redactar anuncios o preparar ideas, pero la venta real requiere validar precio, estado legal, demanda por zona, competencia y estrategia de negociacion.",
    cta: "Validar precio de mi propiedad",
    ctaHref: "/vender-casa-cancun",
  },
  {
    question: "Cuanto vale mi casa en Cancun?",
    shortAnswer: "Depende de zona, terreno, construccion, estado fisico, amenidades, documentacion y demanda real.",
    answer:
      "Una estimacion automatica puede orientar, pero no sustituye una valoracion con comparables locales, revision de condiciones y estrategia comercial.",
    cta: "Solicitar valoracion inmobiliaria",
    ctaHref: "/valuacion-inmobiliaria-cancun",
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
    question: "Como saber si el precio que me dio ChatGPT es correcto?",
    shortAnswer: "Usalo como referencia inicial y validalo con comparables reales, estado fisico, documentacion y demanda local.",
    answer:
      "ChatGPT no siempre conoce inventario actualizado, cierres reales ni condiciones especificas de tu propiedad. Puede orientar, pero el precio debe revisarse con criterio inmobiliario local.",
    cta: "Validar respuesta de IA",
    ctaHref: "/validar-respuesta-ia",
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
    question: "Como ayuda la IA en bienes raices?",
    shortAnswer: "Ayuda a ordenar informacion, pero la decision debe validarse con inventario, precio y asesoria local.",
    answer:
      "Si una IA te dio un precio, una zona o una recomendacion, Puerto Cancun Center puede revisar esa informacion y convertirla en una solicitud real de compra, venta o valoracion.",
    cta: "Validar con asesor",
    ctaHref: "/validar-respuesta-ia",
  },
  {
    question: "Por que necesito asesor si ya use ChatGPT?",
    shortAnswer: "Porque ChatGPT puede orientar, pero no valida documentacion, estado fisico, demanda real ni negociacion local.",
    answer:
      "Un asesor local convierte la informacion en una estrategia inmobiliaria aplicable al mercado de Cancun.",
    cta: "Validar mi decision",
    ctaHref: "/validar-respuesta-ia",
  },
];

function pageShell(page, content) {
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
      <section class="seo-page-hero">
        <div class="content-wrap">
          ${Breadcrumbs([
            { name: homeLabel, url: page.lang === "en" ? "/en/" : "/" },
            { name: page.h1, url: page.path },
          ])}
          <p class="seo-eyebrow">${escapeHtml(page.eyebrow || "Bienes raices en Cancun")}</p>
          <h1>${escapeHtml(page.h1)}</h1>
          <p>${escapeHtml(page.intro)}</p>
          <a class="accent-button" href="${escapeHtml(page.ctaHref || "/#sell")}">${escapeHtml(page.cta || "Hablar con un asesor")}</a>
        </div>
      </section>
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
      "Inmobiliaria en Cancún para comprar, vender, valorar e invertir en propiedades con estrategia local, datos e inteligencia artificial validada por asesores.",
    h1: "Compra o vende tu propiedad en Cancún",
    intro:
      "Te ayudamos a validar precios, preparar tu propiedad, encontrar compradores reales y tomar mejores decisiones inmobiliarias en Cancún.",
    schemaType: "WebPage",
  },
  {
    path: "/inmobiliaria-cancun",
    title: "Inmobiliaria en Cancun | Asesoria para comprar o vender propiedad",
    description:
      "Puerto Cancun Center es una inmobiliaria en Cancun para propietarios, compradores e inversionistas que necesitan asesoria local y validacion de informacion generada por IA.",
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
              <a class="outline-dark-button" href="/valuacion-inmobiliaria-cancun"><i data-lucide="badge-dollar-sign"></i><span>Solicitar valoración</span></a>
            </div>
          </section>
          ${QuickAnswerBlock([
            "Una inmobiliaria en Cancun debe ayudarte a interpretar precio, zona, documentacion, demanda y estrategia antes de comprar o vender.",
            "La IA puede darte ideas iniciales, pero la decision debe validarse con informacion local y acompanamiento profesional.",
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
      "Registra tu propiedad, solicita valoracion y permite que el equipo revise la informacion para atraer compradores reales desde la web.",
    cta: "Validar precio de mi propiedad",
    ctaHref: "/valuacion-inmobiliaria-cancun",
    serviceName: "Venta de casas en Cancun",
    render() {
      return pageShell(
        this,
        `
          <section class="seller-entry-choices" aria-labelledby="seller-entry-title">
            <div>
              <span class="seo-eyebrow">ELIGE CÓMO EMPEZAR</span>
              <h2 id="seller-entry-title">Vende con el nivel de acompañamiento que necesitas</h2>
              <p>Envía los datos esenciales sin registrarte, prepara una publicación completa con seguimiento o solicita primero una valoración.</p>
            </div>
            <div class="seller-entry-choice-grid">
              <button class="primary-button" type="button" data-open-guest-sale><i data-lucide="send"></i><span>Venta sin registro</span></button>
              <button class="outline-dark-button" type="button" data-open-detailed-sale><i data-lucide="clipboard-check"></i><span>Publicación acompañada</span></button>
              <a class="outline-dark-button" href="/valuacion-inmobiliaria-cancun"><i data-lucide="badge-dollar-sign"></i><span>Solicitar valoración</span></a>
            </div>
          </section>
          ${QuickAnswerBlock([
            "Para vender una propiedad en Cancun con Puerto Cancun Center, el primer paso es solicitar una valoracion y registrar la informacion principal del inmueble.",
            "La IA puede ayudarte a ordenar datos, pero la publicacion, el precio y el seguimiento deben revisarse con criterio local y compradores reales.",
          ], "Cómo empezamos a preparar tu venta")}
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
            "La IA puede ayudarte a organizar preguntas, pero la comparacion final debe considerar inventario real, documentacion, estado fisico y negociacion.",
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
      "Solicita valoracion inmobiliaria en Cancun y valida estimaciones de ChatGPT, Gemini o Claude con datos locales, estado fisico y criterio profesional.",
    h1: "Valoracion inmobiliaria en Cancun para validar cuanto vale tu propiedad",
    eyebrow: "Precio, mercado y validacion",
    intro:
      "Diferencia precio estimado, precio de mercado y precio de cierre antes de publicar, comprar o negociar.",
    cta: "Solicitar valoracion inmobiliaria",
    ctaHref: "#valuation-form",
    serviceName: "Valoracion inmobiliaria en Cancun",
    render() {
      return pageShell(
        this,
        `
          ${QuickAnswerBlock([
            "Una valoracion inmobiliaria en Cancun debe revisar zona, terreno, construccion, estado legal, amenidades, antiguedad, demanda, competencia, estado fisico y plusvalia.",
            "Si ChatGPT ya te dio un precio, puede servir como orientacion inicial. Antes de publicar o negociar, conviene validarlo con informacion local y criterio profesional.",
          ])}
          <section class="seo-highlight">
            <h2>ChatGPT ya te dio un precio?</h2>
            <p>Te ayudamos a validarlo con datos reales y criterio local en Cancun. No prometemos un precio exacto inmediato: revisamos factores que pueden subir o bajar el valor.</p>
          </section>
          <section class="factor-grid">
            ${["Zona", "Terreno", "Construccion", "Estado legal", "Amenidades", "Antiguedad", "Demanda", "Competencia", "Estado fisico", "Plusvalia"].map((factor) => `<span>${factor}</span>`).join("")}
          </section>
          <section class="seo-form-block" id="valuation-form">
            <h2>Formulario de valoracion</h2>
            ${PropertyValuationForm()}
          </section>
          ${TrustBlock()}
        `
      );
    },
  },
  {
    path: "/zonas-cancun",
    title: "Mejores zonas para vivir o invertir en Cancun",
    description:
      "Guia editable de zonas de Cancun para vivir, invertir o rentar: Zona Hotelera, Puerto Cancun, Huayacan, Cumbres, Centro, Playa Mujeres y mas.",
    h1: "Zonas de Cancun para vivir, comprar o invertir",
    eyebrow: "Guia local por zona",
    intro:
      "Compara perfiles de comprador, tipos de propiedad, ventajas y puntos a revisar sin inventar precios ni prometer plusvalia.",
    cta: "Consultar propiedades por zona",
    ctaHref: "/#properties",
    render() {
      return pageShell(
        this,
        `
          ${QuickAnswerBlock([
            "La mejor zona de Cancun depende de tu presupuesto, objetivo, estilo de vida y tipo de propiedad.",
            "Conviene comparar ventajas, puntos a revisar y demanda real antes de comprar, vender o invertir.",
          ])}
          <section class="zone-info-grid">
            ${zones.map(ZoneCard).join("")}
          </section>
          ${ComparativeReportBlock()}
        `
      );
    },
  },
  {
    path: "/faq-inmobiliario-cancun",
    title: "Preguntas frecuentes sobre comprar y vender propiedades en Cancun",
    description:
      "FAQ inmobiliario en Cancun con respuestas claras para propietarios, compradores e inversionistas que usan Google, ChatGPT, Gemini o Claude.",
    h1: "Preguntas frecuentes sobre bienes raices en Cancun",
    eyebrow: "FAQ inmobiliario",
    intro:
      "Respuestas cortas y ampliadas para resolver dudas antes de comprar, vender, valorar o usar IA en una decision inmobiliaria.",
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
    path: "/validar-respuesta-ia",
    title: "Validar respuesta de IA sobre una propiedad en Cancun",
    description:
      "Pega una respuesta de ChatGPT, Gemini, Claude o Perplexity sobre una propiedad en Cancun y solicita revision con criterio inmobiliario local.",
    h1: "Valida una respuesta de IA antes de vender, comprar o negociar",
    eyebrow: "IA aplicada a bienes raices",
    intro:
      "Convierte la informacion de la IA en una estrategia inmobiliaria revisada con criterio local en Cancun.",
    cta: "Validar respuesta",
    ctaHref: "#ai-validation-form",
    render() {
      return pageShell(
        this,
        `
          ${QuickAnswerBlock([
            "Una respuesta de IA puede ser util para ordenar ideas, pero debe revisarse antes de usarla como base para precio, compra, venta o negociacion.",
            "Validamos que partes son utiles, que datos faltan, que riesgos existen y que debe confirmarse con informacion local.",
          ])}
          <section class="seo-form-block" id="ai-validation-form">
            <h2>Formulario para validar una respuesta de IA</h2>
            ${AIValidationForm()}
          </section>
          ${TrustBlock()}
        `
      );
    },
  },
];

const CATEGORY_DEFINITIONS = [
  { path: "/propiedades", enPath: "/en/properties", h1: "Propiedades en Cancun", enH1: "Properties in Cancun", intro: "Explora casas, departamentos, terrenos y preventas verificadas por el equipo de Puerto Cancun Center.", enIntro: "Explore homes, condos, land and presale opportunities verified by the Puerto Cancun Center team.", filter: { publicationSection: "properties" } },
  { path: "/propiedades/puerto-cancun", enPath: "/en/properties/puerto-cancun", h1: "Propiedades en Puerto Cancun", enH1: "Properties in Puerto Cancun", intro: "Inventario activo en Puerto Cancun con opciones residenciales, marina, canales y desarrollos contemporaneos.", enIntro: "Active Puerto Cancun inventory with residential, marina, canal and contemporary development options.", filter: { zone: "Puerto Cancun" } },
  { path: "/propiedades/puerto-cancun/casas", enPath: "/en/properties/puerto-cancun/homes", h1: "Casas en Puerto Cancun", enH1: "Homes in Puerto Cancun", intro: "Casas disponibles en Puerto Cancun con informacion de precio, superficie y contacto directo.", enIntro: "Available homes in Puerto Cancun with pricing, floor area and direct advisor contact.", filter: { zone: "Puerto Cancun", type: "Casa" } },
  { path: "/propiedades/puerto-cancun/departamentos", enPath: "/en/properties/puerto-cancun/condos", h1: "Departamentos en Puerto Cancun", enH1: "Condos in Puerto Cancun", intro: "Departamentos disponibles en Puerto Cancun, desde residencias frente a marina hasta torres con amenidades.", enIntro: "Available Puerto Cancun condos, from marina residences to amenity-rich towers.", filter: { zone: "Puerto Cancun", type: "Departamento" } },
  { path: "/propiedades/puerto-cancun/terrenos", enPath: "/en/properties/puerto-cancun/land", h1: "Terrenos en Puerto Cancun", enH1: "Land in Puerto Cancun", intro: "Terrenos disponibles para proyectos residenciales o patrimoniales dentro de Puerto Cancun.", enIntro: "Available land for residential or legacy projects in Puerto Cancun.", filter: { zone: "Puerto Cancun", type: "Terreno" } },
  { path: "/propiedades/zona-hotelera", enPath: "/en/properties/hotel-zone", h1: "Propiedades en Zona Hotelera de Cancun", enH1: "Cancun Hotel Zone properties", intro: "Propiedades frente al Caribe y la Laguna Nichupte con ubicaciones consolidadas de Cancun.", enIntro: "Properties facing the Caribbean and Nichupte Lagoon in established Cancun locations.", filter: { zone: "Zona Hotelera" } },
  { path: "/propiedades/playa-mujeres", enPath: "/en/properties/playa-mujeres", h1: "Propiedades en Playa Mujeres", enH1: "Properties in Playa Mujeres", intro: "Residencias y desarrollos al norte de Cancun en un corredor costero de perfil premium.", enIntro: "Homes and developments north of Cancun in a premium coastal corridor.", filter: { zone: "Punta Sam / Playa Mujeres" } },
  { path: "/propiedades/isla-mujeres", enPath: "/en/properties/isla-mujeres", h1: "Propiedades en Isla Mujeres", enH1: "Properties in Isla Mujeres", intro: "Consulta el inventario disponible en Isla Mujeres y solicita informacion al equipo local.", enIntro: "Browse available Isla Mujeres inventory and request information from the local team.", filter: { zone: "Isla Mujeres" } },
  { path: "/propiedades/riviera-maya", enPath: "/en/properties/riviera-maya", h1: "Propiedades en Riviera Maya", enH1: "Properties in Riviera Maya", intro: "Opciones residenciales y de inversion seleccionadas en Riviera Maya.", enIntro: "Selected residential and investment opportunities in Riviera Maya.", filter: { zone: "Riviera Maya" } },
  { path: "/propiedades-en-renta-cancun", enPath: "/en/cancun-rentals", h1: "Propiedades en renta en Cancun", enH1: "Properties for rent in Cancun", intro: "Departamentos y casas en renta con informacion clara de zona, precio y caracteristicas.", enIntro: "Condos and homes for rent with clear location, price and property details.", filter: { operation: "rent" } },
  { path: "/preventas-cancun", enPath: "/en/cancun-presales", h1: "Preventas en Cancun", enH1: "Cancun presales", intro: "Oportunidades de preventa con seguimiento local para revisar entrega, pagos y caracteristicas del proyecto.", enIntro: "Presale opportunities with local follow-up on delivery, payment schedules and project details.", filter: { type: "Preventa" } },
  { path: "/propiedades/casas-cancun", enPath: "/en/properties/homes-cancun", h1: "Casas en Cancun", enH1: "Homes in Cancun", intro: "Casas disponibles en Cancun filtradas por zona, presupuesto y caracteristicas.", enIntro: "Available Cancun homes filtered by area, budget and property features.", filter: { type: "Casa" } },
  { path: "/propiedades/departamentos-cancun", enPath: "/en/properties/condos-cancun", h1: "Departamentos en Cancun", enH1: "Condos in Cancun", intro: "Departamentos disponibles en Cancun para vivir, invertir o rentar.", enIntro: "Available Cancun condos for living, investing or renting.", filter: { type: "Departamento" } },
  { path: "/propiedades/cancun-centro", enPath: "/en/properties/downtown-cancun", h1: "Propiedades en Cancun Centro", enH1: "Properties in downtown Cancun", intro: "Inventario urbano con acceso a servicios, comercios y conectividad dentro de Cancun.", enIntro: "Urban inventory with access to services, retail and transportation in Cancun.", filter: { zone: "Cancun Centro" } },
  { path: "/propiedades/comerciales-cancun", enPath: "/en/properties/commercial-cancun", h1: "Propiedades comerciales en Cancun", enH1: "Commercial property in Cancun", intro: "Locales, hoteles y oportunidades comerciales disponibles dentro del inventario activo.", enIntro: "Retail, hospitality and commercial opportunities in the active inventory.", filter: { type: "Comercial" } },
  { path: "/propiedades/desarrollos-cancun", enPath: "/en/properties/developments-cancun", h1: "Desarrollos inmobiliarios en Cancun", enH1: "Real estate developments in Cancun", intro: "Desarrollos residenciales seleccionados para compradores e inversionistas.", enIntro: "Selected residential developments for buyers and investors.", filter: { publicationSection: "developments" } },
  { path: "/propiedades/destacadas-cancun", enPath: "/en/properties/featured-cancun", h1: "Propiedades destacadas en Cancun", enH1: "Featured properties in Cancun", intro: "Una seleccion del inventario activo por ubicacion, atributos y presentacion.", enIntro: "A selection of active inventory based on location, features and presentation.", filter: { featured: true } },
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
    eyebrow: english ? "Curated Cancun inventory" : "Inventario seleccionado en Cancun",
    intro: english ? definition.enIntro : definition.intro,
    cta: english ? "Request property options" : "Solicitar opciones",
    ctaHref: "#category-inventory",
    category: definition.filter,
  };
}

const categoryPages = CATEGORY_DEFINITIONS.flatMap((definition) => [categoryPage(definition, "es"), categoryPage(definition, "en")]);

const englishPages = [
  {
    path: "/en", alternate: "/", lang: "en", title: "Buy or sell property in Cancun | Puerto Cancun Center", description: "Cancun real estate support for buyers, owners and investors with local guidance.", h1: "Buy or sell property in Cancun", eyebrow: "Cancun real estate", intro: "Use AI to get informed. Use a local advisor to make a sound decision.", cta: "Browse properties", ctaHref: "/en/properties",
  },
  {
    path: "/en/buy-property-cancun", alternate: "/comprar-casa-cancun", lang: "en", title: "Buy property in Cancun | Puerto Cancun Center", description: "Find homes, condos and investment property in Cancun with local advisor support.", h1: "Buy property in Cancun with local guidance", eyebrow: "For buyers and investors", intro: "Tell us your budget, preferred area and objective to receive compatible active listings.", cta: "Browse properties", ctaHref: "/en/properties",
  },
  {
    path: "/en/sell-property-cancun", alternate: "/vender-casa-cancun", lang: "en", title: "Sell property in Cancun | Puerto Cancun Center", description: "Request pricing and a local sales strategy for your Cancun property.", h1: "Sell your property in Cancun", eyebrow: "For property owners", intro: "Request an initial valuation and a clear plan to prepare, publish and follow up with real buyers.", cta: "Request a valuation", ctaHref: "/en/property-valuation-cancun",
  },
  {
    path: "/en/property-valuation-cancun", alternate: "/valuacion-inmobiliaria-cancun", lang: "en", title: "Cancun property valuation | Puerto Cancun Center", description: "Request a Cancun property valuation with local market criteria.", h1: "Property valuation in Cancun", eyebrow: "Price and local market", intro: "Share the property details and an advisor will review the variables that affect its market position.", cta: "Send property details", ctaHref: "/vender-casa-cancun",
  },
  {
    path: "/en/validate-ai-answer", alternate: "/validar-respuesta-ia", lang: "en", title: "Validate an AI real estate answer in Cancun", description: "Ask a local Cancun advisor to review an AI-generated price or real estate recommendation.", h1: "Validate an AI answer before deciding", eyebrow: "AI plus local criteria", intro: "AI can organize information; a local advisor helps confirm what applies to a real Cancun transaction.", cta: "Validate with an advisor", ctaHref: "/validar-respuesta-ia",
  },
  {
    path: "/en/cancun-real-estate-faq", alternate: "/faq-inmobiliario-cancun", lang: "en", title: "Cancun real estate FAQ | Puerto Cancun Center", description: "Answers for buyers and sellers considering a Cancun real estate transaction.", h1: "Cancun real estate frequently asked questions", eyebrow: "Buyer and seller guidance", intro: "Clear starting points for buying, selling and valuing property in Cancun.", cta: "Contact an advisor", ctaHref: "/en/buy-property-cancun",
  },
  {
    path: "/en/cancun-areas", alternate: "/zonas-cancun", lang: "en", title: "Cancun areas for living and investing | Puerto Cancun Center", description: "Explore Puerto Cancun, Hotel Zone, downtown Cancun, Playa Mujeres, Isla Mujeres and Riviera Maya property areas.", h1: "Cancun areas for buying, living or investing", eyebrow: "Local area guide", intro: "Compare active inventory by location and request local guidance before making a real estate decision.", cta: "Browse properties by area", ctaHref: "/en/properties",
  },
];

const companyPages = [
  { path: "/nosotros", alternate: "/en/about", lang: "es", title: "Nosotros | Puerto Cancun Center", description: "Conoce el enfoque, los valores y el proceso de Puerto Cancun Center para conectar propietarios, compradores e inventario inmobiliario en Cancun.", h1: "Nosotros: experiencia inmobiliaria en Cancún", eyebrow: "Puerto Cancún Center", intro: "Coordinamos publicaciones, solicitudes, seguimiento y contacto para que compradores y propietarios avancen con información clara y acompañamiento local.", cta: "Ver propiedades", ctaHref: "/propiedades" },
  { path: "/contacto", alternate: "/en/contact", lang: "es", title: "Contacto | Puerto Cancun Center", description: "Contacta a Puerto Cancun Center por WhatsApp o visita nuestra oficina en Zona Hotelera de Cancun.", h1: "Contacta a Puerto Cancun Center", eyebrow: "Atencion a compradores y propietarios", intro: "Puerto Cancun Mall, Marina B., oficina 27, Zona Hotelera, Cancun 77500, Q Roo, Mexico.", cta: "Contactar por WhatsApp", ctaHref: "https://wa.me/5219982166563" },
  { path: "/en/about", alternate: "/nosotros", lang: "en", title: "About us | Puerto Cancun Center", description: "Learn about the approach, values and process Puerto Cancun Center uses to connect property owners, buyers and active Cancun inventory.", h1: "About us: Cancun real estate experience", eyebrow: "Puerto Cancun Center", intro: "We coordinate listings, requests and follow-up so buyers and property owners can move forward with clear information and local guidance.", cta: "Browse properties", ctaHref: "/en/properties" },
  { path: "/en/contact", alternate: "/contacto", lang: "en", title: "Contact | Puerto Cancun Center", description: "Contact Puerto Cancun Center by WhatsApp or visit our Cancun Hotel Zone office.", h1: "Contact Puerto Cancun Center", eyebrow: "Buyer and owner support", intro: "Puerto Cancun Mall, Marina B., office 27, Hotel Zone, Cancun 77500, Q Roo, Mexico.", cta: "Contact by WhatsApp", ctaHref: "https://wa.me/5219982166563" },
];

function renderLegalContent(kind, english = false) {
  if (kind === "privacy") {
    return english
      ? `<section class="legal-document"><h2>Data controller and scope</h2><p>Puerto Cancun Center, located at Puerto Cancun Mall, Marina B., office 27, Hotel Zone, Cancun 77500, Quintana Roo, Mexico, processes the personal data submitted through this website.</p><h2>Data and purposes</h2><p>We may process identification and contact data, property information, budgets, images, documents and interaction records to create accounts, respond to inquiries, evaluate or market properties, prepare commercial material, prevent abuse and comply with legal obligations. We do not request passwords through advisory forms.</p><h2>Consent, retention and transfers</h2><p>Required data is identified in each form. Information is retained only for the business, legal and security periods that apply. It is shared only with service providers or advisors necessary to deliver the requested service, under confidentiality and security obligations, or when required by law.</p><h2>Your rights</h2><p>You may request access, correction, cancellation, objection, limitation of use or revocation. Submit the form below with the subject “Privacy rights”; we will verify identity before processing the request.</p>${PrivacyRightsForm(true)}<h2>Changes</h2><p>Material changes will be published on this page with their effective date.</p></section>`
      : `<section class="legal-document"><h2>Responsable y alcance</h2><p>Puerto Cancún Center, con domicilio en Puerto Cancún Mall, Marina B., oficina 27, Zona Hotelera, Cancún 77500, Quintana Roo, México, es responsable del tratamiento de los datos personales enviados mediante este sitio.</p><h2>Datos y finalidades</h2><p>Podemos tratar datos de identificación y contacto, información patrimonial del inmueble, presupuestos, imágenes, documentos y registros de interacción para crear cuentas, atender solicitudes, valorar o comercializar inmuebles, preparar materiales comerciales, prevenir abusos y cumplir obligaciones legales. Nunca solicitamos contraseñas mediante formularios de asesoría.</p><h2>Consentimiento, conservación y transferencias</h2><p>Los datos obligatorios se identifican en cada formulario. Conservamos la información únicamente durante los plazos comerciales, legales y de seguridad aplicables. Solo se comparte con proveedores o asesores necesarios para prestar el servicio solicitado, sujetos a obligaciones de confidencialidad y seguridad, o cuando la ley lo requiera.</p><h2>Derechos ARCO y revocación</h2><p>Puedes solicitar acceso, rectificación, cancelación u oposición, limitar el uso o revocar tu consentimiento. Envía el siguiente formulario con el asunto “Derechos ARCO”; verificaremos tu identidad antes de atender la solicitud.</p>${PrivacyRightsForm(false)}<h2>Cambios al aviso</h2><p>Las modificaciones relevantes se publicarán en esta página indicando su fecha de entrada en vigor.</p></section>`;
  }
  if (kind === "cookies") {
    return english
      ? `<section class="legal-document"><h2>Technologies used</h2><p>The site uses essential cookies for sessions, language, security and saved preferences. Optional measurement technologies are activated only according to the preference selected in the cookie notice.</p><h2>Control</h2><p>You can change your preference from the cookie notice or delete stored data from your browser. Rejecting optional cookies does not prevent access to public property information.</p></section>`
      : `<section class="legal-document"><h2>Tecnologías utilizadas</h2><p>El sitio utiliza cookies esenciales para sesiones, idioma, seguridad y preferencias guardadas. Las tecnologías opcionales de medición se activan únicamente de acuerdo con la preferencia elegida en el aviso de cookies.</p><h2>Control</h2><p>Puedes cambiar tu preferencia desde el aviso de cookies o eliminar los datos almacenados desde tu navegador. Rechazar cookies opcionales no impide consultar la información pública de propiedades.</p></section>`;
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
  "/validar-respuesta-ia": "/en/validate-ai-answer",
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
  return (!filter.zone || property.zone === filter.zone) &&
    (!filter.type || property.type === filter.type) &&
    (!filter.publicationSection || property.publicationSection === filter.publicationSection) &&
    (!filter.operation || property.operation === filter.operation) &&
    (!filter.featured || property.featured);
}

function localizedListingPrice(property) {
  const currency = property.currency || (property.priceUsd !== null && property.priceUsd !== undefined ? "USD" : "MXN");
  const amount = property.price ?? (currency === "USD" ? property.priceUsd : property.priceMxn);
  return amount !== null && amount !== undefined && amount !== "" ? { amount: Number(amount), currency } : null;
}

function formatListingPrice(property, lang = "es") {
  const locale = lang === "en" ? "en-US" : "es-MX";
  const selected = localizedListingPrice(property, lang);
  if (selected) {
    const unit = property.priceUnit === "sqm" ? (lang === "en" ? " / m²" : " por m²") : "";
    return `${selected.currency} $${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(selected.amount)}${unit}`;
  }
  return lang === "en" ? "Price on request" : "Precio a consultar";
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
    const url = propertyPath(property, lang);
    const whatsappUrl = `https://wa.me/5219982166563?text=${encodeURIComponent(`${lang === "en" ? "Hello, I would like information about" : "Hola, quisiera información sobre"}: ${title} ${absoluteUrl(url)}`)}`;
    return `<article class="seo-property-card">
      <a class="seo-property-image" href="${escapeHtml(url)}"><img src="${escapeHtml(image)}" width="640" height="420" loading="lazy" alt="${escapeHtml(imageDescription || title)}" /></a>
      <div>${property.publicationSection === "developments" ? "" : `<p class="seo-property-price">${escapeHtml(formatListingPrice(property, lang))}</p>`}<h2><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></h2><p>${escapeHtml([property.zone, localizedPropertyType(property.type, lang), property.mls ? `MLS# ${property.mls}` : ""].filter(Boolean).join(" · "))}</p><div class="seo-property-description">${escapeHtml(descriptionSummary)}</div><div class="seo-property-actions"><a class="text-link" href="${escapeHtml(url)}">${lang === "en" ? "View property" : "Ver propiedad"}</a><a class="seo-whatsapp-button" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">${lang === "en" ? "WhatsApp" : "Contactar por WhatsApp"}</a></div></div>
    </article>`;
  }).join("")}</div>`;
}

function renderCategoryPage(page, properties) {
  const visible = properties.filter((property) => propertyMatchesCategory(property, page.category));
  const developmentMap = page.category?.publicationSection === "developments"
    ? `<section class="development-map-section"><div><p class="section-kicker">${page.lang === "en" ? "Development map" : "Mapa de desarrollos"}</p><h2>${page.lang === "en" ? "Explore active projects by location" : "Explora los proyectos activos por ubicación"}</h2></div><iframe title="${page.lang === "en" ? "Cancun developments map" : "Mapa de desarrollos en Cancún"}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Cancun%2C%20Quintana%20Roo&output=embed"></iframe></section>`
    : "";
  return pageShell(page, `<section id="category-inventory" class="category-inventory"><div class="section-heading"><p class="section-kicker">${page.lang === "en" ? "Active inventory" : "Inventario activo"}</p><h2>${page.lang === "en" ? `${visible.length} available listings` : `${visible.length} propiedades disponibles`}</h2></div>${renderInventoryCards(visible, page.lang)}</section>${developmentMap}`);
}

function propertySchema(property, baseUrl = DEFAULT_SITE_URL, lang = "es") {
  const url = absoluteUrl(propertyPath(property, lang), baseUrl);
  const images = safePublicImages(property).map((image) => absoluteUrl(image, baseUrl));
  const title = localizedPropertyTitle(property, lang);
  const description = localizedPropertyDescription(property, lang);
  const localizedPrice = localizedListingPrice(property, lang);
  const mainEntity = {
    "@type": property.type === "Casa" ? "House" : property.type === "Departamento" ? "Apartment" : "Residence",
    name: title,
    description,
    numberOfBedrooms: property.beds || undefined,
    numberOfBathroomsTotal: property.baths || undefined,
    numberOfParkingSpaces: property.parking || undefined,
    amenityFeature: Array.isArray(property.amenities) ? property.amenities.map((name) => ({ "@type": "LocationFeatureSpecification", name: localizedAmenity(name, lang), value: true })) : undefined,
    floorSize: property.area ? { "@type": "QuantitativeValue", value: property.area, unitCode: "MTK" } : undefined,
    address: { "@type": "PostalAddress", streetAddress: property.address || undefined, addressLocality: property.city || "Cancun", addressRegion: property.state || "Quintana Roo", addressCountry: "MX" },
  };
  const offer = localizedPrice
    ? {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        url,
        seller: { "@id": `${absoluteUrl("/", baseUrl)}#real-estate-agent` },
        ...(property.priceUnit === "sqm"
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
    : [english ? "Available" : "Disponible", localizedPropertyType(property.type, lang), property.operation === "rent" ? (english ? "For rent" : "En renta") : (english ? "For sale" : "En venta"), property.beds ? `${property.beds} ${english ? "bedrooms" : "recámaras"}` : "", property.baths ? `${property.baths} ${english ? "bathrooms" : "baños"}` : "", property.parking ? `${property.parking} ${english ? "parking spaces" : "estacionamientos"}` : "", property.area ? `${property.area} m² ${english ? "construction" : "construcción"}` : "", property.lot ? `${property.lot} m² ${english ? "lot" : "terreno"}` : "", property.mls ? `MLS# ${property.mls}` : ""]
  ).filter(Boolean);
  const page = { path, alternate: otherPath, lang, h1: title, title: `${title} | Puerto Cancun Center`, description: String(description || title).slice(0, 158), eyebrow: developmentMode ? (english ? "Real estate development" : "Desarrollo inmobiliario") : (english ? "Verified property listing" : "Ficha inmobiliaria verificada"), intro: developmentMode ? (property.zone || property.city || "Cancun") : `${property.zone || "Cancun"} · ${formatListingPrice(property, lang)}`, cta: english ? "Contact by WhatsApp" : "Contactar por WhatsApp", ctaHref: `https://wa.me/5219982166563?text=${encodeURIComponent(`${english ? "Hello, I would like information about" : "Hola, deseo informacion sobre"}: ${title} - ${absoluteUrl(path)}`)}`, hideLastUpdated: true };
  const galleryImages = images.length ? images : ["/assets/og-puerto-cancun-center.webp"];
  const gallerySlides = galleryImages.map((image, index) => {
    const source = optimizedPublicImage(image, 1200);
    const imageDescription = localizedImageDescription(property, index, lang);
    const sourceAttribute = index === 0
      ? `src="${escapeHtml(source)}" fetchpriority="high"`
      : `data-gallery-src="${escapeHtml(source)}" loading="lazy"`;
    return `<figure class="property-gallery-slide ${index === 0 ? "is-active" : ""}" data-gallery-slide="${index}" aria-hidden="${index === 0 ? "false" : "true"}"><img ${sourceAttribute} width="1200" height="800" decoding="async" alt="${escapeHtml(imageDescription || `${title} - ${index + 1}`)}" />${imageDescription ? `<figcaption>${escapeHtml(imageDescription)}</figcaption>` : ""}</figure>`;
  }).join("");
  const galleryThumbs = galleryImages.map((image, index) => {
    const source = optimizedPublicImage(image, 240);
    const sourceAttribute = index < 5 ? `src="${escapeHtml(source)}"` : `data-gallery-src="${escapeHtml(source)}"`;
    return `<button class="property-gallery-thumb ${index === 0 ? "is-active" : ""}" type="button" data-gallery-go="${index}" aria-label="${english ? "View photo" : "Ver foto"} ${index + 1}"><img ${sourceAttribute} width="160" height="110" loading="lazy" decoding="async" alt="" /></button>`;
  }).join("");
  const gallery = `<section class="property-page-gallery" data-property-carousel aria-label="${english ? "Property image gallery" : "Galeria de imagenes de la propiedad"}"><div class="property-gallery-stage">${gallerySlides}<button class="property-gallery-open" type="button" data-open-property-gallery><span>${english ? "View property gallery" : "Ver galería de la propiedad"}</span><b>${galleryImages.length}</b></button>${galleryImages.length > 1 ? `<button class="property-gallery-arrow previous" type="button" data-gallery-previous aria-label="${english ? "Previous photo" : "Foto anterior"}">‹</button><button class="property-gallery-arrow next" type="button" data-gallery-next aria-label="${english ? "Next photo" : "Foto siguiente"}">›</button>` : ""}<span class="property-gallery-counter" data-gallery-counter>1 / ${galleryImages.length}</span></div>${galleryImages.length > 1 ? `<div class="property-gallery-thumbs">${galleryThumbs}</div>` : ""}</section>`;
  const galleryModal = `<div class="property-gallery-modal" data-property-gallery-modal hidden><section class="property-gallery-dialog" role="dialog" aria-modal="true" aria-label="${english ? "Property gallery" : "Galeria de la propiedad"}"><button class="property-gallery-close" type="button" data-close-property-gallery aria-label="${english ? "Close gallery" : "Cerrar galeria"}">×</button><div class="property-gallery-modal-stage"><img data-gallery-modal-image src="${escapeHtml(optimizedPublicImage(galleryImages[0], 1200))}" alt="${escapeHtml(`${title} - 1`)}" /><button class="property-gallery-arrow previous" type="button" data-gallery-previous aria-label="${english ? "Previous photo" : "Foto anterior"}">‹</button><button class="property-gallery-arrow next" type="button" data-gallery-next aria-label="${english ? "Next photo" : "Foto siguiente"}">›</button></div><div class="property-gallery-toolbar"><button type="button" data-gallery-zoom-out aria-label="${english ? "Zoom out" : "Alejar"}">−</button><button type="button" data-gallery-zoom-reset>${english ? "Reset" : "Restablecer"}</button><button type="button" data-gallery-zoom-in aria-label="${english ? "Zoom in" : "Acercar"}">+</button><span data-gallery-modal-counter>1 / ${galleryImages.length}</span></div><div class="property-gallery-modal-thumbs">${galleryThumbs}</div></section></div>`;
  const mapLink = property.googleMapsUrl && /^https?:\/\//i.test(property.googleMapsUrl) ? `<a class="text-link" href="${escapeHtml(property.googleMapsUrl)}" target="_blank" rel="noopener">${english ? "Open location in Google Maps" : "Abrir ubicación en Google Maps"}</a>` : "";
  const latitude = Number(property.latitude);
  const longitude = Number(property.longitude);
  const mapQuery = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `${latitude},${longitude}`
    : [property.address, property.neighborhood, property.zone, property.city, property.state].filter(Boolean).join(", ");
  const publicMapUrl = property.googleMapsUrl && /^https?:\/\//i.test(property.googleMapsUrl)
    ? property.googleMapsUrl
    : mapQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
      : "";
  const mapSection = mapQuery
    ? `<section class="property-location-map"><div class="property-location-map-heading"><div><span class="seo-eyebrow">${english ? "Location" : "Ubicación"}</span><h2>${english ? "Property location" : "Ubicación de la propiedad"}</h2></div>${publicMapUrl ? `<a class="text-link" href="${escapeHtml(publicMapUrl)}" target="_blank" rel="noopener">${english ? "Open in Google Maps" : "Abrir en Google Maps"}</a>` : ""}</div><iframe title="${english ? "Property location map" : "Mapa de ubicación de la propiedad"}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed"></iframe></section>`
    : "";
  const similarSection = similar.length ? `<section class="similar-properties"><div class="section-heading"><h2>${english ? "Similar properties" : "Propiedades similares"}</h2></div>${renderInventoryCards(similar.slice(0, 3), lang)}</section>` : "";
  const allAmenities = [...new Set([
    ...(Array.isArray(property.amenities) ? property.amenities : []),
    ...(Array.isArray(property.parentDevelopment?.amenities) ? property.parentDevelopment.amenities : []),
  ])];
  const amenities = allAmenities.length ? `<section class="property-amenities"><h2>${english ? "Amenities" : "Amenidades"}</h2>${property.parentDevelopment?.nameEs ? `<p>${english ? "This unit belongs to" : "Esta unidad pertenece a"} <strong>${escapeHtml(english ? property.parentDevelopment.nameEn || property.parentDevelopment.nameEs : property.parentDevelopment.nameEs)}</strong>.</p>` : ""}<ul>${allAmenities.map((item) => `<li>${escapeHtml(localizedAmenity(item, lang))}</li>`).join("")}</ul></section>` : "";
  const exchangeForm = `<section class="exchange-rate-request"><h2>${english ? "Need a reference conversion?" : "¿Necesitas una conversión referencial?"}</h2><p>${english ? "The listing keeps its original currency. Ask an advisor for a current reference rate and payment context." : "La publicación conserva su moneda original. Solicita a un asesor una tasa referencial vigente y contexto de pago."}</p><form data-lead-form><input type="hidden" name="leadType" value="solicitud-tipo-cambio" /><input type="hidden" name="propertyId" value="${escapeHtml(property.id)}" /><div class="form-row"><label><span>${english ? "Name" : "Nombre"}</span><input name="name" required /></label><label><span>${english ? "Email" : "Correo"}</span><input name="email" type="email" required /></label><label><span>WhatsApp</span><input name="phone" required /></label><label><span>${english ? "Reference currency" : "Moneda de referencia"}</span><select name="referenceCurrency"><option value="USD">USD</option><option value="MXN">MXN</option></select></label></div><button class="ghost-button" type="submit">${english ? "Request reference rate" : "Solicitar tasa referencial"}</button><p class="form-message"></p></form></section>`;
  const content = `<section class="property-page-layout">${gallery}<section class="property-page-summary"><div class="property-summary-heading"><div>${developmentMode ? "" : `<p class="property-page-price">${escapeHtml(formatListingPrice(property, lang))}</p>`}<div class="property-facts">${facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join("")}</div></div><div class="property-summary-location"><span class="seo-eyebrow">${english ? "Address" : "Dirección"}</span><p class="property-address">${escapeHtml([property.address, property.neighborhood, property.zone, property.city, property.state].filter(Boolean).join(", "))}</p>${mapLink}</div></div><a class="primary-button property-whatsapp" href="${page.ctaHref}" target="_blank" rel="noopener">${page.cta}</a><section class="property-description-section"><span class="seo-eyebrow">${developmentMode ? (english ? "Development overview" : "Presentación del desarrollo") : (english ? "Complete listing" : "Ficha completa")}</span><h2>${developmentMode ? (english ? "About the development" : "Sobre el desarrollo") : (english ? "Property details" : "Detalles de la propiedad")}</h2><div class="property-long-description">${String(description || "").split(/\n+/).filter(Boolean).map((part) => `<p>${escapeHtml(part)}</p>`).join("")}</div></section>${amenities}${mapSection}${developmentMode ? "" : exchangeForm}</section></section>${galleryModal}<section class="property-lead"><h2>${english ? "Schedule a visit or request details" : "Agenda una visita o solicita información"}</h2>${BuyerLeadForm(lang)}</section>${similarSection}`;
  return { page, html: pageShell(page, content) };
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
    <section class="seller-entry-choices" aria-labelledby="seller-entry-title"><div><span class="seo-eyebrow">CHOOSE HOW TO START</span><h2 id="seller-entry-title">Sell with the level of guidance you need</h2><p>Send the essential details without registering, prepare a complete file with follow-up, or request a valuation first.</p></div><div class="seller-entry-choice-grid"><button class="primary-button" type="button" data-open-guest-sale><i data-lucide="send"></i><span>Sell without registering</span></button><button class="outline-dark-button" type="button" data-open-detailed-sale><i data-lucide="clipboard-check"></i><span>Guided listing</span></button><a class="outline-dark-button" href="/en/property-valuation-cancun"><i data-lucide="badge-dollar-sign"></i><span>Request valuation</span></a></div></section>
    <section class="quick-answer"><span>SELLING GUIDE</span><h2>Understand the process before registering</h2><p>Learn how the listing process works before creating an account. An advisor reviews the property information, pricing context and images before publication.</p></section>
    <section class="seo-columns"><div><h2>How we support your sale</h2><ul><li>Collect the essential property information.</li><li>Review price, location and selling points.</li><li>Prepare a clear presentation for prospective buyers.</li><li>Follow up on inquiries and next steps.</li></ul></div><div><h2>Benefits of listing with us</h2><ul><li>Connected buyer and advisor workflows.</li><li>Individual image management and organized property information.</li><li>Professional property sheets and marketing support.</li><li>A single panel to follow your requests.</li></ul></div></section>
    <section class="seller-onboarding-cta"><div><span>LIST WITH GUIDANCE</span><h2>Register and list with us</h2><p>Create your account after reviewing the process. You can submit the property details and photos and receive advisor follow-up.</p></div><div class="seller-onboarding-actions"><button class="primary-button" type="button" data-seller-access="register">Register to list</button><button class="outline-dark-button" type="button" data-seller-access="login">I already have an account</button></div></section>
    <section class="seller-onboarding-cta seller-onboarding-quick"><div><span>START WITH THE ESSENTIALS</span><h2>Would you rather continue without an account?</h2><p>Share the title, property type, location and photos. The description is optional, and an advisor will contact you only if more information is needed.</p></div><div class="seller-onboarding-actions"><button class="primary-button" type="button" data-open-guest-sale>Send property without registering</button></div></section>
    <section class="seo-form-block"><h2>Request an initial valuation</h2>${PropertyValuationForm()}</section>
  `);
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
    const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Puerto%20Cancun%20Mall%2C%20Marina%20B.%2C%20oficina%2027%2C%20Zona%20Hotelera%2C%20Cancun%2077500%2C%20Q%20Roo%2C%20Mexico";
    return pageShell(page, `<section class="quick-answer"><h2>${english ? "Office and contact" : "Oficina y contacto"}</h2><p>${escapeHtml(page.intro)}</p><p><a class="text-link" href="${mapsUrl}" target="_blank" rel="noopener">${english ? "Open address in Google Maps" : "Abrir direccion en Google Maps"}</a></p><p><a class="primary-button" href="https://wa.me/5219982166563" target="_blank" rel="noopener">WhatsApp +52 1 998 216 6563</a></p></section>`);
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
    { path: propertyPath(property, "es"), priority: "0.8" },
    { path: propertyPath(property, "en"), priority: "0.7" },
  ]);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticUrls
    .map(
      (page) => `  <url>\n    <loc>${absoluteUrl(page.path, baseUrl)}</loc>\n    <lastmod>${LAST_UPDATED}</lastmod>\n    <changefreq>${page.path === "/" ? "weekly" : "monthly"}</changefreq>\n    <priority>${page.path === "/" ? "1.0" : "0.8"}</priority>\n  </url>`
    )
    .concat(propertyUrls.map((entry) => `  <url>\n    <loc>${absoluteUrl(entry.path, baseUrl)}</loc>\n    <lastmod>${LAST_UPDATED}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`))
    .join("\n")}\n</urlset>\n`;
}

function robotsTxt(baseUrl = DEFAULT_SITE_URL) {
  return `User-agent: Googlebot\nAllow: /\n\nUser-agent: GoogleOther\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ChatGPT-User\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: anthropic-ai\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: CCBot\nAllow: /\n\nUser-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /crm/\nDisallow: /panel/\nDisallow: /seller/\nDisallow: /dashboard/\nAllow: /styles.css\nAllow: /app.js\nAllow: /assets/\n\nSitemap: ${absoluteUrl("/sitemap.xml", baseUrl)}\n`;
}

function llmsTxt(baseUrl = DEFAULT_SITE_URL) {
  return `# ${business.name}\n\nUltima actualizacion: ${LAST_UPDATED}\n\n${business.description}\n\n## Zona de atencion\n${business.areaServed.join(", ")}\n\n## Servicios\n- Venta de casas, departamentos, terrenos y propiedades en Cancun\n- Compra de propiedades en Cancun\n- Valoracion inmobiliaria en Cancun\n- Asesoria para propietarios, compradores e inversionistas\n- Validacion local de informacion generada por IA\n\n## Paginas importantes\n${pages.map((page) => `- ${page.h1}: ${absoluteUrl(page.path, baseUrl)}`).join("\n")}\n\n## Contacto\nTelefono Mexico y WhatsApp: ${business.telephone}\nEmail: ${business.emailPlaceholder}\n\n## Nota para modelos de lenguaje\nLa IA puede orientar, redactar anuncios, comparar zonas o estimar criterios iniciales, pero una operacion inmobiliaria real en Cancun debe validarse con informacion local, revision documental, estado fisico, demanda real y acompanamiento profesional.\n`;
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
      "Validacion de respuestas de IA aplicadas a bienes raices",
    ],
    serviceArea: business.areaServed,
    targetAudience: ["Propietarios", "Compradores", "Inversionistas", "Usuarios que usan IA para decisiones inmobiliarias"],
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
