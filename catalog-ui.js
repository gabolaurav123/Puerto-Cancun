(function () {
  "use strict";
  const english = document.documentElement.lang.startsWith("en");
  const t = (es, en) => english ? en : es;
  let request, sequence = 0, debounce;
  const root = () => document.querySelector("[data-catalog-root]");

  function formUrl(form) {
    const params = new URLSearchParams(new FormData(form));
    const locations = params.getAll("location");
    params.delete("location");
    if (locations.length) params.set("location", locations.join(","));
    if (params.get("operation") === "rent") params.delete("modality");
    if (params.get("entity") === "developments") { params.delete("type"); params.delete("development"); }
    params.delete("page");
    const comparison = new URLSearchParams(location.search).get("compare");
    if (comparison) params.set("compare", comparison);
    for (const [key, value] of [...params.entries()]) if (value === "") params.delete(key);
    return `${form.action}?${params}`;
  }

  async function navigate(url, push = true, preserveField = "") {
    request?.abort();
    request = new AbortController();
    const id = ++sequence;
    const container = root();
    if (!container) { window.location.assign(url); return; }
    const status = container.querySelector(".catalog-request-status");
    const selection = document.activeElement?.name === preserveField ? document.activeElement.selectionStart : null;
    status.textContent = t("Buscando propiedades…", "Searching listings…");
    container.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(url, { signal: request.signal, headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error("catalog-http");
      const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
      const replacement = parsed.querySelector("[data-catalog-root]");
      if (!replacement) throw new Error("catalog-markup");
      if (id !== sequence) return;
      window.PccCatalogMap?.dispose(container);
      container.replaceWith(replacement);
      document.title = parsed.title;
      const hero = document.querySelector(".seo-page-hero");
      const nextHero = parsed.querySelector(".seo-page-hero");
      if (hero && nextHero) hero.replaceWith(nextHero);
      const alternate = parsed.body.dataset.alternateUrl;
      if (alternate) document.body.dataset.alternateUrl = alternate;
      if (push) history.pushState({ catalog: true }, "", url);
      if (preserveField) {
        const input = replacement.querySelector(`[name="${CSS.escape(preserveField)}"]`);
        input?.focus({ preventScroll: true });
        if (selection !== null && input?.type === "search") input.setSelectionRange(selection, selection);
      }
      window.lucide?.createIcons();
      window.pccComparison?.syncControls();
    } catch (error) {
      if (error.name === "AbortError" || id !== sequence) return;
      status.textContent = t("No se pudieron actualizar los resultados. Tus filtros se conservan; vuelve a pulsar Aplicar filtros.", "Results could not be updated. Your filters are retained; select Apply filters to retry.");
    } finally {
      if (id === sequence) root()?.removeAttribute("aria-busy");
    }
  }

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "catalogFilters") return;
    event.preventDefault(); clearTimeout(debounce); navigate(formUrl(event.target));
  });
  document.addEventListener("input", (event) => {
    if (!event.target.closest("#catalogFilters") || event.target.name !== "q") return;
    clearTimeout(debounce);
    // Invalidate immediately, not after the debounce, so an older request cannot replace new typing.
    sequence += 1; request?.abort();
    debounce = setTimeout(() => navigate(formUrl(event.target.form), true, "q"), 350);
  });
  document.addEventListener("change", (event) => {
    if (!event.target.closest("#catalogFilters")) return;
    if (event.target.name === "operation" && event.target.value === "rent") event.target.form.elements.modality.value = "";
    if (["location", "type", "entity", "operation", "featured", "sort", "zone", "development", "modality"].includes(event.target.name)) {
      clearTimeout(debounce); navigate(formUrl(event.target.form), true, event.target.name);
    }
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest(".catalog-pagination a, .catalog-chip, #catalogFilters a.text-link");
    if (link && !event.ctrlKey && !event.metaKey && event.button === 0) { event.preventDefault(); navigate(link.href); return; }
    const button = event.target.closest("[data-catalog-view]");
    if (button) {
      const container = root();
      container.querySelectorAll("[data-catalog-view]").forEach((control) => control.setAttribute("aria-pressed", String(control === button)));
      if (button.dataset.catalogView === "map") window.PccCatalogMap?.open(container);
      else window.PccCatalogMap?.hide(container);
    }
  });
  window.addEventListener("popstate", () => { if (root()) navigate(location.href, false); });
  window.PccCatalog = { navigate };

  // Links and contacts use ordinary anchors and remain functional without the catalog enhancement.
  for (const contact of window.PccContacts?.contacts || []) {
    document.querySelectorAll(`[data-business-contact="${contact.id}"]`).forEach((link) => {
      link.href = window.PccContacts.whatsappUrl(contact.id);
      link.textContent = `${english ? contact.labelEn : contact.label} · WhatsApp ${contact.display}`;
    });
  }
})();
