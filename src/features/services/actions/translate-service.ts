'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { serviceTranslationSchema } from '../schemas';
import {
  translateServiceTranslation,
  type TranslationPayload,
  type TranslationTarget,
} from '../lib/translate-with-claude';
import type { ServiceTranslationDetail } from '../types';

const TARGET_LOCALES: readonly TranslationTarget[] = [
  'en',
  'pt',
  'fr',
  'ca',
] as const;

type TranslateServiceError =
  | 'invalid-input'
  | 'es-incomplete'
  | 'translate-failed'
  | 'db-failed';

type TranslateServiceResult =
  | { data: { translatedLocales: TranslationTarget[] } }
  | { error: TranslateServiceError };

const translateServiceInputSchema = z.object({
  service_id: z.string().uuid(),
  esTranslation: serviceTranslationSchema.extend({
    locale: z.literal('es'),
  }),
});

// Public input type — uses the runtime `ServiceTranslationDetail` (with
// nullable optional fields) so callers from the form can pass the live
// state directly. `normalizeEsInput` coerces null → '' before Zod parse.
type TranslateServiceInput = {
  service_id: string;
  esTranslation: ServiceTranslationDetail;
};

// Build the persisted entry the same way saveTranslation does — only
// include keys with content so the jsonb stays clean.
function buildEntry(
  payload: TranslationPayload,
): Record<string, unknown> {
  const entry: Record<string, unknown> = { name: payload.name };
  if (payload.description) entry.description = payload.description;
  if (payload.includes) entry.includes = payload.includes;
  if (payload.hero_title) entry.hero_title = payload.hero_title;
  if (payload.hero_subtitle) entry.hero_subtitle = payload.hero_subtitle;
  if (payload.benefits.length) entry.benefits = payload.benefits;
  if (payload.guarantees.length) entry.guarantees = payload.guarantees;
  if (payload.faqs.length) entry.faqs = payload.faqs;
  return entry;
}

function detailToPayload(detail: ServiceTranslationDetail): TranslationPayload {
  return {
    name: detail.name,
    description: detail.description ?? '',
    includes: detail.includes ?? '',
    hero_title: detail.hero_title ?? '',
    hero_subtitle: detail.hero_subtitle ?? '',
    benefits: detail.benefits,
    guarantees: detail.guarantees,
    faqs: detail.faqs,
  };
}

async function translateAll(
  source: TranslationPayload,
): Promise<Record<TranslationTarget, TranslationPayload>> {
  const results = await Promise.all(
    TARGET_LOCALES.map(async (target) => {
      const translated = await translateServiceTranslation(source, target);
      return [target, translated] as const;
    }),
  );
  return Object.fromEntries(results) as Record<
    TranslationTarget,
    TranslationPayload
  >;
}

// The runtime type `ServiceTranslationDetail` allows `null` for optional
// string fields, but `serviceTranslationSchema` expects `string | undefined`.
// Coerce nulls to '' so the schema accepts shapes coming straight from the
// DB / form state.
function normalizeEsInput(input: TranslateServiceInput): TranslateServiceInput {
  if (!input?.esTranslation) return input;
  const es = input.esTranslation;
  return {
    ...input,
    esTranslation: {
      ...es,
      description: es.description ?? '',
      includes: es.includes ?? '',
      hero_title: es.hero_title ?? '',
      hero_subtitle: es.hero_subtitle ?? '',
    },
  };
}

export async function translateService(
  input: TranslateServiceInput,
): Promise<TranslateServiceResult> {
  const parsed = translateServiceInputSchema.safeParse(normalizeEsInput(input));
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    if (flat.fieldErrors.service_id) {
      return { error: 'invalid-input' };
    }
    return { error: 'es-incomplete' };
  }

  const { service_id, esTranslation } = parsed.data;
  const esPayload = detailToPayload(esTranslation);

  const supabase = createClient();
  const { data: row, error: readError } = await supabase
    .from('services')
    .select('i18n')
    .eq('id', service_id)
    .single();
  if (readError) throw readError;

  let translations: Record<TranslationTarget, TranslationPayload>;
  try {
    translations = await translateAll(esPayload);
  } catch {
    return { error: 'translate-failed' };
  }

  const currentI18n = (row?.i18n ?? {}) as Record<string, unknown>;
  const nextI18n: Record<string, unknown> = {
    ...currentI18n,
    es: buildEntry(esPayload),
  };
  for (const target of TARGET_LOCALES) {
    nextI18n[target] = buildEntry(translations[target]);
  }

  const { error: writeError } = await supabase
    .from('services')
    .update({
      i18n: nextI18n as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', service_id);
  if (writeError) {
    return { error: 'db-failed' };
  }

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { translatedLocales: [...TARGET_LOCALES] } };
}
