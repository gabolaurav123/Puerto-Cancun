require("dotenv").config();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const {
  DEFAULT_SITE_URL,
  absoluteUrl,
  aiSummary,
  escapeHtml,
  getPageByPath,
  llmsTxt,
  renderSeoHead,
  renderSeoPage,
  robotsTxt,
  sitemapXml,
} = require("./seo-pages");

const app = express();
const port = Number(process.env.PORT || 3000);
const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
const indexPath = path.join(__dirname, "index.html");
const publicStaticFiles = new Set(["/app.js", "/styles.css", "/og-puerto-cancun-center.svg", "/favicon.svg"]);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Copy .env.example to .env and configure your Neon PostgreSQL URL.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

const IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
const IMAGE_MAX_COUNT = 8;
const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const adminUser = (process.env.ADMIN_USER || "admin prueba").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "";
const googleClientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
const googleMapsApiKey = (process.env.GOOGLE_MAPS_API_KEY || "").trim();

const adminPrompts = [
  {
    id: "price-review",
    title: "Valorar precio inicial",
    body:
      "Actua como analista inmobiliario de Puerto Cancun Center. Revisa esta propiedad en Cancun: [zona], [tipo], [m2], [recamaras], [banos], [amenidades], [estado]. Indica factores que pueden subir o bajar el precio y que datos necesita validar el asesor antes de publicar.",
  },
  {
    id: "listing-copy",
    title: "Redactar publicacion",
    body:
      "Actua como redactor inmobiliario de Puerto Cancun Center. Crea una descripcion profesional para vender esta propiedad: [datos]. Destaca estilo de vida, zona, amenidades, diferenciadores y cierre para agendar contacto con un asesor.",
  },
  {
    id: "buyer-reply",
    title: "Responder a comprador",
    body:
      "Actua como asesor inmobiliario en Cancun. El comprador busca [tipo] en [zona] con presupuesto [presupuesto]. Prepara una respuesta breve que lo invite a revisar opciones dentro de Puerto Cancun Center y a compartir datos de contacto.",
  },
];

