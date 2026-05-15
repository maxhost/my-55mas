-- Atomic, secure public talent registration.
--
-- Root cause fixed: `register.ts` set profiles.active_role='talent'
-- WITHOUT first granting the `talent` role in user_roles, so the
-- BEFORE-UPDATE trigger `check_active_role` (validate_active_role)
-- always RAISEd → registration never succeeded and left orphan
-- auth users. This RPC does the whole post-signUp work in ONE
-- transaction, in the correct order (grant role BEFORE flipping
-- active_role), with referential validation and idempotency.
--
-- Security: SECURITY DEFINER + SET search_path='' (no hijack),
-- EXECUTE revoked from PUBLIC/anon/authenticated and granted ONLY
-- to service_role. The Server Action invokes it with the
-- service-role client (key never reaches the browser); p_user_id is
-- always the id returned by THIS request's signUp → no IDOR.

-- Domain invariant + idempotency base: one talent profile per user.
-- Verified no duplicates exist before adding the constraint.
-- Idempotent (ADD CONSTRAINT IF NOT EXISTS is unsupported in PG).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'talent_profiles_user_id_key'
      AND conrelid = 'public.talent_profiles'::regclass
  ) THEN
    ALTER TABLE public.talent_profiles
      ADD CONSTRAINT talent_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.register_talent_profile(
  p_user_id uuid,
  p_phone text,
  p_address jsonb,
  p_country_id uuid,
  p_city_id uuid,
  p_fiscal_id_type_id uuid,
  p_fiscal_id text,
  p_additional_info text,
  p_terms_accepted boolean,
  p_marketing_consent boolean,
  p_preferred_locale text,
  p_service_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_talent_id uuid;
  v_invalid int;
BEGIN
  -- Preconditions.
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unexpected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'unexpected');
  END IF;
  -- Idempotent: own double-submit / network-retry → success, no-op.
  IF EXISTS (
    SELECT 1 FROM public.talent_profiles WHERE user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('ok', true, 'code', 'already_registered');
  END IF;

  -- Referential validation (source of truth; clean typed codes so
  -- the city/country backstop trigger never surfaces as opaque).
  IF NOT EXISTS (
    SELECT 1 FROM public.countries
    WHERE id = p_country_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_location');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.cities
    WHERE id = p_city_id AND country_id = p_country_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_location');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.fiscal_id_types WHERE id = p_fiscal_id_type_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_fiscal_type');
  END IF;
  IF p_preferred_locale IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.languages WHERE code = p_preferred_locale
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_locale');
  END IF;

  -- Services must be: active in the country, active in the city, and
  -- the service published. Mirrors getServicesByLocation 1:1.
  SELECT count(*) INTO v_invalid
  FROM unnest(p_service_ids) AS sid
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.service_countries sc
    JOIN public.service_cities scc ON scc.service_id = sc.service_id
    JOIN public.services s ON s.id = sc.service_id
    WHERE sc.service_id = sid
      AND sc.country_id = p_country_id AND sc.is_active = true
      AND scc.city_id = p_city_id AND scc.is_active = true
      AND s.status = 'published'
  );
  IF v_invalid > 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_services');
  END IF;

  -- Order is critical: grant role BEFORE flipping active_role so the
  -- BEFORE-UPDATE check_active_role trigger sees it (same tx).
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'talent')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles SET
    phone = p_phone,
    address = p_address,
    preferred_country = p_country_id,
    preferred_city = p_city_id,
    preferred_locale = p_preferred_locale,
    active_role = 'talent'
  WHERE id = p_user_id;

  INSERT INTO public.talent_profiles (
    user_id, status, country_id, city_id, fiscal_id_type_id,
    fiscal_id, terms_accepted, marketing_consent, additional_info
  ) VALUES (
    p_user_id, 'registered', p_country_id, p_city_id,
    p_fiscal_id_type_id, p_fiscal_id, p_terms_accepted,
    p_marketing_consent, p_additional_info
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_talent_id;

  IF v_talent_id IS NULL THEN
    SELECT id INTO v_talent_id
    FROM public.talent_profiles WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.talent_services (
    talent_id, service_id, country_id, is_verified
  )
  SELECT v_talent_id, s, p_country_id, false
  FROM unnest(p_service_ids) AS s
  ON CONFLICT (talent_id, service_id, country_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.register_talent_profile(
  uuid, text, jsonb, uuid, uuid, uuid, text, text, boolean,
  boolean, text, uuid[]
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.register_talent_profile(
  uuid, text, jsonb, uuid, uuid, uuid, text, text, boolean,
  boolean, text, uuid[]
) TO service_role;
