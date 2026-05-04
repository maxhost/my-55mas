import type { AssignedSubtypeGroup, ManualOption, Question } from './types';
import type { SelectOption } from '@/shared/components/question-renderers/select-input';

/**
 * Resolves the visible options for a single/multiSelect question, in the
 * given locale. Handles both manual options and subtype-sourced options
 * (with excluded ids filter).
 */
export function resolveOptions(
  question: Question,
  locale: string,
  fallbackLocale: string,
  assignedGroups: AssignedSubtypeGroup[],
): SelectOption[] {
  if (question.type !== 'singleSelect' && question.type !== 'multiSelect') {
    return [];
  }
  if (question.optionsSource === 'manual') {
    return (question.options ?? []).map((opt) => ({
      value: opt.value,
      label:
        opt.i18n[locale]?.label ??
        opt.i18n[fallbackLocale]?.label ??
        opt.value,
    }));
  }
  if (question.optionsSource === 'subtype' && question.subtypeGroupSlug) {
    const group = assignedGroups.find((g) => g.slug === question.subtypeGroupSlug);
    if (!group) return [];
    const excluded = new Set(question.subtypeExcludedIds ?? []);
    return group.items
      .filter((it) => !excluded.has(it.id))
      .map((it) => ({
        value: it.id,
        label: it.translations[locale] ?? it.translations[fallbackLocale] ?? it.slug,
      }));
  }
  return [];
}

/** Localised label/placeholder/help for a question, with fallback. */
export function resolveQuestionLabels(
  question: Question,
  locale: string,
  fallbackLocale: string,
): { label: string; placeholder?: string; help?: string } {
  const entry = question.i18n[locale] ?? question.i18n[fallbackLocale] ?? {};
  return {
    label: entry.label ?? question.key,
    placeholder: entry.placeholder,
    help: entry.help,
  };
}

function manualOptionUsedAsAnswer(opts: ManualOption[] | undefined, value: string): boolean {
  return Boolean(opts?.some((o) => o.value === value));
}

/** True when the answer is missing for a required question. */
export function isAnswerMissing(question: Question, value: unknown): boolean {
  if (!question.required) return false;
  switch (question.type) {
    case 'text':
    case 'multilineText':
    case 'singleSelect':
      return typeof value !== 'string' || value.trim() === '';
    case 'number':
      return typeof value !== 'number' || Number.isNaN(value);
    case 'boolean':
      return typeof value !== 'boolean';
    case 'multiSelect':
      return !Array.isArray(value) || value.length === 0;
    case 'file':
      return !Array.isArray(value) || value.length === 0;
    default:
      return false;
  }
}

// Marker so the helper isn't tree-shaken if unused elsewhere; keeps API clean.
export const __internal = { manualOptionUsedAsAnswer };
