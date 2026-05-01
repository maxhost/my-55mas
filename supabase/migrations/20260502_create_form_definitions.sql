-- form_definitions: catálogo de los 4 forms estáticos con schema + i18n.
-- UI admin para gestionar schema/i18n llegará en un plan posterior; por ahora
-- la tabla queda con 4 filas vacías listas para que el admin las pueble.

CREATE TABLE form_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_key text UNIQUE NOT NULL
    CHECK (form_key IN ('talent_registration','client_registration','service_hire','service_offer')),
  schema jsonb NOT NULL DEFAULT '{"fields": []}'::jsonb,
  i18n jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON form_definitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO form_definitions (form_key) VALUES
  ('talent_registration'),
  ('client_registration'),
  ('service_hire'),
  ('service_offer');
