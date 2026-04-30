-- Clona el field_definition `mis_servicios` (1d78dd8c-...) para uso
-- exclusivo en el form de registro. El field original se migra a
-- input_type='talent_services_panel' (composite) y queda referenciado
-- solo desde el form de onboarding.
--
-- Por qué: el panel requiere talent autenticado + country+city
-- configurados. En registro el user no existe todavía → renderearlo allá
-- mostraría errors. El clon mantiene un multiselect plano para registro.
--
-- Idempotente: el guard inicial evita doble aplicación.
--
-- Rollback: revertir UPDATE input_type del field original; eliminar el
-- clon; restaurar schema del registro form. Manual.

DO $$
DECLARE
  v_new_id uuid;
BEGIN
  -- Guard idempotency: si ya existe el clon (por key), saltear.
  SELECT id INTO v_new_id
  FROM form_field_definitions
  WHERE key = 'mis_servicios_registro'
  LIMIT 1;

  IF v_new_id IS NOT NULL THEN
    RAISE NOTICE 'Clon ya existe (id %), migración skip.', v_new_id;
    RETURN;
  END IF;

  v_new_id := gen_random_uuid();

  -- 1. Insert clon del field_definition.
  INSERT INTO form_field_definitions (
    id, group_id, key, input_type, persistence_type,
    persistence_target, options, options_source, config, sort_order, is_active
  )
  VALUES (
    v_new_id,
    '76c7f2f9-37e4-4d42-9759-520c63da523b',
    'mis_servicios_registro',
    'multiselect_dropdown',
    'service_select',
    NULL, NULL, NULL, NULL, 0, true
  );

  -- 2. Clonar translations del field original.
  INSERT INTO form_field_definition_translations (
    field_id, locale, label, placeholder, description, option_labels
  )
  SELECT v_new_id, locale, label, placeholder, description, option_labels
  FROM form_field_definition_translations
  WHERE field_id = '1d78dd8c-86ff-4ffb-8d70-35dd7559f923';

  -- 3. UPDATE schema del registro form: reemplazar 1d78dd8c por el clon.
  -- Usamos REPLACE sobre schema::text porque jsonb_set es complicado
  -- para encontrar el path exacto dentro de un array de steps.
  UPDATE registration_forms
  SET schema = REPLACE(
    schema::text,
    '1d78dd8c-86ff-4ffb-8d70-35dd7559f923',
    v_new_id::text
  )::jsonb
  WHERE id = 'ec10aa28-509d-4dea-a258-aaed792ed239';

  -- 4. UPDATE input_type del field original a talent_services_panel.
  -- Ahora referenciado solo desde el form de onboarding.
  UPDATE form_field_definitions
  SET input_type = 'talent_services_panel'
  WHERE id = '1d78dd8c-86ff-4ffb-8d70-35dd7559f923';

  RAISE NOTICE 'Migración aplicada. Nuevo clon: %', v_new_id;
END $$;
