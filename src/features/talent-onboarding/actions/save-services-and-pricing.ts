'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json, Database } from '@/lib/supabase/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { saveServicesSchema } from '../schemas';
import type { Question } from '@/shared/lib/questions/types';

type Result = { data: { ok: true } } | { error: { message: string } };
type Supabase = SupabaseClient<Database>;
type Entry = { service_id: string; unit_price: number; answers: Record<string, unknown> };

/** Migration legacy rows use this question_key — must never be deleted/touched here. */
const LEGACY_QUESTION_KEY = 'legacy_import';

/**
 * Step 4 of the talent onboarding wizard.
 *
 * Reconciles two pieces of state for a single (talent, country) scope:
 *   1. talent_services rows (PK: talent_id + service_id + country_id) — upserts
 *      kept/added entries and deletes removed ones.
 *   2. talent_service_subtypes rows (PK: talent_id + subtype_id + question_key)
 *      — recomputes the selected subtypes for single/multiSelect questions
 *      whose `optionsSource === 'subtype'`.
 *
 * Notes:
 *   - talent_service_subtypes.talent_id FK points at talent_profiles.id (not
 *     talent_services), so no CASCADE — we delete subtype rows explicitly.
 *   - Rows with `question_key = 'legacy_import'` come from the CSV migration
 *     tool; never touched here.
 *   - country_id comes from input (the caller knows it from context), not
 *     from profiles.preferred_country.
 */
export async function saveServicesAndPricing(input: unknown): Promise<Result> {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: { message: 'Not authenticated' } };

  const parsed = saveServicesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { message: parsed.error.issues[0]?.message ?? 'Invalid input' } };
  }
  const { country_id, entries } = parsed.data;

  const talentRes = await resolveTalentId(supabase, auth.user.id);
  if ('error' in talentRes) return { error: { message: talentRes.error } };
  const talentId = talentRes.talentId;

  const questionsByService = await loadQuestionsByService(supabase, entries.map((e) => e.service_id));
  if ('error' in questionsByService) return { error: { message: questionsByService.error } };

  const reconcileErr = await reconcileTalentServices({
    supabase,
    talentId,
    countryId: country_id,
    entries,
    questionsByService: questionsByService.data,
  });
  if (reconcileErr) return { error: { message: reconcileErr } };

  const syncErr = await syncSubtypeMirror({
    supabase,
    talentId,
    entries,
    questionsByService: questionsByService.data,
  });
  if (syncErr) return { error: { message: syncErr } };

  revalidatePath('/[locale]/(talent)/portal/onboarding', 'page');
  return { data: { ok: true } };
}

// ── Step helpers ────────────────────────────────────────────

async function resolveTalentId(
  supabase: Supabase,
  userId: string,
): Promise<{ talentId: string } | { error: string }> {
  const { data, error } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: 'Talent profile not found' };
  return { talentId: data.id };
}

async function loadQuestionsByService(
  supabase: Supabase,
  serviceIds: string[],
): Promise<{ data: Map<string, Question[]> } | { error: string }> {
  const { data, error } = await supabase
    .from('services')
    .select('id, talent_questions')
    .in('id', serviceIds);
  if (error) return { error: error.message };
  const map = new Map<string, Question[]>();
  for (const s of data ?? []) {
    map.set(s.id, ((s.talent_questions as unknown) as Question[]) ?? []);
  }
  return { data: map };
}

type ReconcileArgs = {
  supabase: Supabase;
  talentId: string;
  countryId: string;
  entries: Entry[];
  questionsByService: Map<string, Question[]>;
};