const seedProperties = [
  {
    id: "prop-1696",
    titleEs: "Isla Mujeres, Punta Sam / Playa Mujeres",
    titleEn: "Isla Mujeres, Punta Sam / Playa Mujeres",
    type: "Comercial",
    zone: "Punta Sam / Playa Mujeres",
    operation: "sale",
    priceUsd: 30000000,
    beds: 70,
    baths: 0,
    area: 519,
    lot: 3061,
    mls: "1696",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=82",
    featured: true,
    badges: ["new", "reduced"],
    createdAt: "2026-06-16T12:00:00.000Z",
    descriptionEs: "Hotel boutique y terreno comercial con vista al Caribe, ideal para inversion patrimonial.",
    descriptionEn: "Boutique hotel and commercial land with Caribbean views, ideal for a legacy investment.",
  },
  {
    id: "prop-1678",
    titleEs: "Las Quintas, Cancun Zona Hotelera",
    titleEn: "Las Quintas, Cancun Hotel Zone",
    type: "Casa",
    zone: "Zona Hotelera",
    operation: "sale",
    priceUsd: 13142900,
    beds: 6,
    baths: 8,
    area: 1600,
    lot: 2997,
    mls: "1678",
    image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=82",
    featured: true,
    badges: ["new"],
    createdAt: "2026-06-12T12:00:00.000Z",
    descriptionEs: "Residencia frente al agua con jardines, privacidad y acceso rapido a la Zona Hotelera.",
    descriptionEn: "Waterfront residence with gardens, privacy, and quick access to the Hotel Zone.",
  },
  {
    id: "prop-1583",
    titleEs: "SLS Harbour Beach, Puerto Cancun",
    titleEn: "SLS Harbour Beach, Puerto Cancun",
    type: "Departamento",
    zone: "Puerto Cancun",
    operation: "sale",
    priceUsd: 12900000,
    beds: 5,
    baths: 6,
    area: 1200,
    lot: 0,
    mls: "1583",
    image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=82",
    featured: true,
    badges: [],
    createdAt: "2026-05-29T12:00:00.000Z",
    descriptionEs: "Departamento de coleccion con terraza panoramica, acabados premium y marina cercana.",
    descriptionEn: "Collector-grade condo with panoramic terrace, premium finishes, and nearby marina.",
  },
  {
    id: "prop-1640",
    titleEs: "Los Canales, Puerto Cancun",
    titleEn: "Los Canales, Puerto Cancun",
    type: "Terreno",
    zone: "Puerto Cancun",
    operation: "sale",
    priceUsd: 12345600,
    beds: 0,
    baths: 0,
    area: 0,
    lot: 3858,
    mls: "1640",
    image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=82",
    featured: true,
    badges: ["new"],
    createdAt: "2026-06-05T12:00:00.000Z",
    descriptionEs: "Terreno residencial sobre canal para proyecto arquitectonico a la medida.",
    descriptionEn: "Residential canal-front land for a custom architectural project.",
  },
  {
    id: "prop-1788",
    titleEs: "Villa Marina, Los Canales, Puerto Cancun",
    titleEn: "Villa Marina, Los Canales, Puerto Cancun",
    type: "Casa",
    zone: "Puerto Cancun",
    operation: "sale",
    priceUsd: 9500000,
    beds: 4,
    baths: 4,
    area: 1056,
    lot: 1231,
    mls: "1788",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=82",
    featured: true,
    badges: [],
    createdAt: "2026-04-28T12:00:00.000Z",
    descriptionEs: "Casa contemporanea con alberca, muelle privado y distribucion familiar.",
    descriptionEn: "Contemporary home with pool, private dock, and family-focused layout.",
  },
  {
    id: "prop-1716",
    titleEs: "Kaana, Cancun Zona Hotelera",
    titleEn: "Kaana, Cancun Hotel Zone",
    type: "Departamento",
    zone: "Zona Hotelera",
    operation: "sale",
    priceUsd: 9500000,
    beds: 6,
    baths: 6,
    area: 925,
    lot: 0,
    mls: "1716",
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=82",
    featured: false,
    badges: ["new"],
    createdAt: "2026-06-20T12:00:00.000Z",
    descriptionEs: "Penthouse frente al mar con terrazas amplias, servicio completo y acceso a amenidades.",
    descriptionEn: "Oceanfront penthouse with expansive terraces, full service, and amenity access.",
  },
  {
    id: "prop-1832",
    titleEs: "Residencia Nido, Puerto Cancun",
    titleEn: "Nido Residence, Puerto Cancun",
    type: "Casa",
    zone: "Puerto Cancun",
    operation: "sale",
    priceUsd: 4280000,
    beds: 5,
    baths: 5,
    area: 690,
    lot: 810,
    mls: "1832",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=82",
    featured: false,
    badges: [],
    createdAt: "2026-05-03T12:00:00.000Z",
    descriptionEs: "Residencia lista para ocupar en comunidad privada con acabados claros y areas sociales.",
    descriptionEn: "Move-in ready home in a private community with light finishes and social areas.",
  },
  {
    id: "prop-1904",
    titleEs: "Departamento Vista Mar, Zona Hotelera",
    titleEn: "Ocean View Condo, Hotel Zone",
    type: "Departamento",
    zone: "Zona Hotelera",
    operation: "rent",
    priceUsd: 6500,
    beds: 3,
    baths: 3,
    area: 240,
    lot: 0,
    mls: "1904",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=82",
    featured: false,
    badges: ["new"],
    createdAt: "2026-06-22T12:00:00.000Z",
    descriptionEs: "Renta mensual amueblada con vista al Caribe y acceso directo a playa.",
    descriptionEn: "Monthly furnished rental with Caribbean views and direct beach access.",
  },
  {
    id: "prop-1960",
    titleEs: "Torre Costa Azul, Preventa",
    titleEn: "Costa Azul Tower, Presale",
    type: "Preventa",
    zone: "Puerto Cancun",
    operation: "sale",
    priceUsd: 720000,
    beds: 2,
    baths: 2,
    area: 155,
    lot: 0,
    mls: "1960",
    image: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=82",
    featured: false,
    badges: ["new"],
    createdAt: "2026-06-24T12:00:00.000Z",
    descriptionEs: "Preventa con plan de pagos, amenidades completas y ubicacion cercana a marina.",
    descriptionEn: "Presale with payment plan, full amenities, and marina-adjacent location.",
  },
];

const seedRequests = [
  {
    id: "req-sample-1",
    sellerId: "sample",
    sellerName: "Laura Mendieta",
    email: "laura@example.com",
    phone: "998-555-0188",
    preferredContact: "phone",
    title: "Departamento frente al canal",
    type: "Departamento",
    zone: "Puerto Cancun",
    price: 980000,
    currency: "USD",
    address: "Puerto Cancun, Cancun",
    beds: 3,
    baths: 3,
    area: 245,
    description: "Propiedad con terraza amplia, vista al canal y dos cajones de estacionamiento.",
    status: "pending",
    createdAt: "2026-06-27T15:40:00.000Z",
  },
];

const seedLocationOptions = [
  { id: "loc-state-quintana-roo", type: "state", name: "Quintana Roo", parentId: null },
  { id: "loc-city-cancun", type: "city", name: "Cancun", parentId: "loc-state-quintana-roo" },
  { id: "loc-city-isla-mujeres", type: "city", name: "Isla Mujeres", parentId: "loc-state-quintana-roo" },
  { id: "loc-city-playa-del-carmen", type: "city", name: "Playa del Carmen", parentId: "loc-state-quintana-roo" },
  { id: "loc-zone-puerto-cancun", type: "zone", name: "Puerto Cancun", parentId: "loc-city-cancun" },
  { id: "loc-zone-zona-hotelera", type: "zone", name: "Zona Hotelera", parentId: "loc-city-cancun" },
  { id: "loc-zone-cancun-centro", type: "zone", name: "Cancun Centro", parentId: "loc-city-cancun" },
  { id: "loc-zone-riviera-maya", type: "zone", name: "Riviera Maya", parentId: "loc-city-playa-del-carmen" },
  { id: "loc-zone-punta-sam", type: "zone", name: "Punta Sam / Playa Mujeres", parentId: "loc-city-isla-mujeres" },
  { id: "loc-zone-isla-mujeres", type: "zone", name: "Isla Mujeres", parentId: "loc-city-isla-mujeres" },
  { id: "loc-col-puerto-cancun", type: "neighborhood", name: "Puerto Cancun", parentId: "loc-zone-puerto-cancun" },
  { id: "loc-col-novo-cancun", type: "neighborhood", name: "Novo Cancun", parentId: "loc-zone-puerto-cancun" },
  { id: "loc-col-marina", type: "neighborhood", name: "Marina Puerto Cancun", parentId: "loc-zone-puerto-cancun" },
  { id: "loc-col-km-9", type: "neighborhood", name: "Zona Hotelera Km 9", parentId: "loc-zone-zona-hotelera" },
  { id: "loc-col-la-amada", type: "neighborhood", name: "La Amada", parentId: "loc-zone-punta-sam" },
];

