const crypto = require("crypto");
const { isIP } = require("node:net");
const { publicIp, lookupIp } = require("./ip-geography");

const TRACKING_ID_PATTERN = /^[A-Za-z0-9._:-]{12,120}$/;

function cleanText(value, maxLength = 160) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeTrackingId(value) {
  const candidate = cleanText(value, 120);
  return TRACKING_ID_PATTERN.test(candidate) ? candidate : "";
}

function hashTrackingId(value, secret) {
  const normalized = normalizeTrackingId(value);
  if (!normalized) return "";
  return crypto.createHmac("sha256", String(secret || "visitor-analytics"))
    .update(normalized)
    .digest("hex");
}

function normalizeClientIp(value) {
  let candidate = String(value || "").split(",")[0].trim().toLowerCase();
  if (candidate.startsWith("::ffff:")) candidate = candidate.slice(7);
  if (!isIP(candidate)) return "";
  return candidate;
}

function decodeHeader(value, maxLength = 160) {
  const candidate = cleanText(value, maxLength);
  if (!candidate) return "";
  try {
    return cleanText(decodeURIComponent(candidate), maxLength);
  } catch {
    return candidate;
  }
}

function headerValue(req, names, maxLength = 160) {
  for (const name of names) {
    const value = decodeHeader(req.get(name), maxLength);
    if (value) return value;
  }
  return "";
}

function countryNameFromCode(code) {
  const normalized = cleanText(code, 8).toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "";
  try {
    return new Intl.DisplayNames(["es"], { type: "region" }).of(normalized) || normalized;
  } catch {
    return normalized;
  }
}

function locationFromRequest(req) {
  let ipAddress = normalizeClientIp(req.ip || req.socket?.remoteAddress);
  // Walk back through private ingress hops only when the socket is also behind that ingress.
  const socketIp = normalizeClientIp(req.socket?.remoteAddress);
  if (socketIp && !publicIp(socketIp) && !publicIp(ipAddress)) {
    const chain = String(req.get("x-forwarded-for") || "").split(",").slice(-12).reverse();
    const nearestPublic = chain.map(normalizeClientIp).find(publicIp);
    if (nearestPublic) ipAddress = nearestPublic;
  }
  const headerCode = headerValue(req, ["cf-ipcountry", "x-vercel-ip-country", "x-country-code", "x-appengine-country"], 8).toUpperCase();
  const local = lookupIp(ipAddress);
  const countryCode = /^[A-Z]{2}$/.test(headerCode) && !["XX","ZZ"].includes(headerCode) ? headerCode : local?.countryCode || "";
  const compatible = countryCode === local?.countryCode ? local : null;
  return {
    ipAddress, countryCode,
    countryName: headerValue(req, ["x-geo-country", "x-country-name"], 100) || countryNameFromCode(countryCode),
    region: headerValue(req, ["x-vercel-ip-country-region", "cf-region", "x-geo-region", "x-appengine-region"], 120) || compatible?.region || "",
    city: headerValue(req, ["x-vercel-ip-city", "cf-ipcity", "x-geo-city", "x-appengine-city"], 120) || compatible?.city || "",
  };
}

function parseUserAgent(value) {
  const userAgent = cleanText(value, 500);
  const lower = userAgent.toLowerCase();
  const isBot = /bot|crawler|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp/i.test(userAgent);
  const deviceType = isBot
    ? "bot"
    : /ipad|tablet|kindle|silk/i.test(userAgent)
      ? "tablet"
      : /mobile|iphone|ipod|android/i.test(userAgent)
        ? "mobile"
        : "desktop";
  const browserName = /edg\//i.test(userAgent)
    ? "Edge"
    : /opr\//i.test(userAgent)
      ? "Opera"
      : /samsungbrowser/i.test(userAgent)
        ? "Samsung Internet"
        : /firefox|fxios/i.test(userAgent)
          ? "Firefox"
          : /chrome|crios/i.test(userAgent)
            ? "Chrome"
            : /safari/i.test(userAgent)
              ? "Safari"
              : "Otro";
  const operatingSystem = /windows/i.test(userAgent)
    ? "Windows"
    : /iphone|ipad|ipod/i.test(userAgent)
      ? "iOS"
      : /android/i.test(userAgent)
        ? "Android"
        : /mac os|macintosh/i.test(userAgent)
          ? "macOS"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "Otro";
  return { userAgent, isBot, deviceType, browserName, operatingSystem, lower };
}

function sanitizePath(value) {
  const path = cleanText(value, 300);
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

function sanitizeVisitorPayload(body = {}) {
  const viewportWidth = Math.max(0, Math.min(10000, Number(body.viewportWidth) || 0));
  const viewportHeight = Math.max(0, Math.min(10000, Number(body.viewportHeight) || 0));
  return {
    visitorId: normalizeTrackingId(body.visitorId),
    sessionId: normalizeTrackingId(body.sessionId),
    pageViewId: normalizeTrackingId(body.pageViewId),
    path: sanitizePath(body.path),
    title: cleanText(body.title, 240),
    referrer: cleanText(body.referrer, 500),
    language: cleanText(body.language, 16),
    timezone: cleanText(body.timezone, 80),
    utmSource: cleanText(body.utmSource, 120),
    utmMedium: cleanText(body.utmMedium, 120),
    utmCampaign: cleanText(body.utmCampaign, 160),
    viewportWidth,
    viewportHeight,
  };
}

function periodToDays(value) {
  if (String(value) === "all") return null;
  const days = Number(value);
  return [1, 7, 30, 90].includes(days) ? days : 30;
}

module.exports = {
  cleanText,
  hashTrackingId,
  locationFromRequest,
  normalizeClientIp,
  normalizeTrackingId,
  parseUserAgent,
  periodToDays,
  sanitizeVisitorPayload,
};
