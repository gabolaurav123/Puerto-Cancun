const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { validateRuntimeConfig } = require("../platform-utils");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("producción exige secretos de sesión y WhatsApp independientes", () => {
  const valid = validateRuntimeConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://example",
    SESSION_SECRET: "D9@secure-session-value-2026-random-A",
    WHATSAPP_AUTH_SECRET: "Q7@independent-whatsapp-value-2026-B",
    ADMIN_USER: "admin",
    ADMIN_PASSWORD: "Strong-Admin-Password-2026!",
  });
  assert.deepEqual(valid.errors, []);

  const invalid = validateRuntimeConfig({
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://example",
    SESSION_SECRET: "puerto-cancun-session-secret-cambialo",
    WHATSAPP_AUTH_SECRET: "puerto-cancun-session-secret-cambialo",
    ADMIN_USER: "admin",
    ADMIN_PASSWORD: "puertocancun",
  });
  assert.ok(invalid.errors.some((message) => message.includes("SESSION_SECRET")));
  assert.ok(invalid.errors.some((message) => message.includes("WHATSAPP_AUTH_SECRET")));
  assert.ok(invalid.warnings.some((message) => message.includes("ADMIN_PASSWORD")));
});

test("las cabeceras impiden framing y restringen recursos entre sitios", () => {
  const source = read("platform-utils.js");
  assert.match(source, /"X-Frame-Options": "DENY"/);
  assert.match(source, /"Cross-Origin-Resource-Policy": "same-site"/);
  assert.match(source, /"frame-ancestors 'none'"/);
  assert.match(source, /"media-src 'self' blob: data:"/);
});

test("archivos, credenciales y APIs privadas tienen defensas adicionales", () => {
  const server = read("server.js");
  const html = read("index.html");
  assert.match(server, /activePdfContent/);
  assert.match(server, /OpenAction\|AA\|RichMedia\|FileAttachment\|SubmitForm/);
  assert.match(server, /constantTimeCredentialEqual\(password, adminPassword\)/);
  assert.match(server, /Cache-Control", "private, no-store, max-age=0/);
  assert.match(server, /app\.use\("\/api\/admin\/ai", createRateLimiter/);
  assert.match(server, /Content-Security-Policy", "sandbox; default-src 'none'/);
  assert.match(html, /lucide@1\.46\.0\/dist\/umd\/lucide\.min\.js/);
  assert.match(html, /integrity="sha384-[^"]+" crossorigin="anonymous"/);
});
