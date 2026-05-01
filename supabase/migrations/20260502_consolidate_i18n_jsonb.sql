-- Consolidate 8 *_translations tables into i18n jsonb columns on parent entities.
-- Pattern per entity: ADD COLUMN i18n jsonb -> backfill via jsonb_object_agg ->
-- DROP TABLE *_translations CASCADE.
-- Drop the 2 *_localized views still in use (consumers will be refactored).
-- Drop redundant cities.name column (i18n becomes the only source).

-- 1. countries
ALTER TABLE countries ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE countries c SET i18n = COALESCE((
  SELECT jsonb_object_agg(ct.locale, jsonb_build_object('name', ct.name))
  FROM country_translations ct WHERE ct.country_id = c.id
), '{}'::jsonb);
DROP TABLE country_translations CASCADE;

-- 2. cities (also drop redundant cities.name)
ALTER TABLE cities ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE cities c SET i18n = COALESCE((
  SELECT jsonb_object_agg(ct.locale, jsonb_build_object('name', ct.name))
  FROM city_translations ct WHERE ct.city_id = c.id
), '{}'::jsonb);
DROP TABLE city_translations CASCADE;
ALTER TABLE cities DROP COLUMN name;

-- 3. services (8 i18n fields, includes nested jsonb arrays benefits/guarantees/faqs)
ALTER TABLE services ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE services s SET i18n = COALESCE((
  SELECT jsonb_object_agg(
    st.locale,
    jsonb_strip_nulls(jsonb_build_object(
      'name', st.name,
      'description', st.description,
      'includes', st.includes,
      'hero_title', st.hero_title,
      'hero_subtitle', st.hero_subtitle,
      'benefits', st.benefits,
      'guarantees', st.guarantees,
      'faqs', st.faqs
    ))
  )
  FROM service_translations st WHERE st.service_id = s.id
), '{}'::jsonb);
DROP TABLE service_translations CASCADE;

-- 4. service_subtype_groups
ALTER TABLE service_subtype_groups ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE service_subtype_groups g SET i18n = COALESCE((
  SELECT jsonb_object_agg(t.locale, jsonb_build_object('name', t.name))
  FROM service_subtype_group_translations t WHERE t.group_id = g.id
), '{}'::jsonb);
DROP TABLE service_subtype_group_translations CASCADE;

-- 5. service_subtypes
ALTER TABLE service_subtypes ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE service_subtypes st SET i18n = COALESCE((
  SELECT jsonb_object_agg(t.locale, jsonb_build_object('name', t.name))
  FROM service_subtype_translations t WHERE t.subtype_id = st.id
), '{}'::jsonb);
DROP TABLE service_subtype_translations CASCADE;

-- 6. talent_tags (50 rows of real data)
ALTER TABLE talent_tags ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE talent_tags tg SET i18n = COALESCE((
  SELECT jsonb_object_agg(t.locale, jsonb_build_object('name', t.name))
  FROM talent_tag_translations t WHERE t.tag_id = tg.id
), '{}'::jsonb);
DROP TABLE talent_tag_translations CASCADE;

-- 7. spoken_languages
ALTER TABLE spoken_languages ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE spoken_languages sl SET i18n = COALESCE((
  SELECT jsonb_object_agg(t.locale, jsonb_build_object('name', t.name))
  FROM spoken_language_translations t WHERE t.language_code = sl.code
), '{}'::jsonb);
DROP TABLE spoken_language_translations CASCADE;

-- 8. survey_questions (3 i18n fields including nested option_labels jsonb)
ALTER TABLE survey_questions ADD COLUMN i18n jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE survey_questions q SET i18n = COALESCE((
  SELECT jsonb_object_agg(
    t.locale,
    jsonb_strip_nulls(jsonb_build_object(
      'label', t.label,
      'description', t.description,
      'option_labels', t.option_labels
    ))
  )
  FROM survey_question_translations t WHERE t.question_id = q.id
), '{}'::jsonb);
DROP TABLE survey_question_translations CASCADE;

-- Drop the 2 *_localized views still in use (consumers refactored next).
DROP VIEW IF EXISTS cities_localized CASCADE;
DROP VIEW IF EXISTS countries_localized CASCADE;
