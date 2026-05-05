'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { I18nRecord } from '@/shared/lib/json';
import type { Question } from '@/shared/lib/questions/types';
import { extractDocumentsFromServices } from '../lib/extract-documents-from-services';
import type { TalentDocumentEntry } from '../types';

export async function getTalentDocuments(
  talentId: string,
  locale: string,
): Promise<TalentDocumentEntry[]> {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from('talent_services')
    .select('service_id, form_data, updated_at')
    .eq('talent_id', talentId);
  if (!rows || rows.length === 0) return [];

  const serviceIds = Array.from(new Set(rows.map((r) => r.service_id)));
  const { data: services } = await supabase
    .from('services')
    .select('id, slug, i18n, talent_questions')
    .in('id', serviceIds);

  const serviceMap = new Map<string, { name: string | null; questions: Question[] }>(
    (services ?? []).map((s) => [
      s.id,
      {
        name: localizedField(s.i18n as I18nRecord, locale, 'name') ?? s.slug,
        questions: ((s.talent_questions as unknown) as Question[]) ?? [],
      },
    ]),
  );

  return extractDocumentsFromServices(
    rows.map((r) => {
      const svc = serviceMap.get(r.service_id);
      return {
        service_id: r.service_id,
        service_name: svc?.name ?? null,
        answers: ((r.form_data as unknown) as Record<string, unknown>) ?? {},
        updated_at: r.updated_at,
        questions: svc?.questions ?? [],
      };
    }),
    locale,
  );
}
