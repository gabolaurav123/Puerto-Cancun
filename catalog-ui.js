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

  async function navigate(url, push = true, preserveField = "", revealResults = false) {
    clearTimeout(debounce);
    request?.abort();
    request = new AbortController();
    const id = ++sequence;
    const container = root();
    if (!container) { window.location.assign(url); return; }
    const status = container.querySelector(".catalog-request-status");
    const focused = preserveField && document.activeElement?.name === preserveField ? document.activeElement : null;
    const selection = focused?.type === "search" ? focused.selectionStart : null;
    status.textContent = t("Buscando propiedades…", "Searching listings…");
    container.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(url, { signal: request.signal, headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error("catalog-http");
      const parsed = new DOMParser().parseFromString(await response.text(), "text/html");
      const replacement = parsed.querySelector("[data-catalog-root]");
      if (!replacement) throw new Error("catalog-markup");
      if (id !== sequence) return;
      const mapOpen = container.classList.contains("catalog-map-open");
      for (const selector of [".catalog-filter-panel", ".catalog-advanced"]) {
        const next = replacement.querySelector(selector);
        if (next && container.querySelector(selector)?.open && preserveField) next.open = true;
      }
      window.PccCatalogMap?.dispose(container);
      container.replaceWith(replacement);
      document.title = parsed.title;
      const hero = document.querySelector(".seo-page-hero");
      const nextHero = parsed.querySelector(".seo-page-hero");
      if (hero && nextHero) hero.replaceWith(nextHero);
      const alternate = parsed.body.dataset.alternateUrl;
      if (alternate) document.body.dataset.alternateUrl = alternate;
      if (push) history.pushState({ catalog: true }, "", url);
      if (mapOpen) window.PccCatalogMap?.open(replacement);
      if (focused) {
        const controls = replacement.querySelectorAll(`[name="${CSS.escape(preserveField)}"]`);
        const input = focused.type === "checkbox" ? [...controls].find(control => control.value === focused.value) : controls[0];
        input?.focus({ preventScroll: true });
        if (selection !== null && input?.type === "search") input.setSelectionRange(selection, selection);
      }
      if (revealResults) {
        const target = replacement.querySelector(".catalog-errors, .catalog-result-bar");
        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: "start", behavior: "instant" });
        }
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
    event.preventDefault(); navigate(formUrl(event.target), true, "", true);
  });
  document.addEventListener("input", (event) => {
    if (event.target.form?.id !== "catalogFilters" || event.target.name !== "q") return;
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
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
      event.preventDefault();
      const url = new URL(link.href);
      const comparison = new URLSearchParams(location.search).get("compare");
      if (comparison) url.searchParams.set("compare", comparison); else url.searchParams.delete("compare");
      navigate(url.href, true, "", true);
      return;
    }
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
      const label = `${english ? contact.labelEn : contact.label} · WhatsApp`;
      const labelNode = link.querySelector('[data-contact-label]');
      const numberNode = link.querySelector('[data-contact-number]');
      if (labelNode && numberNode) {
        labelNode.textContent = label;
        numberNode.textContent = contact.display;
      } else {
        link.textContent = `${label} ${contact.display}`;
      }
    });
  }
})();
