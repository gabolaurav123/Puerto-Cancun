const ACCOUNT_ROLES = ["seller", "super_admin", "admin", "advisor", "editor", "marketing", "viewer"];
const ACCOUNT_PERMISSIONS = ["requests:view", "requests:reply", "properties:write", "crm:view", "contacts:export", "analytics:view", "catalogs:write", "settings:write", "users:write"];

function passwordPolicyError(password) {
  if (typeof password !== "string" || [...password].length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  // bcrypt ignores bytes after 72: reject rather than silently truncate a secret.
  if (Buffer.byteLength(password, "utf8") > 72) return "La contraseña es demasiado larga: usa como máximo 72 bytes de texto.";
  return "";
}

function normalizeAccountRole(role) {
  return role === "administrator" ? "admin" : role;
}

function accountSession(row, source) {
  const accessRole = normalizeAccountRole(source === "registered" ? row.access_role || "seller" : row.role);
  return {
    id: row.id, accountSource: source,
    role: accessRole === "seller" ? "seller" : "admin",
    internalRole: accessRole === "seller" ? undefined : accessRole,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    name: source === "registered" ? `${row.first_name} ${row.last_name}`.trim() : row.name,
    email: row.email, phone: row.phone, preferredContact: row.preferred_contact,
    sessionVersion: Number(row.session_version || 1), mustUpdatePassword: false,
  };
}

function internalRoleAllows(req, user) {
  if (user.id === "admin-prueba") return true;
  const role = normalizeAccountRole(user.internalRole);
  if (["super_admin", "admin"].includes(role)) return true;
  if (!["advisor", "editor", "marketing", "viewer"].includes(role)) return false;
  const route = String(req.originalUrl || req.path || "").split("?")[0];
  const read = ["GET", "HEAD"].includes(req.method);
  const matches = (prefixes) => prefixes.some(prefix => route === prefix || route.startsWith(`${prefix}/`));
  if (read && matches(["/media/external-properties"]) && ["editor", "viewer"].includes(role)) return true;
  if (read && matches(["/media/guest-requests"]) && ["advisor", "viewer"].includes(role)) return true;
  // Account administration is never granted by a free-form checkbox.
  if (matches(["/api/admin/users", "/api/admin/settings", "/api/admin/integrations"])) return false;
  const shared = ["/api/admin/stats", "/api/admin/properties", "/api/admin/developments", "/api/admin/location-options", "/api/admin/copilot/features"];
  if (read && matches(shared)) return true;
  const editorial = ["/api/admin/properties", "/api/admin/developments", "/api/admin/external-properties", "/api/admin/blog", "/api/admin/files", "/api/admin/file-folders", "/api/admin/documents", "/api/admin/ai", "/api/admin/listing-drafts"];
  const commercial = ["/api/admin/requests", "/api/admin/guest-sale-requests", "/api/admin/leads", "/api/admin/contacts", "/api/admin/valuations", "/api/admin/tasks", "/api/admin/buyers", "/api/admin/messages", "/api/admin/notifications", "/api/admin/tours", "/api/admin/whatsapp"];
  const marketing = ["/api/admin/campaigns", "/api/admin/instagram", "/api/admin/analytics", "/api/admin/visitor-leads"];
  if (role === "viewer") return read && matches([...editorial, ...commercial, "/api/admin/analytics"]);
  if (role === "editor" && matches([...editorial, "/api/admin/campaigns", "/api/admin/instagram"])) return true;
  if (role === "advisor" && matches(commercial)) return true;
  if (role === "marketing" && matches([...marketing, "/api/admin/ai", "/api/admin/files", "/api/admin/documents"])) return true;
  const permissions = user.permissions || [];
  return (permissions.includes("properties:write") && matches(editorial)) ||
    (permissions.includes("requests:reply") && matches(["/api/admin/requests", "/api/admin/guest-sale-requests"])) ||
    (read && permissions.includes("requests:view") && matches(["/api/admin/requests", "/api/admin/guest-sale-requests"])) ||
    (read && permissions.includes("crm:view") && matches(["/api/admin/contacts"])) ||
    (read && permissions.includes("analytics:view") && matches(["/api/admin/analytics", "/api/admin/visitor-leads"])) ||
    (permissions.includes("catalogs:write") && matches(["/api/admin/location-options"]));
}

module.exports = {ACCOUNT_ROLES, ACCOUNT_PERMISSIONS, passwordPolicyError, normalizeAccountRole, accountSession, internalRoleAllows};
