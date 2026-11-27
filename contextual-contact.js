(() => {
  "use strict";
  const key = "pcc-inquiry-contact";
  const fields = ["intent","zone","subzone","development","developmentId","propertyId","propertyTitle","mls","project","projectId","reference","propertyType","budget","currency","priceMode","rentPeriod","office","origin","preferences","summary","sourcePath","service","visitPreferredAt","searchFilters","beds","baths","topic"];
  const intents = { buy:["Comprar","Buy"], rent:["Buscar una renta","Find a rental"], sell:["Vender","Sell"], let:["Poner mi propiedad en renta","List my property for rent"] };
  const types = { Casa:"House", Departamento:"Apartment", Terreno:"Land", Comercial:"Commercial property" };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const lang = () => document.documentElement.lang.startsWith("en") ? "en" : "es";
  const tr = (es,en) => lang() === "en" ? en : es;
  const option = (value,label) => '<option value="' + escape(value) + '">' + escape(label) + '</option>';
  const row = (label,name,input) => '<label data-field="' + name + '"><span>' + escape(label) + '</span>' + (input || '<input name="' + name + '" maxlength="160">') + '</label>';
  const hidden = (name,value) => '<input type="hidden" name="' + name + '" value="' + escape(value) + '">';
  let optionsRequest, dialog, opener, openGeneration=0, handoffOptions={};
  const drafts = new Map();
  const normalizedContext = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  function contextSummary(context, values) {
    const parts = [context.propertyTitle || context.development || values.project || ""];
    for (const value of [context.zone || values.zone, context.subzone || values.subzone]) {
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
    return optionsRequest ||= fetch("/api/inquiries/options").then(r => { if (!r.ok) throw Error(); return r.json(); }).then(options=>{handoffOptions={offices:options.offices,defaultOffice:options.defaultOffice};return options;}).catch(error => { optionsRequest=null; throw error; });
  }
  async function publicConfig() {
    try { const response = await fetch("/api/config"); return response.ok ? await response.json() : {}; } catch { return {}; }
  }
  function directOfficeLinks(context, config) {
    const contacts = config.offices || window.PccContacts?.contacts || [];
    return '<div class="inquiry-direct-offices" aria-label="'+tr("Consultar por WhatsApp", "Request information on WhatsApp")+'">' + contacts.map(office => '<a class="office-inquiry-button" data-inquiry-office="'+escape(office.id)+'" href="'+escape(whatsappUrl({...context,office:office.id},config))+'" target="_blank" rel="noopener noreferrer"><span>WhatsApp '+(office.id==='us'?tr('Estados Unidos','United States'):tr('México','Mexico'))+'</span></a>').join("")+'</div>';
  }
  function convertedBudget(amount, from, to, snapshot) {
    const value = Number(amount), rate = window.PccPublicPricing?.usableRate(snapshot);
    if (!(value > 0 && Number.isFinite(value)) || !rate || ![from,to].every(code => ["USD","MXN"].includes(code))) return null;
    const converted = from === to ? value : from === "USD" ? value * rate.rate : value / rate.rate;
    // Round only the visitor's converted budget upward to three significant digits.
    const step = Math.max(1, 10 ** (Math.floor(Math.log10(converted)) - 2));
    const amountRounded = from === to ? value : Math.ceil(converted / step - 1e-10) * step;
    return amountRounded <= 1e13 ? { amount: amountRounded, rate } : null;
  }
  function countryList({countries,featuredCountry}) {
    const names = new Intl.DisplayNames([lang()],{type:"region"}), label = c => names.of(c.country) + " (" + c.prefix + ")";
    const preferred = [...new Set(["MX","US","CA",featuredCountry])];
    const group = (title,list) => '<optgroup label="' + title + '">' + list.map(c => option(c.country,label(c))).join("") + '</optgroup>';
    return group(tr("Más utilizados","Frequently used"),preferred.map(id=>countries.find(c=>c.country===id)).filter(Boolean))
      + group(tr("Otros países","Other countries"),countries.filter(c=>!preferred.includes(c.country)).sort((a,b)=>label(a).localeCompare(label(b),lang())));
  }
  function whatsappUrl(values = {}, config = {}) {
    config={...handoffOptions,...config};
    const english = values.lang ? values.lang === "en" : lang() === "en";
    const t = (es,en) => english ? en : es;
    const zones = { "zona-hotelera":t("Zona Hotelera","Hotel Zone"), "puerto-cancun":"Puerto Cancún", "cancun-city":t("Ciudad de Cancún","Cancun City"), "fuera-de-cancun":t("Fuera de Cancún","Outside Cancun") };
    let filters = values.searchFilters || {};
    if(typeof filters === "string") { try { filters=JSON.parse(filters); } catch { filters={}; } }
    const inherited = { propertyType:filters.type || "", zone:filters.zone || (filters.locations || []).map(id=>zones[id] || "").filter(Boolean).join(", "), beds:filters.beds || "", baths:filters.baths || "", budget:filters.max || "", currency:filters.currency || "USD", rentPeriod:filters.rentPeriod || "", features:filters.text || "" };
    const data = {...inherited,...values,lang:english?"en":"es"};
    if(!Object.hasOwn(values,"budget")&&filters.max) { data.budget=filters.max;data.currency=filters.currency || "USD"; }
    const source = /^\/(?![\\/])/.test(values.listingPath || "") ? new URL(values.listingPath, config.publicSiteUrl || location.origin).href : "";
    const offices = config.offices || window.PccContacts?.contacts || [];
    const office = offices.find(item=>item.id===(values.office || config.defaultOffice || "mx")) || offices[0];
    return window.PccWhatsAppMessage?.handoffUrl(office?.number,data,source) || "";
  }
  function contactControls() {
    return row(tr("¿Cómo prefieres que te respondamos?","How would you like us to reply?"),"contactChannel",'<select name="contactChannel" required>' + option("whatsapp","WhatsApp") + option("email",tr("Correo electrónico","Email")) + '</select>')
      + '<div data-email-field hidden>' + row(tr("Tu correo electrónico","Your email"),"email",'<input type="email" name="email" autocomplete="email" maxlength="254" inputmode="email">') + '</div>';
  }
  function updateChannel(form) {
    const email = form.elements.contactChannel.value === "email";
    form.querySelector("[data-email-field]").hidden = !email;
    form.elements.email.disabled=!email; form.elements.email.required=email;
  }
  async function open(values = {}, trigger) {
    if (dialog?.open) return;
    values={...values};
    if(typeof values.searchFilters==='string') { try { values.searchFilters=JSON.parse(values.searchFilters); } catch { delete values.searchFilters; } }
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
    let opts, context, config;
    try {
      const params=new URLSearchParams({lang:lang()});
      for (const name of ["propertyId","developmentId","projectId","reference","project","development","intent","origin","service"]) if(values[name]) params.set(name,values[name]);
      if(values.searchFilters) params.set("searchFilters",JSON.stringify(values.searchFilters));
      [opts,context,config]=await Promise.all([getOptions(),fetch("/api/inquiries/context?"+params).then(async r=>{const result=await r.json();if(!r.ok)throw Error(result.error || tr("No pudimos identificar la publicación.","We could not identify the listing."));return result;}),publicConfig()]);
    } catch(error) {
      if(dialog.open&&generation===openGeneration) {
        const holder=dialog.querySelector(".inquiry-scroll"); holder.innerHTML='<p role="alert">'+escape(error.message || tr("No se pudo cargar el formulario.","The form could not be loaded."))+'</p><button class="primary-button" data-retry>'+tr("Reintentar","Retry")+'</button>';
        holder.querySelector("button").onclick=()=>{dialog.close();void open(values,trigger);};
      }
      return;
    }
    if(!dialog.open||generation!==openGeneration) return;
    config={...config,offices:opts.offices || window.PccContacts?.contacts,defaultOffice:opts.defaultOffice || "mx"};
    const current={...values,...context,sourcePath:values.sourcePath || location.pathname+location.search};
    // Legacy generated search descriptions are structured context, not the visitor's own note.
    const replay={...identity(),...current,...previous?.values};
    if(!previous) replay.preferences="";
    // Search criteria keep their original currency until the visitor explicitly changes the budget.
    if(current.searchFilters&&!budgetEdited) replay.budget="";
    else if(!previous&&current.currency&&current.currency!=="USD") replay.budget="";
    const known=context.entity!=="general", watch=values.service==="search-watch", search=watch || values.service==="property-search", visit=values.service==="visit";
    const fixed=context.fixedIntent || (context.allowedIntents.includes(values.intent) ? values.intent : "");
    const title=visit ? tr("Solicitar visita","Request a visit") : search ? tr("Encuentra tu propiedad ideal","Find your ideal property") : fixed === "sell" ? tr("Vender mi propiedad","Sell my property") : fixed === "let" ? tr("Poner mi propiedad en renta","List my property for rent") : context.project ? tr("Información de preventa","Presale information") : tr("Pedir información","Request information");
    dialog.querySelector("#inquiryTitle").textContent=title;
    const summary=contextSummary(context, values);
    const owner=["sell","let"].includes(fixed);
    const typeSelect='<select name="propertyType">' + option("",tr("Por definir","Not decided")) + Object.entries(owner ? { ...types, Desarrollo: "Development" } : types).map(([es,en])=>option(es,tr(es,en))).join("") + '</select>';
    // A zone inquiry already carries its scope. Do not guess an apartment type
    // or ask the visitor to re-enter it; owners still describe their own listing.
    const contextFields = search || !known && !watch && (!fixed || !current.zone) || owner
      ? row(tr("Tipo de propiedad","Property type"),"propertyType",typeSelect) + (owner&&context.zone ? "" : row(owner?tr("Zona o localidad","Zone or locality"):tr("Zona o destino (opcional)","Zone or destination (optional)"),"zone"))
      : "";
    const searchZones = [['Zona Hotelera',tr('Zona Hotelera','Hotel Zone')],['Puerto Cancún','Puerto Cancún'],['Ciudad de Cancún',tr('Ciudad de Cancún','Cancun City')],['Fuera de Cancún',tr('Fuera de Cancún','Outside Cancun')]];
    if(current.zone&&!searchZones.some(([value])=>normalizedContext(value)===normalizedContext(current.zone)))searchZones.push([current.zone,current.zone]);
    const searchFields = '<div class="inquiry-search-basics">'+row(tr("Tipo de propiedad","Property type"),"propertyType",typeSelect)+row(tr("Zona","Zone"),"zone",'<select name="zone">'+option('',tr('Por definir','Not decided'))+searchZones.map(([value,label])=>option(value,label)).join('')+'</select>')+'</div>';
    const budget = '<div class="inquiry-budget">'+row(tr("Presupuesto (opcional)","Budget (optional)"),"budget",'<input name="budget" type="number" min="0.01" max="10000000000000" step="any" inputmode="decimal">')+row(tr("Moneda","Currency"),"currency",'<select name="currency">'+option("USD","USD")+option("MXN","MXN")+'</select>')+'</div><p class="inquiry-budget-note" data-budget-conversion role="status"></p>';
    const optional = '<details class="inquiry-optional"><summary>'+tr("Añadir detalles (opcional)","Add details (optional)")+'</summary><div class="inquiry-optional-body">'
      + (!search ? row(tr("Nombre (opcional)","Name (optional)"),"name",'<input name="name" maxlength="110" autocomplete="given-name">') : '')
      + (!owner && (!known || context.project) ? budget : "")
      + (!owner && !known ? '<div class="inquiry-room-counts">'+row(tr("Recámaras (opcional)","Bedrooms (optional)"),"beds",'<select name="beds">'+option('',tr('Sin preferencia','No preference'))+[1,2,3,4,5,6].map(n=>option(n,n===6?'6+':n)).join('')+'</select>')+row(tr("Baños (opcional)","Bathrooms (optional)"),"baths",'<select name="baths">'+option('',tr('Sin preferencia','No preference'))+[1,2,3,4,5,6].map(n=>option(n,n===6?'6+':n)).join('')+'</select>')+'</div>' : '')
      + (owner || !known && !search ? row(tr("Superficie (m²)","Area (m²)"),"area",'<input name="area" type="number" min="0" step="any" inputmode="decimal">') + row(tr("Características","Features"),"features") : "")
      + (fixed==="rent"?row(tr("Mudanza estimada (opcional)","Estimated move date (optional)"),"moveDate",'<input name="moveDate" type="date">'):"")
      + row(tr("Comentario (opcional)","Note (optional)"),"preferences",'<textarea name="preferences" rows="2" maxlength="1200"></textarea>')+'</div></details>';
    dialog.querySelector(".inquiry-scroll").innerHTML='<form><section data-inquiry-fields>'
      + (summary.length?'<p class="inquiry-context"><strong>'+escape(summary[0])+'</strong>'+(summary.length>1?'<span>'+summary.slice(1).map(escape).join(" · ")+'</span>':"")+'</p>':"")
      + directOfficeLinks(current, config)
      + '<p class="inquiry-reply-label">'+tr("Prepara tu consulta y envíala por WhatsApp. Puedes pedir que te respondamos por correo.","Prepare your inquiry and send it through WhatsApp. You can ask us to reply by email.")+'</p>'
      + (values.office?'<p class="inquiry-office">'+tr("Oficina: ","Office: ")+ (values.office==="us"?tr("Estados Unidos","United States"):tr("México","Mexico"))+'</p>':"")
      + (fixed?hidden("intent",fixed):row(tr("Quiero","I want to"),"intent",'<select name="intent" required>'+option("",tr("Elige una opción","Choose an option"))+context.allowedIntents.map(k=>option(k,tr(...intents[k]))).join("")+'</select>'))
      + contactControls()
      + (search ? searchFields : owner?contextFields:contextFields?'<details class="inquiry-optional"><summary>'+tr("Zona y tipo (opcional)","Zone and type (optional)")+'</summary>'+contextFields+'</details>':"")
      + (context.project?row(tr("¿Qué te gustaría consultar?","What would you like to know?"),"topic",'<select name="topic">'+option('',tr('Información general','General information'))+Object.entries(window.PccWhatsAppMessage?.topics || {}).map(([value,labels])=>option(value,tr(...labels))).join('')+'</select>'):"")
      + (visit?row(tr("Fecha y hora preferidas (opcional, hora de Cancún)","Preferred date and time (optional, Cancun time)"),"visitPreferredAt",'<input name="visitPreferredAt" type="datetime-local">')+'<p>'+tr("El equipo coordinará contigo la disponibilidad; aún no es una visita confirmada.","Our team will coordinate availability with you; this is not a confirmed appointment.")+'</p>':"")
      + optional
      + '<p class="inquiry-data-use" id="inquiryDataUse">'+tr("Se abrirá WhatsApp con tu mensaje listo para enviar.","WhatsApp will open with your message ready to send.")+' <a href="'+tr("/aviso-de-privacidad","/en/privacy-notice")+'" target="_blank" rel="noopener">'+tr("Privacidad","Privacy")+'</a>.</p>'
      + '<label class="form-honeypot" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></label>'
      + '<button class="primary-button inquiry-submit" type="submit" aria-describedby="inquiryDataUse">'+tr("Enviar solicitud","Send inquiry")+'</button></section><section data-inquiry-success hidden tabindex="-1"><h3>'+tr("Tu mensaje está listo","Your message is ready")+'</h3><p data-success-message></p><a class="primary-button" data-inquiry-whatsapp target="_blank" rel="noopener noreferrer" hidden>'+tr("Abrir WhatsApp","Open WhatsApp")+'</a><button type="button" class="ghost-button" data-inquiry-done>'+tr("Volver a la página","Return to the page")+'</button></section><p class="inquiry-status" role="status" aria-live="polite"></p></form>';
    const form=dialog.querySelector("form"), notice=form.querySelector(".inquiry-status");
    for(const [name,value] of Object.entries(replay)) {
      const field=form.elements[name]; if(!field || ["intent","consent","alertConsent"].includes(name))continue;
      if(field.type==="checkbox") field.checked=Boolean(value); else field.value=value;
    }
    if(search && !previous) {
      const filters=current.searchFilters || {};
      const zoneById={"zona-hotelera":"Zona Hotelera","puerto-cancun":"Puerto Cancún","cancun-city":"Ciudad de Cancún","fuera-de-cancun":"Fuera de Cancún"};
      if(form.elements.propertyType && !form.elements.propertyType.value)form.elements.propertyType.value=filters.type || "";
      if(form.elements.zone && !form.elements.zone.value)form.elements.zone.value=zoneById[filters.locations?.[0]] || filters.zone || "";
      for(const name of ["beds","baths"])if(form.elements[name]&&!form.elements[name].value)form.elements[name].value=filters[name] || "";
    }
    if(!["email","whatsapp"].includes(form.elements.contactChannel.value))form.elements.contactChannel.value="whatsapp";
    if(!fixed&&replay.intent&&context.allowedIntents.includes(replay.intent))form.elements.intent.value=replay.intent;
    if(form.elements.currency&&!['USD','MXN'].includes(form.elements.currency.value))form.elements.currency.value="USD";
    if(form.elements.currency&&!previous&&!budgetEdited)form.elements.currency.value="USD";
    let budgetCurrency=form.elements.currency?.value || "USD";
    let budgetBase=previous?.budgetBase || { amount:form.elements.budget?.value || "", currency:budgetCurrency };
    const update=()=>{
      updateChannel(form);
      const isOwner=["sell","let"].includes(form.elements.intent.value);
      if(form.elements.propertyType) {
        const select = form.elements.propertyType;
        select.required = isOwner;
        const development = select.querySelector('option[value="Desarrollo"]');
        if (isOwner && !development) select.add(new Option(tr("Desarrollo","Development"), "Desarrollo"));
        if (!isOwner && development) development.remove();
      }
      if(form.elements.zone) form.elements.zone.required=isOwner;
      if(isOwner) { const details=form.elements.zone?.closest("details");if(details)details.open=true; }
    };
    const remember=event=>{
      if(event?.target?.name==="budget") { budgetEdited=true; budgetBase={amount:form.elements.budget.value,currency:budgetCurrency}; }
      const data=Object.fromEntries(new FormData(form));
      drafts.set(returnKey,{id:requestId,started,values:data,budgetEdited,budgetBase});
      try { sessionStorage.setItem(key,JSON.stringify(Object.fromEntries(["name","country","phone","email","contactChannel"].map(k=>[k,form.elements[k]?.value || ""])))); } catch {}
    };
    update(); form.onchange=event=>{
      if(event.target.name==="currency") {
        const next=event.target.value, note=form.querySelector('[data-budget-conversion]');
        if(form.elements.budget.value) {
          const converted=convertedBudget(budgetBase.amount,budgetBase.currency,next,config.currencyExchange);
          if(!converted) { event.target.value=budgetCurrency;note.textContent=tr("No hay una cotización vigente disponible. Conservamos el importe y su moneda.","A current exchange rate is unavailable. Your amount and currency are unchanged.");return; }
          form.elements.budget.value=String(converted.amount);budgetEdited=true;
          const rateDate=new Date(converted.rate.date+'T12:00:00Z').toLocaleDateString(lang()==='en'?'en-US':'es-MX');
          note.textContent=tr("Presupuesto aproximado, redondeado hacia arriba. Tipo de cambio: ","Approximate budget, rounded up. Exchange rate: ")+rateDate+" · 1 USD = "+converted.rate.rate+" MXN.";
        } else { budgetBase={amount:"",currency:next};note.textContent=""; }
        budgetCurrency=next;
      }
      update();remember(event);
    };form.oninput=remember;
    form.querySelector("[data-inquiry-done]").onclick=()=>dialog.close();
    function valuesForMessage() {
      const entered=Object.fromEntries(new FormData(form));
      const body={...current,...entered,intent:fixed || entered.intent,lang:lang(),currency:form.elements.currency?.value || "USD"};
      if(known&&!owner)for(const name of ["propertyId","propertyTitle","mls","developmentId","development","reference","zone","subzone","propertyType","project","rentPeriod"]) body[name]=context[name] || "";
      delete body.phone;delete body.country;delete body.requestId;delete body.whatsappRef;
      if(body.contactChannel!=="email")delete body.email;
      if(!form.elements.budget||(!budgetEdited&&current.searchFilters))delete body.budget;
      return body;
    }
    const refreshOfficeLinks=()=>{
      const values=valuesForMessage();
      for(const link of form.querySelectorAll('[data-inquiry-office]'))link.href=whatsappUrl({...values,office:link.dataset.inquiryOffice},config);
    };
    form.addEventListener("input",refreshOfficeLinks);form.addEventListener("change",refreshOfficeLinks);refreshOfficeLinks();
    let ownerReference;
    async function openOwnerWhatsApp(values) {
      if (!form.reportValidity() || form.elements.website.value) return;
      // Preserve the user gesture while the server reserves the anonymous reference.
      const popup = window.open("about:blank", "_blank");
      if (popup) popup.opener = null;
      try {
        ownerReference ||= window.PccInquiryRequest("/api/inquiries/owner-reference", { requestId }).then(result => result.mls);
        const mls = await ownerReference;
        const url = whatsappUrl({ ...values, mls }, config);
        if (!mls || !url) throw Error();
        if (popup) popup.location.replace(url);
        showHandoff(url);
        drafts.delete(returnKey);
      } catch {
        popup?.close();
        ownerReference = null;
        notice.textContent = tr("No pudimos asignar el MLS. Intenta de nuevo.", "We could not assign an MLS. Please try again.");
      }
    }
    for(const link of form.querySelectorAll('[data-inquiry-office]'))link.addEventListener("click",event=>{
      const values = valuesForMessage();
      if (["sell", "let"].includes(values.intent) && !values.propertyId && !values.developmentId) {
        event.preventDefault(); void openOwnerWhatsApp({ ...values, office: link.dataset.inquiryOffice }); return;
      }
      if(form.elements.contactChannel.value==="email"&&!form.elements.email.reportValidity())event.preventDefault();
    });
    form.onsubmit=event=>{
      event.preventDefault();if(!form.reportValidity())return;
      if(form.elements.website.value)return;
      const values = valuesForMessage();
      if (["sell", "let"].includes(values.intent) && !values.propertyId && !values.developmentId) { void openOwnerWhatsApp(values); return; }
      const url=whatsappUrl(values,config);
      if(!url){notice.textContent=tr("No pudimos preparar WhatsApp. Usa uno de los botones de contacto.","We could not prepare WhatsApp. Please use one of the contact buttons.");return;}
      remember();
      // Open synchronously from the visitor's click; no phone or lead POST is needed.
      // Preparing or opening WhatsApp does not mean the visitor has sent the message.
      window.open(url,"_blank","noopener,noreferrer");
      showHandoff(url);
    };
    function showHandoff(url) {
      form.querySelector("[data-inquiry-fields]").hidden=true;
      const success=form.querySelector("[data-inquiry-success]");success.hidden=false;
      form.querySelector("[data-success-message]").textContent=tr("Envía el mensaje en WhatsApp para completar tu consulta. Si no se abrió, usa el botón de abajo.","Send the message in WhatsApp to complete your inquiry. If it did not open, use the button below.");
      const link=form.querySelector("[data-inquiry-whatsapp]");link.hidden=false;link.href=url;
      notice.textContent="";success.focus();dialog.querySelector(".inquiry-scroll").scrollTop=0;
    }
    if (window.PccInvitationVisit?.()) window.PccMountInvitationContact?.(form,countryList(opts),valuesForMessage,started);
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
  window.PccInquiry={open,populatePhone,offerAction,updateChannel,whatsappUrl};
  if(document.querySelector('[data-whatsapp-inquiry]'))void getOptions().catch(()=>{});
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
