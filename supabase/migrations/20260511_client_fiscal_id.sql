-- Add fiscal_id (the number itself) to client_profiles.
--
-- client_profiles already has fiscal_id_type_id (FK to fiscal_id_types), but
-- not the fiscal number. This aligns with talent_profiles, which carries both
-- fiscal_id_type_id and fiscal_id (Phase B). Required so that orders can
-- snapshot the registered client's fiscal data into contact_fiscal_* fields,
-- and so that future invoicing has complete data on the client party.
--
-- Aditive only. No backfill: existing client_profiles rows keep fiscal_id NULL
-- until the next contracting flow asks for it.

ALTER TABLE client_profiles
  ADD COLUMN fiscal_id text;

COMMENT ON COLUMN client_profiles.fiscal_id IS
  'Fiscal number (NIF/CUIT/NIE/...) of the client. Type is resolved via fiscal_id_type_id. Validated against src/shared/fiscal/validators.ts by code.';
