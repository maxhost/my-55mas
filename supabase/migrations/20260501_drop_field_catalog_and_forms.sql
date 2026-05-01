-- Drop field catalog + dynamic forms system (scorched earth).
-- Survives: survey_questions, survey_question_translations, survey_responses
-- (used by /admin/survey-questions and /admin/migration tool).

-- Step 1: Drop FK constraints + columns from surviving tables (orders, talent_services).
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_form_id_fkey;
ALTER TABLE orders DROP COLUMN IF EXISTS form_id;

ALTER TABLE talent_services DROP CONSTRAINT IF EXISTS talent_services_form_id_fkey;
ALTER TABLE talent_services DROP COLUMN IF EXISTS form_id;

-- Step 2: Drop field catalog tables (CASCADE clears FKs from translations / user_form_responses).
DROP TABLE IF EXISTS user_form_responses CASCADE;
DROP TABLE IF EXISTS form_field_definition_translations CASCADE;
DROP TABLE IF EXISTS form_field_definitions CASCADE;
DROP TABLE IF EXISTS form_field_group_translations CASCADE;
DROP TABLE IF EXISTS form_field_groups CASCADE;

-- Step 3: Drop registration forms.
DROP TABLE IF EXISTS registration_form_cities CASCADE;
DROP TABLE IF EXISTS registration_form_countries CASCADE;
DROP TABLE IF EXISTS registration_form_translations CASCADE;
DROP TABLE IF EXISTS registration_forms CASCADE;

-- Step 4: Drop service forms.
DROP TABLE IF EXISTS service_form_cities CASCADE;
DROP TABLE IF EXISTS service_form_countries CASCADE;
DROP TABLE IF EXISTS service_form_translations CASCADE;
DROP TABLE IF EXISTS service_forms CASCADE;

-- Step 5: Drop talent forms.
DROP TABLE IF EXISTS talent_form_cities CASCADE;
DROP TABLE IF EXISTS talent_form_countries CASCADE;
DROP TABLE IF EXISTS talent_form_translations CASCADE;
DROP TABLE IF EXISTS talent_forms CASCADE;
