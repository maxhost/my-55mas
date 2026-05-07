'use server';

import { createClient } from '@/lib/supabase/server';
import type { Question } from '@/shared/lib/questions/types';
import type { OrderDocumentEntry } from '../types';

/**
 * Real read: extracts files uploaded by the CLIENT when answering the
 * service's `services.questions` (not talent_questions). Each question of
 * type='file' whose answer is a non-empty string URL becomes a document
 * entry.
 */
export async function getOrderDocuments(
  orderId: string,
  locale: string,
): Promise<OrderDocumentEntry[]> {
  const supabase = createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('id, service_id, form_data, updated_at')
    .eq('id', orderId)
    .maybeSingle();
  if (!order || !order.service_id) return [];

  const { data: service } = await supabase
    .from('services')
    .select('questions')
    .eq('id', order.service_id)
    .maybeSingle();
  if (!service) return [];

  const questions = ((service.questions as unknown) as Question[]) ?? [];
  const answers = ((order.form_data as unknown) as Record<string, unknown>) ?? {};

  const out: OrderDocumentEntry[] = [];
  for (const q of questions) {
    if (q.type !== 'file') continue;
    if (!q.key) continue;
    const value = answers[q.key];
    if (typeof value !== 'string' || value.length === 0) continue;
    out.push({
      question_key: q.key,
      question_label: questionLabel(q, locale),
      url: value,
      uploaded_at: order.updated_at,
    });
  }
  return out;
}

function questionLabel(q: Question, locale: string): string {
  return q.i18n[locale]?.label ?? q.i18n.es?.label ?? q.key;
}
