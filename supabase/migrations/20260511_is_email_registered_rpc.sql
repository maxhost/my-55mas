-- RPC: is_email_registered(email) → boolean
--
-- Read-only check used by the guest flow to block continuing as guest when
-- the email already belongs to a real (non-anonymous) account. Returning a
-- boolean (no user_id, no details) limits enumeration risk; the same info is
-- already leaked by Supabase Auth on signUp failure with "User already
-- registered".
--
-- SECURITY DEFINER + locked search_path so the function runs with privileges
-- to read auth.users regardless of the caller's role. Grant to anon so the
-- anonymous (guest) session can check before submit; grant to authenticated
-- so logged-in sessions can also use it (e.g. for client_profiles validation
-- in future flows). Revoked from PUBLIC by default — explicit grants only.
--
-- Case-insensitive match to mirror Supabase Auth's case-insensitive email
-- handling, and excludes anonymous users (email IS NULL for them anyway,
-- but the explicit predicate is defense-in-depth in case future Supabase
-- versions allow anonymous emails).

CREATE OR REPLACE FUNCTION public.is_email_registered(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(p_email)
      AND COALESCE(is_anonymous, false) = false
  );
$$;

REVOKE ALL ON FUNCTION public.is_email_registered(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_email_registered(text) TO anon, authenticated;

COMMENT ON FUNCTION public.is_email_registered(text) IS
  'Returns true when the given email is registered to a non-anonymous auth.users row. Used by the guest flow to block re-use of an account email.';
