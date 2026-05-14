-- Adds a `category` enum column to `services` so the public home can
-- group services into the 4 fixed buckets (Acompañamiento, Clases,
-- Reparaciones, Casa). NULL means "uncategorized — do not show on home".
--
-- Idempotent: `DO $$` block tolerates re-runs of `supabase db reset`
-- where the type might already exist locally.

DO $$ BEGIN
  CREATE TYPE service_category AS ENUM (
    'accompaniment',
    'classes',
    'repairs',
    'home'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS category service_category NULL;

COMMENT ON COLUMN services.category IS
  'Home bucket (Acompañamiento / Clases / Reparaciones / Casa). NULL = not shown on /.';
