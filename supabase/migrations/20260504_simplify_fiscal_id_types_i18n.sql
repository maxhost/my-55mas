-- Simplify fiscal_id_types.i18n shape from {label, help} to {label} only.
-- Phase B decision: admin only edits the label per locale; help is unused by
-- the public form (get-form-context.ts only reads label).
--
-- Strip the `help` key from every locale entry of every row.

UPDATE fiscal_id_types
SET i18n = (
  SELECT jsonb_object_agg(locale, jsonb_build_object('label', entry->>'label'))
  FROM jsonb_each(i18n) AS each_row(locale, entry)
  WHERE entry->>'label' IS NOT NULL
)
WHERE i18n <> '{}'::jsonb;
