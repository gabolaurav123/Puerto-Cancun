const EXTERNAL_PROPERTY_STATUSES = new Set([
  "draft",
  "available",
  "reserved",
  "unavailable",
  "sold",
  "rented",
  "archived",
]);

function safeJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function text(value, maxLength = 500) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function longText(value, maxLength = 50000) {
  return String(value || "").trim().slice(0, maxLength);
}

function list(value, limit = 40) {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = new Set();
  return source
    .map((item) => text(item, 120))
    .filter((item) => {
      const key = item.toLocaleLowerCase("es-MX");
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function optionalNumber(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    const error = new Error(`Revisa ${label}.`);
    error.status = 400;
    throw error;
  }
  return number;
}

function nonNegativeInteger(value, label) {
  const number = optionalNumber(value === "" || value === undefined || value === null ? 0 : value, label, { min: 0, max: 100000 });
  if (!Number.isInteger(number)) {
    const error = new Error(`${label} debe ser un número entero.`);
    error.status = 400;
    throw error;
  }
  return number;
}

function normalizeEmail(value) {
  const email = text(value, 254).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("El correo del contacto externo no es válido.");
    error.status = 400;
    throw error;
  }
  return email;
}

function externalReference(id, supplied = "") {
  const reference = text(supplied, 80).toUpperCase();
  if (reference) return reference;
  const suffix = String(id || "").replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase();
  return `EXT-${suffix || Date.now().toString(36).toUpperCase()}`;
}

function normalizeImageMetadata(value, count) {
  const source = Array.isArray(value) ? value : safeJsonArray(value);
  return Array.from({ length: count }, (_unused, index) => ({
    descriptionEs: longText(source[index]?.descriptionEs, 500),
    descriptionEn: longText(source[index]?.descriptionEn, 500),
  }));
}

function normalizeExternalPropertyInput(body = {}, { id, images = [] } = {}) {
  const titleEs = text(body.title || body.titleEs, 240);
  const titleEn = text(body.titleEn, 240);
  const type = text(body.type, 80);
  const state = text(body.state || "Quintana Roo", 120);
  const city = text(body.city || "Cancun", 120);
  const zone = text(body.zone, 160);
  const status = EXTERNAL_PROPERTY_STATUSES.has(String(body.status || "").toLowerCase())
    ? String(body.status).toLowerCase()
    : "available";
  const externalContactName = text(body.externalContactName, 180);
  const externalCompany = text(body.externalCompany, 180);
  if (!titleEs || !type || !state || !city || !zone) {
    const error = new Error("Completa título, tipo de propiedad, estado, ciudad y zona.");
    error.status = 400;
    throw error;
  }
  if (!externalContactName && !externalCompany) {
    const error = new Error("Agrega el nombre del colega o la empresa de origen.");
    error.status = 400;
    throw error;
  }
  const latitude = optionalNumber(body.latitude, "la latitud", { min: -90, max: 90 });
  const longitude = optionalNumber(body.longitude, "la longitud", { min: -180, max: 180 });
  if ((latitude === null) !== (longitude === null)) {
    const error = new Error("Ingresa latitud y longitud, o deja ambas vacías.");
    error.status = 400;
    throw error;
  }
  const storedImages = safeJsonArray(images).filter(Boolean).slice(0, 20);
  return {
    id,
    referenceCode: externalReference(id, body.referenceCode),
    titleEs,
    titleEn,
    type,
    operation: body.operation === "rent" ? "rent" : "sale",
    state,
    city,
    zone,
    neighborhood: text(body.neighborhood, 160),
    address: text(body.address, 300),
    latitude,
    longitude,
    mapPlace: text(body.mapPlace, 260),
    locationPrecision: ["exact", "approximate", "hidden"].includes(body.locationPrecision)
      ? body.locationPrecision
      : latitude === null ? "approximate" : "exact",
    googleMapsUrl: text(body.googleMapsUrl, 500),
    currency: body.currency === "MXN" ? "MXN" : "USD",
    price: optionalNumber(body.price, "el precio"),
    priceUnit: body.priceUnit === "sqm" ? "sqm" : "total",
    beds: nonNegativeInteger(body.beds, "Recámaras"),
    baths: optionalNumber(body.baths === "" || body.baths === undefined || body.baths === null ? 0 : body.baths, "baños", { min: 0, max: 100 }),
    parking: nonNegativeInteger(body.parking, "Estacionamientos"),
    area: optionalNumber(body.area === "" || body.area === undefined || body.area === null ? 0 : body.area, "la superficie construida", { min: 0 }),
    lot: optionalNumber(body.lot === "" || body.lot === undefined || body.lot === null ? 0 : body.lot, "la superficie de terreno", { min: 0 }),
    features: list(body.features, 50),
    amenities: list(body.amenities, 50),
    keywords: list(body.keywords, 50),
    images: storedImages,
    imageMetadata: normalizeImageMetadata(body.imageMetadata, storedImages.length),
    descriptionEs: longText(body.description || body.descriptionEs),
    descriptionEn: longText(body.descriptionEn),
    additionalInformation: longText(body.additionalInformation, 8000),
    status,
    externalContactName,
    externalCompany,
    externalPhone: text(body.externalPhone, 60),
    externalWhatsapp: text(body.externalWhatsapp, 60),
    externalEmail: normalizeEmail(body.externalEmail),
    internalNotes: longText(body.internalNotes, 12000),
    externalAdditionalInfo: longText(body.externalAdditionalInfo, 8000),
  };
}

function toExternalProperty(row = {}, { includePrivate = true, mediaBase = "" } = {}) {
  const storedCount = safeJsonArray(row.images).length || (row.image ? 1 : 0);
  const imageCount = Math.max(0, Number(row.image_count ?? storedCount));
  const base = String(mediaBase || `/media/external-properties/${encodeURIComponent(row.id || "")}`).replace(/\/$/, "");
  const property = {
    id: row.id,
    referenceCode: row.reference_code || "",
    external: true,
    titleEs: row.title_es || "",
    titleEn: row.title_en || "",
    type: row.type || "",
    operation: row.operation === "rent" ? "rent" : "sale",
    state: row.state || "",
    city: row.city || "",
    zone: row.zone || "",
    neighborhood: row.neighborhood || "",
    address: row.address || "",
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    mapPlace: row.map_place || "",
    locationPrecision: row.location_precision || "approximate",
    googleMapsUrl: row.google_maps_url || "",
    currency: row.price_currency === "MXN" ? "MXN" : "USD",
    price: row.price_amount === null || row.price_amount === undefined ? null : Number(row.price_amount),
    priceUnit: row.price_unit === "sqm" ? "sqm" : "total",
    beds: Number(row.beds || 0),
    baths: Number(row.baths || 0),
    parking: Number(row.parking || 0),
    area: Number(row.area || 0),
    lot: Number(row.lot || 0),
    features: safeJsonArray(row.features),
    amenities: safeJsonArray(row.amenities),
    keywords: safeJsonArray(row.keywords),
    descriptionEs: row.description_es || "",
    descriptionEn: row.description_en || "",
    additionalInformation: row.additional_information || "",
    status: row.status || "draft",
    imageCount,
    imageMetadata: normalizeImageMetadata(row.image_metadata, imageCount),
    images: Array.from({ length: imageCount }, (_unused, index) => `${base}/${index}`),
    image: imageCount ? `${base}/0` : "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    archivedAt: row.archived_at || null,
  };
  if (includePrivate) {
    property.externalContact = {
      name: row.external_contact_name || "",
      company: row.external_company || "",
      phone: row.external_phone || "",
      whatsapp: row.external_whatsapp || "",
      email: row.external_email || "",
      internalNotes: row.internal_notes || "",
      additionalInfo: row.external_additional_info || "",
    };
  }
  return property;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(value, currency = "USD") {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "Precio a consultar";
  return `${currency} $${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(amount)}`;
}

function locationLabel(property) {
  return [property.neighborhood, property.zone, property.city, property.state]
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");
}

function normalizeWhatsAppNumber(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 15);
}

function externalPropertyWhatsappText(property, shareUrl, { includeContact = false } = {}) {
  const contact = includeContact ? property.externalContact || {} : {};
  const contactLines = includeContact
    ? [
        contact.name ? `👤 ${contact.name}` : "",
        contact.company ? `🏢 ${contact.company}` : "",
        contact.whatsapp ? `💬 WhatsApp: ${contact.whatsapp}` : "",
        !contact.whatsapp && contact.phone ? `☎️ Teléfono: ${contact.phone}` : "",
        contact.email ? `✉️ ${contact.email}` : "",
      ].filter(Boolean)
    : [];
  return [
    "🏷️ *EXT · Propiedad externa de colaboración*",
    `*${property.titleEs}*`,
    locationLabel(property) ? `📍 ${locationLabel(property)}` : "",
    `💰 ${formatMoney(property.price, property.currency)}${property.priceUnit === "sqm" ? " por m²" : ""}`,
    property.beds ? `🛏️ ${property.beds} recámara${property.beds === 1 ? "" : "s"}` : "",
    property.baths ? `🚿 ${property.baths} baño${property.baths === 1 ? "" : "s"}` : "",
    property.area ? `📐 Construcción: ${property.area} m²` : "",
    property.lot ? `🌿 Terreno: ${property.lot} m²` : "",
    ...contactLines,
    "",
    `🔗 Ver presentación privada: ${shareUrl}`,
  ].filter((line) => line !== "").join("\n");
}

function renderExternalPropertyShareHtml(property, { shareUrl, includeContact = false } = {}) {
  const contact = includeContact ? property.externalContact || {} : {};
  const location = locationLabel(property);
  const imageDescription = property.imageMetadata?.[0]?.descriptionEs || property.titleEs;
  const mapQuery = property.latitude !== null && property.longitude !== null
    ? `${property.latitude},${property.longitude}`
    : [property.address, location].filter(Boolean).join(", ");
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : "";
  const whatsappNumber = normalizeWhatsAppNumber(contact.whatsapp || contact.phone);
  const contactRows = [
    ["Contacto", contact.name],
    ["Empresa", contact.company],
    ["Teléfono", contact.phone],
    ["WhatsApp", contact.whatsapp],
    ["Correo", contact.email],
  ].filter(([, value]) => value);
  const facts = [
    property.beds ? ["Recámaras", property.beds] : null,
    property.baths ? ["Baños", property.baths] : null,
    property.parking ? ["Estacionamientos", property.parking] : null,
    property.area ? ["Construcción", `${property.area} m²`] : null,
    property.lot ? ["Terreno", `${property.lot} m²`] : null,
    property.type ? ["Tipo", property.type] : null,
    ["Operación", property.operation === "rent" ? "Renta" : "Venta"],
  ].filter(Boolean);
  const imageMarkup = property.images.length
    ? `<section class="gallery" aria-label="Fotografías de la propiedad">
        <div class="gallery-stage">${property.images.map((src, index) => `<img src="${escapeHtml(src)}" alt="${escapeHtml(property.imageMetadata?.[index]?.descriptionEs || `${property.titleEs}, fotografía ${index + 1}`)}" ${index ? "hidden" : ""} data-gallery-image="${index}" />`).join("")}</div>
        ${property.images.length > 1 ? `<div class="gallery-controls"><button type="button" data-gallery-prev aria-label="Fotografía anterior">‹</button><span><b data-gallery-current>1</b> / ${property.images.length}</span><button type="button" data-gallery-next aria-label="Fotografía siguiente">›</button></div><div class="gallery-thumbs">${property.images.map((src, index) => `<button type="button" data-gallery-thumb="${index}" class="${index === 0 ? "active" : ""}" aria-label="Ver fotografía ${index + 1}"><img src="${escapeHtml(src)}" alt="" /></button>`).join("")}</div>` : ""}
      </section>`
    : `<section class="gallery-empty"><strong>Presentación privada</strong><span>Fotografías por confirmar con el colaborador.</span></section>`;
  const contactMarkup = includeContact && contactRows.length
    ? `<section class="contact"><div><span class="section-label">CONTACTO AUTORIZADO</span><h2>Datos del colaborador</h2></div><dl>${contactRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl><div class="contact-actions">${whatsappNumber ? `<a href="https://wa.me/${escapeHtml(whatsappNumber)}" rel="nofollow noopener">Abrir WhatsApp</a>` : ""}${contact.email ? `<a href="mailto:${escapeHtml(contact.email)}" rel="nofollow">Enviar correo</a>` : ""}</div></section>`
    : "";
  const ogImage = property.image ? `<meta property="og:image" content="${escapeHtml(property.image)}"><meta property="og:image:alt" content="${escapeHtml(imageDescription)}">` : "";
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex">
  <meta name="referrer" content="no-referrer">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(`EXT · ${property.titleEs}`)}">
  <meta property="og:description" content="${escapeHtml(`${formatMoney(property.price, property.currency)} · ${location || property.type}`)}">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  ${ogImage}
  <title>${escapeHtml(`EXT · ${property.titleEs} | Pick.State`)}</title>
  <style>
    :root{--ink:#063b46;--teal:#006678;--gold:#c49a35;--paper:#f3f7f6;--line:#d5e2e0;--muted:#5d7478}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 Arial,sans-serif}a{color:inherit}.topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px max(20px,calc((100vw - 1120px)/2));background:#042f38;color:#fff;border-bottom:3px solid var(--gold)}.brand{font:700 1.05rem Georgia,serif;letter-spacing:.04em}.ext{display:inline-flex;align-items:center;min-height:32px;padding:4px 12px;border:1px solid #e8c96d;color:#ffe39a;font-size:.78rem;font-weight:800}.shell{width:min(1120px,100%);margin:auto;padding:clamp(18px,4vw,42px)}.hero{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr);gap:clamp(24px,4vw,54px);align-items:start}.gallery{min-width:0}.gallery-stage{position:relative;aspect-ratio:4/3;overflow:hidden;background:#dfe8e6}.gallery-stage img{width:100%;height:100%;object-fit:cover}.gallery-controls{display:flex;align-items:center;justify-content:space-between;margin-top:10px}.gallery-controls button{width:42px;height:42px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:1.5rem;cursor:pointer}.gallery-thumbs{display:grid;grid-auto-flow:column;grid-auto-columns:76px;gap:8px;overflow-x:auto;padding:10px 0 2px}.gallery-thumbs button{aspect-ratio:1;border:2px solid transparent;padding:0;background:#fff;cursor:pointer}.gallery-thumbs button.active{border-color:var(--gold)}.gallery-thumbs img{width:100%;height:100%;object-fit:cover}.gallery-empty{min-height:300px;display:grid;place-content:center;text-align:center;background:#dfe8e6;border-top:4px solid var(--gold)}.gallery-empty span{color:var(--muted)}.summary{padding-top:8px}.section-label{display:block;color:#956c14;font-size:.73rem;font-weight:800}.summary h1{margin:10px 0 12px;font:700 clamp(2rem,5vw,3.5rem)/1.04 Georgia,serif;overflow-wrap:anywhere}.location{margin:0 0 22px;color:var(--muted)}.price{display:block;margin-bottom:24px;color:var(--teal);font:700 clamp(1.65rem,4vw,2.35rem) Georgia,serif}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));margin:0;border-top:1px solid var(--line);border-left:1px solid var(--line)}.facts div{padding:13px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff}.facts dt{color:var(--muted);font-size:.74rem;text-transform:uppercase}.facts dd{margin:3px 0 0;font-weight:700}.map-link{display:inline-flex;margin-top:16px;font-weight:700;text-decoration-thickness:2px;text-underline-offset:4px}.content{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.42fr);gap:32px;margin-top:44px}.copy,.contact{padding:clamp(22px,4vw,38px);background:#fff;border-top:3px solid var(--gold)}h2{margin:6px 0 16px;font:700 clamp(1.55rem,3vw,2.15rem) Georgia,serif}.copy p{white-space:pre-line}.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:20px}.pills span{padding:7px 10px;border:1px solid var(--line);background:var(--paper);font-size:.86rem}.contact dl{margin:0}.contact dl div{padding:10px 0;border-bottom:1px solid var(--line)}.contact dt{font-size:.75rem;color:var(--muted);text-transform:uppercase}.contact dd{margin:2px 0 0;font-weight:700;overflow-wrap:anywhere}.contact-actions{display:grid;gap:8px;margin-top:18px}.contact-actions a{display:flex;min-height:44px;align-items:center;justify-content:center;border:1px solid var(--teal);background:var(--teal);color:#fff;font-weight:700;text-decoration:none}.notice{margin-top:28px;padding:18px;border:1px solid var(--line);color:var(--muted);font-size:.86rem}.footer{padding:28px 20px;text-align:center;background:#042f38;color:#d9e6e5;font-size:.82rem}@media(max-width:760px){.hero,.content{grid-template-columns:1fr}.shell{padding:16px}.summary h1{font-size:clamp(2rem,11vw,2.75rem)}.gallery-stage{aspect-ratio:1}.content{margin-top:28px}.contact{order:-1}.topbar{padding:14px 16px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
  </style>
</head>
<body>
  <header class="topbar"><strong class="brand">PICK.STATE</strong><span class="ext">EXT · COLABORACIÓN</span></header>
  <main class="shell">
    <section class="hero">${imageMarkup}<div class="summary"><span class="section-label">SELECCIÓN INMOBILIARIA EXTERNA</span><h1>${escapeHtml(property.titleEs)}</h1><p class="location">${escapeHtml(location || property.address || "Ubicación por confirmar")}</p><strong class="price">${escapeHtml(formatMoney(property.price, property.currency))}${property.priceUnit === "sqm" ? " / m²" : ""}</strong><dl class="facts">${facts.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>${mapUrl ? `<a class="map-link" href="${escapeHtml(mapUrl)}" target="_blank" rel="nofollow noopener">Ver ubicación en el mapa</a>` : ""}</div></section>
    <section class="content"><article class="copy"><span class="section-label">INFORMACIÓN DE LA PROPIEDAD</span><h2>Descripción y características</h2><p>${escapeHtml(property.descriptionEs || "Información detallada disponible previa confirmación.")}</p>${property.additionalInformation ? `<p>${escapeHtml(property.additionalInformation)}</p>` : ""}${property.features.length || property.amenities.length ? `<div class="pills">${[...property.features, ...property.amenities].map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}</article>${contactMarkup}</section>
    <p class="notice"><strong>EXT:</strong> esta opción pertenece a un colaborador externo. Disponibilidad, condiciones y datos deben confirmarse antes de cualquier operación.</p>
  </main>
  <footer class="footer">PICK.STATE · Presentación privada para colaboración inmobiliaria</footer>
  <script>(()=>{const images=[...document.querySelectorAll('[data-gallery-image]')];const thumbs=[...document.querySelectorAll('[data-gallery-thumb]')];const current=document.querySelector('[data-gallery-current]');let index=0;function show(next){if(!images.length)return;index=(next+images.length)%images.length;images.forEach((image,i)=>image.hidden=i!==index);thumbs.forEach((thumb,i)=>thumb.classList.toggle('active',i===index));if(current)current.textContent=String(index+1)}document.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>show(index-1));document.querySelector('[data-gallery-next]')?.addEventListener('click',()=>show(index+1));thumbs.forEach((thumb)=>thumb.addEventListener('click',()=>show(Number(thumb.dataset.galleryThumb))));})();</script>
</body>
</html>`;
}

module.exports = {
  EXTERNAL_PROPERTY_STATUSES,
  externalPropertyWhatsappText,
  normalizeExternalPropertyInput,
  normalizeImageMetadata,
  renderExternalPropertyShareHtml,
  safeJsonArray,
  toExternalProperty,
};
