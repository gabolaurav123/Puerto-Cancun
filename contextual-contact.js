(() => {
  "use strict";
  const key = "pcc-inquiry-contact";
  const fields = ["intent","zone","subzone","development","developmentId","propertyId","propertyTitle","mls","project","reference","propertyType","budget","currency","priceMode","rentPeriod","office","origin","preferences","summary","sourcePath","service","visitPreferredAt","searchFilters"];
  const intents = { buy:["Comprar","Buy"], rent:["Buscar una renta","Find a rental"], sell:["Vender","Sell"], let:["Poner mi propiedad en renta","List my property for rent"] };
  const types = { Casa:"House", Departamento:"Apartment", Terreno:"Land", Comercial:"Commercial property" };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const lang = () => document.documentElement.lang.startsWith("en") ? "en" : "es";
  const tr = (es,en) => lang() === "en" ? en : es;
  const option = (value,label) => '<option value="' + escape(value) + '">' + escape(label) + '</option>';
  const row = (label,name,input) => '<label data-field="' + name + '"><span>' + escape(label) + '</span>' + (input || '<input name="' + name + '" maxlength="160">') + '</label>';
  const hidden = (name,value) => '<input type="hidden" name="' + name + '" value="' + escape(value) + '">';
  let optionsRequest, dialog, opener, openGeneration=0;
  const drafts = new Map();
  const normalizedContext = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function contextSummary(context, values) {
    const parts = [context.propertyTitle || context.development || values.project || ""];
    for (const value of [context.zone || values.zone, context.subzone || values.subzone, context.mls ? "MLS " + context.mls : ""]) {
      const normalized = normalizedContext(value);
      if (normalized && !parts.some(part => normalizedContext(part).includes(normalized))) parts.push(value);
    }
    return parts.filter(Boolean);
  }
  function fitInquiryViewport() {
    if (!dialog || !window.visualViewport) return;
    dialog.style.setProperty("--inquiry-viewport-height", window.visualViewport.height + "px");
    dialog.style.setProperty("--inquiry-viewport-top", window.visualViewport.offsetTop + "px");
  }
  function identity() { try { return JSON.parse(sessionStorage.getItem(key) || "{}") || {}; } catch { return {}; } }
  function getOptions() {
    return optionsRequest ||= fetch("/api/inquiries/options").then(r => { if (!r.ok) throw Error(); return r.json(); }).catch(error => { optionsRequest=null; throw error; });
  }
  function countryList({countries,featuredCountry}) {
    const names = new Intl.DisplayNames([lang()],{type:"region"}), label = c => names.of(c.country) + " (" + c.prefix + ")";
    const preferred = [...new Set(["MX","US","CA",featuredCountry])];
    const group = (title,list) => '<optgroup label="' + title + '">' + list.map(c => option(c.country,label(c))).join("") + '</optgroup>';
    return group(tr("Más utilizados","Frequently used"),preferred.map(id=>countries.find(c=>c.country===id)).filter(Boolean))
      + group(tr("Otros países","Other countries"),countries.filter(c=>!preferred.includes(c.country)).sort((a,b)=>label(a).localeCompare(label(b),lang())));
  }
  function contactControls() {
    return row(tr("¿Cómo prefieres que te respondamos?","How would you like us to reply?"),"contactChannel",'<select name="contactChannel" required>' + option("whatsapp","WhatsApp") + option("email",tr("Correo electrónico","Email")) + '</select>')
      + '<div data-phone-fields>' + row(tr("País del teléfono","Phone number country"),"country",'<select name="country"><option value="MX">' + tr("México (+52)","Mexico (+52)") + '</option></select>')
      + row(tr("Tu número de WhatsApp","Your WhatsApp number"),"phone",'<input type="tel" name="phone" autocomplete="tel" maxlength="40" inputmode="tel">') + '</div>'
      + '<div data-email-field hidden>' + row(tr("Tu correo electrónico","Your email"),"email",'<input type="email" name="email" autocomplete="email" maxlength="254" inputmode="email">') + '</div>';
  }
  function updateChannel(form) {
    const email = form.elements.contactChannel.value === "email";
    form.querySelector("[data-phone-fields]").hidden = email;
    form.querySelector("[data-email-field]").hidden = !email;
    for (const name of ["phone","country"]) { form.elements[name].disabled=email; form.elements[name].required=!email; }
    form.elements.email.disabled=!email; form.elements.email.required=email;
  }
  async function open(values = {}, trigger) {
    if (dialog?.open) return;
    const generation=++openGeneration;
    opener = trigger || document.activeElement;
    if (!dialog) {
      dialog=document.createElement("dialog"); dialog.className="contextual-inquiry"; dialog.setAttribute("aria-labelledby","inquiryTitle");
      document.body.append(dialog);
      dialog.addEventListener("close",()=>opener?.focus?.({preventScroll:true}));
      window.visualViewport?.addEventListener("resize", fitInquiryViewport);
      window.visualViewport?.addEventListener("scroll", fitInquiryViewport);
    }
    const returnKey=JSON.stringify(fields.map(k=>values[k] || ""));
    const previous=drafts.get(returnKey), requestId=previous?.id || crypto.randomUUID(), started=previous?.started || Date.now();
    let budgetEdited=Boolean(previous?.budgetEdited);
    dialog.innerHTML='<header><h2 id="inquiryTitle">' + tr("Pedir información","Request information") + '</h2><button type="button" data-inquiry-close aria-label="' + tr("Cerrar","Close") + '">×</button></header><div class="inquiry-scroll"><p role="status">' + tr("Preparando tu consulta…","Preparing your inquiry…") + '</p></div>';
    dialog.querySelector("[data-inquiry-close]").onclick=()=>dialog.close();
    dialog.showModal();
    fitInquiryViewport();
    let opts, context;
    try {
      const params=new URLSearchParams({lang:lang()});
      for (const name of ["propertyId","developmentId","reference","project","development","intent","origin","service"]) if(values[name]) params.set(name,values[name]);
      if(values.searchFilters) params.set("searchFilters",JSON.stringify(values.searchFilters));
      [opts,context]=await Promise.all([getOptions(),fetch("/api/inquiries/context?"+params).then(async r=>{const result=await r.json();if(!r.ok)throw Error(result.error || tr("No pudimos identificar la publicación.","We could not identify the listing."));return result;})]);
    } catch(error) {
      if(dialog.open&&generation===openGeneration) {
        const holder=dialog.querySelector(".inquiry-scroll"); holder.innerHTML='<p role="alert">'+escape(error.message || tr("No se pudo cargar el formulario.","The form could not be loaded."))+'</p><button class="primary-button" data-retry>'+tr("Reintentar","Retry")+'</button>';
        holder.querySelector("button").onclick=()=>{dialog.close();void open(values,trigger);};
      }
      return;
    }
    if(!dialog.open||generation!==openGeneration) return;
    const current={...values,...context,sourcePath:values.sourcePath || location.pathname+location.search};
    // Legacy generated search descriptions are structured context, not the visitor's own note.
    const replay={...identity(),...current,...previous?.values};
    if(!previous) replay.preferences="";
    // Search criteria keep their original currency until the visitor explicitly changes the budget.
    if(current.searchFilters&&!budgetEdited) replay.budget="";
    else if(!previous&&current.currency&&current.currency!=="USD") replay.budget="";
    const known=context.entity!=="general", watch=values.service==="search-watch", visit=values.service==="visit";
    const fixed=context.fixedIntent || (context.allowedIntents.includes(values.intent) ? values.intent : "");
    const title=visit ? tr("Solicitar visita","Request a visit") : watch ? tr("Guardar esta búsqueda","Save this search") : fixed === "sell" ? tr("Vender mi propiedad","Sell my property") : fixed === "let" ? tr("Poner mi propiedad en renta","List my property for rent") : context.project ? tr("Información de preventa","Presale information") : tr("Pedir información","Request information");
    dialog.querySelector("#inquiryTitle").textContent=title;
    const summary=contextSummary(context, values);
    const owner=["sell","let"].includes(fixed);
    const typeSelect='<select name="propertyType">' + option("",tr("Por definir","Not decided")) + Object.entries(types).map(([es,en])=>option(es,tr(es,en))).join("") + '</select>';
    const contextFields = !known && !watch || owner
      ? row(tr("Tipo de propiedad","Property type"),"propertyType",typeSelect) + (owner&&context.zone ? "" : row(owner?tr("Zona aproximada","Approximate zone"):tr("Zona o destino (opcional)","Zone or destination (optional)"),"zone"))
      : "";
    const budget = row(tr("Presupuesto USD (opcional)","Budget USD (optional)"),"budget",'<input name="budget" type="number" min="0.01" max="10000000000000" step="any" inputmode="decimal">');
    const optional = '<details class="inquiry-optional"><summary>'+tr("Añadir detalles (opcional)","Add details (optional)")+'</summary><div class="inquiry-optional-body">'
      + row(tr("Nombre (opcional)","Name (optional)"),"name",'<input name="name" maxlength="110" autocomplete="given-name">')
      + (!owner && !watch && (!known || context.project) ? budget : "")
      + (owner || !known && !watch ? row(tr("Superficie de terreno (m², opcional)","Lot size (m², optional)"),"area",'<input name="area" type="number" min="0" step="any" inputmode="decimal">') + row(tr("Uso previsto o características (opcional)","Intended use or features (optional)"),"features") : "")
      + (fixed==="rent"?row(tr("Mudanza estimada (opcional)","Estimated move date (optional)"),"moveDate",'<input name="moveDate" type="date">'):"")
      + row(tr("Comentario (opcional)","Note (optional)"),"preferences",'<textarea name="preferences" rows="2" maxlength="1200"></textarea>')+'</div></details>';
    dialog.querySelector(".inquiry-scroll").innerHTML='<form><section data-inquiry-fields>'
      + (summary.length?'<p class="inquiry-context"><strong>'+escape(summary[0])+'</strong>'+(summary.length>1?'<span>'+summary.slice(1).map(escape).join(" · ")+'</span>':"")+'</p>':"")
      + (values.office?'<p class="inquiry-office">'+tr("Oficina: ","Office: ")+ (values.office==="us"?tr("Estados Unidos","United States"):tr("México","Mexico"))+'</p>':"")
      + (fixed?hidden("intent",fixed):row(tr("Quiero","I want to"),"intent",'<select name="intent" required>'+option("",tr("Elige una opción","Choose an option"))+context.allowedIntents.map(k=>option(k,tr(...intents[k]))).join("")+'</select>'))
      + contactControls()
      + (owner?contextFields:contextFields?'<details class="inquiry-optional"><summary>'+tr("Zona y tipo (opcional)","Zone and type (optional)")+'</summary>'+contextFields+'</details>':"")
      + (visit?row(tr("Fecha y hora preferidas (opcional, hora de Cancún)","Preferred date and time (optional, Cancun time)"),"visitPreferredAt",'<input name="visitPreferredAt" type="datetime-local">')+'<p>'+tr("El equipo coordinará contigo la disponibilidad; aún no es una visita confirmada.","Our team will coordinate availability with you; this is not a confirmed appointment.")+'</p>':"")
      + (watch?'<p>'+tr("Conservaremos los filtros exactos de esta búsqueda.","We will keep the exact filters of this search.")+'</p><p data-alert-status></p><label class="inquiry-consent" data-alert-option hidden><input name="alertConsent" type="checkbox"><span>'+tr("Quiero avisos de nuevas coincidencias por el canal elegido. Podré cancelarlos desde cada aviso.","Send new-match alerts through my chosen channel. I can unsubscribe from each alert.")+'</span></label>':"")
      + optional
      + '<label class="inquiry-consent"><input name="consent" type="checkbox" required><span>'+tr("Acepto que el equipo me contacte según el","I agree to be contacted under the")+' <a href="'+tr("/aviso-de-privacidad","/en/privacy-notice")+'" target="_blank" rel="noopener">'+tr("aviso de privacidad","privacy notice")+'</a>.</span></label>'
      + '<label class="form-honeypot" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></label>'
      + '<button class="primary-button inquiry-submit" type="submit">'+tr("Enviar solicitud","Send inquiry")+'</button></section><section data-inquiry-success hidden tabindex="-1"><h3>'+tr("Solicitud recibida","Inquiry received")+'</h3><p data-success-message></p><a class="primary-button" data-inquiry-whatsapp target="_blank" rel="noopener noreferrer" hidden>'+tr("Abrir WhatsApp (opcional)","Open WhatsApp (optional)")+'</a><button type="button" class="ghost-button" data-inquiry-done>'+tr("Volver a la página","Return to the page")+'</button></section><p class="inquiry-status" role="status" aria-live="polite"></p></form>';
    const form=dialog.querySelector("form"), notice=form.querySelector(".inquiry-status");
    form.elements.country.innerHTML=countryList(opts);
    for(const [name,value] of Object.entries(replay)) {
      const field=form.elements[name]; if(!field || ["intent","consent","alertConsent"].includes(name))continue;
      if(field.type==="checkbox") field.checked=Boolean(value); else field.value=value;
    }
    form.elements.country.value=opts.countries.some(c=>c.country===replay.country)?replay.country:"MX";
    if(!["email","whatsapp"].includes(form.elements.contactChannel.value))form.elements.contactChannel.value="whatsapp";
    if(!fixed&&replay.intent&&context.allowedIntents.includes(replay.intent))form.elements.intent.value=replay.intent;
    const update=()=>{
      updateChannel(form);
      const isOwner=["sell","let"].includes(form.elements.intent.value);
      if(form.elements.propertyType) form.elements.propertyType.required=isOwner;
      if(form.elements.zone) form.elements.zone.required=isOwner;
      if(isOwner) { const details=form.elements.zone?.closest("details");if(details)details.open=true; }
      if(watch) {
        const enabled=Boolean(opts.channels?.[form.elements.contactChannel.value]);
        form.querySelector("[data-alert-option]").hidden=!enabled; form.elements.alertConsent.disabled=!enabled;
        form.querySelector("[data-alert-status]").textContent=enabled?tr("Puedes activar avisos automáticos. Si añades preferencias, el equipo las revisará antes de activar coincidencias.","You can enable automatic alerts. If you add preferences, our team will review them before activating matches."):tr("El equipo dará seguimiento por el canal elegido. Los avisos automáticos no están disponibles por este canal.","Our team will follow up through your chosen channel. Automatic alerts are not available through this channel.");
      }
    };
    const remember=event=>{
      if(event?.target?.name==="budget")budgetEdited=true;
      const data=Object.fromEntries(new FormData(form)); data.consent=form.elements.consent.checked;
      drafts.set(returnKey,{id:requestId,started,values:data,budgetEdited});
      try { sessionStorage.setItem(key,JSON.stringify(Object.fromEntries(["name","country","phone","email","contactChannel"].map(k=>[k,form.elements[k]?.value || ""])))); } catch {}
    };
    update(); form.onchange=event=>{update();remember(event);};form.oninput=remember;
    form.querySelector("[data-inquiry-done]").onclick=()=>dialog.close();
    form.onsubmit=async event=>{
      event.preventDefault();if(!form.reportValidity())return;
      const button=form.querySelector('[type="submit"]');button.disabled=true;notice.textContent=tr("Enviando…","Sending…");
      const entered=Object.fromEntries(new FormData(form));
      const body={...current,...entered,intent:fixed || entered.intent,lang:lang(),requestId,formStartedAt:started,consent:form.elements.consent.checked,currency:"USD",priceMode:"public-usd"};
      delete body.allowedIntents;delete body.fixedIntent;delete body.entity;delete body.address;
      // Known IDs and context cannot be reassigned by editing optional fields.
      if(known&&!owner)for(const name of ["propertyId","propertyTitle","mls","developmentId","development","reference","zone","subzone","propertyType","project","rentPeriod"]) body[name]=context[name] || "";
      if(body.contactChannel==="email"){delete body.phone;delete body.country;}else delete body.email;
      if(!form.elements.budget||(!budgetEdited&&current.searchFilters))delete body.budget;
      if(watch){body.searchFilters=values.searchFilters;body.alertChannel=form.elements.alertConsent.checked&&!form.elements.alertConsent.disabled?body.contactChannel:"";body.alertConsent=Boolean(body.alertChannel);body.alertEmail=body.email || "";}
      try {
        const result=await window.PccInquiryRequest("/api/inquiries",body);
        if(!result?.id)throw Error(tr("Falta la confirmación del servidor.","Server confirmation is missing."));
        drafts.delete(returnKey);
        if(!form.isConnected)return;
        form.querySelector("[data-inquiry-fields]").hidden=true;
        const success=form.querySelector("[data-inquiry-success]");success.hidden=false;
        const message=result.visitStatus==="requested"?tr("Recibimos tu solicitud de visita. El equipo te responderá por el canal que elegiste para coordinarla.","We received your visit request. Our team will reply through your chosen channel to coordinate it."):result.searchWatchStatus==="active"?tr("Búsqueda guardada y avisos activados para nuevas coincidencias.","Search saved and new-match alerts enabled."):result.searchWatchStatus?tr("Búsqueda guardada para seguimiento del equipo. Los avisos automáticos todavía no están activos.","Search saved for our team to follow up. Automatic alerts are not active yet."):tr("El equipo recibió tu solicitud y te responderá por el canal que elegiste.","Our team received your inquiry and will reply through your chosen channel.");
        form.querySelector("[data-success-message]").textContent=message+" "+tr("Referencia: ","Reference: ")+result.id;
        if(result.whatsappUrl){const link=form.querySelector("[data-inquiry-whatsapp]");link.hidden=false;link.href=result.whatsappUrl;link.onclick=()=>{window.PccInquiryRequest("/api/inquiries/"+encodeURIComponent(result.id)+"/whatsapp-click",{token:result.clickToken}).catch(()=>{});};}
        notice.textContent="";success.focus();dialog.querySelector(".inquiry-scroll").scrollTop=0;
      } catch(error) {
        notice.textContent=error.status===429?tr("Espera unos minutos y vuelve a intentarlo. Tus datos siguen aquí.","Wait a few minutes and retry. Your details are still here."):!error.status||error.status>=500?tr("No recibimos confirmación. Tus datos siguen aquí; puedes reintentar sin duplicar la solicitud.","We could not confirm your request. Your details are still here; you can retry without duplicating the inquiry."):error.message;
      } finally {button.disabled=false;}
    };
    form.querySelector('[name="contactChannel"]').focus({preventScroll:true});
  }
  function readValues(node) {
    const url=new URL(node?.getAttribute("href") || location.href,location.href), values={};
    for(const field of fields){const value=node?.dataset?.[field] || url.searchParams.get(field);if(value){if(field==="searchFilters"){try{values[field]=JSON.parse(value);}catch{}}else values[field]=value;}}
    values.reference ||= node?.dataset?.projectReference || url.searchParams.get("projectReference") || "";
    if(node&&(!values.sourcePath||values.sourcePath===location.pathname))values.sourcePath=location.pathname+location.search;
    return values;
  }
  async function populatePhone(target) {
    const country=target?.querySelector("[data-inquiry-country]");if(!country)return;
    const stored=identity();
    for(const name of ["phone","name","email"])if(target.elements[name]&&!target.elements[name].value)target.elements[name].value=stored[name] || "";
    try{const options=await getOptions(),selected=country.dataset.edited?country.value:stored.country || "MX";country.innerHTML=countryList(options);country.value=options.countries.some(c=>c.country===selected)?selected:"MX";}catch{country.title=tr("No se pudo cargar la lista de países.","The country list could not be loaded.");}
  }
  function offerAction(message,action) {
    if(!action?.whatsappUrl)return;
    const link=document.createElement("a");link.href=action.whatsappUrl;link.target="_blank";link.rel="noopener noreferrer";link.className="primary-button inquiry-saved-link";link.textContent=tr("Abrir WhatsApp (opcional)","Open WhatsApp (optional)");
    link.onclick=()=>{window.PccInquiryRequest("/api/inquiries/"+encodeURIComponent(action.id)+"/whatsapp-click",{token:action.clickToken}).catch(()=>{});};
    message.append(document.createElement("br"),link);
  }
  document.addEventListener("input",event=>{
    const holder=event.target.form;if(!holder?.querySelector("[data-inquiry-country]")||!["country","phone","name"].includes(event.target.name))return;
    if(event.target.name==="country")event.target.dataset.edited="true";
  });
  for(const country of document.querySelectorAll("[data-inquiry-country]"))if(!country.closest("#guestSaleModal[hidden]"))void populatePhone(country.form);
  window.PccInquiry={open,populatePhone,offerAction,updateChannel};
  const officeBlock = document.querySelector('.contact-strip[aria-labelledby="homeContactTitle"], #contact-offices');
  if (officeBlock && "IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      document.body.classList.toggle("public-office-contact-visible", entries.some(entry => entry.isIntersecting));
    }, { threshold: 0 }).observe(officeBlock);
  }
  document.addEventListener("click",event=>{
    const trigger=event.target.closest("[data-contact-inquiry]");if(!trigger||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();event.stopPropagation();void open(readValues(trigger),trigger);
  },true);
  if(/^\/(?:contacto|en\/contact)\/?$/.test(location.pathname)&&["intent","inquiry","propertyId","developmentId","project","reference"].some(k=>new URLSearchParams(location.search).has(k)))void open(readValues(null),null);
})();
