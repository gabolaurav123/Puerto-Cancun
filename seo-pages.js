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

function QuickAnswerBlock(paragraphs) {
  return `
    <section class="quick-answer" aria-labelledby="quick-answer-title">
      <span>Respuesta rapida</span>
      <h2 id="quick-answer-title">Respuesta rapida</h2>
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
    title: "Compra y venta de propiedades en Cancun | Inmobiliaria en Cancun",
    description:
      "Inmobiliaria en Cancun para comprar, vender, valorar e invertir en propiedades con estrategia local, datos e inteligencia artificial validada por asesores.",
    h1: "Compra o vende tu propiedad en Cancun",
    intro:
      "Te ayudamos a validar precios, preparar tu propiedad, encontrar compradores reales y tomar mejores decisiones inmobiliarias en Cancun.",
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
          ${QuickAnswerBlock([
            "Para vender una propiedad en Cancun con Puerto Cancun Center, el primer paso es solicitar una valoracion y registrar la informacion principal del inmueble.",
            "La IA puede ayudarte a ordenar datos, pero la publicacion, el precio y el seguimiento deben revisarse con criterio local y compradores reales.",
          ])}
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
  { path: "/propiedades", enPath: "/en/properties", h1: "Propiedades en Cancun", enH1: "Properties in Cancun", intro: "Explora casas, departamentos, terrenos y preventas verificadas por el equipo de Puerto Cancun Center.", enIntro: "Explore homes, condos, land and presale opportunities verified by the Puerto Cancun Center team.", filter: {} },
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
  { path: "/propiedades/desarrollos-cancun", enPath: "/en/properties/developments-cancun", h1: "Desarrollos inmobiliarios en Cancun", enH1: "Real estate developments in Cancun", intro: "Desarrollos residenciales seleccionados para compradores e inversionistas.", enIntro: "Selected residential developments for buyers and investors.", filter: { type: "Desarrollo" } },
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
];

const companyPages = [
  { path: "/nosotros", alternate: "/en/about", lang: "es", title: "Nosotros | Puerto Cancun Center", description: "Conoce el enfoque, los valores y el proceso de Puerto Cancun Center para conectar propietarios, compradores e inventario inmobiliario en Cancun.", h1: "Nosotros: experiencia inmobiliaria en Cancún", eyebrow: "Puerto Cancún Center", intro: "Coordinamos publicaciones, solicitudes, seguimiento y contacto para que compradores y propietarios avancen con información clara y acompañamiento local.", cta: "Ver propiedades", ctaHref: "/propiedades" },
  { path: "/contacto", alternate: "/en/contact", lang: "es", title: "Contacto | Puerto Cancun Center", description: "Contacta a Puerto Cancun Center por WhatsApp o visita nuestra oficina en Zona Hotelera de Cancun.", h1: "Contacta a Puerto Cancun Center", eyebrow: "Atencion a compradores y propietarios", intro: "Puerto Cancun Mall, Marina B., oficina 27, Zona Hotelera, Cancun 77500, Q Roo, Mexico.", cta: "Contactar por WhatsApp", ctaHref: "https://wa.me/5219982166563" },
  { path: "/en/about", alternate: "/nosotros", lang: "en", title: "About us | Puerto Cancun Center", description: "Learn about the approach, values and process Puerto Cancun Center uses to connect property owners, buyers and active Cancun inventory.", h1: "About us: Cancun real estate experience", eyebrow: "Puerto Cancun Center", intro: "We coordinate listings, requests and follow-up so buyers and property owners can move forward with clear information and local guidance.", cta: "Browse properties", ctaHref: "/en/properties" },
  { path: "/en/contact", alternate: "/contacto", lang: "en", title: "Contact | Puerto Cancun Center", description: "Contact Puerto Cancun Center by WhatsApp or visit our Cancun Hotel Zone office.", h1: "Contact Puerto Cancun Center", eyebrow: "Buyer and owner support", intro: "Puerto Cancun Mall, Marina B., office 27, Hotel Zone, Cancun 77500, Q Roo, Mexico.", cta: "Contact by WhatsApp", ctaHref: "https://wa.me/5219982166563" },
];

pages.forEach((page) => {
  if (!page.lang) page.lang = "es";
});

const alternatePairs = {
  "/": "/en/",
  "/comprar-casa-cancun": "/en/buy-property-cancun",
  "/vender-casa-cancun": "/en/sell-property-cancun",
  "/valuacion-inmobiliaria-cancun": "/en/property-valuation-cancun",
  "/validar-respuesta-ia": "/en/validate-ai-answer",
  "/faq-inmobiliario-cancun": "/en/cancun-real-estate-faq",
};
pages.forEach((page) => {
  if (alternatePairs[page.path]) page.alternate = alternatePairs[page.path];
});
pages.push(...englishPages, ...companyPages, ...categoryPages);

function propertyMatchesCategory(property, filter = {}) {
  return (!filter.zone || property.zone === filter.zone) && (!filter.type || property.type === filter.type) && (!filter.operation || property.operation === filter.operation) && (!filter.featured || property.featured);
}

function localizedListingPrice(property, lang = "es", exchangeRate = 18.5) {
  const safeRate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 18.5;
  if (lang === "en") {
    const amount = property.priceUsd ?? (property.priceMxn ? Number(property.priceMxn) / safeRate : null);
    return amount ? { amount, currency: "USD" } : null;
  }
  const amount = property.priceMxn ?? (property.priceUsd ? Number(property.priceUsd) * safeRate : null);
  return amount ? { amount, currency: "MXN" } : null;
}

function formatListingPrice(property, lang = "es") {
  const locale = lang === "en" ? "en-US" : "es-MX";
  const selected = localizedListingPrice(property, lang);
  if (selected) return `${selected.currency} $${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(selected.amount)}`;
  return lang === "en" ? "Price on request" : "Precio a consultar";
}

function safePublicImages(property) {
  const images = Array.isArray(property.images) ? property.images : [];
  return images.filter((image) => /^https?:\/\//i.test(image) || /^\/media\//.test(image) || /^\/assets\//.test(image));
}

function renderInventoryCards(properties, lang = "es") {
  if (!properties.length) return `<p class="inventory-empty">${lang === "en" ? "No public listings are available in this category right now. Contact us to receive options." : "No hay publicaciones activas en esta categoria por el momento. Contactanos para recibir opciones."}</p>`;
  return `<div class="seo-property-grid">${properties.map((property) => {
    const image = safePublicImages(property)[0] || "/assets/og-puerto-cancun-center.webp";
    const title = lang === "en" ? property.titleEn || property.titleEs : property.titleEs || property.titleEn;
    const url = propertyPath(property, lang);
    return `<article class="seo-property-card">
      <a class="seo-property-image" href="${escapeHtml(url)}"><img src="${escapeHtml(image)}" width="640" height="420" loading="lazy" alt="${escapeHtml(title)}" /></a>
      <div><p class="seo-property-price">${escapeHtml(formatListingPrice(property, lang))}</p><h2><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></h2><p>${escapeHtml([property.zone, property.type, property.mls ? `MLS# ${property.mls}` : ""].filter(Boolean).join(" · "))}</p><a class="text-link" href="${escapeHtml(url)}">${lang === "en" ? "View property" : "Ver propiedad"}</a></div>
    </article>`;
  }).join("")}</div>`;
}

function renderCategoryPage(page, properties) {
  const visible = properties.filter((property) => propertyMatchesCategory(property, page.category));
  const related = categoryPages.filter((candidate) => candidate.lang === page.lang && candidate.path !== page.path).slice(0, 5).map((candidate) => ({ label: candidate.h1, href: candidate.path }));
  return pageShell(page, `<section id="category-inventory" class="category-inventory"><div class="section-heading"><p class="section-kicker">${page.lang === "en" ? "Active inventory" : "Inventario activo"}</p><h2>${page.lang === "en" ? `${visible.length} available listings` : `${visible.length} propiedades disponibles`}</h2></div>${renderInventoryCards(visible, page.lang)}</section>${InternalLinksBlock(related)}`);
}

function propertySchema(property, baseUrl = DEFAULT_SITE_URL, lang = "es") {
  const url = absoluteUrl(propertyPath(property, lang), baseUrl);
  const images = safePublicImages(property).map((image) => absoluteUrl(image, baseUrl));
  const title = lang === "en" ? property.titleEn || property.titleEs : property.titleEs || property.titleEn;
  const description = lang === "en" ? property.descriptionEn || property.descriptionEs : property.descriptionEs || property.descriptionEn;
  const localizedPrice = localizedListingPrice(property, lang);
  const mainEntity = {
    "@type": property.type === "Casa" ? "House" : property.type === "Departamento" ? "Apartment" : "Residence",
    name: title,
    description,
    numberOfBedrooms: property.beds || undefined,
    numberOfBathroomsTotal: property.baths || undefined,
    numberOfParkingSpaces: property.parking || undefined,
    amenityFeature: Array.isArray(property.amenities) ? property.amenities.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })) : undefined,
    floorSize: property.area ? { "@type": "QuantitativeValue", value: property.area, unitCode: "MTK" } : undefined,
    address: { "@type": "PostalAddress", streetAddress: property.address || undefined, addressLocality: property.city || "Cancun", addressRegion: property.state || "Quintana Roo", addressCountry: "MX" },
  };
  return {
    "@context": "https://schema.org", "@type": "RealEstateListing", "@id": `${url}#listing`, url, name: title, description, keywords: Array.isArray(property.keywords) ? property.keywords.join(", ") : undefined, image: images, datePosted: property.createdAt, dateModified: property.updatedAt || property.createdAt, inLanguage: lang === "en" ? "en" : "es-MX", identifier: property.mls || property.id, mainEntity,
    offers: localizedPrice ? { "@type": "Offer", price: Number(localizedPrice.amount.toFixed(2)), priceCurrency: localizedPrice.currency, availability: "https://schema.org/InStock", url, seller: { "@id": `${absoluteUrl("/", baseUrl)}#real-estate-agent` } } : undefined,
  };
}

