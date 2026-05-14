'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import { sanitizeRichHtml } from '@/shared/lib/lexical/sanitize-rich-html';
import { saveLegalDocumentSchema } from '../schemas';
import type {
  LegalDocumentTranslation,
  SaveLegalDocumentError,
  SaveLegalDocumentInput,
  SaveLegalDocumentSuccess,
} from '../types';

type Result =
  | { data: SaveLegalDocumentSuccess }
  | { error: SaveLegalDocumentError };

// Atomic save: sanitizes every richHtml server-side and replaces the
// whole i18n jsonb with the 5 locale slots in one UPDATE. Optimistic
// lock: rejects if updated_at moved since the caller's fetch (means
// another admin saved meanwhile).
export async function saveLegalDocument(
  input: SaveLegalDocumentInput,
): Promise<Result> {
  const parsed = saveLegalDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'invalid-input' };
  }

  const { slug, expectedUpdatedAt, translations } = parsed.data;
  const supabase = createClient();

  // Optimistic lock check.
  const { data: existing, error: readError } = await supabase
    .from('legal_documents')
    .select('updated_at')
    .eq('slug', slug)
    .single();
  if (readError || !existing) return { error: 'not-found' };
  if (existing.updated_at !== expectedUpdatedAt) {
    return { error: 'optimistic-lock' };
  }

  // Sanitize every richHtml + build the new i18n jsonb. Preserves the
  // (already-validated) lexicalState as-is.
  const nextI18n: Record<string, LegalDocumentTranslation> = {};
  for (const [locale, payload] of Object.entries(translations)) {
    nextI18n[locale] = {
      lexicalState: payload.lexicalState,
      richHtml: sanitizeRichHtml(payload.richHtml),
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
