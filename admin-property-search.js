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
    results.hidden = true; status.textContent = "Buscando anuncios en distintos portales… Puede tardar alrededor de un minuto.";
    try {
      const authResponse = await fetch("/api/session", { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!authResponse.ok) throw Error("La sesión venció. Inicia sesión nuevamente.");
      const session = await authResponse.json();
      const response = await fetch("/api/admin/property-search", {
        method: "POST", headers: { "Content-Type": "application/json", "X-CSRF-Token": session.csrfToken || "" },
        body: JSON.stringify({ criteria }), signal: AbortSignal.timeout(75000),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "No se pudo completar la búsqueda.");
      show(data); status.textContent = `${data.listings.length} opciones con fuente. Revisa los datos antes de compartirlas.`;
    } catch (failure) {
      status.textContent = ["AbortError", "TimeoutError"].includes(failure?.name) ? "La búsqueda tardó demasiado. Prueba una zona y criterios más concretos." : failure.message || "No se pudo completar la búsqueda.";
    } finally {
      busy = false; submit.disabled = false; clear.disabled = false; root.removeAttribute("aria-busy");
    }
  });
})();
