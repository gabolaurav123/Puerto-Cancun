(() => {
  "use strict";
  const key = "pcc-inquiry-contact";
  const fields = ["intent", "zone", "subzone", "development", "developmentId", "propertyId", "propertyTitle", "mls", "project", "reference", "propertyType", "budget", "currency", "rentPeriod", "office", "origin", "preferences", "summary", "sourcePath", "service", "visitPreferredAt", "searchFilters"];
  const intents = { buy: ["Comprar", "Buy"], rent: ["Buscar una renta", "Find a rental"], sell: ["Vender", "Sell"], let: ["Poner mi propiedad en renta", "List my property for rent"] };
  const typeLabels = { Casa: "House", Departamento: "Apartment", Terreno: "Land", Comercial: "Commercial property" };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const lang = () => document.documentElement.lang.startsWith("en") ? "en" : "es";
  const tr = (es, en) => lang() === "en" ? en : es;
  const option = (value, label) => '<option value="' + escape(value) + '">' + escape(label) + '</option>';
  let optionsRequest, dialog, form, opener, current, started, saved, draftId;
  const draft = new Map();
  function remember() {
    try { sessionStorage.setItem(key, JSON.stringify(Object.fromEntries(["name", "phone", "country"].map(k => [k, form.elements[k].value])))); } catch {}
  }
  function identity() { try { return JSON.parse(sessionStorage.getItem(key) || "{}") || {}; } catch { return {}; } }
  function getOptions() {
    if (!optionsRequest) optionsRequest = fetch("/api/inquiries/options").then(async r => {
      if (!r.ok) throw Error();
      return r.json();
    }).catch(error => { optionsRequest = null; throw error; });
    return optionsRequest;
  }
  function countryList({ countries, featuredCountry }) {
    const display = new Intl.DisplayNames([lang()], { type: "region" });
    const label = c => display.of(c.country) + " (" + c.prefix + ")";
    const preferred = [...new Set(["MX", "US", "CA", featuredCountry])];
    const byId = new Map(countries.map(c => [c.country, c]));
    const group = (name, list) => '<optgroup label="' + name + '">' + list.map(c => option(c.country, label(c))).join("") + '</optgroup>';
    return group(tr("Más utilizados", "Frequently used"), preferred.map(id => byId.get(id)).filter(Boolean))
      + group(tr("Otros países", "Other countries"), countries.filter(c => !preferred.includes(c.country)).sort((a,b) => label(a).localeCompare(label(b), lang())));
  }
  function row(label, name, control = "") {
    return '<label data-field="' + name + '"><span>' + escape(label) + '</span>' + (control || '<input name="' + name + '" maxlength="160">') + '</label>';
  }
  function updateQuestions() {
    const e = form.elements, owner = ["sell", "let"].includes(e.intent.value), land = e.propertyType.value === "Terreno";
    const label = (name, value) => { form.querySelector('[data-field="' + name + '"] span').textContent = value; };
    label("zone", owner ? tr("Ubicación de tu propiedad", "Where your property is located") : tr("Zona de interés", "Preferred zone"));
    const rentalBudget = { month: tr("Presupuesto mensual de renta", "Monthly rental budget"), day: tr("Presupuesto diario de renta", "Daily rental budget"), year: tr("Presupuesto anual de renta", "Yearly rental budget") };
    label("budget", e.intent.value === "rent" ? rentalBudget[e.rentPeriod?.value] || tr("Presupuesto de renta", "Rental budget") : tr("Presupuesto aproximado", "Approximate budget"));
    form.querySelector("[data-inquiry-budget]").hidden = owner;
    e.budget.disabled = owner;
    e.currency.disabled = false;
    form.querySelector('[data-field="area"]').hidden = !owner;
    form.querySelector('[data-field="features"]').hidden = !owner;
    label("area", land ? tr("Superficie aproximada del terreno (m²)", "Approximate land area (m²)") : tr("Superficie aproximada (m²)", "Approximate floor area (m²)"));
    label("features", land ? tr("Uso de suelo o servicios que conoces", "Known land use or utilities") : tr("Características que conoces", "Known property features"));
    e.preferences.placeholder = land ? tr("Por ejemplo, uso previsto, acceso o servicios.", "For example, intended use, road access or utilities.") : tr("Por ejemplo, mascotas, escuelas, tranquilidad o accesibilidad.", "For example, pets, schools, a quiet area or accessibility.");
    if (form.querySelector('[data-owner-price]')) {
      form.querySelector('[data-owner-price]').hidden = !owner;
      e.askingPrice.disabled = !owner;
      e.ownerCurrency.disabled = !owner;
      form.querySelector('[data-rent-period]').hidden = !["rent", "let"].includes(e.intent.value);
      e.rentPeriod.disabled = !["rent", "let"].includes(e.intent.value);
    }
  }
  function locationChanged() {
    const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    return ["zone", "subzone", "development"].some(k => current[k] && normalize(current[k]) !== normalize(form.elements[k].value));
  }
  function reviewOrigin() {
    form.querySelector("[data-review-origin]").hidden = !(current.project || current.propertyId || current.propertyTitle) || !locationChanged();
  }
  function step(n) {
    form.querySelectorAll("[data-inquiry-step]").forEach(el => { el.hidden = Number(el.dataset.inquiryStep) !== n; });
    dialog.querySelector(".inquiry-scroll").scrollTop = 0;
    form.querySelector('[data-inquiry-step="' + n + '"] h3')?.focus();
  }
  async function open(values = {}, trigger) {
    if (dialog?.open) return;
    opener = trigger || document.activeElement;
    const returnKey = JSON.stringify(fields.map(k => values[k] || ""));
    const existing = draft.get(returnKey);
    current = { ...values, sourcePath: values.sourcePath || location.pathname + location.search };
    started = Date.now();
    saved = null;
    draftId = existing?.id || crypto.randomUUID();
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "contextual-inquiry"; dialog.setAttribute("aria-labelledby", "inquiryTitle");
      document.body.append(dialog);
      dialog.addEventListener("close", () => { opener?.focus?.({ preventScroll: true }); });
    }
    const replay = { ...identity(), ...values, ...(existing?.values || {}) };
    const typeOptions = [...new Set([...(window.PccInventory?.TYPES || Object.keys(typeLabels)), replay.propertyType].filter(Boolean))];
    const officeLabel = values.office === "us" ? tr("Estados Unidos", "United States") : values.office === "mx" ? tr("México", "Mexico") : "";
    dialog.innerHTML = '<header><h2 id="inquiryTitle">' + (officeLabel ? "WhatsApp " + officeLabel : tr("Hablar con un asesor", "Talk to an advisor")) + '</h2><button type="button" data-inquiry-close aria-label="' + tr("Cerrar", "Close") + '">×</button></header><div class="inquiry-scroll"><form>'
      + '<section data-inquiry-step="1"><h3 tabindex="-1">' + tr("¿Qué necesitas?", "How can we help?") + '</h3>'
      + (values.project || values.propertyTitle || values.mls ? '<p class="inquiry-context">' + [...new Set([values.project, values.propertyTitle, values.mls ? "MLS " + values.mls : ""].filter(Boolean))].map(escape).join(" · ") + '</p>' : "")
      + row(tr("Quiero", "I want to"), "intent", '<select name="intent" required>' + option("", tr("Elige una opción", "Choose an option")) + Object.entries(intents).map(([k,v]) => option(k, tr(...v))).join("") + '</select>')
      + row(tr("Tipo de propiedad", "Property type"), "propertyType", '<select name="propertyType">' + option("", tr("No estoy seguro", "I'm not sure")) + typeOptions.map(t => option(t, lang() === "en" ? typeLabels[t] || t : t)).join("") + '</select>')
      + row("", "zone")
      + '<details' + (replay.subzone || replay.development ? " open" : "") + '><summary>' + tr("Subzona o desarrollo (opcional)", "Subzone or development (optional)") + '</summary>' + row(tr("Subzona o corredor", "Subzone or corridor"), "subzone") + row(tr("Desarrollo", "Development"), "development") + '</details>'
      + '<label class="inquiry-consent" data-review-origin hidden><input name="keepOrigin" type="checkbox"><span>' + tr("También me sigue interesando", "I am also still interested in") + ' ' + escape(current.project || current.propertyTitle || current.development) + '</span></label>'
      + '<div class="inquiry-budget" data-inquiry-budget>' + row("", "budget", '<input name="budget" type="number" step="any" min="0.01" max="10000000000000" inputmode="decimal" placeholder="' + tr("Aún sin definir", "Not decided yet") + '">') + row(tr("Moneda", "Currency"), "currency", '<select name="currency">' + option("", tr("Elegir", "Choose")) + option("USD", "USD") + option("MXN", "MXN") + '</select>') + '</div>'
      + row("", "area", '<input name="area" maxlength="100" placeholder="' + tr("No estoy seguro", "I'm not sure") + '">')
      + row("", "features", '<input name="features" maxlength="400">')
      + row(tr("¿Qué más te gustaría que tomemos en cuenta?", "What else should we keep in mind?"), "preferences", '<textarea name="preferences" rows="2" maxlength="1200"></textarea>')
      + '<button type="button" class="primary-button" data-inquiry-next>' + tr("Continuar", "Continue") + '</button></section>'
      + '<section data-inquiry-step="2" hidden><h3 tabindex="-1">' + tr("¿Cómo te contactamos?", "How can we reach you?") + '</h3>'
      + row(tr("País de tu teléfono", "Phone number country"), "country", '<select name="country" required>' + option("MX", tr("México (+52)", "Mexico (+52)")) + '</select>')
      + row(tr("Teléfono", "Phone number"), "phone", '<input type="tel" name="phone" autocomplete="tel" maxlength="40" required>')
      + row(tr("Nombre (opcional)", "Name (optional)"), "name", '<input name="name" autocomplete="given-name" maxlength="110">')
      + '<label class="inquiry-consent"><input type="checkbox" name="consent" required><span>' + tr("Acepto que un asesor me contacte según el", "I agree to be contacted under the") + ' <a target="_blank" rel="noopener" href="' + tr("/aviso-de-privacidad", "/en/privacy-notice") + '">' + tr("aviso de privacidad", "privacy notice") + '</a>.</span></label>'
      + '<label class="form-honeypot" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></label>'
      + '<div class="inquiry-buttons"><button type="button" class="ghost-button" data-inquiry-back>' + tr("Volver", "Back") + '</button><button type="submit" class="primary-button">' + tr("Guardar solicitud", "Save inquiry") + '</button></div></section>'
      + '<section data-inquiry-step="3" hidden><h3 tabindex="-1">' + tr("Solicitud guardada", "Inquiry saved") + '</h3><p>' + tr("Ya tenemos tu solicitud. Puedes revisar el mensaje preparado en WhatsApp y enviarlo si lo deseas.", "We have your inquiry. You can review the prepared WhatsApp message and send it if you wish.") + '</p><a class="primary-button" data-inquiry-whatsapp target="_blank" rel="noopener noreferrer">' + tr("Abrir WhatsApp", "Open WhatsApp") + '</a></section>'
      + '<p class="inquiry-status" role="status" aria-live="polite"></p></form></div>';
    form = dialog.querySelector("form");
    const extra = document.createElement("div");
    extra.className = "inquiry-extra";
    extra.innerHTML = '<div data-owner-price hidden>' + row(tr("Precio que tienes en mente (opcional)", "Your asking price (optional)"), "askingPrice", '<input name="askingPrice" type="number" min="0.01" max="10000000000000" step="any" inputmode="decimal">') + row(tr("Moneda del precio", "Price currency"), "ownerCurrency", '<select name="ownerCurrency">' + option("", tr("Elegir", "Choose")) + option("USD", "USD") + option("MXN", "MXN") + '</select>') + '</div>'
      + '<div data-rent-period hidden>' + row(tr("Periodo de renta", "Rental period"), "rentPeriod", '<select name="rentPeriod">' + option("", tr("Por definir", "Not decided")) + option("month", tr("Mensual", "Monthly")) + option("day", tr("Diaria", "Daily")) + option("year", tr("Anual", "Yearly")) + '</select>') + '</div>';
    if (values.propertyId && values.service !== "search-watch") extra.innerHTML += '<label class="inquiry-consent"><input type="checkbox" name="requestVisit"' + (values.service === "visit" ? ' checked' : '') + '><span>' + tr("Quiero solicitar una visita", "I would like to request a visit") + '</span></label><div data-visit-preference' + (values.service === "visit" ? '' : ' hidden') + '>' + row(tr("Fecha y hora preferidas (hora de Cancún)", "Preferred date and time (Cancun time)"), "visitPreferredAt", '<input name="visitPreferredAt" type="datetime-local">') + '<p>' + tr("El equipo confirmará la disponibilidad y el horario. Esta solicitud no confirma la visita.", "Our team will confirm availability and the time. This request does not confirm a visit.") + '</p></div>';
    form.querySelector('[data-inquiry-next]').before(extra);
    if (values.service === "search-watch") {
      form.querySelector('[data-inquiry-step="1"] h3').textContent = tr("Guardar esta búsqueda", "Save this search");
      for (const name of ["intent","propertyType","zone","subzone","development","budget","currency","area","features"]) {
        const field = form.querySelector('[data-field="' + name + '"]'); if (field) field.hidden = true;
      }
      extra.innerHTML = '<p>' + tr("Guardaremos los filtros exactos que seleccionaste. Puedes añadir preferencias para que un asesor las confirme.", "We will save the exact filters you selected. You can add preferences for an advisor to confirm.") + '</p>';
      const alerts = document.createElement("div"); alerts.className = "inquiry-alerts";
      alerts.innerHTML = row(tr("Avisos de nuevas coincidencias", "New match alerts"), "alertChannel", '<select name="alertChannel">' + option("", tr("Guardar para revisión del asesor", "Save for advisor review")) + '</select>') + '<p data-alert-channel-status role="status">' + tr("Comprobando canales disponibles…", "Checking available channels…") + '</p>' + '<div data-alert-email hidden>' + row(tr("Correo para los avisos", "Email for alerts"), "alertEmail", '<input type="email" name="alertEmail" maxlength="254" autocomplete="email">') + '</div><label class="inquiry-consent" data-alert-consent hidden><input type="checkbox" name="alertConsent"><span>' + tr("Autorizo recibir avisos de nuevas coincidencias por el canal seleccionado. Podré cancelarlos desde cada aviso.", "I agree to receive new match alerts through the selected channel. I can unsubscribe from each alert.") + '</span></label>';
      form.querySelector('[data-inquiry-step="2"] .inquiry-buttons').before(alerts);
    }
    const openedForm = form;
    for (const [k,v] of Object.entries(replay)) {
      const control = form.elements[k];
      if (!control || ["country", "consent", "alertConsent"].includes(k)) continue;
      if (control.type === "checkbox") control.checked = v === true || v === "on";
      else control.value = v;
    }
    const updateExtraQuestions = () => {
      if (form.elements.requestVisit) {
        form.querySelector('[data-visit-preference]').hidden = !form.elements.requestVisit.checked;
        form.elements.visitPreferredAt.required = form.elements.requestVisit.checked;
      }
      if (form.elements.alertChannel) {
        form.querySelector('[data-alert-email]').hidden = form.elements.alertChannel.value !== "email";
        form.elements.alertEmail.required = form.elements.alertChannel.value === "email";
        form.querySelector('[data-alert-consent]').hidden = !form.elements.alertChannel.value;
        form.elements.alertConsent.required = Boolean(form.elements.alertChannel.value);
      }
    };
    const rememberDraft = () => {
      const values = Object.fromEntries(new FormData(form));
      for (const name of ["requestVisit", "keepOrigin"]) if (form.elements[name]) values[name] = form.elements[name].checked;
      draft.set(returnKey, { id: draftId, values });
    };
    updateExtraQuestions();
    form.elements.zone.placeholder = tr("No estoy seguro", "I'm not sure");
    updateQuestions();
    reviewOrigin();
    const notice = dialog.querySelector(".inquiry-status");
    let previousIntent = form.elements.intent.value;
    dialog.querySelector("[data-inquiry-close]").onclick = () => dialog.close();
    dialog.querySelector("[data-inquiry-next]").onclick = () => {
      for (const el of form.querySelectorAll('[data-inquiry-step="1"] input, [data-inquiry-step="1"] select, [data-inquiry-step="1"] textarea')) if (!el.disabled && el.offsetParent && !el.reportValidity()) return;
      if (form.elements.requestVisit?.checked && !form.elements.visitPreferredAt.value) { form.elements.visitPreferredAt.required = true; form.elements.visitPreferredAt.reportValidity(); return; }
      if (!form.querySelector("[data-inquiry-budget]").hidden && form.elements.budget.value && !form.elements.currency.value) {
        form.elements.currency.setCustomValidity(tr("Selecciona la moneda.", "Choose a currency.")); form.elements.currency.reportValidity(); return;
      }
      if (!form.querySelector('[data-owner-price]')?.hidden && form.elements.askingPrice?.value && !form.elements.ownerCurrency.value) {
        form.elements.ownerCurrency.setCustomValidity(tr("Selecciona la moneda del precio.", "Choose the price currency.")); form.elements.ownerCurrency.reportValidity(); return;
      }
      step(2);
    };
    dialog.querySelector("[data-inquiry-back]").onclick = () => step(1);
    form.oninput = event => {
      form.elements.currency.setCustomValidity("");
      form.elements.phone.setCustomValidity("");
      form.elements.ownerCurrency?.setCustomValidity("");
      if (["name","country","phone"].includes(event.target.name)) remember();
      rememberDraft();
    };
    form.onkeydown = event => {
      if (event.key === "Enter" && event.target.tagName === "INPUT" && event.target.closest('[data-inquiry-step="1"]')) {
        event.preventDefault(); form.querySelector("[data-inquiry-next]").click();
      }
    };
    form.onchange = event => {
      const changedOperation = event.target.name === "intent" && ["buy", "rent"].includes(previousIntent) && ["buy", "rent"].includes(event.target.value) && previousIntent !== event.target.value;
      const changedRentalPeriod = event.target.name === "rentPeriod" && form.elements.intent.value === "rent";
      if ((changedOperation || changedRentalPeriod) && form.elements.budget.value) {
        form.elements.budget.value = "";
        form.elements.currency.value = "";
        notice.textContent = tr("Cambiaste la operación o el periodo. Indica de nuevo el presupuesto para esa búsqueda.", "You changed the operation or rental period. Enter the budget for this search again.");
      }
      if (event.target.name === "intent") previousIntent = event.target.value;
      if (["intent", "propertyType", "rentPeriod"].includes(event.target.name)) updateQuestions();
      if (event.target.name === "requestVisit") {
        form.querySelector('[data-visit-preference]').hidden = !event.target.checked;
        form.elements.visitPreferredAt.required = event.target.checked;
      }
      if (event.target.name === "alertChannel") {
        form.querySelector('[data-alert-email]').hidden = event.target.value !== "email";
        form.elements.alertEmail.required = event.target.value === "email";
        form.querySelector('[data-alert-consent]').hidden = !event.target.value;
        form.elements.alertConsent.required = Boolean(event.target.value);
      }
      if (["zone","subzone","development"].includes(event.target.name)) {
        if (event.target.name === "zone" && locationChanged()) {
          for (const child of ["subzone","development"]) if (form.elements[child].value === current[child]) form.elements[child].value = "";
        }
        form.elements.keepOrigin.checked = false;
        reviewOrigin();
        draft.set(returnKey, { id: draftId, values: Object.fromEntries(new FormData(form)) });
      }
      if (event.target.name === "country") remember();
      rememberDraft();
    };
    form.onsubmit = async event => {
      event.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const send = form.querySelector('[type="submit"]');
      send.disabled = true; notice.textContent = tr("Guardando…", "Saving…");
      try {
        const body = { ...current, ...Object.fromEntries(new FormData(form)), lang: lang(), requestId: draftId, formStartedAt: started, consent: form.elements.consent.checked };
        if (current.service === "search-watch") {
          body.searchFilters = current.searchFilters;
          body.alertConsent = form.elements.alertConsent.checked;
        }
        if (form.elements.requestVisit) {
          if (form.elements.requestVisit.checked) body.service = "visit";
          else { delete body.service; delete body.visitPreferredAt; }
        }
        if (locationChanged() && !form.elements.keepOrigin.checked) {
          for (const [field, originField] of [["propertyId","viewedPropertyId"],["propertyTitle","viewedPropertyTitle"],["mls","viewedMls"],["project","viewedProject"],["reference","viewedReference"]]) {
            if (current[field]) body[originField] = current[field];
            delete body[field];
          }
          body.viewedZone = current.zone;
          body.viewedDevelopment = current.development;
          delete body.developmentId;
        }
        delete body.keepOrigin;
        if (!["rent", "let"].includes(body.intent)) delete body.rentPeriod;
        if (["sell","let"].includes(body.intent)) { delete body.budget; body.currency = body.ownerCurrency || ""; }
        else { delete body.area; delete body.features; }
        const result = await window.PccInquiryRequest("/api/inquiries", body);
        if (!result?.whatsappUrl) throw Error(tr("No se pudo preparar el mensaje.", "The message could not be prepared."));
        draft.delete(returnKey);
        if (form !== openedForm || !dialog.open) return;
        saved = result;
        const successText = form.querySelector('[data-inquiry-step="3"] p');
        if (result.visitStatus === "requested") successText.textContent = tr("Visita solicitada. El equipo te contactará para confirmar el horario. Tu visita todavía no está confirmada.", "Visit requested. Our team will contact you to confirm the time. Your visit is not yet confirmed.");
        if (result.searchWatchStatus) successText.textContent = result.searchWatchStatus === "active" ? tr("Búsqueda guardada y avisos activados para nuevas coincidencias.", "Search saved and alerts enabled for new matches.") : result.searchWatchStatus === "needs_review" ? tr("Búsqueda guardada. Un asesor revisará tus preferencias antes de considerar una opción compatible. Los avisos automáticos están pendientes de esa revisión.", "Search saved. An advisor will review your preferences before considering a match. Automatic alerts are pending that review.") : tr("Búsqueda guardada para el equipo. Los avisos automáticos no están activados; puedes continuar la consulta en WhatsApp.", "Search saved for our team. Automatic alerts are not enabled; you can continue on WhatsApp.");
        const link = form.querySelector("[data-inquiry-whatsapp]");
        link.href = saved.whatsappUrl;
        link.onclick = () => { window.PccInquiryRequest("/api/inquiries/" + encodeURIComponent(saved.id) + "/whatsapp-click", { token: saved.clickToken }).catch(() => {}); };
        notice.textContent = ""; step(3);
      } catch (err) {
        notice.textContent = err.status === 429 ? tr("Espera unos minutos antes de volver a enviar.", "Wait a few minutes before sending again.")
          : err.status === 403 ? tr("La sesión venció. Vuelve a intentarlo.", "Your session expired. Try again.")
          : !err.status || err.status >= 500 ? tr("No recibimos confirmación. Tus respuestas siguen aquí para reintentar.", "We could not confirm your request. Your answers are here so you can try again.")
          : err.message;
      }
      finally { send.disabled = false; }
    };
    dialog.showModal();
    step(1);
    try {
      const opts = await getOptions();
      if (!dialog.open || form !== openedForm) return;
      form.elements.country.innerHTML = countryList(opts);
      form.elements.country.value = opts.countries.some(c => c.country === replay.country) ? replay.country : "MX";
      if (current.service === "search-watch") {
        const available = opts.channels || {};
        for (const channel of ["whatsapp","email"]) if (available[channel]) form.elements.alertChannel.add(new Option(channel === "email" ? tr("Correo electrónico", "Email") : "WhatsApp", channel));
        if (available[replay.alertChannel]) form.elements.alertChannel.value = replay.alertChannel;
        updateExtraQuestions();
        form.querySelector('[data-alert-channel-status]').textContent = Object.values(available).some(Boolean) ? tr("Solo aparecen canales conectados. Las preferencias adicionales requieren revisión del asesor.", "Only connected channels are shown. Additional preferences require advisor review.") : tr("No hay un canal de avisos automáticos configurado. Puedes guardar la búsqueda para que el equipo la revise.", "No automatic alert channel is configured. You can save the search for our team to review.");
      }
    } catch {
      notice.textContent = tr("No se pudo cargar la lista de países. Cierra el formulario y vuelve a abrirlo.", "Could not load the country list. Close the form and reopen it.");
    }
  }
  function readValues(node) {
    const url = new URL(node?.getAttribute("href") || location.href, location.href);
    const values = {};
    for (const field of fields) {
      const value = node?.dataset?.[field] || url.searchParams.get(field);
      if (value) {
        if (field === "searchFilters") { try { values[field] = JSON.parse(value); } catch {} }
        else values[field] = value;
      }
    }
    values.reference ||= node?.dataset?.projectReference || url.searchParams.get("projectReference") || "";
    if (node && (!values.sourcePath || values.sourcePath === location.pathname)) values.sourcePath = location.pathname + location.search;
    return values;
  }
  async function populatePhone(target) {
    const country = target?.querySelector("[data-inquiry-country]");
    if (!country) return;
    const stored = identity();
    if (target.elements.phone && !target.elements.phone.value) target.elements.phone.value = stored.phone || "";
    if (target.elements.name && !target.elements.name.value) target.elements.name.value = stored.name || "";
    try {
      const options = await getOptions();
      const selected = country.dataset.edited ? country.value : stored.country || "MX";
      country.innerHTML = countryList(options);
      country.value = options.countries.some(c => c.country === selected) ? selected : "MX";
    } catch { country.title = tr("No se pudo cargar la lista de países. Vuelve a intentarlo.", "The country list could not be loaded. Try again."); }
  }
  function offerAction(message, action) {
    if (!action?.whatsappUrl) return;
    const link = document.createElement("a");
    link.href = action.whatsappUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
    link.className = "primary-button inquiry-saved-link";
    link.textContent = tr("Revisar mensaje en WhatsApp", "Review message in WhatsApp");
    link.onclick = () => { window.PccInquiryRequest("/api/inquiries/" + encodeURIComponent(action.id) + "/whatsapp-click", { token: action.clickToken }).catch(() => {}); };
    message.append(document.createElement("br"),link);
  }
  document.addEventListener("input", event => {
    const holder = event.target.form;
    if (!holder?.querySelector("[data-inquiry-country]") || !["country","phone","name"].includes(event.target.name)) return;
    if (event.target.name === "country") event.target.dataset.edited = "true";
    try { sessionStorage.setItem(key, JSON.stringify({ ...identity(), country: holder.elements.country.value, phone: holder.elements.phone.value, ...(holder.elements.name && { name: holder.elements.name.value }) })); } catch {}
  });
  for (const country of document.querySelectorAll("[data-inquiry-country]")) {
    if (!country.closest("#guestSaleModal[hidden]")) void populatePhone(country.form);
  }
  window.PccInquiry = { open, populatePhone, offerAction };
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-contact-inquiry]");
    if (!trigger || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); event.stopPropagation();
    void open(readValues(trigger), trigger);
  }, true);
  if (/^\/(?:contacto|en\/contact)\/?$/.test(location.pathname) && (new URLSearchParams(location.search).has("intent") || new URLSearchParams(location.search).has("inquiry"))) {
    void open(readValues(null), null);
  }
})();
