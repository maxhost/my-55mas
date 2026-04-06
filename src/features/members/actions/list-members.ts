'use server';

import { createClient } from '@/lib/supabase/server';
import { buildNameMap, buildTeamsMap } from './list-members-helpers';
import type { MemberListItem, StaffRole } from '../types';

type ListMembersParams = { locale: string };

export async function listMembers({
  locale,
}: ListMembersParams): Promise<MemberListItem[]> {
  const supabase = createClient();

  // Query 1: staff user_roles + profiles
  const { data: staffRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role, created_at, profiles!user_roles_user_id_fkey(full_name, email)')
    .in('role', ['admin', 'manager', 'viewer'])
    .order('created_at', { ascending: false });

  if (rolesError) throw rolesError;
  if (!staffRoles || staffRoles.length === 0) return [];

  const userIds = staffRoles.map((r) => r.user_id);

  // Query 2: staff_role_scopes for country/city
  const { data: scopes, error: scopesError } = await supabase
    .from('staff_role_scopes')
    .select('user_id, country_id, city_id')
    .in('user_id', userIds);

  if (scopesError) throw scopesError;

  // Query 3: team memberships
  const { data: teamMemberships, error: teamsError } = await supabase
    .from('team_members')
    .select('user_id, team_id, teams!inner(id, name)')
    .in('user_id', userIds);

  if (teamsError) throw teamsError;

  // Query 4: staff_roles display names
  const { data: roleNames, error: roleNamesError } = await supabase
    .from('staff_roles')
    .select('key, display_name');

  if (roleNamesError) throw roleNamesError;

  // Query 5: localized country/city names
  const { data: countries, error: countriesErr } = await supabase
    .from('countries_localized')
    .select('id, name')
    .eq('locale', locale);

  if (countriesErr) throw countriesErr;

  const { data: cities, error: citiesErr } = await supabase
    .from('cities_localized')
    .select('id, name')
    .eq('locale', locale);

  if (citiesErr) throw citiesErr;

  // Build lookup maps
  const scopeMap = new Map(
    (scopes ?? []).map((s) => [s.user_id, s])
  );
  const teamsMap = buildTeamsMap(
    (teamMemberships ?? []) as { user_id: string; team_id: string; teams: { id: string; name: string } | null }[]
  );
  const roleNameMap = new Map(
    (roleNames ?? []).map((r) => [r.key, r.display_name])
  );
  const countryMap = buildNameMap(countries ?? []);
  const cityMap = buildNameMap(cities ?? []);

  return staffRoles.map((r) => {
    const profile = r.profiles as unknown as { full_name: string | null; email: string | null };
    const scope = scopeMap.get(r.user_id);

    return {
      user_id: r.user_id,
      full_name: profile.full_name,
      email: profile.email,
      role: r.role as StaffRole,
      role_display_name: roleNameMap.get(r.role) ?? r.role,
      country_id: scope?.country_id ?? null,
      country_name: scope?.country_id ? countryMap.get(scope.country_id) ?? null : null,
      city_id: scope?.city_id ?? null,
      city_name: scope?.city_id ? cityMap.get(scope.city_id) ?? null : null,
      teams: teamsMap.get(r.user_id) ?? [],
      created_at: r.created_at,
    };
  });
}
