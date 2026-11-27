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
  function markCurrentNavigation() {
    const catalogParent = document.querySelector(".property-page-heading [data-return-catalog]");
    const here = new URL(catalogParent?.href || location.href);
    const path = url => url.pathname.replace(/\/$/, "");
    const allListings = document.querySelector("#mainNav .public-nav-search");
    const developments = allListings && path(allListings) === path(here) && here.searchParams.get("entity") === "developments";
    document.querySelectorAll(".public-quick-nav, #mainNav").forEach(nav => {
      let current = null, specificity = -1;
      for (const link of nav.querySelectorAll("a[href]")) {
        link.removeAttribute("aria-current");
        const url = new URL(link.href);
        if (url.origin !== here.origin || path(url) !== path(here)) continue;
        const filters = [...url.searchParams];
        if (filters.length > specificity && filters.every(([key, value]) => here.searchParams.get(key) === value)) {
          current = link;
          specificity = filters.length;
        }
      }
      if (developments && specificity <= 0) {
        current = nav.querySelector('a[data-i18n="navDevelopments"]') || current;
        specificity = -1;
      }
      if (current) current.setAttribute("aria-current", !catalogParent && specificity === here.searchParams.size ? "page" : "location");
    });
  }
  markCurrentNavigation();
  document.addEventListener("pcc:catalog:navigated", markCurrentNavigation);

  const footerGroups = [];
  for (const heading of document.querySelectorAll(".footer-grid > div > h3")) {
    const group = document.createElement("details");
    const summary = document.createElement("summary");
    group.className = "footer-section";
    heading.before(group);
    group.append(summary);
    while (heading.nextElementSibling && heading.nextElementSibling.tagName !== "H3") group.append(heading.nextElementSibling);
    summary.append(heading);
    footerGroups.push(group);
  }
  if (footerGroups.length) {
    const compactFooter = matchMedia("(max-width: 700px)");
    const fitFooter = () => footerGroups.forEach(group => {
      group.open = !compactFooter.matches || group.contains(document.activeElement);
    });
    fitFooter();
    compactFooter.addEventListener("change", fitFooter);
  }

  let shareDialog, shareOpener, shareLinks;

  function getShareDialog() {
    if (shareDialog) return shareDialog;
    const dialog = document.createElement("dialog");
    shareDialog = dialog;
    dialog.className = "public-share-dialog";
    dialog.setAttribute("aria-labelledby", "publicShareTitle");
    dialog.innerHTML = `<form method="dialog"><h2 id="publicShareTitle">${en ? "Share listing" : "Compartir publicación"}</h2><button class="public-share-close" aria-label="${en ? "Close" : "Cerrar"}">×</button></form>
      <p class="public-share-name"></p><div class="public-share-options">
      <a data-share-channel="whatsapp" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span> WhatsApp</a>
      <a data-share-channel="facebook" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">f</span> Facebook</a>
      <button type="button" data-share-channel="instagram"><span aria-hidden="true">◎</span> Instagram</button>
      <button type="button" data-share-channel="copy"><span aria-hidden="true">⧉</span> ${en ? "Copy link" : "Copiar enlace"}</button></div>
      <p class="public-share-hint">${en ? "For Instagram, copy the link and paste it into a message or story." : "En Instagram, pega el enlace copiado en un mensaje o historia."}</p>
      <label class="public-share-url">${en ? "Short link" : "Enlace corto"}<input data-share-url readonly type="text" /></label>
      <details class="public-share-signature" hidden><summary>${en ? "Tell the agency who shared (optional)" : "Indicar a la agencia quién comparte (opcional)"}</summary>
        <label>${en ? "Your name" : "Tu nombre"}<input data-sender-name maxlength="110" autocomplete="given-name" /></label></details>
      <p class="public-share-status" role="status" aria-live="polite"></p>`;
    document.body.append(dialog);
    const field = dialog.querySelector("[data-share-url]");
    const status = dialog.querySelector(".public-share-status");
    const sender = dialog.querySelector("[data-sender-name]");
    function selection(channel) {
      const ticket = window.PccPublicSharing?.allowed() && shareLinks?.[channel];
      const href = new URL(ticket?.path || shareOpener.dataset.publicShare, location.origin).href;
      const name = sender.closest("details").open ? sender.value.trim() : "";
      return {href, record:() => { if (ticket) window.PccPublicSharing.record(ticket, channel, name); }};
    }
    function setAnchor(link, href) {
      const channel = link.dataset.shareChannel;
      link.href = channel === "whatsapp"
        ? "https://api.whatsapp.com/send?text=" + encodeURIComponent(shareOpener.dataset.shareTitle + "\n" + href)
        : "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(href);
    }
    dialog.updateLinks = () => {
      for (const link of dialog.querySelectorAll("a[data-share-channel]")) setAnchor(link, selection(link.dataset.shareChannel).href);
      field.value = selection("copy").href;
      field.dataset.channel = "copy";
    };
    dialog.addEventListener("close", () => {
      if (shareOpener?.isConnected) shareOpener.focus({ preventScroll:true });
    });
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    function selectSocial(event) {
      const link = event.target.closest("a[data-share-channel]");
      if (!link || event.defaultPrevented || (event.type === "auxclick" ? event.button !== 1 : event.button !== 0)) return;
      const choice = selection(link.dataset.shareChannel);
      setAnchor(link, choice.href);
      choice.record();
    }
    dialog.addEventListener("click", selectSocial);
    dialog.addEventListener("auxclick", selectSocial);
    let copyingByButton = false;
    field.addEventListener("copy", event => {
      if (copyingByButton || !event.clipboardData || field.selectionStart !== 0 || field.selectionEnd !== field.value.length) return;
      const choice = selection(field.dataset.channel);
      event.clipboardData.setData("text/plain", choice.href);
      event.preventDefault();
      choice.record();
    });
    async function copyLink(channel) {
      const choice = selection(channel);
      field.value = choice.href;
      field.dataset.channel = channel;
      let copied = false;
      try { await navigator.clipboard.writeText(choice.href); copied = true; }
      catch {
        copyingByButton = true;
        field.focus(); field.select();
        try { copied = document.execCommand("copy"); } catch {}
        finally { copyingByButton = false; }
      }
      if (copied) choice.record();
      return copied;
    }
    dialog.querySelector('[data-share-channel="copy"]').addEventListener("click", async () => {
      status.textContent = await copyLink("copy")
        ? (en ? "Link copied." : "Enlace copiado.")
        : (en ? "Select and copy the link below." : "Selecciona y copia el enlace de abajo.");
    });
    dialog.querySelector('[data-share-channel="instagram"]').addEventListener("click", async () => {
      const copying = copyLink("instagram");
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      status.textContent = await copying
        ? (en ? "Link copied. Paste it into your Instagram message or story." : "Enlace copiado. Pégalo en tu mensaje o historia de Instagram.")
        : (en ? "Copy the link below to paste into Instagram." : "Copia el enlace de abajo para pegarlo en Instagram.");
    });
    return dialog;
  }
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-public-share]");
    if (!trigger) return;
    const path = trigger.dataset.publicShare;
    if (!/^\/(?:en\/)?s\/[A-Za-z0-9_-]{12}$/.test(path || "")) return;
    event.preventDefault();
    shareOpener = trigger;
    shareLinks = null;
    const dialog = getShareDialog();
    const status = dialog.querySelector(".public-share-status");
    const signature = dialog.querySelector(".public-share-signature");
    const field = dialog.querySelector("[data-share-url]");
    const options = dialog.querySelector(".public-share-options");
    dialog.querySelector(".public-share-name").textContent = trigger.dataset.shareTitle || "Puerto Cancún Center";
    signature.open = false;
    signature.hidden = true;
    signature.querySelector("input").value = "";
    status.textContent = "";
    dialog.updateLinks();
    const request = Symbol();
    dialog.shareRequest = request;
    const tracking = window.PccPublicSharing;
    const pending = tracking?.allowed() && tracking.prepare(path);
    options.inert = field.disabled = Boolean(pending);
    if (pending) {
      dialog.setAttribute("aria-busy","true");
      status.textContent = en ? "Preparing link…" : "Preparando enlace…";
      pending.then(result => {
        if (!result?.links || !dialog.open || dialog.shareRequest !== request || !tracking.allowed()) return;
        shareLinks = result.links;
        dialog.updateLinks();
        signature.hidden = !tracking.canSign();
      }).catch(() => {}).finally(() => {
        if (dialog.shareRequest !== request) return;
        options.inert = field.disabled = false;
        dialog.removeAttribute("aria-busy");
        status.textContent = "";
      });
    } else dialog.removeAttribute("aria-busy");
    dialog.showModal();
  });
  const owner = document.querySelector("body[data-owner-contact] #ownerContactButton");
  if (owner && document.querySelector("[data-catalog-root]")) {
    const section = () => location.pathname + "|" + (new URLSearchParams(location.search).get("entity") || "");
    let previousSection = section();
    document.addEventListener("pcc:catalog:navigated", () => {
      const nextSection = section();
      if (nextSection === previousSection) return;
      previousSection = nextSection;
      for (const effect of owner.getAnimations({ subtree: true })) {
        if (effect.animationName === "pcc-owner-ring" || effect.animationName === "pcc-owner-hint") {
          effect.currentTime = 0;
          effect.play();
        }
      }
    });
  }
  const cookies = document.querySelector("#cookieBanner");
  if (owner && cookies) {
    const positionOwner = () => {
      const bounds = cookies.getBoundingClientRect();
      const offset = !cookies.hidden && bounds.height ? Math.max(0, window.innerHeight - bounds.top) : 0;
      owner.style.setProperty("--owner-cookie-offset", Math.ceil(offset) + "px");
    };
    positionOwner();
    if ("ResizeObserver" in window) new ResizeObserver(positionOwner).observe(cookies);
    new MutationObserver(positionOwner).observe(cookies, { attributes: true, attributeFilter: ["hidden"] });
    window.addEventListener("resize", positionOwner);
  }

  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  const typeGrid = document.querySelector('body[data-page="home"] .type-grid');
  if (typeGrid) {
    const markPhotoReady = image => {
      if (image.matches("img[data-home-cover]") && image.naturalWidth) image.classList.add("type-photo-ready");
    };
    typeGrid.addEventListener("load", event => markPhotoReady(event.target), true);
    typeGrid.querySelectorAll("img[data-home-cover]").forEach(markPhotoReady);
  }
  if (document.body.matches('[data-page="home"], [data-page="seo"], [data-page="property"]') && Element.prototype.animate) {
    const controls = [
      ":is(.main-header, .home-only) :is(a[href], button:enabled, summary):not(.brand)", "#ownerContactButton",
      "#siteShell :is(.primary-button, .accent-button, .outline-dark-button, .office-inquiry-button, [data-catalog-view], .catalog-entity-nav a)",
      ".contextual-inquiry :is(.inquiry-submit, .office-inquiry-button)", ".footer-section > summary",
    ].join(",");
    let activePress, pressedListing;
    function releaseListing() {
      pressedListing?.classList.remove("public-card-pressed");
      pressedListing = null;
    }
    function showPress(event) {
      if (!motion.matches) return;
      const control = event.target.closest(controls);
      if (!control) return;
      const bounds = control.getBoundingClientRect();
      const origin = event.type === "pointerdown"
        ? `${event.clientX - bounds.left}px ${event.clientY - bounds.top}px` : "50% 50%";
      const wave = document.createElement("i");
      wave.className = "home-press-wave";
      wave.setAttribute("aria-hidden", "true");
      activePress?.cancel();
      control.append(wave);
      const effect = wave.animate([
        { clipPath: `circle(7px at ${origin})`, opacity: .5 },
        { clipPath: `circle(145% at ${origin})`, opacity: 0 },
      ], { duration: 500, easing: "cubic-bezier(.18,.72,.3,1)" });
      activePress = effect;
      const finish = () => {
        wave.remove();
        if (activePress === effect) activePress = null;
      };
      effect.onfinish = finish;
      effect.oncancel = finish;
    }
    document.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0) return;
      if (event.pointerType !== "mouse" && motion.matches) {
        releaseListing();
        pressedListing = event.target.closest(".seo-property-card");
        pressedListing?.classList.add("public-card-pressed");
      }
      showPress(event);
    }, { passive: true });
    document.addEventListener("pointerup", event => { if (event.isPrimary) releaseListing(); }, { passive: true });
    document.addEventListener("pointercancel", event => {
      if (!event.isPrimary) return;
      releaseListing();
      activePress?.cancel();
    });
    window.addEventListener("blur", releaseListing);
    motion.addEventListener("change", releaseListing);
    document.addEventListener("click", event => { if (event.detail === 0) showPress(event); }, true);
  }
  if ("IntersectionObserver" in window && document.body.matches('[data-page="home"], [data-page="seo"], [data-page="property"]')) {
    const main = document.querySelector("#siteShell main");
    if (!main) return;
    const header = document.getElementById("mainHeader");
    const hero = document.body.dataset.page === "home" ? main.querySelector(".hero") : null;
    const targets = hero
      ? ".hero-content, .contact-strip, .zones-band .section-heading, .zone-card, .type-section .center-heading, .type-tile, .presale-feature, .team-statement, .trust-signal-grid article, .sell-cta .content-wrap"
      : ".seo-property-card, .exploration-area, .exploration-featured-card, .property-gallery-column, .property-description-section .section-heading, .property-amenities, .seller-entry-options article, .seller-entry-choice-grid article";
    const mobilePhotos = matchMedia("(max-width: 700px), (max-width: 1000px) and (pointer: coarse)");
    const photoFrames = ".zone-card, .type-tile, .presale-photo, .seo-property-image:has(> img), .property-gallery-stage, .catalog-project-cover, .catalog-project-gallery figure";
    const visibleListings = new Set();
    const visiblePhotos = new Set();
    const exitedAbove = new WeakMap();
    const responseDistance = 100; // CSS pixels around the center where a finger drag is most visible.
    let observer, headerInset, lastY = window.scrollY, movingUp = false;
    let heroVisible = false, watchingScroll = false, frame = 0;
    const fraction = value => Math.max(0, Math.min(1, value)).toFixed(4);
    function paintScroll() {
      frame = 0;
      const coast = heroVisible ? hero.getBoundingClientRect() : null;
      const height = window.innerHeight;
      const travel = Math.max(1, height - headerInset);
      const center = headerInset + travel / 2;
      // Read the visible geometry together before writing any styles.
      const positions = Array.from(visibleListings, card => [card, fraction((height - card.getBoundingClientRect().top) / travel)]);
      const photos = Array.from(visiblePhotos, frame => {
        const rect = frame.getBoundingClientRect();
        const distance = center - (rect.top + rect.height / 2);
        // Use the full safe inset between entry and exit, easing towards either edge.
        const edge = (travel + rect.height) / 2;
        const phase = Math.atan(distance / responseDistance) / Math.atan(edge / responseDistance);
        return [frame, Math.max(-1, Math.min(1, phase)).toFixed(4)];
      });
      if (coast) hero.style.setProperty("--coast-scroll", fraction(-coast.top / Math.max(1, coast.height)));
      for (const [card, progress] of positions) card.style.setProperty("--photo-rule", progress);
      for (const [frame, offset] of photos) frame.style.setProperty("--photo-phase", offset);
    }
    function queuePaint() {
      if (!frame) frame = requestAnimationFrame(paintScroll);
    }
    function trackScroll() {
      const active = heroVisible || visibleListings.size > 0 || visiblePhotos.size > 0;
      if (active && !watchingScroll) window.addEventListener("scroll", queuePaint, { passive: true });
      if (!active && watchingScroll) {
        window.removeEventListener("scroll", queuePaint);
        cancelAnimationFrame(frame);
        frame = 0;
      }
      watchingScroll = active;
      if (active) queuePaint();
    }
    function reveal(entries, source) {
      if (source !== observer || !motion.matches) return;
      const y = window.scrollY;
      const scrolled = y !== lastY;
      if (scrolled) movingUp = y < lastY;
      lastY = y;
      let stagger = 0;
      for (const { target, isIntersecting, intersectionRatio, boundingClientRect, rootBounds } of entries) {
        if (target === hero) {
          heroVisible = isIntersecting;
          continue;
        }
        if (mobilePhotos.matches && target.matches(photoFrames)) {
          if (isIntersecting) visiblePhotos.add(target);
          else visiblePhotos.delete(target);
          if (!target.matches(targets)) continue;
        }
        if (target.matches(".seo-property-card")) {
          if (isIntersecting) visibleListings.add(target);
          else visibleListings.delete(target);
        }
        if (!isIntersecting) {
          if (rootBounds && boundingClientRect.height) exitedAbove.set(target, boundingClientRect.bottom <= rootBounds.top);
          target.classList.remove("public-card-arriving", "public-card-from-top");
          continue;
        }
        if (intersectionRatio < .12 || target.classList.contains("public-card-arriving")) continue;
        const fromTop = scrolled ? movingUp : exitedAbove.get(target) ?? movingUp;
        target.classList.toggle("public-card-from-top", fromTop);
        target.style.setProperty("--card-delay", Math.min(stagger++, 3) * 50 + "ms");
        target.classList.add("public-card-arriving");
      }
      trackScroll();
    }
    const measureHeader = () => Math.min(header?.offsetHeight || 0, Math.round(innerHeight / 2));
    function observeCards() {
      observer?.disconnect();
      visibleListings.clear();
      visiblePhotos.clear();
      heroVisible = false;
      trackScroll();
      headerInset = measureHeader();
      if (!motion.matches) {
        hero?.style.removeProperty("--coast-scroll");
        main.querySelectorAll(".public-card-arriving").forEach(el => el.classList.remove("public-card-arriving", "public-card-from-top"));
        return;
      }
      // Re-arm only after a full exit. An entry starts below the fixed header on the way back up.
      observer = new IntersectionObserver(reveal, { rootMargin: `-${headerInset}px 0px 0px`, threshold: [0, .12] });
      if (hero) observer.observe(hero);
      main.querySelectorAll(mobilePhotos.matches ? targets + ", " + photoFrames : targets).forEach(el => observer.observe(el));
    }
    const resized = () => {
      if (headerInset !== measureHeader()) observeCards();
      else if (watchingScroll) queuePaint();
    };
    if ("ResizeObserver" in window) {
      const resize = new ResizeObserver(resized);
      if (header) resize.observe(header);
      if (hero) resize.observe(hero);
    }
    window.addEventListener("resize", resized);
    observeCards();
    motion.addEventListener("change", observeCards);
    mobilePhotos.addEventListener("change", observeCards);
    document.addEventListener("pcc:catalog:navigated", observeCards);
  }
})();