function uuid(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function safeJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mergeLegacyImages(images, image) {
  const list = safeJsonArray(images).filter(Boolean);
  if (image && !list.includes(image)) list.unshift(image);
  return list.slice(0, IMAGE_MAX_COUNT);
}

function toProperty(row) {
  const images = mergeLegacyImages(row.images, row.image);
  return {
    id: row.id,
    titleEs: row.title_es,
    titleEn: row.title_en,
    type: row.type,
    state: row.state || "Quintana Roo",
    city: row.city || "Cancun",
    zone: row.zone,
    neighborhood: row.neighborhood || "",
    address: row.address || "",
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    mapPlace: row.map_place || "",
    operation: row.operation,
    priceUsd: row.price_usd === null ? null : Number(row.price_usd || 0),
    priceMxn: row.price_mxn === null ? null : Number(row.price_mxn || 0),
    beds: Number(row.beds || 0),
    baths: Number(row.baths || 0),
    area: Number(row.area || 0),
    lot: Number(row.lot || 0),
    mls: row.mls,
    image: row.image || images[0] || null,
    images,
    featured: Boolean(row.featured),
    badges: row.badges || [],
    createdAt: row.created_at,
    descriptionEs: row.description_es,
    descriptionEn: row.description_en,
    sourceRequestId: row.source_request_id,
  };
}

function toRequest(row) {
  const images = mergeLegacyImages(row.images, row.image);
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    email: row.email,
    phone: row.phone,
    preferredContact: row.preferred_contact,
    title: row.title,
    type: row.type,
    state: row.state || "Quintana Roo",
    city: row.city || "Cancun",
    zone: row.zone,
    neighborhood: row.neighborhood || "",
    price: Number(row.price || 0),
    currency: row.currency,
    address: row.address,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    mapPlace: row.map_place || "",
    beds: Number(row.beds || 0),
    baths: Number(row.baths || 0),
    area: Number(row.area || 0),
    description: row.description,
    image: row.image || images[0] || null,
    images,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

function toLocationOption(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    parentId: row.parent_id || null,
    createdAt: row.created_at,
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    preferredContact: user.preferredContact,
  };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };
}

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

