-- Talent registration foundation:
-- 1) fiscal_id_types catalog (admin-managed) + junction to countries
-- 2) talent_profiles: add fiscal_id_type_id, fiscal_id, marketing_consent, additional_info
-- 3) Migrate profiles.nif → talent_profiles.fiscal_id, then drop profiles.nif
-- 4) form_definition_countries + form_definition_cities (activation only — i18n stays in form_definitions.i18n jsonb)

-- ── 1. fiscal_id_types ──────────────────────────────────────────

CREATE TABLE fiscal_id_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON fiscal_id_types
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE fiscal_id_type_countries (
  fiscal_id_type_id uuid NOT NULL REFERENCES fiscal_id_types(id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (fiscal_id_type_id, country_id)
);

CREATE INDEX idx_fitc_country ON fiscal_id_type_countries(country_id);

-- ── 2. talent_profiles new columns ─────────────────────────────

ALTER TABLE talent_profiles
  ADD COLUMN fiscal_id_type_id uuid REFERENCES fiscal_id_types(id),
  ADD COLUMN fiscal_id text,
  ADD COLUMN marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN additional_info text;

-- ── 3. Migrate profiles.nif → talent_profiles.fiscal_id ────────

UPDATE talent_profiles tp
SET fiscal_id = p.nif
FROM profiles p
WHERE tp.user_id = p.id
  AND p.nif IS NOT NULL;

ALTER TABLE profiles DROP COLUMN nif;

-- ── 4. Form activation tables (NOT translation tables) ─────────

CREATE TABLE form_definition_countries (
  form_id uuid NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (form_id, country_id)
);

CREATE INDEX idx_fdc_country ON form_definition_countries(country_id);

CREATE TABLE form_definition_cities (
  form_id uuid NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (form_id, city_id)
);

CREATE INDEX idx_fdcity_city ON form_definition_cities(city_id);
