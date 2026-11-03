const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const functionSource = (name) => source.match(new RegExp(`^function ${name}\\([^]*?^}`, "m"))[0];
function panel(overrides = {}) {
  const state = { ...overrides };
  const view = { innerHTML: "" };
  const context = vm.createContext({
    state, $: () => view, $$: () => [], t: key => key, escapeHtml: String, formatDate: String,
    refreshIcons() {}, renderAdminLeads() {}, setAdminSection(section) { state.adminSection = section; },
  });
  vm.runInContext(["renderAdminTasks", "openAdminMetric", "leadCategory"].map(functionSource).join("\n"), context);
  return { state, view, ...context };
}

test("abrir asesorías nuevas desde Inicio descarta el filtro de una consulta anterior", () => {
  const ctx = panel({ leadFilter: "ai_validation", adminLeadStatusFilter: "closed", adminLeadPriorityFilter: "premium" });
  ctx.openAdminMetric("new-leads");
  assert.equal(ctx.state.adminSection, "leads");
  assert.equal(ctx.state.leadFilter, "all");
  assert.equal(ctx.state.adminLeadPriorityFilter, "all");
  assert.equal(ctx.state.adminLeadStatusFilter, "new");
  assert.equal(ctx.leadCategory("validar-precio"), "ai_validation");
  assert.equal(ctx.leadCategory("valuation"), "valuation");
  assert.equal(ctx.leadCategory("ayuda-guia"), "whatsapp_help");
});

test("los indicadores de tareas muestran los registros abiertos y vencidos correspondientes", () => {
  const ctx = panel({ taskFilter: "completed", tasks: [
    { id: "1", title: "Futura", status: "pending", dueDate: "2099-10-01" },
    { id: "2", title: "Atrasada", status: "in_progress", dueDate: "2001-10-01" },
    { id: "3", title: "Terminada", status: "completed", dueDate: "2001-10-01" },
  ] });
  ctx.openAdminMetric("tasks");
  assert.equal(ctx.state.adminSection, "tasks");
  assert.match(ctx.view.innerHTML, /Futura/);
  assert.match(ctx.view.innerHTML, /Atrasada/);
  assert.doesNotMatch(ctx.view.innerHTML, /Terminada/);
  ctx.openAdminMetric("overdue-tasks");
  assert.match(ctx.view.innerHTML, /Atrasada/);
  assert.doesNotMatch(ctx.view.innerHTML, /Terminada|Futura/);
});
