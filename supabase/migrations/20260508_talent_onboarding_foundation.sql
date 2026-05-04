-- Talent onboarding (Phase D) — DB foundation.
-- Spec: docs/features/talent-onboarding.md
--
-- Verificado pre-aplicación:
--   talent_service_subtypes está vacía (0 rows) → PK rebuild seguro con NOT NULL.
--   profiles.other_language sin datos (0 rows) → DROP sin backfill.

-- ── A. Columnas nuevas en talent_profiles ─────────────────────

ALTER TABLE talent_profiles
  ADD COLUMN previous_experience text,
  ADD COLUMN has_social_security boolean,
  ADD COLUMN onboarding_completed_at timestamptz;

COMMENT ON COLUMN talent_profiles.previous_experience IS
  'Experiencia profesional anterior del talento. Texto libre llenado durante onboarding step 3.';
COMMENT ON COLUMN talent_profiles.has_social_security IS
  'Step 5 onboarding: si está dado de alta en la Seguridad Social.';
COMMENT ON COLUMN talent_profiles.onboarding_completed_at IS
  'Marca cuándo el talento completó el wizard. NULL = onboarding pendiente. La aprobación final por admin es independiente (talent_profiles.status).';

-- ── B. Junction relacional para idiomas hablados ──────────────

CREATE TABLE talent_spoken_languages (
  talent_id uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  language_code text NOT NULL REFERENCES spoken_languages(code) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (talent_id, language_code)
);

CREATE INDEX idx_tsl_language ON talent_spoken_languages(language_code);

COMMENT ON TABLE talent_spoken_languages IS
  'Idiomas hablados por cada talento (junction). Reemplaza profiles.other_language[]. FK a spoken_languages para integridad referencial.';

-- profiles.other_language sin datos legacy → drop directo.
ALTER TABLE profiles DROP COLUMN other_language;

-- ── C. Preguntas talento por servicio (paralelo a services.questions) ─

ALTER TABLE services
  ADD COLUMN talent_questions jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN services.talent_questions IS
  'Array de Question objects que el admin define para que el TALENTO responda durante onboarding. Mismo shape que services.questions (preguntas para cliente). Renderer: shared/components/question-renderers.';

-- ── D. Extender talent_service_subtypes con question_key ──────

-- Tabla vacía → seguros con NOT NULL desde el inicio.
ALTER TABLE talent_service_subtypes
  ADD COLUMN question_key text NOT NULL DEFAULT '';

ALTER TABLE talent_service_subtypes
  DROP CONSTRAINT talent_service_subtypes_pkey;

ALTER TABLE talent_service_subtypes
  ADD CONSTRAINT talent_service_subtypes_pkey
  PRIMARY KEY (talent_id, subtype_id, question_key);

-- Quitar el default '' del schema (era solo para evitar ALTER NOT NULL fail si hubiera rows).
ALTER TABLE talent_service_subtypes
  ALTER COLUMN question_key DROP DEFAULT;

COMMENT ON COLUMN talent_service_subtypes.question_key IS
  'Identificador de la pregunta talento que produjo esta selección de subtype. Permite que un mismo subtype aparezca como respuesta en preguntas distintas.';
