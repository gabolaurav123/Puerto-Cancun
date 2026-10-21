const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { adminUsernameMatches } = require("../server");
const { passwordPolicyError, accountSession, internalRoleAllows } = require("../auth-utils");

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

test("las contraseñas admiten 6 caracteres sin combinaciones obligatorias", () => {
  const html = read("index.html");
  for (const value of ["123456", "abcdef", "!!!!!!", "hola mundo", "áéíóúñ"]) assert.equal(passwordPolicyError(value), "");
  for (const value of ["", "12345", "a".repeat(73), "é".repeat(37)]) assert.ok(passwordPolicyError(value));
  assert.match(html, /id="registerForm"[\s\S]*?minlength="6"/);
  assert.match(html, /id="passwordUpdateForm"[\s\S]*?name="currentPassword"[\s\S]*?name="newPassword"[\s\S]*?minlength="6"/);
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

test("no se obliga a cambiar una contraseña válida al iniciar sesión", () => {
  const app = read("app.js");
  assert.equal(accountSession({ id: "seller-test", first_name: "Prueba", last_name: "", email: "test@example.test" }, "registered").mustUpdatePassword, false);
  assert.doesNotMatch(app, /if \(data\.user\.mustUpdatePassword\)/);
  assert.match(app, /passwordUpdateSubmit/);
});

test("los roles limitan rutas y no elevan privilegios mediante permisos libres", () => {
  const permits = (role, method, route, permissions = []) => internalRoleAllows({ method, originalUrl: route }, { id: "staff-test", internalRole: role, permissions });
  assert.equal(permits("editor", "POST", "/api/admin/ai/improve-description"), true);
  assert.equal(permits("editor", "PUT", "/api/admin/listing-drafts/new-properties"), true);
  assert.equal(permits("viewer", "PATCH", "/api/admin/properties/test/status"), false);
  assert.equal(permits("advisor", "GET", "/api/admin/users", ["users:write"]), false);
  assert.equal(permits("editor", "PATCH", "/api/admin/settings/site", ["settings:write"]), false);
  assert.equal(permits("administrator", "PATCH", "/api/admin/users/test"), true);
  assert.equal(permits("editor", "POST", "/api/admin/properties-evil"), false);
});
