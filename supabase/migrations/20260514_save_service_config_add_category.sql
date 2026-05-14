-- Extends `save_service_config` RPC with `p_category` parameter so the
-- admin Configuración tab can persist the new `services.category` enum
-- atomically alongside status / allows_recurrence / countries / cities.
--
-- Semantics: `p_category` is DIRECT SET (not COALESCE) — caller must
-- always pass the current value (NULL allowed to clear). Today the only
-- caller is `src/features/services/actions/update-service.ts` which
-- always reads the form state and passes it. Any future caller MUST
-- also pass `p_category` explicitly or the column will be cleared.

CREATE OR REPLACE FUNCTION public.save_service_config(
  p_service_id uuid,
  p_status text DEFAULT NULL,
  p_allows_recurrence boolean DEFAULT NULL,
  p_countries jsonb DEFAULT '[]'::jsonb,
  p_cities jsonb DEFAULT '[]'::jsonb,
  p_category service_category DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update service fields
  UPDATE services SET
    status = COALESCE(p_status, status),
    allows_recurrence = COALESCE(p_allows_recurrence, allows_recurrence),
    category = p_category,
    updated_at = now()
  WHERE id = p_service_id;

  -- Replace countries (delete-all + insert)
  DELETE FROM service_countries WHERE service_id = p_service_id;
  IF jsonb_array_length(p_countries) > 0 THEN
    INSERT INTO service_countries (service_id, country_id, base_price, is_active)
    SELECT p_service_id, (c->>'country_id')::uuid, (c->>'base_price')::numeric, (c->>'is_active')::boolean
    FROM jsonb_array_elements(p_countries) AS c;
  END IF;

  -- Replace cities (delete-all + insert)
  DELETE FROM service_cities WHERE service_id = p_service_id;
  IF jsonb_array_length(p_cities) > 0 THEN
    INSERT INTO service_cities (service_id, city_id, base_price, is_active)
    SELECT p_service_id, (c->>'city_id')::uuid, (c->>'base_price')::numeric, (c->>'is_active')::boolean
    FROM jsonb_array_elements(p_cities) AS c;
  END IF;
END;
$function$;
