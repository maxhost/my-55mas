import type { Question } from '@/shared/lib/questions/types';
import type { TalentDocumentEntry } from '../types';

type TalentServiceLike = {
  service_id: string;
  service_name: string | null;
  /** form_data jsonb — answers to talent_questions, key by question.key. */
  answers: Record<string, unknown>;
  updated_at: string | null;
  questions: Question[];
};

/**
 * Walks each `talent_services` row, finds talent_questions with type='file',
 * and emits one TalentDocumentEntry per upload (URL stored in form_data).
 *
 * The form_data shape for file answers is the URL string (per
 * FileInputRenderer convention). Empty strings or non-string values are
 * skipped.
 */
export function extractDocumentsFromServices(
  rows: TalentServiceLike[],
  locale: string,
): TalentDocumentEntry[] {
  const out: TalentDocumentEntry[] = [];
  for (const row of rows) {
    for (const q of row.questions) {
      if (q.type !== 'file') continue;
      if (!q.key) continue;
      const value = row.answers?.[q.key];
      if (typeof value !== 'string' || value.length === 0) continue;
      out.push({
        service_id: row.service_id,
        service_name: row.service_name,
        question_key: q.key,
        question_label: questionLabel(q, locale),
        url: value,
        uploaded_at: row.updated_at,
      });
    }
  }
  return out;
}

function questionLabel(q: Question, locale: string): string {
  return q.i18n[locale]?.label ?? q.i18n.es?.label ?? q.key;
}
