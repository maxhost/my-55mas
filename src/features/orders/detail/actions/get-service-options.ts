'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { ServiceOption } from '../types';

/**
 * Lists active services as `{ id, name }` for the talent search modal's
 * "Servicio" filter. Returns localized name (falls back to slug).
 */
export async function getServiceOptions(locale: string): Promise<ServiceOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('services')
    .select('id, slug, i18n, status')
    .eq('status', 'published');
  const opts = (data ?? []).map((s) => ({
    id: s.id,
    name: localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug,
  }));
  opts.sort((a, b) => a.name.localeCompare(b.name));
  return opts;
}
