import type { SurveyQuestionInput, SurveyQuestionTranslation } from './types';

/**
 * Removes orphaned option_labels from a survey question's translations.
 * Only keeps option_labels whose keys exist in question.options.
 * If no options exist, clears all option_labels.
 */
export function sanitizeSurveyOptionLabels(
  question: SurveyQuestionInput,
): SurveyQuestionInput {
  const validOptions = new Set(question.options ?? []);
  const clean: Record<string, SurveyQuestionTranslation> = {};

  for (const [locale, trans] of Object.entries(question.translations)) {
    if (!trans.option_labels || validOptions.size === 0) {
      const { option_labels, ...rest } = trans;
      clean[locale] = rest;
      continue;
    }

    const filtered: Record<string, string> = {};
    for (const [key, value] of Object.entries(trans.option_labels)) {
      if (validOptions.has(key)) {
        filtered[key] = value;
      }
    }

    clean[locale] = {
      ...trans,
      option_labels: Object.keys(filtered).length > 0 ? filtered : undefined,
    };
  }

  return { ...question, translations: clean };
}
