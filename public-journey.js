(function () {
  "use strict";
  const logo = document.querySelector("[data-gold-logo]");
  function shine() {
    if (!logo) return;
    logo.classList.remove("is-gold-shining");
    requestAnimationFrame(() => {
      logo.classList.add("is-gold-shining");
      setTimeout(() => logo.classList.remove("is-gold-shining"), 1000);
    });
  }
  try {
    if (sessionStorage.getItem("pcc-logo-shine") === "1") {
      sessionStorage.removeItem("pcc-logo-shine"); shine();
    }
  } catch {}
  logo?.addEventListener("click", event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    shine();
    const destination = new URL(logo.href, location.href);
    if (destination.pathname === location.pathname && !location.search) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    } else {
      try { sessionStorage.setItem("pcc-logo-shine", "1"); } catch {}
    }
  });
  const en = document.documentElement.lang.startsWith("en");
  let shareDialog, shareOpener;
  function getShareDialog() {
    if (shareDialog) return shareDialog;
    shareDialog = document.createElement("dialog");
    shareDialog.className = "public-share-dialog";
    shareDialog.setAttribute("aria-labelledby", "publicShareTitle");
    shareDialog.innerHTML = `<form method="dialog"><h2 id="publicShareTitle">${en ? "Share listing" : "Compartir publicación"}</h2><button class="public-share-close" aria-label="${en ? "Close" : "Cerrar"}">×</button></form>
      <p class="public-share-name"></p><div class="public-share-options">
      <a data-share-channel="whatsapp" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span> WhatsApp</a>
      <a data-share-channel="facebook" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">f</span> Facebook</a>
      <button type="button" data-share-channel="instagram"><span aria-hidden="true">◎</span> Instagram</button>
      <button type="button" data-share-channel="copy"><span aria-hidden="true">⧉</span> ${en ? "Copy link" : "Copiar enlace"}</button></div>
      <p class="public-share-hint">${en ? "For Instagram, copy the link and paste it into a message or story." : "En Instagram, pega el enlace copiado en un mensaje o historia."}</p>
      <label class="public-share-url">${en ? "Short link" : "Enlace corto"}<input readonly type="text" /></label>
      <p class="public-share-status" role="status" aria-live="polite"></p>`;
    document.body.append(shareDialog);
    shareDialog.addEventListener("close", () => {
      if (shareOpener?.isConnected) shareOpener.focus({ preventScroll: true });
    });
    shareDialog.addEventListener("click", event => {
      if (event.target !== shareDialog) return;
      const rect = shareDialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) shareDialog.close();
    });
    async function copyLink() {
      const field = shareDialog.querySelector("input");
      try { await navigator.clipboard.writeText(field.value); return true; }
      catch {
        field.focus(); field.select();
        try { return document.execCommand("copy"); } catch { return false; }
      }
    }
    shareDialog.querySelector('[data-share-channel="copy"]').addEventListener("click", async () => {
      const copied = await copyLink();
      shareDialog.querySelector(".public-share-status").textContent = copied
        ? (en ? "Link copied." : "Enlace copiado.")
        : (en ? "Select and copy the link below." : "Selecciona y copia el enlace de abajo.");
    });
    shareDialog.querySelector('[data-share-channel="instagram"]').addEventListener("click", async () => {
      // Instagram has no URL composer; copy the link without claiming a post was sent.
      const copying = copyLink();
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      const copied = await copying;
      shareDialog.querySelector(".public-share-status").textContent = copied
        ? (en ? "Link copied. Paste it into your Instagram message or story." : "Enlace copiado. Pégalo en tu mensaje o historia de Instagram.")
        : (en ? "Copy the link below to paste into Instagram." : "Copia el enlace de abajo para pegarlo en Instagram.");
    });
    return shareDialog;
  }
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-public-share]");
    if (!trigger) return;
    const path = trigger.dataset.publicShare;
    if (!/^\/(?:en\/)?s\/[A-Za-z0-9_-]{12}$/.test(path || "")) return;
    event.preventDefault();
    shareOpener = trigger;
    const dialog = getShareDialog();
    const url = new URL(path, location.origin).href;
    const title = trigger.dataset.shareTitle || "Puerto Cancún Center";
    dialog.querySelector(".public-share-name").textContent = title;
    dialog.querySelector("input").value = url;
    dialog.querySelector(".public-share-status").textContent = "";
    dialog.querySelector('[data-share-channel="whatsapp"]').href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(title + "\n" + url);
    dialog.querySelector('[data-share-channel="facebook"]').href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    dialog.showModal();
  });
  const owner = document.querySelector("#ownerContactButton");
  if (owner) {
    const updateOwnerVisibility = () => {
      const path = location.pathname.replace(/\/+$/, "") || "/";
      const params = new URLSearchParams(location.search);
      const home = path === "/" || path === "/en";
      const allProperties = ["/propiedades", "/en/properties"].includes(path)
        && (!params.has("entity") || params.get("entity") === "properties")
        && !["1", "true"].includes(params.get("featured"));
      owner.hidden = !(home || allProperties);
      document.body.classList.toggle("owner-contact-eligible", !owner.hidden);
    };
    updateOwnerVisibility();
    document.addEventListener("pcc:catalog:navigated", updateOwnerVisibility);
    window.addEventListener("popstate", updateOwnerVisibility);
    const cookies = document.querySelector("#cookieBanner");
    const updateCookieVisibility = () => document.body.classList.toggle("owner-contact-cookie-visible", Boolean(cookies && !cookies.hidden && cookies.getBoundingClientRect().height > 0 && getComputedStyle(cookies).visibility !== "hidden"));
    if (cookies) {
      new ResizeObserver(updateCookieVisibility).observe(cookies);
      new MutationObserver(updateCookieVisibility).observe(cookies, { attributes: true, attributeFilter: ["hidden", "class", "style"] });
      updateCookieVisibility();
    }
    owner.setAttribute("aria-label", en ? "Selling or renting out? Start here" : "¿Quieres vender o rentar? Clic aquí");
    const action = owner.querySelector("[data-owner-float-action]");
    if (action) action.textContent = en ? "Start here" : "Clic aquí";
  }
})();