async function verifyGoogleCredential(credential) {
  if (!googleClientId) {
    const error = new Error("Google login is not configured");
    error.status = 503;
    throw error;
  }
  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) {
    const error = new Error("Invalid Google credential");
    error.status = 401;
    throw error;
  }
  const profile = await response.json();
  if (profile.aud !== googleClientId || String(profile.email_verified) !== "true") {
    const error = new Error("Invalid Google account");
    error.status = 401;
    throw error;
  }
  return {
    sub: String(profile.sub || ""),
    email: String(profile.email || "").trim().toLowerCase(),
    name: String(profile.name || profile.email || "").trim(),
    givenName: String(profile.given_name || "").trim(),
    familyName: String(profile.family_name || "").trim(),
  };
}

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS seller_accounts (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('email', 'phone')),
        password_hash TEXT NOT NULL,
        google_sub TEXT UNIQUE,
        auth_provider TEXT NOT NULL DEFAULT 'password',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS seller_requests (
        id TEXT PRIMARY KEY,
        seller_id TEXT NOT NULL,
        seller_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        preferred_contact TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'Quintana Roo',
        city TEXT NOT NULL DEFAULT 'Cancun',
        zone TEXT NOT NULL,
        neighborhood TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        map_place TEXT,
        price NUMERIC NOT NULL,
        currency TEXT NOT NULL CHECK (currency IN ('USD', 'MXN')),
        address TEXT NOT NULL,
        beds INTEGER NOT NULL DEFAULT 0,
        baths INTEGER NOT NULL DEFAULT 0,
        area INTEGER NOT NULL DEFAULT 0,
        description TEXT NOT NULL,
        image TEXT,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMPTZ
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        title_es TEXT NOT NULL,
        title_en TEXT NOT NULL,
        type TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'Quintana Roo',
        city TEXT NOT NULL DEFAULT 'Cancun',
        zone TEXT NOT NULL,
        neighborhood TEXT,
        address TEXT,
        latitude NUMERIC,
        longitude NUMERIC,
        map_place TEXT,
        operation TEXT NOT NULL CHECK (operation IN ('sale', 'rent')),
        price_usd NUMERIC,
        price_mxn NUMERIC,
        beds INTEGER NOT NULL DEFAULT 0,
        baths INTEGER NOT NULL DEFAULT 0,
        area INTEGER NOT NULL DEFAULT 0,
        lot INTEGER NOT NULL DEFAULT 0,
        mls TEXT NOT NULL,
        image TEXT,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        badges JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description_es TEXT NOT NULL,
        description_en TEXT NOT NULL,
        source_request_id TEXT UNIQUE
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS location_options (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('state', 'city', 'zone', 'neighborhood')),
        name TEXT NOT NULL,
        parent_id TEXT REFERENCES location_options(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (type, name, parent_id)
      );
    `);
    await client.query("ALTER TABLE seller_accounts ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE");
    await client.query("ALTER TABLE seller_accounts ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'password'");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_mxn NUMERIC");
    await client.query("ALTER TABLE properties ALTER COLUMN price_usd DROP NOT NULL");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'Quintana Roo'");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Cancun'");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood TEXT");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS address TEXT");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude NUMERIC");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude NUMERIC");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS map_place TEXT");
    await client.query("ALTER TABLE properties ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb");
    await client.query("UPDATE properties SET images = jsonb_build_array(image) WHERE image IS NOT NULL AND images = '[]'::jsonb");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS state TEXT NOT NULL DEFAULT 'Quintana Roo'");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Cancun'");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS neighborhood TEXT");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS latitude NUMERIC");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS longitude NUMERIC");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS map_place TEXT");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb");
    await client.query("ALTER TABLE seller_requests ADD COLUMN IF NOT EXISTS image TEXT");
    await client.query("UPDATE seller_requests SET images = jsonb_build_array(image) WHERE image IS NOT NULL AND images = '[]'::jsonb");
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_metrics (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        visits INTEGER NOT NULL DEFAULT 0,
        searches INTEGER NOT NULL DEFAULT 0
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_requests (
        id TEXT PRIMARY KEY,
        lead_type TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        source_path TEXT,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`
      INSERT INTO app_metrics (id, visits, searches)
      VALUES (1, 0, 0)
      ON CONFLICT (id) DO NOTHING;
    `);
    for (const option of seedLocationOptions) {
      await client.query(
        `INSERT INTO location_options (id, type, name, parent_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [option.id, option.type, option.name, option.parentId]
      );
    }

    const propertiesCount = await client.query("SELECT COUNT(*)::int AS count FROM properties");
    if (propertiesCount.rows[0].count === 0) {
      for (const property of seedProperties) {
        await client.query(
          `INSERT INTO properties
            (id, title_es, title_en, type, state, city, zone, neighborhood, address, operation, price_usd, price_mxn, beds, baths, area, lot, mls, image, images, featured, badges, created_at, description_es, description_en)
           VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20, $21::jsonb, $22, $23, $24)
           ON CONFLICT (id) DO NOTHING`,
          [
            property.id,
            property.titleEs,
            property.titleEn,
            property.type,
            "Quintana Roo",
            property.zone === "Isla Mujeres" || property.zone === "Punta Sam / Playa Mujeres" ? "Isla Mujeres" : "Cancun",
            property.zone,
            "",
            property.zone,
            property.operation,
            property.priceUsd,
            property.priceMxn || null,
            property.beds,
            property.baths,
            property.area,
            property.lot,
            property.mls,
            property.image,
            JSON.stringify([property.image]),
            property.featured,
            JSON.stringify(property.badges),
            property.createdAt,
            property.descriptionEs,
            property.descriptionEn,
          ]
        );
      }
    }

    const requestsCount = await client.query("SELECT COUNT(*)::int AS count FROM seller_requests");
    if (requestsCount.rows[0].count === 0) {
      for (const request of seedRequests) {
        await client.query(
          `INSERT INTO seller_requests
            (id, seller_id, seller_name, email, phone, preferred_contact, title, type, state, city, zone, neighborhood, price, currency, address, beds, baths, area, description, status, created_at)
           VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
           ON CONFLICT (id) DO NOTHING`,
          [
            request.id,
            request.sellerId,
            request.sellerName,
            request.email,
            request.phone,
            request.preferredContact,
            request.title,
            request.type,
            "Quintana Roo",
            "Cancun",
            request.zone,
            "",
            request.price,
            request.currency,
            request.address,
            request.beds,
            request.baths,
            request.area,
            request.description,
            request.status,
            request.createdAt,
          ]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

app.set("trust proxy", 1);
app.use(express.json({ limit: "20mb" }));
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    name: "pcc.sid",
    secret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 12,
    },
  })
);

app.get("/api/health", async (_req, res, next) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/config", (_req, res) => {
  res.json({
    googleClientId,
    googleMapsApiKey,
  });
});

