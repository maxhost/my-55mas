-- Agrega 'talent_services_panel' al CHECK constraint de input_type.
-- Este input_type compone multiselect + accordion + status + bloqueo de
-- submit en una unidad declarativa del field catalog. Ver
-- docs/features/talent-services-panel.md.
--
-- Idempotente: drop+add del constraint con la lista actualizada.

ALTER TABLE form_field_definitions DROP CONSTRAINT IF EXISTS chk_input_type;

ALTER TABLE form_field_definitions ADD CONSTRAINT chk_input_type CHECK (
  input_type = ANY (ARRAY[
    'text'::text,
    'email'::text,
    'password'::text,
    'number'::text,
    'date'::text,
    'boolean'::text,
    'textarea'::text,
    'single_select'::text,
    'multiselect_checkbox'::text,
    'multiselect_dropdown'::text,
    'address'::text,
    'display_text'::text,
    'terms_checkbox'::text,
    'talent_services_panel'::text
  ])
);
