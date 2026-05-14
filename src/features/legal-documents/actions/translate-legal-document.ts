'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { sanitizeRichHtml } from '@/shared/lib/lexical/sanitize-rich-html';
import { lexicalStateSchema } from '@/shared/lib/lexical/types';
import type { TranslationTarget } from '@/shared/lib/translation';
import { translateLegalDocHtml } from '../lib/translate-legal-doc-with-claude';
import { LEGAL_DOCUMENT_SLUGS } from '../types';
import type {
  LegalDocumentSlug,
  LegalDocumentTranslation,
} from '../types';

const TARGET_LOCALES: readonly TranslationTarget[] = [
  'en',
  'pt',
  'fr',
  'ca',
] as const;

const MAX_HTML_BYTES = 100_000;

const esTranslationSchema = z.object({
  lexicalState: lexicalStateSchema.nullable(),
  richHtml: z.string().max(200_000),
});

const inputSchema = z.object({
  slug: z.enum(LEGAL_DOCUMENT_SLUGS),
  expectedUpdatedAt: z.string().min(1),
  esTranslation: esTranslationSchema,
});

type Input = z.input<typeof inputSchema>;

type Result =
  | { data: { updated_at: string } }
  | {
      error:
        | 'invalid-input'
        | 'es-empty'
        | 'doc-too-large'
        | 'not-found'
        | 'optimistic-lock'
        | 'translate-failed'
        | 'db-failed';
    };

export async function translateLegalDocument(
  input: Input,
): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'invalid-input' };
  }
  const { slug, expectedUpdatedAt, esTranslation } = parsed.data;

  const esHtml = esTranslation.richHtml.trim();
  if (!esHtml) {
    return { error: 'es-empty' };
  }
  if (esHtml.length > MAX_HTML_BYTES) {
    return { error: 'doc-too-large' };
  }

  const supabase = createClient();

  // Optimistic-lock check.
  const { data: existing, error: readError } = await supabase
    .from('legal_documents')
    .select('updated_at')
    .eq('slug', slug)
    .single();
  if (readError || !existing) return { error: 'not-found' };
  if (existing.updated_at !== expectedUpdatedAt) {
    return { error: 'optimistic-lock' };
  }

  let translatedByLocale: Record<TranslationTarget, string>;
  try {
    const entries = await Promise.all(
      TARGET_LOCALES.map(async (locale) => {
        const html = await translateLegalDocHtml(esHtml, locale);
        return [locale, html] as const;
      }),
    );
    translatedByLocale = Object.fromEntries(entries) as Record<
      TranslationTarget,
      string
    >;
  } catch {
    return { error: 'translate-failed' };
  }

  // Build the new i18n jsonb. ES preserves the form's lexicalState + a
  // sanitized version of its richHtml. Targets get sanitized translated
  // HTML and `lexicalState: null` (the editor reconstructs state from
  // HTML via $generateNodesFromDOM on next open).
  const nextI18n: Record<string, LegalDocumentTranslation> = {
    es: {
      lexicalState: esTranslation.lexicalState,
      richHtml: sanitizeRichHtml(esTranslation.richHtml),
    },
  };
  for (const locale of TARGET_LOCALES) {
    nextI18n[locale] = {
      lexicalState: null,
      richHtml: sanitizeRichHtml(translatedByLocale[locale]),
    };
  }

  const { data: updated, error: writeError } = await supabase
    .from('legal_documents')
    .update({ i18n: nextI18n as unknown as Json })
    .eq('slug', slug)
    .select('updated_at')
    .single();
  if (writeError || !updated) return { error: 'db-failed' };

  revalidatePath('/[locale]/(admin)/admin', 'layout');
  return { data: { updated_at: updated.updated_at } };
}
