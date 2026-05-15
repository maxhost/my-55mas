'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import { suggestionSchema } from '../schemas';
import { sendSuggestionEmail } from '../lib/send-suggestion-email';
import type { SuggestionInput, SuggestionResult } from '../types';

type I18nRecord = Record<string, Record<string, unknown>> | null;

export async function submitSuggestion(
  input: SuggestionInput,
): Promise<SuggestionResult> {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    // Honeypot/dwell-time failing = bot. Generic code → generic toast;
    // never reveal the anti-spam heuristic.
    if (fe.honeypot || fe.elapsedMs) return { error: { code: 'spam' } };
    return { error: { code: 'invalid', fieldErrors: fe } };
  }
  const s = parsed.data;

  // Read-only catalog lookup: anti-tamper (city must belong to the
  // chosen country) + resolve human-readable names for the email.
  // No persistence.
  const supabase = createClient();
  const { data: city } = await supabase
    .from('cities')
    .select('id, country_id, i18n')
    .eq('id', s.cityId)
    .eq('country_id', s.countryId)
    .eq('is_active', true)
    .single();
  const { data: country } = await supabase
    .from('countries')
    .select('id, i18n')
    .eq('id', s.countryId)
    .eq('is_active', true)
    .single();
  if (!city || !country) {
    return { error: { code: 'invalid-location' } };
  }

  const countryName =
    localizedField(country.i18n as I18nRecord, s.locale, 'name') ?? '';
  const cityName =
    localizedField(city.i18n as I18nRecord, s.locale, 'name') ?? '';

  try {
    await sendSuggestionEmail({
      fullName: s.fullName,
      serviceNeeded: s.serviceNeeded,
      email: s.email,
      countryName,
      cityName,
      comments: s.comments,
      locale: s.locale,
    });
    return { data: { ok: true } };
  } catch (e) {
    if (e instanceof Error && e.message === 'EMAIL_NOT_CONFIGURED') {
      return { error: { code: 'email-not-configured' } };
    }
    console.error('[submitSuggestion] send failed', e);
    return { error: { code: 'send-failed' } };
  }
}
