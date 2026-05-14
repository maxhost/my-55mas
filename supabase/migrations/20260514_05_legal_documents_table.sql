-- Legal documents: 4 fixed slugs editable from admin with the shared
-- Lexical rich-text editor. Each row stores per-locale lexicalState (JSON)
-- + richHtml (pre-sanitized) so the public site can render via
-- dangerouslySetInnerHTML without DOMPurify on the client.

DO $$ BEGIN
  CREATE TYPE legal_document_slug AS ENUM (
    'terms', 'privacy', 'terms_of_use', 'transparency'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug legal_document_slug NOT NULL UNIQUE,
  i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- shape: { es: { lexicalState: object, richHtml: string }, en: {...}, ... }
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER legal_documents_set_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

INSERT INTO legal_documents (slug) VALUES
  ('terms'), ('privacy'), ('terms_of_use'), ('transparency')
ON CONFLICT (slug) DO NOTHING;
