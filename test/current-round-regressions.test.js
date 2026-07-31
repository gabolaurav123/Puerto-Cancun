const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("el registro confirma la cuenta antes de intentar el correo", () => {
  const server = read("server.js");
  const registerStart = server.indexOf('app.post("/api/auth/register"');
  const registerEnd = server.indexOf('app.get("/api/auth/verify-email"', registerStart);
  const route = server.slice(registerStart, registerEnd);
  assert.ok(registerStart > 0 && registerEnd > registerStart);
  assert.ok(route.indexOf('await client.query("COMMIT")') < route.indexOf("sendTransactionalEmail"));
  assert.match(route, /transactionalEmailConfigured/);
  assert.match(route, /emailDeliveryPending/);
});

test("el acceso de vendedor establece una sesion real", () => {
  const server = read("server.js");
  assert.match(server, /await establishAuthenticatedSession\(req, user\)/);
  assert.match(server, /user: publicUser\(user\)/);
});

test("el alta recopila prefijo internacional sin confundirlo con el telefono", () => {
  const html = read("index.html");
  const app = read("app.js");
  assert.match(html, /name="countryCode"/);
  assert.match(html, /value="\+52"/);
  assert.match(app, /form\.countryCode\.value.*form\.phone\.value/s);
});

test("los buscadores de mailing y PDF filtran durante input", () => {
  const app = read("app.js");
  const html = read("index.html");
  assert.match(app, /searchInput\.oninput = \(\) =>/);
  assert.match(app, /renderMatches\(\)/);
  assert.match(html, /id="campaignPropertyMatches"/);
  assert.match(html, /id="pdfPropertyMatches"/);
});

test("contactos se pueden retirar sin eliminar una cuenta registrada", () => {
  const server = read("server.js");
  const app = read("app.js");
  assert.match(server, /app\.delete\("\/api\/admin\/contacts\/:id"/);
  assert.match(server, /existing\.rows\[0\]\.source === "registered_account"/);
  assert.match(server, /SET status = 'archived'/);
  assert.match(app, /async function deleteContact/);
});

test("las propiedades se vinculan a desarrollos independientes", () => {
  const server = read("server.js");
  const html = read("index.html");
  assert.match(server, /parent_development_id/);
  assert.match(server, /properties_parent_development_fk/);
  assert.match(server, /developmentImages/);
  assert.match(html, /name="developmentId"/);
  assert.match(html, /data-property-development-link/);
});

test("la ficha neutra elimina toda referencia a la marca", () => {
  const pdf = read("pdf-property-sheet.js");
  assert.match(pdf, /function stripBrand/);
  assert.match(pdf, /function neutralizeProperty/);
  assert.match(pdf, /branded \? property : neutralizeProperty\(property\)/);
});

test("el CRM persiste recordatorios y los convierte en notificaciones", () => {
  const server = read("server.js");
  const html = read("index.html");
  assert.match(server, /reminder_at TIMESTAMPTZ/);
  assert.match(server, /'task-reminder-' \|\| id/);
  assert.match(html, /name="reminderAt" type="datetime-local"/);
  assert.match(html, /name="reminderChannel"/);
});

test("la IA usa un modelo economico configurable", () => {
  const env = read(".env.example");
  const server = read("server.js");
  assert.match(env, /OPENAI_MODEL=gpt-5-mini/);
  assert.match(server, /process\.env\.OPENAI_MODEL \|\| "gpt-5-mini"/);
});
