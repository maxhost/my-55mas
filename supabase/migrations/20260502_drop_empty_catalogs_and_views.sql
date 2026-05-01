-- Drop empty catalogs (categories, service_required_documents) and orphan views.
-- These tables have 0 rows and 0 references in code; they were scaffolding never
-- adopted. talent_profile_translations also goes (user content stays in user's
-- language; bio/experience aren't translated).

-- Drop orphan views first (services_localized, categories_localized never used).
DROP VIEW IF EXISTS services_localized CASCADE;
DROP VIEW IF EXISTS categories_localized CASCADE;

-- Drop services.category_id FK + column before dropping categories.
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_id_fkey;
ALTER TABLE services DROP COLUMN IF EXISTS category_id;

-- Drop categories + translations.
DROP TABLE IF EXISTS category_translations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop service_required_documents + translations.
DROP TABLE IF EXISTS service_required_document_translations CASCADE;
DROP TABLE IF EXISTS service_required_documents CASCADE;

-- Drop talent_profile_translations (talent writes bio in their own language;
-- translation table is over-engineering).
DROP TABLE IF EXISTS talent_profile_translations CASCADE;
