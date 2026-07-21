const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("todos los campos de contraseña reciben un control para mostrar u ocultar", () => {
  const app = read("app.js");
  const styles = read("styles.css");
  assert.match(app, /function installPasswordVisibilityToggles/);
  assert.match(app, /input\[type="password"\]/);
  assert.match(app, /input\.type === "password" \? "text" : "password"/);
  assert.match(app, /data-lucide="\$\{visible \? "eye-off" : "eye"\}"/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /showPassword/);
  assert.match(app, /hidePassword/);
  assert.match(styles, /\.password-visibility-button/);
});
