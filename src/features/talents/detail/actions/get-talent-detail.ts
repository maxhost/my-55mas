'use server';

import { createClient } from '@/lib/supabase/server';
import { composeTalentDetail } from '../lib/compose-talent-detail';
import type { TalentDetail } from '../types';

export async function getTalentDetail(
  talentId: string,
  locale: string,
): Promise<TalentDetail | null> {
  const supabase = createClient();

  const { data: talent } = await supabase
    .from('talent_profiles')
    .select(
      'id, user_id, status, country_id, city_id, photo_url, internal_notes, preferred_payment, onboarding_completed_at, created_at, updated_at',
    )
    .eq('id', talentId)
    .maybeSingle();
  if (!talent) return null;

  const [profileRes, countryRes, cityRes, tagsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', talent.user_id)
      .maybeSingle(),
    talent.country_id
      ? supabase.from('countries').select('id, i18n').eq('id', talent.country_id).maybeSingle()
      : Promise.resolve({ data: null }),
    talent.city_id
      ? supabase.from('cities').select('id, i18n').eq('id', talent.city_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('talent_tag_assignments')
      .select('tag_id, talent_tags(id, i18n)')
      .eq('talent_id', talentId),
  ]);

  return composeTalentDetail({
    profile: profileRes.data ?? null,
    talentProfile: talent,
    country: countryRes.data ?? null,
    city: cityRes.data ?? null,
    tagAssignments:
      (tagsRes.data ?? []).map((r) => ({
        tag_id: r.tag_id,
        talent_tags: (r.talent_tags as unknown) as { id: string; i18n: unknown } | null,
      })) ?? [],
    locale,
  });
}
