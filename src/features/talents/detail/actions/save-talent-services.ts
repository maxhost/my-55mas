'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type { Question } from '@/shared/lib/questions/types';
import { saveTalentServicesSchema } from '../schemas';

type Result = { data: { ok: true } } | { error: { message: string } };

const LEGACY_QUESTION_KEY = 'legacy_import';

/**
 * Reconciles `talent_services` for a (talent, country) scope:
 * upserts kept/added entries and deletes removed ones. When services are
 * removed, also deletes the matching `talent_service_subtypes` rows but ONLY
 * for question_keys belonging to those removed services — never touches
 * subtypes that other services still own.
 */
export async function saveTalentServices(input: unknown): Promise<Result> {
  const supabase = createClient();

  const parsed = saveTalentServicesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { talentId, countryId, entries } = parsed.data;

  const { data: existing, error: existErr } = await supabase
    .from('talent_services')
    .select('service_id')
    .eq('talent_id', talentId)
    .eq('country_id', countryId);
  if (existErr) return { error: { message: existErr.message } };

  const incomingIds = new Set(entries.map((e) => e.service_id));
  const removedIds = (existing ?? [])
    .map((r) => r.service_id)
    .filter((id) => !incomingIds.has(id));

  if (removedIds.length > 0) {
    const subtypeKeysToRemove = await collectSubtypeQuestionKeys(supabase, removedIds, incomingIds);
    if ('error' in subtypeKeysToRemove) return { error: { message: subtypeKeysToRemove.error } };

    if (subtypeKeysToRemove.keys.length > 0) {
      const { error: subErr } = await supabase
        .from('talent_service_subtypes')
        .delete()
        .eq('talent_id', talentId)
        .in('question_key', subtypeKeysToRemove.keys)
        .neq('question_key', LEGACY_QUESTION_KEY);
      if (subErr) return { error: { message: subErr.message } };
    }

    const { error: delErr } = await supabase
      .from('talent_services')
      .delete()
      .eq('talent_id', talentId)
      .eq('country_id', countryId)
      .in('service_id', removedIds);
    if (delErr) return { error: { message: delErr.message } };
  }

  if (entries.length > 0) {
    const upsertRows = entries.map((e) => ({
      talent_id: talentId,
      service_id: e.service_id,
      country_id: countryId,
      unit_price: e.unit_price,
      form_data: (e.answers as unknown) as Json,
    }));
    const { error } = await supabase
      .from('talent_services')
      .upsert(upsertRows, { onConflict: 'talent_id,service_id,country_id' });
    if (error) return { error: { message: error.message } };
  }

  revalidatePath('/[locale]/(admin)/admin/talents/[id]', 'page');
  return { data: { ok: true } };
}

/**
 * Returns the set of question_keys that belong to the removed services AND
 * are NOT also present in any kept service. This prevents nuking subtype
 * assignments for questions that the talent still has via another service.
 */
async function collectSubtypeQuestionKeys(
  supabase: ReturnType<typeof createClient>,
  removedServiceIds: string[],
  keptServiceIds: Set<string>,
): Promise<{ keys: string[] } | { error: string }> {
  const allRelevantIds = [...removedServiceIds, ...Array.from(keptServiceIds)];
  if (allRelevantIds.length === 0) return { keys: [] };

  const { data, error } = await supabase
    .from('services')
    .select('id, talent_questions')
    .in('id', allRelevantIds);
  if (error) return { error: error.message };

  const removedSet = new Set(removedServiceIds);
  const keysFromRemoved = new Set<string>();
  const keysFromKept = new Set<string>();

  for (const row of data ?? []) {
    const questions = ((row.talent_questions as unknown) as Question[]) ?? [];
    for (const q of questions) {
      if (q.optionsSource !== 'subtype') continue;
      if (q.type !== 'singleSelect' && q.type !== 'multiSelect') continue;
      if (!q.key || q.key === LEGACY_QUESTION_KEY) continue;
      if (removedSet.has(row.id)) keysFromRemoved.add(q.key);
      else keysFromKept.add(q.key);
    }
  }

  const safe = Array.from(keysFromRemoved).filter((k) => !keysFromKept.has(k));
  return { keys: safe };
}
