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
  try {
    const parsed = saveLegalDocumentSchema.safeParse(input);
    if (!parsed.success) {
      console.error('[saveLegalDocument] invalid-input', {
        slug: (input as { slug?: string })?.slug,
        issues: parsed.error.issues.slice(0, 3),
      });
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
    if (readError) {
      console.error('[saveLegalDocument] read-error', {
        slug,
        message: readError.message,
      });
      return { error: 'not-found' };
    }
    if (!existing) {
      console.error('[saveLegalDocument] not-found', { slug });
      return { error: 'not-found' };
    }
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
    if (writeError) {
      console.error('[saveLegalDocument] write-error', {
        slug,
        message: writeError.message,
        code: writeError.code,
      });
      return { error: 'db-failed' };
    }
    if (!updated) {
      console.error('[saveLegalDocument] no-rows-updated', { slug });
      return { error: 'db-failed' };
    }

    revalidatePath('/[locale]/(admin)/admin', 'layout');
    return { data: { updated_at: updated.updated_at } };
  } catch (err) {
    // Anything unexpected (DOMPurify init, jsdom load, network) ends up
    // here. Log the real error so production debugging is possible —
    // the client otherwise only sees a generic 500.
    console.error('[saveLegalDocument] unexpected throw', {
      message: (err as Error)?.message,
      name: (err as Error)?.name,
      stack: (err as Error)?.stack?.slice(0, 500),
    });
    return { error: 'db-failed' };
  }
}
