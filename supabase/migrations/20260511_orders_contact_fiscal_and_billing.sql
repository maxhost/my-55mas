-- Add fiscal contact fields and billing override to orders.
--
-- orders.contact_* already carries name/email/phone/address of the contracting
-- party (snapshotted at submit). Two gaps remain:
--   1) No fiscal identification of the contact (type + number). Required for
--      invoicing and for guest orders that never had a registered profile.
--   2) No way to invoice a different party than the contact. The new
--      billing_override jsonb is NULL when factura = contact data; populated
--      when the user explicitly chose "factura a otros datos".
--
-- billing_override shape (enforced by CHECK):
--   { name text, phone text, fiscal_id_type_id uuid, fiscal_id text }
-- We require all four keys when present so downstream invoicing never needs
-- to handle a half-filled override. Address/company are intentionally out of
-- scope for now (see docs/features/client-billing-data.md §"Out of scope").
--
-- ON DELETE SET NULL on the FK: deleting a fiscal type from the catalog must
-- not destroy historical orders; the snapshot value of contact_fiscal_id is
-- preserved even if the type catalog entry disappears.

ALTER TABLE orders
  ADD COLUMN contact_fiscal_id_type_id uuid
    REFERENCES fiscal_id_types(id) ON DELETE SET NULL,
  ADD COLUMN contact_fiscal_id text,
  ADD COLUMN billing_override jsonb;

ALTER TABLE orders
  ADD CONSTRAINT orders_billing_override_shape_chk CHECK (
    billing_override IS NULL OR (
      jsonb_typeof(billing_override) = 'object'
      AND billing_override ? 'name'
      AND billing_override ? 'phone'
      AND billing_override ? 'fiscal_id_type_id'
      AND billing_override ? 'fiscal_id'
      AND jsonb_typeof(billing_override->'name') = 'string'
      AND jsonb_typeof(billing_override->'phone') = 'string'
      AND jsonb_typeof(billing_override->'fiscal_id_type_id') = 'string'
      AND jsonb_typeof(billing_override->'fiscal_id') = 'string'
    )
  );

COMMENT ON COLUMN orders.contact_fiscal_id_type_id IS
  'FK to fiscal_id_types — type of fiscal ID of the contact (NIF/CUIT/...). NULL for orders predating this feature.';

COMMENT ON COLUMN orders.contact_fiscal_id IS
  'Fiscal number of the contact, snapshotted at submit. NULL for orders predating this feature.';

COMMENT ON COLUMN orders.billing_override IS
  'Optional billing party distinct from contact. NULL = invoice with contact_* fields. When set, must contain { name, phone, fiscal_id_type_id, fiscal_id }.';
