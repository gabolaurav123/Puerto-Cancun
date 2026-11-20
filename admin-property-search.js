(() => {
  "use strict";
  const root = document.querySelector("[data-property-web-search]");
  if (!root) return;
  const form = root.querySelector("form"), field = form.elements.criteria;
  const submit = form.querySelector('[type="submit"]'), clear = root.querySelector("[data-property-search-clear]");
  const status = root.querySelector("[data-property-search-status]"), results = root.querySelector("[data-property-search-results]");
  let busy = false;
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const safeUrl = value => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : ""; } catch { return ""; } };
  const list = (heading, values) => Array.isArray(values) && values.length ? `<div><h4>${heading}</h4><ul>${values.map(value => `<li>${escape(value)}</li>`).join("")}</ul></div>` : "";
  async function readResponse(response) {
    let data;
    try { data = JSON.parse(await response.text()); }
    catch { throw Object.assign(Error("No se pudo consultar la búsqueda. El servicio está temporalmente ocupado; intenta nuevamente."), { retryable: true, code: "SEARCH_INVALID_JSON", httpStatus: response.status }); }
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Object.assign(Error("La búsqueda devolvió una respuesta inesperada. Intenta nuevamente."), { code: "SEARCH_INVALID_RESPONSE", httpStatus: response.status });
    if (!response.ok) throw Object.assign(Error(typeof data.error === "string" ? data.error : "No se pudo completar la búsqueda."), { retryable: [502,503,504].includes(response.status), code: /^SEARCH_[A-Z_]+$/.test(data.code || "") ? data.code : "SEARCH_HTTP_ERROR", httpStatus: response.status });
    return data;
  }
  async function waitForJob(jobId) {
    if (typeof jobId !== "string" || !/^[a-f0-9-]{36}$/i.test(jobId)) throw Error("No se pudo iniciar la búsqueda. Intenta nuevamente.");
    const deadline = Date.now() + 150000;
    let failures = 0;
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      try {
        const response = await fetch("/api/admin/property-search/jobs/" + encodeURIComponent(jobId), { cache: "no-store", signal: AbortSignal.timeout(Math.min(12000, remaining)) });
        const job = await readResponse(response);
        failures = 0;
        if (job.status === "complete" && Array.isArray(job.result?.listings)) return job.result;
        if (job.status === "failed") throw Object.assign(Error(job.error || "No se pudo completar la búsqueda."), { code: /^SEARCH_[A-Z_]+$/.test(job.code || "") ? job.code : "SEARCH_FAILED" });
        if (job.status !== "pending") throw Error("La búsqueda devolvió una respuesta inesperada. Intenta nuevamente.");
      } catch (failure) {
        if ((failure.retryable || ["AbortError", "TimeoutError"].includes(failure.name)) && ++failures < 3) continue;
        throw failure;
      }
    }
    throw Error("La búsqueda tardó demasiado. Prueba una zona y criterios más concretos.");
  }
  function show(result) {
    const items = (result.listings || []).filter(item => safeUrl(item.url));
    const date = result.checkedAt ? new Date(result.checkedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "";
    results.innerHTML = `<div class="property-search-summary"><h3>${items.length ? "Opciones encontradas" : "Sin coincidencias verificables"}</h3><p>${escape(result.summary)}</p>${date ? `<small>Consultado: ${escape(date)}</small>` : ""}${result.warning ? `<p>${escape(result.warning)}</p>` : ""}</div>
      <div class="property-search-results-grid">${items.map(item => `<article class="property-search-result"><span class="property-search-portal">${escape(item.portal)}</span><h3>${escape(item.title)}</h3><p class="property-search-price">${escape(item.price)}</p><p>${escape(item.location)}</p>${list("Características publicadas", item.features)}${list("Coincide con lo solicitado", item.matches)}${list("Por confirmar o ajustar", item.toConfirm)}<a class="primary-button" href="${escape(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">Ver anuncio en ${escape(item.portal)}</a></article>`).join("")}</div>
      <p class="property-search-notice">${escape(result.notice)}</p>`;
    results.hidden = false;
  }
  clear.addEventListener("click", () => {
    if (busy) return;
    form.reset(); results.replaceChildren(); results.hidden = true; status.textContent = ""; field.focus();
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const criteria = field.value.trim();
    if (criteria.length < 12) { status.textContent = "Añade la zona y algunas características para orientar la búsqueda."; field.focus(); return; }
    busy = true; submit.disabled = true; clear.disabled = true; root.setAttribute("aria-busy", "true");
    root.removeAttribute("data-property-search-error"); root.removeAttribute("data-property-search-http-status");
    root.setAttribute("data-property-search-stage", "session");
    results.hidden = true; status.textContent = "Buscando anuncios en distintos portales… Puede tardar hasta dos minutos. Puedes mantener esta sección abierta.";
    try {
      const authResponse = await fetch("/api/session", { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!authResponse.ok) throw Error("La sesión venció. Inicia sesión nuevamente.");
      const session = await readResponse(authResponse);
      root.setAttribute("data-property-search-stage", "start");
      const response = await fetch("/api/admin/property-search", {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken || "" },
        body: JSON.stringify({ criteria }), signal: AbortSignal.timeout(12000),
      });
      const started = await readResponse(response);
      root.setAttribute("data-property-search-stage", "poll");
      const data = await waitForJob(started.jobId);
      show(data); status.textContent = `${data.listings.length} opciones con fuente. Revisa los datos antes de compartirlas.`;
      root.setAttribute("data-property-search-stage", "complete");
    } catch (failure) {
      root.setAttribute("data-property-search-error", failure.code || "SEARCH_CLIENT_ERROR");
      if (failure.httpStatus) root.setAttribute("data-property-search-http-status", String(failure.httpStatus));
      status.textContent = ["AbortError", "TimeoutError"].includes(failure?.name) ? "La búsqueda tardó demasiado. Prueba una zona y criterios más concretos." : failure.message || "No se pudo completar la búsqueda.";
    } finally {
      busy = false; submit.disabled = false; clear.disabled = false; root.removeAttribute("aria-busy");
    }
  });
})();
