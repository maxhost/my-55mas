import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import { buildCoverPublicUrl } from '@/shared/lib/services/cover-image-storage';
import {
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from '@/shared/lib/services/types';
import type { I18nRecord } from '@/shared/lib/json';

export type HomeServiceCard = {
  id: string;
  slug: string;
  category: ServiceCategory;
  imageSrc: string;
  imageAlt: string;
  title: string;
  bullets: string[];
  tone: 'coral' | 'salmon';
};

export const HOME_SERVICE_PLACEHOLDER = '/brand/service-placeholder.svg';

function pickBullets(
  i18n: I18nRecord,
  locale: string,
): string[] {
  // Don't use `localize` here — its built-in fallback returns the locale
  // entry even when its `benefits` is empty, masking the ES fallback we
  // want. Read each locale independently and prefer target only when it
  // has content.
  const target = i18n?.[locale]?.benefits as unknown;
  const fallback = i18n?.['es']?.benefits as unknown;
  const targetArr = Array.isArray(target) ? (target as unknown[]) : undefined;
  const fallbackArr = Array.isArray(fallback)
    ? (fallback as unknown[])
    : undefined;
  const source = targetArr && targetArr.length > 0 ? targetArr : fallbackArr ?? [];
  return source
    .filter((b): b is string => typeof b === 'string' && b.trim().length > 0)
    .slice(0, 3);
}

function isValidCategory(value: unknown): value is ServiceCategory {
  return (
    typeof value === 'string' &&
    (SERVICE_CATEGORIES as readonly string[]).includes(value)
  );
}

// Load published services that have a category assigned. Services with
// `category=NULL` are NEVER shown on the home — admin must categorize
// them in `/admin/services/[id]` Configuración first.
export async function loadHomeServices(
  locale: string,
  filter: ServiceCategory | 'all',
): Promise<HomeServiceCard[]> {
  const supabase = createClient();
  let query = supabase
    .from('services')
    .select('id, slug, category, cover_image_url, i18n')
    .eq('status', 'published')
    .not('category', 'is', null)
    .order('created_at', { ascending: false });
  if (filter !== 'all') {
    query = query.eq('category', filter);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row, index): HomeServiceCard => {
    // Cast i18n through the shared type — supabase returns it as `Json`.
    const i18n = row.i18n as unknown as I18nRecord;
    const title =
      localizedField(i18n, locale, 'name') ?? row.slug;
    const imageSrc =
      buildCoverPublicUrl(row.cover_image_url, 'card') ??
      HOME_SERVICE_PLACEHOLDER;
    // .not('category', 'is', null) guarantees non-null at runtime; the
    // type narrowing isn't picked up by supabase-js so we re-check.
    const category = isValidCategory(row.category) ? row.category : 'home';

    return {
      id: row.id,
      slug: row.slug,
      category,
      imageSrc,
      imageAlt: title,
      title,
      bullets: pickBullets(i18n, locale),
      tone: index % 2 === 0 ? 'coral' : 'salmon',
    };
  });
}

