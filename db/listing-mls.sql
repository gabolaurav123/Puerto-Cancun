-- A single registry protects imported, manually entered and generated references.
CREATE SEQUENCE IF NOT EXISTS pcc_mls_sequence;
CREATE TABLE IF NOT EXISTS listing_mls_registry (
  code TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL
);
INSERT INTO listing_mls_registry(code, owner_id)
SELECT upper(btrim(mls)), min(COALESCE(NULLIF(source_request_id,''), id))
FROM properties WHERE NULLIF(btrim(mls), '') IS NOT NULL GROUP BY upper(btrim(mls))
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION pcc_reserve_mls(owner_key TEXT, requested TEXT DEFAULT NULL)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  candidate TEXT := NULLIF(btrim(requested), '');
  claimed TEXT;
BEGIN
  IF candidate IS NOT NULL THEN
    INSERT INTO listing_mls_registry AS registry(code, owner_id) VALUES (upper(candidate), owner_key)
    ON CONFLICT (code) DO UPDATE SET owner_id = excluded.owner_id WHERE registry.owner_id = excluded.owner_id OR registry.owner_id LIKE 'inquiry/%'
    RETURNING code INTO claimed;
    IF claimed IS NULL THEN
      RAISE EXCEPTION 'Ese MLS ya pertenece a otra ficha.' USING ERRCODE = '23505', CONSTRAINT = 'listing_mls_owner';
    END IF;
    RETURN candidate;
  END IF;
  LOOP
    candidate := 'PCC-' || nextval('pcc_mls_sequence')::text;
    INSERT INTO listing_mls_registry(code, owner_id) VALUES(candidate, owner_key)
      ON CONFLICT DO NOTHING RETURNING code INTO claimed;
    IF claimed IS NOT NULL THEN RETURN candidate; END IF;
  END LOOP;
END;
$$;

-- WhatsApp-only owner inquiries reserve a reference without collecting form data.
CREATE TABLE IF NOT EXISTS owner_inquiry_references (
  request_id UUID PRIMARY KEY,
  mls TEXT NOT NULL UNIQUE
);
CREATE OR REPLACE FUNCTION pcc_owner_reference(nonce UUID) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE reference TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('owner-mls/' || nonce::text));
  SELECT mls INTO reference FROM owner_inquiry_references WHERE request_id = nonce;
  IF reference IS NULL THEN
    reference := pcc_reserve_mls('inquiry/' || nonce::text);
    INSERT INTO owner_inquiry_references(request_id, mls) VALUES(nonce, reference);
  END IF;
  RETURN reference;
END;
$$;

CREATE OR REPLACE FUNCTION pcc_assign_listing_mls() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NULLIF(btrim(OLD.mls), '') IS NOT NULL AND
     (NULLIF(btrim(NEW.mls), '') IS NULL OR upper(btrim(NEW.mls)) = upper(btrim(OLD.mls))) THEN
    NEW.mls := OLD.mls;
  ELSE
    NEW.mls := pcc_reserve_mls(COALESCE(NULLIF(NEW.source_request_id,''), NEW.id), NEW.mls);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS pcc_property_mls ON properties;
CREATE TRIGGER pcc_property_mls BEFORE INSERT OR UPDATE OF mls ON properties
FOR EACH ROW EXECUTE FUNCTION pcc_assign_listing_mls();
UPDATE properties SET mls = '' WHERE NULLIF(btrim(mls),'') IS NULL;
