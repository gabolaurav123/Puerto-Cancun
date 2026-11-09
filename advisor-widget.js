(() => {
  "use strict";
  if (/^\/(?:panel|admin|seller)(?:\/|$)/.test(location.pathname) || document.body.dataset.page === "admin") return;
  const en = () => document.documentElement.lang.startsWith("en");
  const t = (es, english) => en() ? english : es;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  let dialog, state = {}, context = {}, latest, trigger, pending = false, failedMessage = "";
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

  const phaseNames = ["collecting", "results", "no_results", "clarification", "context"];
  function pendingField(result) {
    if (typeof result.pendingField === "string") return result.pendingField;
    const question = (result.questions || []).join(" ").toLowerCase();
    if (/comprar o rentar|buy or rent/.test(question)) return "operation";
    if (/mensual.*diaria|monthly.*daily|periodo de renta|rental period/.test(question)) return "rentPeriod";
    if (/zona o desarrollo|zone or development/.test(question)) return "location";
    if (/tipo de inmueble|type of property/.test(question)) return "type";
    if (/presupuesto|budget/.test(question)) return "budget";
    if (/moneda|currency/.test(question)) return "currency";
    if (result.state?.contextId || result.phase === "context") return "";
    const filters = result.state?.filters || {};
    if (!filters.operation) return "operation";
    if (filters.operation === "rent" && !filters.rentPeriod) return "rentPeriod";
    if (!(filters.locations?.length || filters.zone || filters.development || filters.subarea)) return "location";
    if (!filters.type) return "type";
    return "";
  }

  function isDefinedSearch(result) {
    const filters = result.state?.filters || result.inquiryContext?.searchFilters || {};
    return Boolean(["sale", "rent"].includes(filters.operation)
      && (filters.locations?.length || filters.zone || filters.development || filters.subarea)
      && filters.type && (Number(filters.min) > 0 || Number(filters.max) > 0)
      && ["USD", "MXN"].includes(filters.currency)
      && (filters.operation !== "rent" || ["month", "day", "year"].includes(filters.rentPeriod)));
  }

  function phaseOf(result) {
    if (phaseNames.includes(result.phase)) return result.phase;
    if (result.needsClarification) return "clarification";
    if (result.state?.contextId && !result.questions?.length && result.cards?.length === 1) return "context";
    if (result.cards?.length) return "results";
    if (result.total === 0 && isDefinedSearch(result)) return "no_results";
    return "collecting";
  }

  function suggestedReplies(result, field) {
    if (Array.isArray(result.suggestions)) return result.suggestions.filter(value => typeof value?.label === "string" && typeof value?.message === "string" && value.message.trim()).slice(0, 6).map(value => ({ label: value.label.slice(0, 90), message: value.message.slice(0, 1200) }));
    const choice = (labelEs, labelEn, messageEs = labelEs, messageEn = labelEn) => ({ label: t(labelEs, labelEn), message: t(messageEs, messageEn) });
    if (field === "operation") return [choice("Comprar", "Buy", "Quiero comprar", "I want to buy"), choice("Rentar", "Rent", "Busco una renta", "I am looking to rent")];
    if (field === "rentPeriod") return [choice("Mensual", "Monthly", "Renta mensual", "Monthly rent"), choice("Diaria", "Daily", "Renta diaria", "Daily rent"), choice("Anual", "Yearly", "Renta anual", "Yearly rent")];
    if (field === "type") return [choice("Departamento", "Apartment"), choice("Casa", "House"), choice("Terreno", "Land"), choice("Comercial", "Commercial property")];
    if (field === "coastal") return [choice("Vista al mar", "Ocean view"), choice("Frente al mar", "Beachfront"), choice("Cerca de la playa", "Near the beach")];
    if (field === "currency") return [choice("Pesos · MXN", "Mexican pesos · MXN", "MXN", "MXN"), choice("Dólares · USD", "US dollars · USD", "USD", "USD")];
    return [];
  }

  function updateComposer(field) {
    const prompts = {
      operation: ["¿Comprar o rentar?", "Buy or rent?", "Elige una opción o escribe lo que buscas", "Choose an option or describe what you need"],
      rentPeriod: ["¿Por cuánto tiempo necesitas rentar?", "What rental period do you need?", "Por ejemplo, renta mensual", "For example, a monthly rental"],
      location: ["¿Qué zona o desarrollo te interesa?", "Which zone or development interests you?", "Por ejemplo, Puerto Cancún o Zona Hotelera", "For example, Puerto Cancun or Hotel Zone"],
      type: ["¿Qué tipo de inmueble buscas?", "What type of property are you looking for?", "Por ejemplo, departamento o casa", "For example, an apartment or house"],
      budget: ["¿Cuál es tu presupuesto y en qué moneda?", "What is your budget and currency?", "Indica el importe y MXN o USD", "Enter the amount and MXN or USD"],
      currency: ["¿El presupuesto es en pesos o dólares?", "Is your budget in pesos or dollars?", "Escribe MXN o USD", "Enter MXN or USD"],
      coastal: ["¿Qué cercanía al mar buscas?", "How close to the sea would you like to be?", "Vista al mar, frente al mar o cerca de la playa", "Ocean view, beachfront or near the beach"],
    };
    const copy = prompts[field];
    dialog.querySelector('label[for="advisor-message"]').textContent = copy ? t(copy[0], copy[1]) : t("Escribe tu respuesta o pregunta", "Write your answer or question");
    dialog.querySelector("textarea").placeholder = copy ? t(copy[2], copy[3]) : t("Puedes añadir detalles o preguntar por una propiedad", "You can add details or ask about a property");
  }

  function setPending(value) {
    pending = value;
    dialog.setAttribute("aria-busy", String(value));
    dialog.querySelectorAll('[type="submit"], [data-advisor-restart], [data-advisor-retry], [data-advisor-contact], .advisor-suggestions button, .advisor-card-actions button, .advisor-next-actions button').forEach(button => { button.disabled = value; });
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
    if (!result || typeof result.reply !== "string" || !result.reply.trim() || !result.state || typeof result.state !== "object") throw new Error("ADVISOR_INVALID_RESPONSE");
    latest = result; state = result.state;
    if (result.conversationReset === true) context = {};
    const phase = phaseOf(result), field = pendingField(result);
    dialog.dataset.phase = phase;
    dialog.querySelectorAll(".advisor-suggestions, .advisor-next-actions").forEach(node => node.remove());
    const legacyCollecting = !phaseNames.includes(result.phase) && phase === "collecting" && result.total === 0 && field;
    const reply = message(legacyCollecting ? (result.questions?.[0] || t("Vamos a precisar tu búsqueda para encontrar opciones compatibles.", "Let’s narrow down your search to find suitable options.")) : result.reply, "assistant");
    const cards = document.createElement("div"); cards.className = "advisor-cards";
    for (const card of result.cards || []) cards.append(cardNode(card));
    if (result.alternatives?.length) {
      const caption = document.createElement("h3"); caption.textContent = t("Preferencias pendientes de confirmar", "Preferences requiring confirmation"); cards.append(caption);
      for (const card of result.alternatives) cards.append(cardNode(card, true));
    }
    reply.after(cards);
    const suggestions = suggestedReplies(result, field);
    if (suggestions.length) {
      const choices = document.createElement("div"); choices.className = "advisor-suggestions";
      choices.setAttribute("role", "group"); choices.setAttribute("aria-label", t("Respuestas rápidas", "Quick replies"));
      for (const suggestion of suggestions) {
        const button = document.createElement("button"); button.type = "button"; button.textContent = suggestion.label;
        button.onclick = () => void send(suggestion.message); choices.append(button);
      }
      cards.after(choices);
    }
    const actions = document.createElement("div"); actions.className = "advisor-next-actions";
    const actualEmptySearch = phase === "no_results" && result.total === 0 && result.canSaveSearch === true && !result.needsClarification && (!result.phase || phaseNames.includes(result.phase)) && (result.phase === "no_results" || isDefinedSearch(result));
    if (actualEmptySearch) {
      const save = document.createElement("button"); save.type = "button"; save.textContent = t("Guardar búsqueda y consultar avisos", "Save search and check alerts"); save.onclick = () => inquire(null, "search-watch"); actions.append(save);
    }
    if (result.total > (result.cards || []).length && safePath(result.catalogUrl)) {
      const all = document.createElement("a"); all.href = safePath(result.catalogUrl); all.textContent = t("Ver resultados del catálogo", "View catalog results"); actions.append(all);
    }
    if (actions.children.length) (dialog.querySelector(".advisor-suggestions") || cards).after(actions);
    updateComposer(["collecting", "clarification"].includes(phase) ? field : "");
    const status = dialog.querySelector("[data-advisor-mode]");
    status.textContent = result.provider === "ai" ? t("Asistente con IA · Respuestas basadas en las fichas publicadas", "AI assistant · Answers based on published listings") : t("Asesor guiado · Información del inventario publicado", "Guided advisor · Published inventory information");
    const scroll = dialog.querySelector(".advisor-scroll"); scroll.scrollTop = reply.offsetTop - scroll.offsetTop;
  }

  async function send(value, options = {}) {
    const input = dialog.querySelector("textarea"), text = String(value ?? input.value).trim();
    if (!text || pending) return;
    const status = dialog.querySelector("[data-advisor-status]");
    if (text.length > 1200) { status.textContent = t("Resume tu mensaje en 1200 caracteres o menos.", "Keep your message to 1200 characters or fewer."); return; }
    setPending(true); failedMessage = "";
    dialog.querySelector("[data-advisor-retry]").hidden = true;
    status.textContent = t("Revisando tu mensaje…", "Reviewing your message…");
    if (!options.silent && !options.retry) message(text, "user");
    if (value === undefined || input.value.trim() === text) input.value = "";
    try {
      const body = { message: text, state, context, lang: en() ? "en" : "es" };
      const result = window.api ? await window.api("/api/advisor/chat", { method: "POST", body, retry: false, timeoutMs: 20000 }) : await window.PccInquiryRequest("/api/advisor/chat", body);
      renderResult(result); status.textContent = "";
    } catch (error) {
      status.textContent = error.status === 429 ? t("Hemos recibido varios mensajes seguidos. Espera un momento y pulsa Reintentar; tu búsqueda sigue guardada aquí.", "Several messages arrived close together. Wait a moment and choose Retry; your search is still here.") : t("No pudimos responder este mensaje. Conservamos los criterios anteriores; puedes reintentar o consultar al equipo.", "We could not answer this message. Your previous criteria are preserved; retry or contact the team.");
      failedMessage = text; dialog.querySelector("[data-advisor-retry]").hidden = false;
      if (!input.value.trim() && !options.silent) input.value = text;
    } finally { setPending(false); }
  }

  function open(values, opener) {
    if (pending) { if (dialog && !dialog.open) dialog.showModal(); return; }
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
        + '<div class="advisor-compose"><p data-advisor-status role="status"></p><button type="button" data-advisor-retry hidden>' + t("Reintentar", "Retry") + '</button><form><label for="advisor-message">' + t("Cuéntame qué necesitas", "Tell me what you need") + '</label><div><textarea id="advisor-message" rows="2" maxlength="1200" placeholder="' + escape(t("Ej. renta mensual, 2 recámaras en Puerto Cancún, hasta 40,000 MXN", "E.g. monthly rental, 2 bedrooms in Puerto Cancun, up to 40,000 MXN")) + '" required></textarea><button type="submit">' + t("Enviar", "Send") + '</button></div></form><div class="advisor-footer-actions"><button type="button" data-advisor-contact>' + t("Consultar al equipo", "Contact the team") + '</button><button class="advisor-restart" type="button" data-advisor-restart>' + t("Empezar de nuevo", "Start over") + '</button></div></div>';
      document.body.append(dialog);
      dialog.querySelector("[data-advisor-close]").onclick = () => dialog.close();
      dialog.addEventListener("close", () => trigger?.focus?.({ preventScroll: true }));
      dialog.querySelector("form").onsubmit = event => { event.preventDefault(); void send(); };
      dialog.querySelector("[data-advisor-contact]").onclick = () => inquire();
      dialog.querySelector("[data-advisor-retry]").onclick = () => { if (failedMessage) void send(failedMessage, { retry: true }); };
      dialog.querySelector("[data-advisor-restart]").onclick = () => {
        if (pending) return;
        state = {}; context = {}; latest = null; failedMessage = ""; dialog.querySelector("[data-advisor-messages]").replaceChildren(); dialog.querySelector("textarea").value = "";
        void send(t("Hola", "Hello"), { silent: true });
      };
    }
    if (!dialog.open) dialog.showModal();
    if (!latest && !pending) void send(t("Hola", "Hello"), { silent: true });
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
