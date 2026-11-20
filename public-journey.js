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
  const owner = document.querySelector("#ownerContactButton");
  if (owner) {
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
