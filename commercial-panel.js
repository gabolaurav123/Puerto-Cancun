(() => {
  "use strict";
  const root = document.querySelector("[data-commercial-panel]");
  if (!root) return;
  const stages = { new: "Nueva", contacted: "Contactada", qualified: "Necesidad validada", visit_requested: "Visita solicitada", visit_confirmed: "Visita confirmada", visit_completed: "Visita realizada", captured: "Propiedad captada", closed_won: "Cierre registrado", closed_lost: "Sin cierre" };
  const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const when = value => value ? new Date(value).toLocaleString("es-MX") : "";
  let data, page = 0, loading = false;
  const request = async (path, method = "GET", body) => {
    const headers = { "Content-Type": "application/json" };
    if (method !== "GET") {
      const auth = await fetch("/api/session", { cache: "no-store" }).then(r => r.json());
      headers["X-CSRF-Token"] = auth.csrfToken;
    }
    const response = await fetch(path, { method, headers, ...(body && { body: JSON.stringify(body) }) });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "No se pudo completar la operación.");
    return result;
  };
  root.innerHTML = '<summary>Seguimiento comercial, búsquedas y coincidencias</summary><div class="commercial-workspace"><p>Relaciona cada consulta con su inmueble o desarrollo, registra avances reales y revisa coincidencias. Las preferencias pendientes deben confirmarse con el cliente.</p><div data-commercial-metrics class="commercial-metrics"></div><div class="commercial-filters"><label>Buscar por persona, desarrollo o propiedad<input type="search" data-commercial-search></label><label>Mostrar<select data-commercial-filter><option value="">Todas las consultas</option><option value="search">Búsquedas guardadas</option><option value="owner">Ofertas de propietarios</option><option value="visit">Solicitudes de visita</option><option value="related">Contactos con varias consultas</option></select></label><button type="button" class="ghost-button" data-commercial-refresh>Actualizar</button></div><p role="status" data-commercial-status></p><div data-commercial-results></div><div class="commercial-pagination"><button type="button" class="ghost-button" data-commercial-prev>Anterior</button><span data-commercial-page></span><button type="button" class="ghost-button" data-commercial-next>Siguiente</button></div></div>';
  const status = text => { root.querySelector('[data-commercial-status]').textContent = text; };
  function render() {
    if (!data) return;
    const m = data.metrics;
    root.querySelector('[data-commercial-metrics]').innerHTML = [[m.contacts,"Contactos"],[m.inquiries,"Consultas"],[m.visitingContacts,"Contactos que solicitaron visita"],[m.requested,"Visitas solicitadas"],[m.confirmed,"Visitas confirmadas / realizadas"],[m.captured,"Propiedades captadas"],[m.closed,"Cierres registrados"]].map(([n,label]) => `<div><strong>${Number(n || 0)}</strong><span>${label}</span></div>`).join("");
    const q = root.querySelector('[data-commercial-search]').value.toLowerCase().trim();
    const kind = root.querySelector('[data-commercial-filter]').value;
    const all = data.leads.filter(lead => (!q || JSON.stringify([lead.name,lead.phone,lead.id,lead.payload]).toLowerCase().includes(q)) && (!kind || (kind === "search" && lead.payload.searchWatch) || (kind === "owner" && ["sell","let"].includes(lead.payload.intent)) || (kind === "visit" && lead.payload.visitId) || (kind === "related" && lead.relatedInquiries.length)));
    page = Math.min(page, Math.max(0,Math.ceil(all.length / 20)-1));
    root.querySelector('[data-commercial-page]').textContent = `${all.length} consultas · página ${page+1} de ${Math.max(1,Math.ceil(all.length/20))}`;
    root.querySelector('[data-commercial-prev]').disabled = page === 0;
    root.querySelector('[data-commercial-next]').disabled = (page+1)*20 >= all.length;
    root.querySelector('[data-commercial-results]').innerHTML = all.slice(page*20,page*20+20).map(lead => {
      const p = lead.payload, stage = p.commercialStage || "new", watch = p.searchWatch;
      const availableStages = Object.entries(stages).filter(([key]) => !key.startsWith("visit_") || p.visitId).filter(([key]) => key !== "captured" || ["sell","let"].includes(p.intent));
      const watchStatus = { active:"Avisos activos", pending_channel:"Sin canal activado", needs_review:"Preferencias pendientes de revisión", cancelled:"Avisos cancelados" };
      const deliveries = Object.values(watch?.deliveries || {});
      return `<details class="commercial-lead" data-commercial-id="${escape(lead.id)}"><summary><strong>${escape(lead.name)}</strong><span>${escape(p.propertyTitle || p.development || p.zone || "Consulta general")}</span><span>${escape(stages[stage] || stage)}</span></summary><div class="commercial-lead-body"><p>${escape(lead.phone)} · ${escape(when(lead.createdAt))}</p><dl><dt>Intención</dt><dd>${escape({buy:"Comprar",rent:"Buscar renta",sell:"Vender",let:"Ofrecer en renta"}[p.intent] || lead.status)}</dd><dt>Origen</dt><dd>${escape(p.origin || lead.source || "Portal")}</dd><dt>Necesidades</dt><dd>${escape([p.propertyType,p.zone,p.development,p.budget ? 'Presupuesto: '+p.budget+' '+p.currency : '',p.askingPrice ? 'Precio solicitado: '+p.askingPrice+' '+p.currency : '',p.rentPeriod ? 'Periodo: '+p.rentPeriod : '',p.preferences].filter(Boolean).join(' · ') || "Pendiente de ampliar")}</dd></dl>${p.visitPreferredAt ? `<p><strong>Visita solicitada:</strong> ${escape(p.visitPreferredAt.replace('T',' '))} (Cancún). ${escape(stages[stage] || "Pendiente de confirmación")}</p>` : ""}${watch ? `<div class="commercial-watch"><h4>Búsqueda guardada</h4><p>${escape(watchStatus[watch.status] || watch.status)}${watch.channel ? ' · '+escape(watch.channel) : ''}</p><p>Autorización: ${escape(watch.consentAt ? when(watch.consentAt) : "sin autorización de avisos")}</p><p>${deliveries.filter(d=>d.status==='sent').length} coincidencias notificadas · ${deliveries.filter(d=>d.status==='needs_review'||d.status==='sending').length} entregas por revisar</p><code>${escape(window.PccInventory?.toSearchParams(watch.filters).toString() || JSON.stringify(watch.filters))}</code>${watch.status !== 'cancelled' ? '<button type="button" class="ghost-button" data-commercial-pause>Detener avisos</button>' : ''}</div>` : ""}${lead.relatedInquiries.length ? `<p>Este contacto tiene otras ${lead.relatedInquiries.length} consultas. Se conservan por separado.</p>` : ""}<h4>Coincidencias con publicaciones</h4>${lead.inventory.pending.map(text=>'<p>'+escape(text)+'</p>').join('')}<ul>${lead.inventory.matches.map(p=>`<li><a href="${escape(p.url)}" target="_blank" rel="noopener">${escape(p.title)}</a></li>`).join('') || '<li>Sin coincidencias verificadas con estos criterios.</li>'}</ul>${lead.owners.length ? `<h4>Ofertas de propietarios en el mismo desarrollo</h4><ul>${lead.owners.map(owner=>`<li><button type="button" class="text-link" data-commercial-related="${escape(owner.id)}">${escape(owner.name)}</button> · ${escape(owner.propertyType || 'Tipo pendiente')}<p>${escape(owner.pending.join(' · ') || 'Coincide en desarrollo, operación, tipo y presupuesto; confirmar disponibilidad.')}</p></li>`).join('')}</ul>` : ""}<form data-commercial-update><div class="commercial-filters"><label>Etapa<select name="stage">${availableStages.map(([value,label])=>`<option value="${value}"${value===stage?' selected':''}>${label}</option>`).join('')}</select></label><label>Responsable<select name="assignedTo"><option value="">Sin asignar</option>${data.users.map(u=>`<option value="${escape(u.id)}"${u.id===lead.assignedTo?' selected':''}>${escape(u.name)}</option>`).join('')}</select></label></div><label>Añadir nota<textarea name="note" rows="2" maxlength="4000" placeholder="Acción realizada, acuerdos o próximo paso"></textarea></label><button class="primary-button" type="submit">Guardar seguimiento</button><p role="status" data-commercial-save-status></p></form><details><summary>Notas e historial de atención</summary><pre>${escape(lead.notes || 'Sin notas todavía.')}</pre><button type="button" class="ghost-button" data-commercial-history>Consultar historial</button><div data-commercial-timeline></div></details></div></details>`;
    }).join("") || '<p>No hay consultas en esta selección.</p>';
    status(data.leads.length >= data.limit ? `Se muestran las ${data.limit} consultas más recientes. Las métricas incluyen todo el historial.` : "Métricas basadas en solicitudes y avances registrados por el equipo.");
  }
  async function load() {
    if (loading) return; loading = true; status("Cargando seguimiento…");
    try { data = await request('/api/admin/commercial'); render(); }
    catch (error) { status(error.message); }
    finally { loading = false; }
  }
  root.addEventListener('toggle', () => { if (root.open && !data) void load(); });
  root.addEventListener('input', event => { if (event.target.matches('[data-commercial-search]')) { page=0; render(); } });
  root.addEventListener('change', event => { if (event.target.matches('[data-commercial-filter]')) { page=0; render(); } });
  root.addEventListener('click', async event => {
    if (event.target.closest('[data-commercial-refresh]')) { await load(); return; }
    if (event.target.closest('[data-commercial-prev]')) { page--; render(); return; }
    if (event.target.closest('[data-commercial-next]')) { page++; render(); return; }
    const related = event.target.closest('[data-commercial-related]');
    if (related) { root.querySelector('[data-commercial-search]').value=related.dataset.commercialRelated; root.querySelector('[data-commercial-filter]').value='';page=0;render();root.querySelector('.commercial-lead')?.setAttribute('open','');return; }
    const card = event.target.closest('[data-commercial-id]'); if (!card) return;
    const id = card.dataset.commercialId;
    if (event.target.closest('[data-commercial-history]')) {
      const timeline = card.querySelector('[data-commercial-timeline]');
      try { const result = await request('/api/admin/commercial/'+encodeURIComponent(id)+'/history'); timeline.innerHTML=result.history.map(h=>`<p><strong>${escape(when(h.created_at))} · ${escape(h.author || 'Administración')}</strong><br>${escape(stages[h.new_value?.stage] || h.action)}${h.new_value?.note ? '<br>'+escape(h.new_value.note) : ''}</p>`).join('') || '<p>Sin cambios de seguimiento registrados.</p>'; }
      catch(error) { timeline.textContent=error.message; }
    }
    if (event.target.closest('[data-commercial-pause]')) {
      try { await request('/api/admin/commercial/'+encodeURIComponent(id),'PATCH',{pauseAlerts:true}); await load(); }
      catch(error) { status(error.message); }
    }
  });
  root.addEventListener('submit',async event=>{
    const form=event.target.closest('[data-commercial-update]');if(!form)return;event.preventDefault();
    const id=form.closest('[data-commercial-id]').dataset.commercialId, button=form.querySelector('button[type="submit"]'), notice=form.querySelector('[data-commercial-save-status]');
    button.disabled=true;notice.textContent='Guardando…';
    try{ await request('/api/admin/commercial/'+encodeURIComponent(id),'PATCH',Object.fromEntries(new FormData(form))); document.dispatchEvent(new Event('pcc:commercial-updated')); await load(); const card=[...root.querySelectorAll('[data-commercial-id]')].find(el=>el.dataset.commercialId===id);card?.setAttribute('open','');if(card)card.querySelector('[data-commercial-save-status]').textContent='Seguimiento guardado.'; }
    catch(error){notice.textContent=error.message;}finally{button.disabled=false;}
  });
})();
