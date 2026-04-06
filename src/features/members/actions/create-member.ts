'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createMemberSchema } from '../schemas';
import type { CreateMemberInput } from '../schemas';

type Result = { success: true } | { error: Record<string, string[]> };

export async function createMember(input: CreateMemberInput): Promise<Result> {
  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { first_name, last_name, email, role, country_id, city_id, team_id } = parsed.data;
  const fullName = `${first_name} ${last_name}`;

  // Get current admin user ID for audit fields
  const supabase = createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const adminId = currentUser?.id ?? null;

  const admin = createAdminClient();
  let userId: string | null = null;

  try {
    // Step 1: Invite user via email (trigger creates profile + user_roles)
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
      email,
      { data: { role, full_name: fullName } }
    );

    if (authError) {
      return { error: { email: [authError.message] } };
    }

    userId = authData.user.id;

    // Step 2: Create staff_profiles (triggers sync_full_name → profiles.full_name)
    const { error: profileError } = await admin
      .from('staff_profiles')
      .insert({ user_id: userId, first_name, last_name });

    if (profileError) throw profileError;

    // Step 3: Set granted_by for audit trail
    if (adminId) {
      await admin
        .from('user_roles')
        .update({ granted_by: adminId })
        .eq('user_id', userId)
        .eq('role', role);
    }

    // Step 4: Create scope for manager/viewer
    if (role !== 'admin' && country_id) {
      const { error: scopeError } = await admin
        .from('staff_role_scopes')
        .insert({ user_id: userId, role, country_id, city_id });

      if (scopeError) throw scopeError;
    }

    // Step 5: Add to team if selected
    if (team_id) {
      const { error: teamError } = await admin
        .from('team_members')
        .insert({ team_id, user_id: userId, added_by: adminId });

      if (teamError) throw teamError;
    }
  } catch (err) {
    // Cleanup: delete auth user if it was created
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: { _server: [message] } };
  }

  revalidatePath('/[locale]/(admin)/admin/members', 'layout');
  return { success: true };
}
