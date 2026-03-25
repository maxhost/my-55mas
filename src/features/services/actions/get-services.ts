'use server';

import { createClient } from '@/lib/supabase/server';
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

  let query = supabase
    .from('service_translations')
    .select(
      `
      service_id,
      name,
      services!inner (
        id,
        slug,
        status,
        created_at
      )
    `,
      { count: 'exact' }
    )
    .eq('locale', locale)
    .order('name', { ascending: true })
    .range(from, to);

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data: rows, count, error } = await query;

  if (error) throw error;

  const data: ServiceListItem[] = (rows ?? []).map((row) => {
    const svc = row.services as unknown as {
      id: string;
      slug: string;
      status: string;
      created_at: string | null;
    };
    return {
      id: svc.id,
      slug: svc.slug,
      status: svc.status,
      created_at: svc.created_at,
      name: row.name,
    };
  });

  return { data, count: count ?? 0 };
}
