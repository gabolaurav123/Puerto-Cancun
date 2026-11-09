(() => {
  "use strict";
  if (/^\/(?:panel|admin|seller)(?:\/|$)/.test(location.pathname) || document.body.dataset.page === "admin") return;
  const en = () => document.documentElement.lang.startsWith("en");
  const t = (es, english) => en() ? english : es;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  let dialog, state = {}, context = {}, latest, trigger, pending = false;
  const launch = document.createElement("button");
  launch.type = "button"; launch.className = "advisor-launch"; launch.textContent = t("Asesor inmobiliario", "Property advisor");
  launch.setAttribute("aria-haspopup", "dialog"); document.body.append(launch);

  function contextFromPage() {
    const link = document.querySelector('.property-lead [data-contact-inquiry][data-property-id]');
    const values = link ? { propertyId: link.dataset.propertyId } : {};
    const catalog = document.querySelector("[data-catalog-root]");
    if (catalog && window.PccInventory && !Object.keys(state).length) {
      const query = new URLSearchParams(catalog.getAttribute("data-catalog-query") || location.search);
      const parsed = window.PccInventory.parseQuery(query);
      if (!parsed.errors.length) state = { filters: parsed.query };
    }
    return values;
  }

  function message(text, role) {
    const node = document.createElement("div"); node.className = "advisor-message advisor-message-" + role;
    node.textContent = text; node.setAttribute("aria-label", role === "user" ? t("Tu mensaje", "Your message") : t("Respuesta del asesor", "Advisor reply"));
    dialog.querySelector("[data-advisor-messages]").append(node);
    return node;
  }

  function safePath(value) {
    try { const url = new URL(value, location.origin); return url.origin === location.origin && /^\/(?:en\/)?(?:propiedades|properties)(?:\/|\?|$)/.test(url.pathname) ? url.pathname + url.search : ""; } catch { return ""; }
  }

  function inquire(card, service = "") {
    if (!window.PccInquiry?.open) { dialog.querySelector("[data-advisor-status]").textContent = t("No se pudo abrir el formulario. Intenta de nuevo.", "The form could not be opened. Please try again."); return; }
    const data = { ...latest?.inquiryContext, service, origin: "web-advisor", sourcePath: location.pathname + location.search };
    if (card) Object.assign(data, { propertyId: card.id, propertyTitle: card.title, developmentId:card.developmentId || "", development: card.development, zone: card.zone, propertyType: card.entity === "properties" ? card.type : "", rentPeriod:card.rentPeriod || "", intent: card.operation === "rent" ? "rent" : data.intent || "buy" });
    dialog.close(); window.PccInquiry.open(data, launch);
  }

  function cardNode(card, alternative = false) {
    const cardPath = safePath(card.url);
    const article = document.createElement("article"); article.className = "advisor-card";
    const heading = document.createElement("h3"); heading.textContent = card.title; article.append(heading);
    const details = document.createElement("p"); details.textContent = [card.price, card.zone].filter(Boolean).join(" · "); article.append(details);
    if (alternative) { const explanation = document.createElement("p"); explanation.className = "advisor-differences"; explanation.textContent = card.differences.join(". "); article.append(explanation); }
    const actions = document.createElement("div"); actions.className = "advisor-card-actions";
    if (cardPath) { const link = document.createElement("a"); link.href = cardPath; link.textContent = t("Ver ficha", "View listing"); actions.append(link); }
    const detailsButton = document.createElement("button"); detailsButton.type = "button"; detailsButton.textContent = t("Preguntar", "Ask about it");
    detailsButton.onclick = () => { if (pending) return; context = { propertyId: card.id }; void send(t("Cuéntame los detalles de esta ficha", "Tell me the details of this listing")); }; actions.append(detailsButton);
    if (card.entity === "properties") { const visit = document.createElement("button"); visit.type = "button"; visit.textContent = t("Solicitar visita", "Request a viewing"); visit.onclick = () => inquire(card, "visit"); actions.append(visit); }
    else { const contact = document.createElement("button"); contact.type = "button"; contact.textContent = t("Busco una propiedad aquí", "Find a property here"); contact.onclick = () => inquire(card); actions.append(contact); }
    article.append(actions); return article;
  }

  function renderResult(result) {
    latest = result; state = result.state;
    const reply = message(result.reply, "assistant");
    const cards = document.createElement("div"); cards.className = "advisor-cards";
    for (const card of result.cards || []) cards.append(cardNode(card));
    if (result.alternatives?.length) {
      const caption = document.createElement("h3"); caption.textContent = t("Preferencias pendientes de confirmar", "Preferences requiring confirmation"); cards.append(caption);
      for (const card of result.alternatives) cards.append(cardNode(card, true));
    }
    reply.after(cards);
    const actions = document.createElement("div"); actions.className = "advisor-next-actions";
    const contact = document.createElement("button"); contact.type = "button"; contact.textContent = t("Consultar al equipo", "Contact the team"); contact.onclick = () => inquire(); actions.append(contact);
    if (result.canSaveSearch) {
      const save = document.createElement("button"); save.type = "button"; save.textContent = t("Guardar búsqueda y consultar avisos", "Save search and check alerts"); save.onclick = () => inquire(null, "search-watch"); actions.append(save);
    }
    if (result.total > (result.cards || []).length && safePath(result.catalogUrl)) {
      const all = document.createElement("a"); all.href = safePath(result.catalogUrl); all.textContent = t("Ver resultados del catálogo", "View catalog results"); actions.append(all);
    }
    cards.after(actions);
    const status = dialog.querySelector("[data-advisor-mode]");
    status.textContent = result.provider === "ai" ? t("Asistente con IA · Respuestas basadas en las fichas publicadas", "AI assistant · Answers based on published listings") : t("Asesor guiado · Información del inventario publicado", "Guided advisor · Published inventory information");
    const scroll = dialog.querySelector(".advisor-scroll"); scroll.scrollTop = reply.offsetTop - scroll.offsetTop;
  }

  async function send(value) {
    const input = dialog.querySelector("textarea"), text = String(value ?? input.value).trim();
    if (!text || pending) return;
    if (text.length > 1200) return;
    const status = dialog.querySelector("[data-advisor-status]");
    pending = true; dialog.querySelector('[type="submit"]').disabled = true;
    status.textContent = t("Consultando el inventario…", "Checking the inventory…");
    message(text, "user"); input.value = "";
    try {
      const body = { message: text, state, context, lang: en() ? "en" : "es" };
      const result = window.api ? await window.api("/api/advisor/chat", { method: "POST", body, retry: false, timeoutMs: 20000 }) : await window.PccInquiryRequest("/api/advisor/chat", body);
      renderResult(result); status.textContent = "";
    } catch (error) {
      status.textContent = error.status === 429 ? t("Espera un momento antes de continuar.", "Please wait a moment before continuing.") : t("No pudimos consultar el inventario. Conservamos tu mensaje para que puedas reintentar.", "We could not check the inventory. Your message has been kept so you can retry.");
      input.value = text;
    } finally { pending = false; dialog.querySelector('[type="submit"]').disabled = false; }
  }

  function open(values, opener) {
    if (pending && dialog?.open) return;
    trigger = opener || document.activeElement;
    const next = values?.propertyId || values?.developmentId ? values : contextFromPage();
    const contextChanged = (next.propertyId || next.developmentId) && (next.propertyId || next.developmentId) !== (context.propertyId || context.developmentId);
    if (contextChanged) {
      context = next; latest = null;
      if (dialog) dialog.querySelector("[data-advisor-messages]").replaceChildren();
    }
    if (!dialog) {
      dialog = document.createElement("dialog"); dialog.className = "advisor-dialog"; dialog.setAttribute("aria-labelledby", "advisor-title");
      dialog.innerHTML = '<header><div><h2 id="advisor-title">' + t("Tu asesor inmobiliario", "Your property advisor") + '</h2><p data-advisor-mode>' + t("Busca, consulta y solicita una visita", "Search, ask questions and request a viewing") + '</p></div><button type="button" data-advisor-close aria-label="' + t("Cerrar asesor", "Close advisor") + '">×</button></header>'
        + '<div class="advisor-scroll"><div data-advisor-messages role="log" aria-live="polite" aria-relevant="additions"></div></div>'
        + '<div class="advisor-compose"><p data-advisor-status role="status"></p><form><label for="advisor-message">' + t("Cuéntame qué necesitas", "Tell me what you need") + '</label><div><textarea id="advisor-message" rows="2" maxlength="1200" placeholder="' + escape(t("Ej. renta mensual, 2 recámaras en Puerto Cancún, hasta 40,000 MXN", "E.g. monthly rental, 2 bedrooms in Puerto Cancun, up to 40,000 MXN")) + '" required></textarea><button type="submit">' + t("Enviar", "Send") + '</button></div></form><button class="advisor-restart" type="button" data-advisor-restart>' + t("Empezar otra búsqueda", "Start another search") + '</button></div>';
      document.body.append(dialog);
      dialog.querySelector("[data-advisor-close]").onclick = () => dialog.close();
      dialog.addEventListener("close", () => trigger?.focus?.({ preventScroll: true }));
      dialog.querySelector("form").onsubmit = event => { event.preventDefault(); void send(); };
      dialog.querySelector("[data-advisor-restart]").onclick = () => {
        if (pending) return;
        state = {}; context = {}; latest = null; dialog.querySelector("[data-advisor-messages]").replaceChildren();
        void send(t("Hola", "Hello"));
      };
    }
    if (!dialog.open) dialog.showModal();
    if (!latest && !pending) void send(t("Hola", "Hello"));
    else dialog.querySelector("textarea").focus();
  }

  launch.onclick = () => open();
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-advisor-open]");
    if (!button) return;
    event.preventDefault(); open({ propertyId: button.dataset.propertyId, developmentId: button.dataset.developmentId }, button);
  });
  window.PccAdvisor = { open };
})();
