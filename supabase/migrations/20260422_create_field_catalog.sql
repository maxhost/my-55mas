-- ══════════════════════════════════════════════════════
-- Field Catalog: grupos, definiciones, traducciones, respuestas
-- ══════════════════════════════════════════════════════

-- Grupos de campos (categorías reutilizables)
CREATE TABLE form_field_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  sort_order int NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Traducciones de grupos
CREATE TABLE form_field_group_translations (
  group_id uuid NOT NULL REFERENCES form_field_groups(id) ON DELETE CASCADE,
  locale   text NOT NULL,
  name     text NOT NULL,
  PRIMARY KEY (group_id, locale)
);

-- Definiciones de campos (catálogo central)
CREATE TABLE form_field_definitions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           uuid NOT NULL REFERENCES form_field_groups(id),
  key                text NOT NULL UNIQUE,
  input_type         text NOT NULL,
  persistence_type   text NOT NULL,
  persistence_target jsonb,
  options            jsonb,
  options_source     text,
  sort_order         int NOT NULL DEFAULT 0,
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

-- Traducciones de campos
CREATE TABLE form_field_definition_translations (
  field_id      uuid NOT NULL REFERENCES form_field_definitions(id) ON DELETE CASCADE,
  locale        text NOT NULL,
  label         text NOT NULL,
  placeholder   text,
  description   text,
  option_labels jsonb,
  PRIMARY KEY (field_id, locale)
);

-- Respuestas de usuario vinculadas a campo (cross-form)
CREATE TABLE user_form_responses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  field_definition_id uuid NOT NULL REFERENCES form_field_definitions(id),
  value               jsonb,
  updated_at          timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, field_definition_id)
);

-- Indexes para queries frecuentes
CREATE INDEX idx_ufr_user ON user_form_responses(user_id);
CREATE INDEX idx_ufr_field ON user_form_responses(field_definition_id);
CREATE INDEX idx_ffd_group ON form_field_definitions(group_id);
CREATE INDEX idx_ffd_active ON form_field_definitions(is_active) WHERE is_active = true;

-- Constraints: validar valores de input_type y persistence_type
ALTER TABLE form_field_definitions
  ADD CONSTRAINT chk_input_type CHECK (
    input_type IN ('text', 'email', 'password', 'number', 'date', 'boolean', 'textarea', 'single_select', 'multiselect')
  ),
  ADD CONSTRAINT chk_persistence_type CHECK (
    persistence_type IN ('db_column', 'auth', 'form_response', 'survey', 'service_select', 'subtype')
  );