function renderPropertyPage(property, lang = "es", similar = []) {
  const english = lang === "en";
  const title = english ? property.titleEn || property.titleEs : property.titleEs || property.titleEn;
  const description = english ? property.descriptionEn || property.descriptionEs : property.descriptionEs || property.descriptionEn;
  const images = safePublicImages(property);
  const path = propertyPath(property, lang);
  const otherPath = propertyPath(property, english ? "es" : "en");
  const facts = [english ? "Available" : "Disponible", property.type, property.operation === "rent" ? (english ? "For rent" : "En renta") : (english ? "For sale" : "En venta"), property.beds ? `${property.beds} ${english ? "bedrooms" : "recamaras"}` : "", property.baths ? `${property.baths} ${english ? "bathrooms" : "banos"}` : "", property.parking ? `${property.parking} ${english ? "parking spaces" : "estacionamientos"}` : "", property.area ? `${property.area} m2` : "", property.lot ? `${property.lot} m2 ${english ? "lot" : "terreno"}` : "", property.mls ? `MLS# ${property.mls}` : ""].filter(Boolean);
  const page = { path, alternate: otherPath, lang, h1: title, title: `${title} | Puerto Cancun Center`, description: String(description || title).slice(0, 158), eyebrow: english ? "Verified property listing" : "Ficha inmobiliaria verificada", intro: `${property.zone || "Cancun"} · ${formatListingPrice(property, lang)}`, cta: english ? "Contact by WhatsApp" : "Contactar por WhatsApp", ctaHref: `https://wa.me/5219982166563?text=${encodeURIComponent(`${english ? "Hello, I would like information about" : "Hola, deseo informacion sobre"}: ${title} - ${absoluteUrl(path)}`)}`, hideLastUpdated: true };
  const galleryImages = images.length ? images : ["/assets/og-puerto-cancun-center.webp"];
  const gallerySlides = galleryImages.map((image, index) => `<figure class="property-gallery-slide ${index === 0 ? "is-active" : ""}" data-gallery-slide="${index}" aria-hidden="${index === 0 ? "false" : "true"}"><img src="${escapeHtml(image)}" width="1200" height="800" ${index ? 'loading="lazy"' : 'fetchpriority="high"'} alt="${escapeHtml(`${title} - ${index + 1}`)}" /></figure>`).join("");
  const galleryThumbs = galleryImages.map((image, index) => `<button class="property-gallery-thumb ${index === 0 ? "is-active" : ""}" type="button" data-gallery-go="${index}" aria-label="${english ? "View photo" : "Ver foto"} ${index + 1}"><img src="${escapeHtml(image)}" width="160" height="110" loading="lazy" alt="" /></button>`).join("");
  const gallery = `<section class="property-page-gallery" data-property-carousel aria-label="${english ? "Property image gallery" : "Galeria de imagenes de la propiedad"}"><div class="property-gallery-stage">${gallerySlides}<button class="property-gallery-open" type="button" data-open-property-gallery><span>${english ? "View property gallery" : "Ver galería de la propiedad"}</span><b>${galleryImages.length}</b></button>${galleryImages.length > 1 ? `<button class="property-gallery-arrow previous" type="button" data-gallery-previous aria-label="${english ? "Previous photo" : "Foto anterior"}">‹</button><button class="property-gallery-arrow next" type="button" data-gallery-next aria-label="${english ? "Next photo" : "Foto siguiente"}">›</button>` : ""}<span class="property-gallery-counter" data-gallery-counter>1 / ${galleryImages.length}</span></div>${galleryImages.length > 1 ? `<div class="property-gallery-thumbs">${galleryThumbs}</div>` : ""}</section>`;
  const galleryModal = `<div class="property-gallery-modal" data-property-gallery-modal hidden><section class="property-gallery-dialog" role="dialog" aria-modal="true" aria-label="${english ? "Property gallery" : "Galeria de la propiedad"}"><button class="property-gallery-close" type="button" data-close-property-gallery aria-label="${english ? "Close gallery" : "Cerrar galeria"}">×</button><div class="property-gallery-modal-stage"><img data-gallery-modal-image src="${escapeHtml(galleryImages[0])}" alt="${escapeHtml(`${title} - 1`)}" /><button class="property-gallery-arrow previous" type="button" data-gallery-previous aria-label="${english ? "Previous photo" : "Foto anterior"}">‹</button><button class="property-gallery-arrow next" type="button" data-gallery-next aria-label="${english ? "Next photo" : "Foto siguiente"}">›</button></div><div class="property-gallery-toolbar"><button type="button" data-gallery-zoom-out aria-label="${english ? "Zoom out" : "Alejar"}">−</button><button type="button" data-gallery-zoom-reset>${english ? "Reset" : "Restablecer"}</button><button type="button" data-gallery-zoom-in aria-label="${english ? "Zoom in" : "Acercar"}">+</button><span data-gallery-modal-counter>1 / ${galleryImages.length}</span></div><div class="property-gallery-modal-thumbs">${galleryThumbs}</div></section></div>`;
  const mapLink = property.googleMapsUrl && /^https?:\/\//i.test(property.googleMapsUrl) ? `<a class="text-link" href="${escapeHtml(property.googleMapsUrl)}" target="_blank" rel="noopener">${english ? "Open location in Google Maps" : "Abrir ubicacion en Google Maps"}</a>` : "";
  const similarSection = similar.length ? `<section class="similar-properties"><div class="section-heading"><h2>${english ? "Similar properties" : "Propiedades similares"}</h2></div>${renderInventoryCards(similar.slice(0, 3), lang)}</section>` : "";
  const amenities = Array.isArray(property.amenities) && property.amenities.length ? `<section class="property-amenities"><h2>${english ? "Amenities" : "Amenidades"}</h2><ul>${property.amenities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "";
  const content = `<section class="property-page-layout">${gallery}<aside class="property-page-summary"><p class="property-page-price">${escapeHtml(formatListingPrice(property, lang))}</p><div class="property-facts">${facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join("")}</div><h2>${english ? "Property details" : "Detalles de la propiedad"}</h2><p class="property-address">${escapeHtml([property.address, property.neighborhood, property.zone, property.city, property.state].filter(Boolean).join(", "))}</p>${mapLink}<div class="property-long-description">${String(description || "").split(/\n+/).filter(Boolean).map((part) => `<p>${escapeHtml(part)}</p>`).join("")}</div>${amenities}<a class="primary-button property-whatsapp" href="${page.ctaHref}" target="_blank" rel="noopener">${page.cta}</a></aside></section>${galleryModal}<section class="property-lead"><h2>${english ? "Schedule a visit or request details" : "Agenda una visita o solicita informacion"}</h2>${BuyerLeadForm(lang)}</section>${similarSection}${InternalLinksBlock([{ label: english ? "All properties" : "Todas las propiedades", href: english ? "/en/properties" : "/propiedades" }, { label: english ? "Puerto Cancun properties" : "Propiedades en Puerto Cancun", href: english ? "/en/properties/puerto-cancun" : "/propiedades/puerto-cancun" }], english ? "Related resources" : "Recursos relacionados")}`;
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
    <section class="quick-answer"><span>SELLING GUIDE</span><h2>Understand the process before registering</h2><p>Learn how the listing process works before creating an account. An advisor reviews the property information, pricing context and images before publication.</p></section>
    <section class="seo-columns"><div><h2>How we support your sale</h2><ul><li>Collect the essential property information.</li><li>Review price, location and selling points.</li><li>Prepare a clear presentation for prospective buyers.</li><li>Follow up on inquiries and next steps.</li></ul></div><div><h2>Benefits of listing with us</h2><ul><li>Connected buyer and advisor workflows.</li><li>Individual image management and organized property information.</li><li>Professional property sheets and marketing support.</li><li>A single panel to follow your requests.</li></ul></div></section>
    <section class="seller-onboarding-cta"><div><span>LIST WITH GUIDANCE</span><h2>Register and list with us</h2><p>Create your account after reviewing the process. You can submit the property details and photos and receive advisor follow-up.</p></div><div class="seller-onboarding-actions"><button class="primary-button" type="button" data-seller-access="register">Register to list</button><button class="outline-dark-button" type="button" data-seller-access="login">I already have an account</button></div></section>
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

function sitemapXml(baseUrl = DEFAULT_SITE_URL, properties = []) {
  const staticUrls = pages;
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
