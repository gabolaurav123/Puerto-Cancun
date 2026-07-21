const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { adminUsernameMatches } = require("../server");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("el administrador acepta variantes equivalentes sin relajar correos", () => {
  assert.equal(adminUsernameMatches("adminprueba", "admin prueba"), true);
  assert.equal(adminUsernameMatches("ADMIN-PRUEBA", "admin prueba"), true);
  assert.equal(adminUsernameMatches("admin_prueba", "admin prueba"), true);
  assert.equal(adminUsernameMatches("otro-admin", "admin prueba"), false);
  assert.equal(adminUsernameMatches("admin@example.com", "admin@example.com"), true);
  assert.equal(adminUsernameMatches("adminexamplecom", "admin@example.com"), false);
});

test("registro y actualización exigen al menos 12 caracteres", () => {
  const server = read("server.js");
  const html = read("index.html");
  assert.match(server, /password\.length < 12/);
  assert.match(server, /newPassword\.length < 12/);
  assert.match(html, /id="registerForm"[\s\S]*?minlength="12"/);
  assert.match(html, /id="passwordUpdateForm"[\s\S]*?name="currentPassword"[\s\S]*?name="newPassword"[\s\S]*?minlength="12"/);
});

test("una contraseña existente solo cambia después de verificar la actual", () => {
  const server = read("server.js");
  const route = server.match(/app\.post\("\/api\/auth\/update-password"[\s\S]*?\n\}\);/);
  assert.ok(route, "debe existir la actualización segura de contraseña");
  assert.match(route[0], /bcrypt\.compare\(currentPassword/);
  assert.match(route[0], /bcrypt\.hash\(newPassword/);
  assert.match(route[0], /ADMIN_PASSWORD_ENV_MANAGED/);
  assert.doesNotMatch(route[0], /INSERT INTO seller_accounts/);
});

test("las cuentas anteriores reciben una actualización guiada", () => {
  const server = read("server.js");
  const app = read("app.js");
  assert.match(server, /mustUpdatePassword: password\.length < 12/);
  assert.match(app, /data\.user\.mustUpdatePassword/);
  assert.match(app, /passwordUpgradeRequired/);
  assert.match(app, /passwordUpdateSubmit/);
});