app.get("/api/session", (req, res) => {
  res.json({ user: publicUser(req.session.user) });
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const normalized = username.toLowerCase();

    if (normalized === adminUser) {
      if (!adminPassword || password !== adminPassword) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      req.session.user = {
        id: "admin-prueba",
        role: "admin",
        name: "Admin Prueba",
        email: "admin@puertocancuncenter.test",
      };
      res.json({ user: publicUser(req.session.user) });
      return;
    }

    const result = await query("SELECT * FROM seller_accounts WHERE lower(email) = lower($1)", [username]);
    const account = result.rows[0];
    if (!account || !(await bcrypt.compare(password, account.password_hash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    req.session.user = {
      id: account.id,
      role: "seller",
      name: `${account.first_name} ${account.last_name}`,
      email: account.email,
      phone: account.phone,
      preferredContact: account.preferred_contact,
    };
    res.json({ user: publicUser(req.session.user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const phone = String(req.body.phone || "").trim();
    const preferredContact = req.body.preferredContact === "phone" ? "phone" : "email";
    const password = String(req.body.password || "");

    if (!firstName || !lastName || !email || !phone || password.length < 6) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const id = uuid("seller");
    const passwordHash = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO seller_accounts
        (id, first_name, last_name, email, phone, preferred_contact, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, firstName, lastName, email, phone, preferredContact, passwordHash]
    );

    req.session.user = {
      id,
      role: "seller",
      name: `${firstName} ${lastName}`,
      email,
      phone,
      preferredContact,
    };
    res.status(201).json({ user: publicUser(req.session.user) });
  } catch (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "Account exists" });
      return;
    }
    next(error);
  }
});

app.post("/api/auth/google", async (req, res, next) => {
  try {
    const credential = String(req.body.credential || "");
    if (!credential) {
      res.status(400).json({ error: "Missing Google credential" });
      return;
    }

    const profile = await verifyGoogleCredential(credential);
    if (!profile.sub || !profile.email) {
      res.status(401).json({ error: "Invalid Google account" });
      return;
    }

    let result = await query("SELECT * FROM seller_accounts WHERE google_sub = $1", [profile.sub]);
    let account = result.rows[0];

    if (!account) {
      result = await query("SELECT * FROM seller_accounts WHERE lower(email) = lower($1)", [profile.email]);
      account = result.rows[0];
      if (account) {
        const updated = await query(
          "UPDATE seller_accounts SET google_sub = COALESCE(google_sub, $2), auth_provider = 'google' WHERE id = $1 RETURNING *",
          [account.id, profile.sub]
        );
        account = updated.rows[0];
      }
    }

    if (!account) {
      const id = uuid("seller");
      const nameParts = profile.name.split(/\s+/).filter(Boolean);
      const firstName = profile.givenName || nameParts[0] || "Usuario";
      const lastName = profile.familyName || nameParts.slice(1).join(" ") || "Google";
      const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
      const created = await query(
        `INSERT INTO seller_accounts
          (id, first_name, last_name, email, phone, preferred_contact, password_hash, google_sub, auth_provider)
         VALUES
          ($1, $2, $3, $4, '', 'email', $5, $6, 'google')
         RETURNING *`,
        [id, firstName, lastName, profile.email, passwordHash, profile.sub]
      );
      account = created.rows[0];
    }

    req.session.user = {
      id: account.id,
      role: "seller",
      name: `${account.first_name} ${account.last_name}`,
      email: account.email,
      phone: account.phone,
      preferredContact: account.preferred_contact,
    };
    res.json({ user: publicUser(req.session.user) });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    next(error);
  }
});

app.post("/api/auth/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }
    res.json({ ok: true });
  });
});

