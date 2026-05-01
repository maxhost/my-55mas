'use server';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import type { ServiceListItem } from '../types';

type GetServicesParams = {
  locale: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

type GetServicesResult = {
  data: ServiceListItem[];
  count: number;
};

export async function getServices({
  locale,
  search,
  page = 1,
  pageSize = 20,
}: GetServicesParams): Promise<GetServicesResult> {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Sort by slug server-side (stable + indexable). The localized name is
  // resolved in JS after the page is fetched. Search is also done client-side
  // against the resolved name to honour the locale fallback chain.
  let query = supabase
    .from('services')
    .select('id, slug, status, created_at, i18n', { count: 'exact' })
    .order('slug', { ascending: true })
    .range(from, to);

  const { data: rows, count, error } = await query;
  if (error) throw error;

  const i18nRecord = (i: unknown) =>
    (i ?? {}) as Record<string, Record<string, unknown>>;

  const all: ServiceListItem[] = (rows ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    status: row.status,
    created_at: row.created_at,
    name: localizedField(i18nRecord(row.i18n), locale, 'name') ?? row.slug,
  }));

  const data = search
    ? all.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : all;

  return { data, count: count ?? 0 };
}
