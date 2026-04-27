'use server';

import type { Sb } from '@/shared/lib/field-catalog/persistence/context';
import type { EmbedReason } from '@/shared/lib/embed/types';

export type TalentAccessReason = Extract<
  EmbedReason,
  | 'not-authenticated'
  | 'no-talent-profile'
  | 'talent-country-not-set'
  | 'country-mismatch'
>;

export type TalentAccessResult =
  | {
      granted: true;
      talentId: string;
      countryId: string;
      cityId: string | null;
    }
  | { granted: false; reason: TalentAccessReason };

// Decide si el talent autenticado puede ver el form de un site dado.
//
// Pasos (estrictamente serial — cada uno depende del anterior):
// 1. userId null → not-authenticated.
// 2. talent_profiles WHERE user_id = ? → null → no-talent-profile.
// 3. profile.country_id === null → talent-country-not-set.
// 4. profile.country_id !== siteCountryId → country-mismatch.
// 5. granted con talentId + countryId + cityId.
//
// El cityId puede ser null (talent sin city seteada) — el loader del form
// hace fallback a la variant general en ese caso.
export async function resolveTalentAccess(
  supabase: Sb,
  userId: string | null,
  siteCountryId: string
): Promise<TalentAccessResult> {
  if (!userId) return { granted: false, reason: 'not-authenticated' };

  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('id, country_id, city_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return { granted: false, reason: 'no-talent-profile' };

  if (profile.country_id === null) {
    return { granted: false, reason: 'talent-country-not-set' };
  }

  if (profile.country_id !== siteCountryId) {
    return { granted: false, reason: 'country-mismatch' };
  }

  return {
    granted: true,
    talentId: profile.id,
    countryId: profile.country_id,
    cityId: profile.city_id,
  };
}
