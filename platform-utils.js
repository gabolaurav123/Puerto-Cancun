const crypto = require("crypto");

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function resolveReleaseInfo(env = process.env, packageVersion = "0.0.0") {
  const rawRelease =
    env.RELEASE_SHA ||
    env.GIT_COMMIT_SHA ||
    env.SEENODE_GIT_COMMIT ||
    env.SOURCE_COMMIT ||
    env.RENDER_GIT_COMMIT ||
    "development";
  const release = String(rawRelease).trim() || "development";
  return {
    version: String(env.APP_VERSION || packageVersion).trim() || packageVersion,
    release,
    shortRelease: release === "development" ? "development" : release.slice(0, 12),
    environment: String(env.NODE_ENV || "development"),
  };
}

function validateRuntimeConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const errors = [];
  const warnings = [];
  const sessionSecret = String(env.SESSION_SECRET || "");
  if (!env.DATABASE_URL) warnings.push("DATABASE_URL no está configurada; el portal no podrá consultar datos.");
  if (production && (sessionSecret.length < 32 || sessionSecret.includes("change-me") || sessionSecret === "dev-session-secret-change-me")) {
    errors.push("SESSION_SECRET debe contener al menos 32 caracteres aleatorios en producción.");
  }
  if (production && env.ADMIN_USER && !env.ADMIN_PASSWORD) {
    errors.push("ADMIN_PASSWORD es obligatoria cuando ADMIN_USER está configurado en producción.");
  }
  if (production && env.ADMIN_PASSWORD && String(env.ADMIN_PASSWORD).length < 12) {
    errors.push("ADMIN_PASSWORD debe contener al menos 12 caracteres en producción.");
  }
  if (!env.WHATSAPP_AUTH_SECRET) warnings.push("WHATSAPP_AUTH_SECRET no está configurada; se usará SESSION_SECRET como respaldo.");
  return { errors, warnings };
}

function requestContext(releaseInfo) {
  return (req, res, next) => {
    const requestId = String(req.get("X-Request-Id") || crypto.randomUUID()).slice(0, 120);
    req.requestId = requestId;
    res.locals.requestId = requestId;
    res.set("X-Request-Id", requestId);
    res.set("X-App-Version", releaseInfo.version);
    res.set("X-App-Release", releaseInfo.shortRelease);
    next();
  };
}

function securityHeaders() {
  return (req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Origin-Agent-Cluster": "?1",
    });
    if (req.secure) res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  };
}

function sameOriginMutationGuard() {
  return (req, res, next) => {
    if (!MUTATING_METHODS.has(req.method)) return next();
    const fetchSite = String(req.get("Sec-Fetch-Site") || "").toLowerCase();
    if (fetchSite === "cross-site") {
      res.status(403).json({ error: "Solicitud bloqueada por protección de origen.", requestId: req.requestId });
      return;
    }
    const origin = req.get("Origin");
    if (origin) {
      try {
        const expectedHost = String(req.get("X-Forwarded-Host") || req.get("Host") || "").split(",")[0].trim();
        if (new URL(origin).host !== expectedHost) {
          res.status(403).json({ error: "Origen no permitido.", requestId: req.requestId });
          return;
        }
      } catch {
        res.status(403).json({ error: "Origen no válido.", requestId: req.requestId });
        return;
      }
    }
    next();
  };
}

function createRateLimiter({ windowMs, max, message = "Demasiadas solicitudes. Intenta nuevamente más tarde.", keyGenerator } = {}) {
  const hits = new Map();
  const duration = Math.max(1000, Number(windowMs || 60000));
  const limit = Math.max(1, Number(max || 60));
  return (req, res, next) => {
    const now = Date.now();
    const key = String(keyGenerator ? keyGenerator(req) : req.ip || req.socket?.remoteAddress || "unknown");
    const current = hits.get(key);
    const entry = !current || current.resetAt <= now ? { count: 0, resetAt: now + duration } : current;
    entry.count += 1;
    hits.set(key, entry);
    res.set("RateLimit-Limit", String(limit));
    res.set("RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
    res.set("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > limit) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      res.status(429).json({ error: message, requestId: req.requestId });
      return;
    }
    if (hits.size > 5000) {
      for (const [storedKey, stored] of hits) if (stored.resetAt <= now) hits.delete(storedKey);
    }
    next();
  };
}

function inferAuditTarget(originalUrl = "") {
  const parts = String(originalUrl).split("?")[0].split("/").filter(Boolean);
  const adminIndex = parts.indexOf("admin");
  const entityType = parts[adminIndex + 1] || "administration";
  const entityId = parts[adminIndex + 2] && !["generate", "connect", "overview"].includes(parts[adminIndex + 2])
    ? parts[adminIndex + 2]
    : "collection";
  return { entityType, entityId };
}

function isValidEmail(value) {
  const email = String(value || "").trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : "";
}

module.exports = {
  MUTATING_METHODS,
  createRateLimiter,
  inferAuditTarget,
  isValidEmail,
  normalizePhone,
  requestContext,
  resolveReleaseInfo,
  sameOriginMutationGuard,
  securityHeaders,
  validateRuntimeConfig,
};