async function reconcileTalentServices(args: ReconcileArgs): Promise<string | null> {
  const { supabase, talentId, countryId, entries, questionsByService } = args;

  const { data: existing, error: existErr } = await supabase
    .from('talent_services')
    .select('service_id')
    .eq('talent_id', talentId)
    .eq('country_id', countryId);
  if (existErr) return existErr.message;

  const incomingIds = new Set(entries.map((e) => e.service_id));
  const removedIds = (existing ?? [])
    .map((r) => r.service_id)
    .filter((id) => !incomingIds.has(id));

  if (removedIds.length > 0) {
    const removedKeys = collectSubtypeQuestionKeys(removedIds, questionsByService);
    if (removedKeys.length > 0) {
      const { error } = await supabase
        .from('talent_service_subtypes')
        .delete()
        .eq('talent_id', talentId)
        .in('question_key', removedKeys)
        .neq('question_key', LEGACY_QUESTION_KEY);
      if (error) return error.message;
    }
    const { error } = await supabase
      .from('talent_services')
      .delete()
      .eq('talent_id', talentId)
      .eq('country_id', countryId)
      .in('service_id', removedIds);
    if (error) return error.message;
  }

  if (entries.length === 0) return null;
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
  return error?.message ?? null;
}

type SyncArgs = {
  supabase: Supabase;
  talentId: string;
  entries: Entry[];
  questionsByService: Map<string, Question[]>;
};

async function syncSubtypeMirror(args: SyncArgs): Promise<string | null> {
  const { supabase, talentId, entries, questionsByService } = args;

  const incomingIds = entries.map((e) => e.service_id);
  const allKeys = collectSubtypeQuestionKeys(incomingIds, questionsByService);
  if (allKeys.length > 0) {
    const { error } = await supabase
      .from('talent_service_subtypes')
      .delete()
      .eq('talent_id', talentId)
      .in('question_key', allKeys)
      .neq('question_key', LEGACY_QUESTION_KEY);
    if (error) return error.message;
  }

  const inserts = buildSubtypeInserts(talentId, entries, questionsByService);
  if (inserts.length === 0) return null;
  const { error } = await supabase.from('talent_service_subtypes').insert(inserts);
  return error?.message ?? null;
}

function buildSubtypeInserts(
  talentId: string,
  entries: Entry[],
  questionsByService: Map<string, Question[]>,
): Array<{ talent_id: string; subtype_id: string; question_key: string }> {
  const out: Array<{ talent_id: string; subtype_id: string; question_key: string }> = [];
  for (const entry of entries) {
    const questions = questionsByService.get(entry.service_id) ?? [];
    for (const q of questions) {
      if (q.optionsSource !== 'subtype') continue;
      if (q.type !== 'singleSelect' && q.type !== 'multiSelect') continue;
      if (!q.key || q.key === LEGACY_QUESTION_KEY) continue;
      const subtypeIds = toUuidArray(entry.answers[q.key]);
      for (const subtypeId of subtypeIds) {
        out.push({ talent_id: talentId, subtype_id: subtypeId, question_key: q.key });
      }
    }
  }
  return dedupeSubtypeRows(out);
}

// ── Pure helpers ────────────────────────────────────────────

/** Collect all question_keys (across services) whose options come from a subtype group. */
function collectSubtypeQuestionKeys(
  serviceIds: string[],
  questionsByService: Map<string, Question[]>,
): string[] {
  const keys = new Set<string>();
  for (const sid of serviceIds) {
    const qs = questionsByService.get(sid) ?? [];
    for (const q of qs) {
      if (q.optionsSource !== 'subtype') continue;
      if (q.type !== 'singleSelect' && q.type !== 'multiSelect') continue;
      if (!q.key || q.key === LEGACY_QUESTION_KEY) continue;
      keys.add(q.key);
    }
  }
  return Array.from(keys);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toUuidArray(value: unknown): string[] {
  if (typeof value === 'string') return UUID_RE.test(value) ? [value] : [];
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string' && UUID_RE.test(v));
  }
  return [];
}

function dedupeSubtypeRows<T extends { subtype_id: string; question_key: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    const k = `${r.subtype_id}::${r.question_key}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}
