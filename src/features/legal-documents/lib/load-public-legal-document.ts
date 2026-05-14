import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { localize } from '@/shared/lib/i18n/localize';
import type { LegalDocumentSlug } from '../types';

export type PublicLegalDocument = {
  richHtml: string;
  updatedAt: string;
};

type LegalI18n = Record<string, { richHtml?: string }>;

// Graceful degradation: returns null on error/empty so the page renders a
// localized empty-state instead of throwing.
export async function loadPublicLegalDocument(
  slug: LegalDocumentSlug,
  locale: string,
): Promise<PublicLegalDocument | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('legal_documents')
      .select('updated_at, i18n')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.error('[loadPublicLegalDocument] db error', {
        slug,
        message: error?.message,
      });
      return null;
    }

    const entry = localize(data.i18n as unknown as LegalI18n, locale);
    const richHtml = entry?.richHtml?.trim() ?? '';
    if (!richHtml) return null;

    return { richHtml, updatedAt: data.updated_at };
  } catch (err) {
    console.error('[loadPublicLegalDocument] unexpected throw', {
      slug,
      message: (err as Error)?.message,
    });
    return null;
  }
}
