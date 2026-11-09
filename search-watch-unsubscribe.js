document.querySelector("form[data-unsubscribe]")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.target, button = form.querySelector("button"), status = document.querySelector("[role=status]");
  button.disabled = true;
  try {
    const auth = await fetch("/api/session", { cache: "no-store" }).then(r => r.json());
    const result = await fetch("/api/search-watch/unsubscribe", { method:"POST", headers:{"Content-Type":"application/json","X-CSRF-Token":auth.csrfToken},body:JSON.stringify(Object.fromEntries(new FormData(form))) });
    if (!result.ok) throw Error("No se pudo cancelar. Intenta de nuevo. / Please try again.");
    status.textContent = await result.text(); form.hidden = true;
  } catch(error) { status.textContent=error.message;button.disabled=false; }
});
