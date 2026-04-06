import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Supabase client with service_role key — bypasses RLS.
 * Use ONLY for admin operations like auth.admin.inviteUserByEmail().
 * Never expose this client to the browser.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
