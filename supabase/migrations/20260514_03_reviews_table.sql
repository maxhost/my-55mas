CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_photo text NULL,  -- base path en bucket review-photos (sin sufijo .webp)
  stars numeric(2,1) NOT NULL
    CHECK (stars >= 0.5 AND stars <= 5.0 AND (stars * 2) = floor(stars * 2)),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- shape: { es: { text: "..." }, en: { text: "..." }, ... }
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Bucket creation (aplicado via Supabase MCP / dashboard):
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('review-photos', 'review-photos', true)
--   ON CONFLICT (id) DO NOTHING;
