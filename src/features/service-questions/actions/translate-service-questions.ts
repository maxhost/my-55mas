'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type {
  ManualOption,
  Question,
  QuestionI18nEntry,
  QuestionTarget,
} from '@/shared/lib/questions/types';
import type { TranslationTarget } from '@/shared/lib/translation';
import { saveQuestionsSchema } from '../schemas';
import {
  translateQuestionsTranslations,
  type QuestionTranslationItem,
} from '../lib/translate-questions-with-claude';

const TARGET_LOCALES: readonly TranslationTarget[] = [
  'en',
  'pt',
  'fr',
  'ca',
] as const;

// Soft guard: a single click translates the entire active set in parallel
// across 4 locales. Beyond ~50 questions the prompt grows large enough to
// risk truncation / latency spikes. Force the admin to split into tandas.
const MAX_QUESTIONS_WITH_ES = 50;

type Result =
  | { data: { translatedLocales: TranslationTarget[] } }
  | {
      error:
        | 'invalid-input'
        | 'es-incomplete'
        | 'too-many-questions'
        | 'translate-failed'
        | 'db-failed';
    };

const inputSchema = z.object({
  service_id: z.string().uuid(),
  target: z.enum(['client', 'talent']),
  questions: saveQuestionsSchema.shape.questions,
});

type Input = z.input<typeof inputSchema>;

function hasEsLabel(q: Question): boolean {
  return Boolean(q.i18n?.es?.label?.trim());
}

function pickManualOptions(q: Question): QuestionTranslationItem['options'] {
  if (q.optionsSource !== 'manual') return undefined;
  if (!q.options || q.options.length === 0) return undefined;
  const opts = q.options
    .filter((o) => o.i18n?.es?.label?.trim())
    .map((o) => ({ value: o.value, label: o.i18n.es!.label!.trim() }));
  return opts.length > 0 ? opts : undefined;
}

function buildTranslationItems(
  questions: Question[],
): QuestionTranslationItem[] {
  const items: QuestionTranslationItem[] = [];
  for (const q of questions) {
    if (!hasEsLabel(q)) continue;
    const es = q.i18n.es!;
    const item: QuestionTranslationItem = {
      key: q.key,
      label: es.label!.trim(),
    };
    if (es.placeholder?.trim()) item.placeholder = es.placeholder.trim();
    if (es.help?.trim()) item.help = es.help.trim();
    const opts = pickManualOptions(q);
    if (opts) item.options = opts;
    items.push(item);
  }
  return items;
}

function mergeOptionTranslations(
  question: Question,
  options: ManualOption[],
  translationsByLocale: Record<TranslationTarget, QuestionTranslationItem[]>,
  serviceId: string,
  target: QuestionTarget,
): ManualOption[] {
  return options.map((opt) => {
    if (!opt.i18n?.es?.label?.trim()) return opt;
    const nextI18n: ManualOption['i18n'] = { ...opt.i18n };
    for (const locale of TARGET_LOCALES) {
      const translatedQ = translationsByLocale[locale].find(
        (t) => t.key === question.key,
      );
      const translatedOpt = translatedQ?.options?.find(
        (o) => o.value === opt.value,
      );
      if (!translatedOpt) {
        console.warn('[translate-questions] missing option translation', {
          serviceId,
          target,
          key: question.key,
          value: opt.value,
          locale,
        });
        continue;
      }
      nextI18n[locale] = { label: translatedOpt.label };
    }
    return { ...opt, i18n: nextI18n };
  });
}

function mergeTranslations(
  questions: Question[],
  translationsByLocale: Record<TranslationTarget, QuestionTranslationItem[]>,
  serviceId: string,
  target: QuestionTarget,
): Question[] {
  return questions.map((q) => {
    if (!hasEsLabel(q)) return q;

    const nextI18n: Record<string, QuestionI18nEntry> = { ...q.i18n };
    for (const locale of TARGET_LOCALES) {
      const translated = translationsByLocale[locale].find(
        (t) => t.key === q.key,
      );
      if (!translated) {
        console.warn('[translate-questions] missing translation', {
          serviceId,
          target,
          key: q.key,
          locale,
        });
        continue;
      }
      const entry: QuestionI18nEntry = { label: translated.label };
      if (translated.placeholder) entry.placeholder = translated.placeholder;
      if (translated.help) entry.help = translated.help;
      nextI18n[locale] = entry;
    }

    let nextOptions = q.options;
    if (q.optionsSource === 'manual' && q.options && q.options.length > 0) {
      nextOptions = mergeOptionTranslations(
        q,
        q.options,
        translationsByLocale,
        serviceId,
        target,
      );
    }

    return { ...q, i18n: nextI18n, options: nextOptions };
  });
}

async function translateAll(
  items: QuestionTranslationItem[],
): Promise<Record<TranslationTarget, QuestionTranslationItem[]>> {
  const entries = await Promise.all(
    TARGET_LOCALES.map(async (locale) => {
      const result = await translateQuestionsTranslations(items, locale);
      return [locale, result] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<
    TranslationTarget,
    QuestionTranslationItem[]
  >;
}

export async function translateServiceQuestions(
  input: Input,
): Promise<Result> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'invalid-input' };
  }
  const { service_id, target, questions } = parsed.data;

  const items = buildTranslationItems(questions);
  if (items.length === 0) {
    return { error: 'es-incomplete' };
  }
  if (items.length > MAX_QUESTIONS_WITH_ES) {
    return { error: 'too-many-questions' };
  }

  let translationsByLocale: Record<
    TranslationTarget,
    QuestionTranslationItem[]
  >;
  try {
    translationsByLocale = await translateAll(items);
  } catch {
    return { error: 'translate-failed' };
  }

  const merged = mergeTranslations(
    questions,
    translationsByLocale,
    service_id,
    target,
  );

  const column = target === 'client' ? 'questions' : 'talent_questions';
  const supabase = createClient();
  const { error: dbError } = await supabase
    .from('services')
    .update({
      [column]: merged as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', service_id);
  if (dbError) {
    return { error: 'db-failed' };
  }

  revalidatePath('/[locale]/(admin)/admin/services', 'layout');
  return { data: { translatedLocales: [...TARGET_LOCALES] } };
}
