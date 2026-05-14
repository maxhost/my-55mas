'use server';

import { createClient } from '@/lib/supabase/server';
import type { LexicalState } from '@/shared/lib/lexical/types';
import type {
  LegalDocument,
  LegalDocumentSlug,
  LegalDocumentTranslation,
} from '../types';

type I18nRecord = Record<
  string,
  { lexicalState?: unknown; richHtml?: string } | null
> | null;

function flattenTranslations(
  i18n: I18nRecord,
): Record<string, LegalDocumentTranslation> {
  const out: Record<string, LegalDocumentTranslation> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    if (!entry) continue;
    const lexicalState =
      entry.lexicalState && typeof entry.lexicalState === 'object'
        ? (entry.lexicalState as LexicalState)
        : null;
    const richHtml = typeof entry.richHtml === 'string' ? entry.richHtml : '';
    out[locale] = { lexicalState, richHtml };
  }
  return out;
}

export async function getLegalDocument(
  slug: LegalDocumentSlug,
): Promise<LegalDocument> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('legal_documents')
    .select('id, slug, updated_at, i18n')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  if (!data) throw new Error(`legal-document-not-found:${slug}`);

  return {
    id: data.id,
    slug: data.slug as LegalDocumentSlug,
    updated_at: data.updated_at,
    translations: flattenTranslations(data.i18n as I18nRecord),
  };
}