app.get("/api/properties", async (req, res, next) => {
  try {
    if (!req.session.visited) {
      req.session.visited = true;
      await query("UPDATE app_metrics SET visits = visits + 1 WHERE id = 1");
    }
    const result = await query("SELECT * FROM properties ORDER BY created_at DESC");
    res.json({ properties: result.rows.map(toProperty) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/location-options", async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM location_options ORDER BY type, name");
    res.json({ options: result.rows.map(toLocationOption) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/metrics/search", async (_req, res, next) => {
  try {
    await query("UPDATE app_metrics SET searches = searches + 1 WHERE id = 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/leads", async (req, res, next) => {
  try {
    const body = req.body || {};
    const leadType = String(body.leadType || "general").trim().slice(0, 80);
    const name = String(body.name || body.firstName || "").trim();
    const phone = String(body.whatsapp || body.phone || "").trim();
    const email = String(body.email || "").trim().toLowerCase() || null;
    const sourcePath = String(body.sourcePath || "").trim().slice(0, 220) || null;

    if (!name || !phone) {
      res.status(400).json({ error: "Nombre y WhatsApp son obligatorios." });
      return;
    }

    const payload = { ...body };
    delete payload.leadType;
    delete payload.name;
    delete payload.firstName;
    delete payload.whatsapp;
    delete payload.phone;
    delete payload.email;
    delete payload.sourcePath;

    const result = await query(
      `INSERT INTO lead_requests
        (id, lead_type, name, phone, email, source_path, payload)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7::jsonb)
       RETURNING id, lead_type, created_at`,
      [uuid("lead"), leadType, name, phone, email, sourcePath, JSON.stringify(payload)]
    );
    res.status(201).json({ lead: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.get("/api/seller/requests", requireRole("seller"), async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM seller_requests WHERE seller_id = $1 ORDER BY created_at DESC", [
      req.session.user.id,
    ]);
    res.json({ requests: result.rows.map(toRequest) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/seller/requests", requireRole("seller"), async (req, res, next) => {
  try {
    const id = uuid("req");
    const body = req.body;
    const email = String(body.email || req.session.user.email || "").trim().toLowerCase();
    const phone = String(body.phone || req.session.user.phone || "").trim();
    const preferredContact = body.preferredContact === "phone" ? "phone" : "email";
    const request = {
      title: String(body.title || "").trim(),
      type: String(body.type || "").trim(),
      state: String(body.state || "Quintana Roo").trim(),
      city: String(body.city || "Cancun").trim(),
      zone: String(body.zone || "").trim(),
      neighborhood: String(body.neighborhood || "").trim(),
      price: Number(body.price || 0),
      currency: body.currency === "MXN" ? "MXN" : "USD",
      address: String(body.address || "").trim(),
      latitude: parseOptionalCoordinate(body.latitude, "latitude", -90, 90),
      longitude: parseOptionalCoordinate(body.longitude, "longitude", -180, 180),
      mapPlace: String(body.mapPlace || "").trim().slice(0, 260),
      beds: Number(body.beds || 0),
      baths: Number(body.baths || 0),
      area: Number(body.area || 0),
      description: String(body.description || "").trim(),
      images: parseUploadedImages(body, []),
    };
    request.image = request.images[0] || null;

    if (
      !email ||
      !phone ||
      !request.title ||
      !request.type ||
      !request.state ||
      !request.city ||
      !request.zone ||
      !request.price ||
      !request.address ||
      !request.description
    ) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const result = await query(
      `INSERT INTO seller_requests
        (id, seller_id, seller_name, email, phone, preferred_contact, title, type, state, city, zone, neighborhood, latitude, longitude, map_place, price, currency, address, beds, baths, area, description, image, images)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::jsonb)
       RETURNING *`,
      [
        id,
        req.session.user.id,
        req.session.user.name,
        email,
        phone,
        preferredContact,
        request.title,
        request.type,
        request.state,
        request.city,
        request.zone,
        request.neighborhood,
        request.latitude,
        request.longitude,
        request.mapPlace,
        request.price,
        request.currency,
        request.address,
        request.beds,
        request.baths,
        request.area,
        request.description,
        request.image,
        JSON.stringify(request.images),
      ]
    );
    res.status(201).json({ request: toRequest(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/stats", requireRole("admin"), async (_req, res, next) => {
  try {
    const [properties, pending, users, metrics] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM properties"),
      query("SELECT COUNT(*)::int AS count FROM seller_requests WHERE status = 'pending'"),
      query("SELECT COUNT(*)::int AS count FROM seller_accounts"),
      query("SELECT visits, searches FROM app_metrics WHERE id = 1"),
    ]);
    res.json({
      properties: properties.rows[0].count,
      pendingRequests: pending.rows[0].count,
      users: users.rows[0].count,
      visits: metrics.rows[0]?.visits || 0,
      searches: metrics.rows[0]?.searches || 0,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/prompts", requireRole("admin"), (_req, res) => {
  res.json({ prompts: adminPrompts });
});

app.post("/api/admin/location-options", requireRole("admin"), async (req, res, next) => {
  try {
    const type = String(req.body.type || "").trim();
    const name = String(req.body.name || "").trim();
    const parentId = String(req.body.parentId || "").trim() || null;
    if (!["state", "city", "zone", "neighborhood"].includes(type) || !name) {
      res.status(400).json({ error: "Missing required location fields" });
      return;
    }
    const result = await query(
      `INSERT INTO location_options (id, type, name, parent_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (type, name, parent_id) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [uuid("loc"), type, name, parentId]
    );
    res.status(201).json({ option: toLocationOption(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/location-options/:id", requireRole("admin"), async (req, res, next) => {
  try {
    await query("DELETE FROM location_options WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/requests", requireRole("admin"), async (_req, res, next) => {
  try {
    const result = await query("SELECT * FROM seller_requests ORDER BY created_at DESC");
    res.json({ requests: result.rows.map(toRequest) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/requests/:id/approve", requireRole("admin"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const requestResult = await client.query(
      "UPDATE seller_requests SET status = 'approved', reviewed_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    const request = requestResult.rows[0];
    if (!request) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const existing = await client.query("SELECT * FROM properties WHERE source_request_id = $1", [request.id]);
    let property = existing.rows[0];
    if (!property) {
      const priceUsd = request.currency === "USD" ? Number(request.price) : null;
      const priceMxn = request.currency === "MXN" ? Number(request.price) : null;
      const propertyResult = await client.query(
        `INSERT INTO properties
          (id, title_es, title_en, type, state, city, zone, neighborhood, address, latitude, longitude, map_place, operation, price_usd, price_mxn, beds, baths, area, lot, mls, image, images, featured, badges, description_es, description_en, source_request_id)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'sale', $13, $14, $15, $16, $17, 0, $18, $19, $20::jsonb, false, $21::jsonb, $22, $23, $24)
         RETURNING *`,
        [
          uuid("prop"),
          request.title,
          request.title,
          request.type,
          request.state || "Quintana Roo",
          request.city || "Cancun",
          request.zone,
          request.neighborhood || "",
          request.address || "",
          request.latitude,
          request.longitude,
          request.map_place || "",
          priceUsd,
          priceMxn,
          request.beds,
          request.baths,
          request.area,
          String(Math.floor(2000 + Math.random() * 8000)),
          request.image || null,
          JSON.stringify(mergeLegacyImages(request.images, request.image)),
          JSON.stringify(["new"]),
          request.description,
          request.description,
          request.id,
        ]
      );
      property = propertyResult.rows[0];
    }

    await client.query("COMMIT");
    res.json({ request: toRequest(request), property: toProperty(property) });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

app.post("/api/admin/requests/:id/reject", requireRole("admin"), async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE seller_requests SET status = 'rejected', reviewed_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    res.json({ request: toRequest(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/properties", requireRole("admin"), async (req, res, next) => {
  try {
    const property = normalizePropertyInput(req.body, uuid("prop"));
    const result = await query(
      `INSERT INTO properties
        (id, title_es, title_en, type, state, city, zone, neighborhood, address, latitude, longitude, map_place, operation, price_usd, price_mxn, beds, baths, area, lot, mls, image, images, featured, badges, description_es, description_en)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24::jsonb, $25, $26)
       RETURNING *`,
      [
        property.id,
        property.titleEs,
        property.titleEn,
        property.type,
        property.state,
        property.city,
        property.zone,
        property.neighborhood,
        property.address,
        property.latitude,
        property.longitude,
        property.mapPlace,
        property.operation,
        property.priceUsd,
        property.priceMxn,
        property.beds,
        property.baths,
        property.area,
        property.lot,
        property.mls,
        property.image,
        JSON.stringify(property.images),
        property.featured,
        JSON.stringify(property.badges),
        property.descriptionEs,
        property.descriptionEn,
      ]
    );
    res.status(201).json({ property: toProperty(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/properties/:id", requireRole("admin"), async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM properties WHERE id = $1", [req.params.id]);
    if (!existing.rows[0]) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    const existingImages = mergeLegacyImages(existing.rows[0].images, existing.rows[0].image);
    const property = normalizePropertyInput(req.body, req.params.id, existingImages);
    const result = await query(
      `UPDATE properties
       SET title_es = $2, title_en = $3, type = $4, state = $5, city = $6, zone = $7, neighborhood = $8, address = $9,
           latitude = $10, longitude = $11, map_place = $12, operation = $13, price_usd = $14, price_mxn = $15,
           beds = $16, baths = $17, area = $18, lot = $19, mls = $20, image = $21, images = $22::jsonb,
           featured = $23, badges = $24::jsonb, description_es = $25, description_en = $26
       WHERE id = $1
       RETURNING *`,
      [
        property.id,
        property.titleEs,
        property.titleEn,
        property.type,
        property.state,
        property.city,
        property.zone,
        property.neighborhood,
        property.address,
        property.latitude,
        property.longitude,
        property.mapPlace,
        property.operation,
        property.priceUsd,
        property.priceMxn,
        property.beds,
        property.baths,
        property.area,
        property.lot,
        property.mls,
        property.image,
        JSON.stringify(property.images),
        property.featured,
        JSON.stringify(property.badges),
        property.descriptionEs,
        property.descriptionEn,
      ]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json({ property: toProperty(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/properties/:id", requireRole("admin"), async (req, res, next) => {
  try {
    await query("DELETE FROM properties WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

function parseOptionalPrice(value, fieldName) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${fieldName} must be a valid number`);
    error.status = 400;
    throw error;
  }
  return number;
}

function parseOptionalCoordinate(value, fieldName, min, max) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    const error = new Error(`${fieldName} must be a valid coordinate`);
    error.status = 400;
    throw error;
  }
  return number;
}

function validateImagePayload(image) {
  const mimeType = String(image.imageType || image.type || "").toLowerCase();
  const size = Number(image.imageSize || image.size || 0);
  const dataUrl = String(image.imageDataUrl || image.dataUrl || "");

  if (!IMAGE_TYPES.has(mimeType)) {
    const error = new Error("La imagen debe ser JPG, JPEG, PNG o WEBP.");
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(size) || size <= 0 || size > IMAGE_MAX_BYTES) {
    const error = new Error("La imagen no debe superar 1.5 MB.");
    error.status = 400;
    throw error;
  }

  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1].toLowerCase() !== mimeType) {
    const error = new Error("La imagen no tiene un formato valido.");
    error.status = 400;
    throw error;
  }

  const estimatedBytes = Math.floor((match[2].length * 3) / 4);
  if (estimatedBytes > IMAGE_MAX_BYTES) {
    const error = new Error("La imagen no debe superar 1.5 MB.");
    error.status = 400;
    throw error;
  }

  return dataUrl;
}

function parseUploadedImages(body, existingImages = []) {
  if (body.removeImage === true || body.removeImage === "true") return [];
  const incoming = Array.isArray(body.images)
    ? body.images
    : body.imageDataUrl
      ? [{ imageDataUrl: body.imageDataUrl, imageType: body.imageType, imageSize: body.imageSize }]
      : [];
  if (!incoming.length) return safeJsonArray(existingImages).slice(0, IMAGE_MAX_COUNT);
  if (incoming.length > IMAGE_MAX_COUNT) {
    const error = new Error(`Solo puedes cargar hasta ${IMAGE_MAX_COUNT} imagenes por publicacion.`);
    error.status = 400;
    throw error;
  }
  return incoming.map(validateImagePayload);
}

function normalizePropertyInput(body, id, existingImages = []) {
  const title = String(body.title || body.titleEs || "").trim();
  const type = String(body.type || "").trim();
  const state = String(body.state || "Quintana Roo").trim();
  const city = String(body.city || "Cancun").trim();
  const zone = String(body.zone || "").trim();
  const neighborhood = String(body.neighborhood || "").trim();
  const address = String(body.address || "").trim();
  const latitude = parseOptionalCoordinate(body.latitude, "latitude", -90, 90);
  const longitude = parseOptionalCoordinate(body.longitude, "longitude", -180, 180);
  const mapPlace = String(body.mapPlace || "").trim().slice(0, 260);
  const operation = body.operation === "rent" ? "rent" : "sale";
  const priceUsd = parseOptionalPrice(body.priceUsd, "priceUsd");
  const priceMxn = parseOptionalPrice(body.priceMxn, "priceMxn");
  const images = parseUploadedImages(body, existingImages);

  if (!title || !type || !state || !city || !zone || (priceUsd === null && priceMxn === null)) {
    const error = new Error("Missing required property fields");
    error.status = 400;
    throw error;
  }

  return {
    id,
    titleEs: title,
    titleEn: String(body.titleEn || title).trim(),
    type,
    state,
    city,
    zone,
    neighborhood,
    address,
    latitude,
    longitude,
    mapPlace,
    operation,
    priceUsd,
    priceMxn,
    beds: Number(body.beds || 0),
    baths: Number(body.baths || 0),
    area: Number(body.area || 0),
    lot: Number(body.lot || 0),
    mls: String(body.mls || Math.floor(2000 + Math.random() * 8000)),
    image: images[0] || null,
    images,
    featured: Boolean(body.featured),
    badges: Array.isArray(body.badges) ? body.badges : ["new"],
    descriptionEs: String(body.description || body.descriptionEs || "").trim() || "Propiedad publicada por administracion.",
    descriptionEn: String(body.descriptionEn || body.description || "").trim() || "Property published by administration.",
  };
}

function defaultImageForType(type) {
  const images = {
    Casa: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=82",
    Departamento: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=82",
    Terreno: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1200&q=82",
    Comercial: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=82",
    Preventa: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=82",
    Desarrollo: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=82",
  };
  return images[type] || "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82";
}

function replaceMetaTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function renderPublicHtml(requestPath) {
  const page = getPageByPath(requestPath) || getPageByPath("/");
  const seo = renderSeoHead(page, siteUrl);
  const pageContent = page.path === "/" ? "" : renderSeoPage(page.path);
  let html = fs.readFileSync(indexPath, "utf8");

  html = replaceMetaTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);
  html = replaceMetaTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`
  );
  html = replaceMetaTag(html, /<link\s+rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`);
  html = replaceMetaTag(
    html,
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`
  );
  html = replaceMetaTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`
  );
  html = replaceMetaTag(html, /<meta\s+property="og:url"[\s\S]*?\/>/, `<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`);
  html = replaceMetaTag(html, /<meta\s+property="og:image"[\s\S]*?\/>/, `<meta property="og:image" content="${escapeHtml(seo.image)}" />`);
  html = replaceMetaTag(
    html,
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`
  );
  html = replaceMetaTag(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`
  );
  html = replaceMetaTag(
    html,
    /<meta\s+name="twitter:image"[\s\S]*?\/>/,
    `<meta name="twitter:image" content="${escapeHtml(seo.image)}" />`
  );
  html = html.replace("<!-- SEO_JSON_LD -->", seo.jsonLd);
  html = html.replace("<!-- SEO_PAGE_CONTENT -->", pageContent);
  html = html.replace('<body data-page="home">', `<body data-page="${page.path === "/" ? "home" : "seo"}">`);
  return html;
}

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send(robotsTxt(siteUrl));
});

app.get("/sitemap.xml", (_req, res) => {
  res.type("application/xml").send(sitemapXml(siteUrl));
});

app.get("/llms.txt", (_req, res) => {
  res.type("text/plain").send(llmsTxt(siteUrl));
});

app.get("/ai-summary.json", (_req, res) => {
  res.json(aiSummary(siteUrl));
});

app.get("/prompts-inmobiliarios-cancun", (_req, res) => {
  res.redirect(301, "/validar-respuesta-ia");
});

app.get(Array.from(publicStaticFiles), (req, res) => {
  res.sendFile(path.join(__dirname, req.path.slice(1)));
});

app.get("*", (req, res) => {
  res.send(renderPublicHtml(req.path));
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: error.message || "Server error" });
});

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Puerto Cancun Center running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database.");
    console.error(error);
    process.exit(1);
  });
