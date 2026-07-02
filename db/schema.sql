CREATE TABLE IF NOT EXISTS seller_accounts (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('email', 'phone')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS location_options (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('state', 'city', 'zone', 'neighborhood')),
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES location_options(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, name, parent_id)
);

CREATE TABLE IF NOT EXISTS app_metrics (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  visits INTEGER NOT NULL DEFAULT 0,
  searches INTEGER NOT NULL DEFAULT 0
);

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

CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);
