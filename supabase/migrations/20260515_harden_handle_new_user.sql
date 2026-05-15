-- Security hardening: self-service signup must NEVER let the caller
-- choose a role. Before this, handle_new_user read
-- raw_user_meta_data->>'role' (defaulting to 'client') and accepted
-- any of {client,talent,admin,manager,viewer}. Since the anon key
-- ships in the browser, anyone could signUp with
-- options.data.role='admin' and the trigger seeded
-- user_roles(admin) + active_role='admin' on INSERT (the
-- check_active_role trigger is BEFORE UPDATE only, so it does not
-- block INSERTs). Active privilege escalation.
--
-- Fix: signup always seeds 'client'. Elevated/talent roles are
-- granted exclusively server-side (talent → register_talent_profile
-- RPC; admin/manager → service-role tooling). Verified no legitimate
-- flow (talent register, signupClient, anonymous guest) passes a
-- role in metadata, so clamping is safe. Everything else
-- (full_name/email, SECURITY DEFINER, search_path, profiles +
-- user_roles inserts, owner, grants) is preserved verbatim.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _role text;
BEGIN
  -- Self-service signup is ALWAYS 'client'. Role in metadata is
  -- ignored on purpose (anti privilege-escalation).
  _role := 'client';

  INSERT INTO public.profiles (id, email, full_name, active_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    _role
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$function$;
