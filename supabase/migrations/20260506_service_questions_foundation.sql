-- Service questions foundation (Phase B-ext / Phase C):
-- 1) services.questions jsonb: array of admin-defined questions per service.
-- 2) order_subtypes: relational table for answers that reference subtypes
--    (via singleSelect/multiSelect with optionsSource='subtype').
--    Hybrid model: scalar answers live in orders.form_data jsonb (already exists),
--    subtype answers ALSO get FK rows for clean SQL queries / reporting.

-- ── 1. services.questions ──────────────────────────────────────

ALTER TABLE services
  ADD COLUMN questions jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN services.questions IS
  'Ordered array of Question objects defined by admin. Each: {key, type, required, i18n, options? | subtypeGroupSlug? + subtypeExcludedIds?, fileConfig? (allowedTypes, maxSizeMb)}. Renderer maps type → input. Answers persist to orders.form_data using `key`.';

-- ── 2. order_subtypes (relational mirror for subtype answers) ──

CREATE TABLE order_subtypes (
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  subtype_id uuid NOT NULL REFERENCES service_subtypes(id),
  question_key text NOT NULL,
  PRIMARY KEY (order_id, subtype_id, question_key)
);

CREATE INDEX idx_order_subtypes_subtype ON order_subtypes(subtype_id);
CREATE INDEX idx_order_subtypes_order ON order_subtypes(order_id);

COMMENT ON TABLE order_subtypes IS
  'Relational mirror of subtype-typed answers stored in orders.form_data. Populated on order create when a question has optionsSource=subtype. Allows admin queries like "orders where subtype=X" without jsonb operators.';

-- ── 3. Storage bucket for file-typed answers ───────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('order-attachments', 'order-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the bucket are intentionally NOT defined here. They will be
-- added in S5 once the auth flow (guest / signup / login) is implemented and
-- we know exactly which paths each role needs access to. Until then, the
-- bucket is locked by default RLS (no access).
