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
  email_verified_at TIMESTAMPTZ,
  email_verification_token_hash TEXT,
  email_verification_expires_at TIMESTAMPTZ,
  password_reset_token_hash TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  session_version INTEGER NOT NULL DEFAULT 1,
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
  latitude NUMERIC,
  longitude NUMERIC,
  map_place TEXT,
  location_precision TEXT NOT NULL DEFAULT 'approximate',
  google_maps_url TEXT,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'MXN')),
  address TEXT NOT NULL,
  beds INTEGER NOT NULL DEFAULT 0,
  baths INTEGER NOT NULL DEFAULT 0,
  area NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  admin_response TEXT,
  response_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_notes TEXT,
  assigned_to TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS guest_sale_requests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('email', 'whatsapp')),
  email TEXT,
  country_code TEXT,
  phone TEXT,
  contact_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium',
  internal_notes TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_sale_requests_status_created ON guest_sale_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guest_sale_requests_contact ON guest_sale_requests (email, phone);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  type TEXT NOT NULL,
  publication_section TEXT NOT NULL DEFAULT 'properties',
  state TEXT NOT NULL DEFAULT 'Quintana Roo',
  city TEXT NOT NULL DEFAULT 'Cancun',
  zone TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  map_place TEXT,
  location_precision TEXT NOT NULL DEFAULT 'approximate',
  google_maps_url TEXT,
  operation TEXT NOT NULL CHECK (operation IN ('sale', 'rent')),
  price_currency TEXT NOT NULL DEFAULT 'USD' CHECK (price_currency IN ('USD', 'MXN')),
  price_amount NUMERIC,
  price_unit TEXT NOT NULL DEFAULT 'total' CHECK (price_unit IN ('total', 'sqm')),
  price_usd NUMERIC,
  price_mxn NUMERIC,
  beds INTEGER NOT NULL DEFAULT 0,
  baths INTEGER NOT NULL DEFAULT 0,
  parking INTEGER NOT NULL DEFAULT 0,
  area NUMERIC NOT NULL DEFAULT 0,
  lot NUMERIC NOT NULL DEFAULT 0,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  mls TEXT NOT NULL,
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  description_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  development_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_request_id TEXT UNIQUE,
  idempotency_key TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS developments (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  developer TEXT,
  stage TEXT,
  delivery_date DATE,
  total_units INTEGER NOT NULL DEFAULT 0,
  available_units INTEGER NOT NULL DEFAULT 0,
  payment_plan_es TEXT,
  payment_plan_en TEXT,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  construction_progress NUMERIC NOT NULL DEFAULT 0 CHECK (construction_progress >= 0 AND construction_progress <= 100),
  progress_updated_at TIMESTAMPTZ,
  investment_highlights_es TEXT,
  investment_highlights_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developments_delivery ON developments (delivery_date, stage);

CREATE TABLE IF NOT EXISTS location_options (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('state', 'city', 'zone', 'neighborhood')),
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES location_options(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, name, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_properties_keywords_gin ON properties USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_properties_public_status_updated ON properties (is_public, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_options_hierarchy ON location_options (type, parent_id, is_active, sort_order);

CREATE TABLE IF NOT EXISTS app_metrics (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  visits INTEGER NOT NULL DEFAULT 0,
  searches INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lead_requests (
  id TEXT PRIMARY KEY,
  lead_type TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source_path TEXT,
  property_id TEXT,
  contact_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to TEXT,
  last_response TEXT,
  internal_notes TEXT,
  lead_score TEXT NOT NULL DEFAULT 'cold',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  contact_type TEXT NOT NULL DEFAULT 'unclassified',
  source TEXT,
  preferred_zones JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget_min NUMERIC,
  budget_max NUMERIC,
  property_type TEXT,
  notes TEXT,
  consent_contact BOOLEAN NOT NULL DEFAULT TRUE,
  lead_score TEXT NOT NULL DEFAULT 'cold',
  assigned_to TEXT,
  objective TEXT,
  urgency TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS request_messages (
  id TEXT PRIMARY KEY,
  request_table TEXT NOT NULL,
  request_id TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_requests_status_created ON lead_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_type_updated ON contacts (contact_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications (user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status_due ON tasks (status, due_date);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  contact_id TEXT,
  property_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS valuations (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  contact_id TEXT,
  property_id TEXT,
  owner_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  zone TEXT,
  property_type TEXT,
  expected_price NUMERIC,
  suggested_price NUMERIC,
  low_range NUMERIC,
  high_range NUMERIC,
  confidence_level TEXT NOT NULL DEFAULT 'manual',
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  related_entity_type TEXT,
  related_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_matches (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'suggested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, contact_id)
);

CREATE TABLE IF NOT EXISTS internal_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'advisor',
  status TEXT NOT NULL DEFAULT 'active',
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buyer_profiles (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL UNIQUE REFERENCES contacts(id) ON DELETE CASCADE,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_zones JSONB NOT NULL DEFAULT '[]'::jsonb,
  property_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  operation TEXT NOT NULL DEFAULT 'sale',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  objective TEXT,
  urgency TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'document',
  related_entity_type TEXT,
  related_entity_id TEXT,
  uploaded_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_documents (
  id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  property_id TEXT,
  valuation_id TEXT,
  contact_id TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  content_base64 TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  segment TEXT NOT NULL,
  channel TEXT NOT NULL,
  template TEXT,
  message TEXT NOT NULL,
  property_id TEXT,
  recipient_mode TEXT NOT NULL DEFAULT 'segment',
  recipient_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_es TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  content_es TEXT NOT NULL,
  content_en TEXT NOT NULL,
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_name TEXT NOT NULL DEFAULT 'Puerto Cancun Center',
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_publication ON blog_posts (status, published_at DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (sid)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);

CREATE TABLE IF NOT EXISTS seller_favorites (
  seller_id TEXT NOT NULL REFERENCES seller_accounts(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (seller_id, property_id)
);

CREATE TABLE IF NOT EXISTS saved_searches (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES seller_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query_text TEXT NOT NULL DEFAULT '',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  alert_frequency TEXT NOT NULL DEFAULT 'immediate',
  consent_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_search_matches (
  id TEXT PRIMARY KEY,
  saved_search_id TEXT NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  notification_id TEXT REFERENCES notifications(id) ON DELETE SET NULL,
  delivery_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (saved_search_id, property_id)
);

CREATE TABLE IF NOT EXISTS tour_requests (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  seller_id TEXT REFERENCES seller_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT,
  comments TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','contacted','confirmed','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS copilot_responses (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  question TEXT NOT NULL,
  category TEXT,
  feature TEXT,
  tool TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT,
  model TEXT,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS copilot_feedback (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL REFERENCES copilot_responses(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL,
  feedback TEXT NOT NULL CHECK (feedback IN ('positive','negative')),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (response_id, admin_id)
);

CREATE TABLE IF NOT EXISTS copilot_actions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'previewed' CHECK (status IN ('previewed','confirmed','cancelled','failed')),
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS brochure_imports (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  development_property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  extracted_text TEXT NOT NULL DEFAULT '',
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  review_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'review' CHECK (status IN ('processing','review','applied','rejected','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS image_analysis_cache (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property','development')),
  entity_id TEXT NOT NULL,
  image_index INTEGER NOT NULL,
  source_hash TEXT NOT NULL,
  perceptual_hash TEXT,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT NOT NULL DEFAULT 'technical',
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, image_index, source_hash)
);

CREATE TABLE IF NOT EXISTS property_versions (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  changed_by TEXT,
  change_type TEXT NOT NULL,
  changed_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS verified_by TEXT;

CREATE TABLE IF NOT EXISTS integration_diagnostics (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error','blocked')),
  message TEXT NOT NULL DEFAULT '',
  tested_by TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_diagnostics_latest
  ON integration_diagnostics (integration_id, created_at DESC);
