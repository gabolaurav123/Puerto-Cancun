(function () {
  "use strict";
  let pending = null, request = null, sequence = 0, activeButton = null, activeStatus = null;
  const languageOf = (options) => {
    for (const value of [options?.language, options?.lang, document.documentElement.lang]) {
      if (/^(es|en)(?:[-_]|$)/i.test(String(value || ""))) return value.slice(0, 2).toLowerCase();
    }
    return "es";
  };
  function reset() {
    pending = null; request?.abort(); request = null; sequence += 1;
    if (activeButton) activeButton.disabled = false;
    activeStatus?.replaceChildren(); activeButton = null; activeStatus = null;
  }
  async function search(text, status, button, options = {}) {
    const language = languageOf(options);
    const t = (es, en) => language === "en" ? en : es;
    const addRestart = () => {
      const restart = document.createElement("button"); restart.type = "button"; restart.className = "text-link";
      restart.textContent = t("Empezar otra búsqueda", "Start another search");
      restart.addEventListener("click", reset); status.append(restart);
    };
    request?.abort();
    if (activeButton) activeButton.disabled = false;
    request = new AbortController(); const ticket = ++sequence;
    activeButton = button; activeStatus = status;
    status.hidden = false; status.textContent = t("Interpretando criterios…", "Interpreting criteria…");
    status.setAttribute("role", "status");
    button.disabled = true;
    try {
      const catalogRoot = document.querySelector("[data-catalog-root]");
      const initial = catalogRoot ? window.PccInventory.parseQuery(new URLSearchParams(catalogRoot.getAttribute?.("data-catalog-query") || location.search)).query : {};
      // The existing endpoint forwards body.filters as parser context; keep its envelope intact.
      const filters = { ...(pending || { filters: initial }), language };
      const result = await window.api("/api/search/intelligent", { method: "POST", signal: request.signal,
        body: { query: text, filters, lang: language, language }, retry: false, timeoutMs: 15000 });
      if (ticket !== sequence) return;
      status.replaceChildren();
      const state = result.conversation;
      if ((pending && !state) || (state && (state.version !== 1 || !Array.isArray(state.pending)))) {
        pending ||= { filters: result.filters || initial, conversation: state, clarificationRequired: true, warnings: [], language };
        throw new Error(t("Falta el contexto de aclaraciones; no se aplicaron filtros. Reintenta o inicia otra búsqueda.", "Clarification context is missing; no filters were applied. Retry or start another search."));
      }
      if (result.needsChoice || result.clarificationRequired || result.errors?.length || result.conversation?.pending?.length) {
        pending = { filters: result.filters, conversation: result.conversation, warnings: result.warnings || [],
          clarificationRequired: true, language };
        const heading = document.createElement("strong");
        heading.textContent = t("Necesitamos precisar estos criterios:", "Please clarify these criteria:"); status.append(heading);
        const messages = [...new Set([...(result.warnings || []), ...(result.errors || [])])];
        if (!messages.length) messages.push(t("Confirma los requisitos pendientes antes de buscar.", "Confirm the pending requirements before searching."));
        for (const warning of messages) {
          const paragraph = document.createElement("p"); paragraph.textContent = warning; status.append(paragraph);
        }
        addRestart();
        return;
      }
      if (typeof result.url !== "string" || !result.url) throw new Error(t("Destino de catálogo inválido.", "Invalid catalog destination."));
      const target = new URL(result.url, location.origin);
      if (target.origin !== location.origin) throw new Error(t("Destino de catálogo inválido.", "Invalid catalog destination."));
      if (document.querySelector("[data-catalog-root]") && window.PccCatalog) await window.PccCatalog.navigate(target.href);
      else location.assign(target.href);
      if (ticket === sequence) pending = null;
    } catch (error) {
      if (error.name !== "AbortError" && ticket === sequence) {
        status.textContent = error.message;
        if (pending) addRestart();
      }
    } finally { if (ticket === sequence) { button.disabled = false; activeButton = null; request = null; } }
  }
  document.addEventListener("submit", (event) => {
    if (!event.target.matches("[data-catalog-assistant]")) return;
    event.preventDefault();
    void search(event.target.elements.query.value.trim(), event.target.querySelector("[data-search-status]"), event.target.querySelector("button[type=submit]"), { language: event.target.getAttribute("lang") });
  });
  window.PccCatalogAssistant = { search, reset };
})();
