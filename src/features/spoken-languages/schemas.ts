import { z } from 'zod';
import { SPOKEN_LANGUAGE_LOCALES } from './types';

export const spokenLanguageCodeSchema = z
  .string()
  .regex(/^[a-z]{2,3}(-[a-z]{2,4})?$/, 'invalidCode');

const translationsShape = SPOKEN_LANGUAGE_LOCALES.reduce(
  (acc, locale) => {
    acc[locale] = z.string().min(1, 'missingTranslation');
    return acc;
  },
  {} as Record<(typeof SPOKEN_LANGUAGE_LOCALES)[number], z.ZodString>
);

export const spokenLanguageTranslationsSchema = z.object(translationsShape);

export const spokenLanguageInputSchema = z.object({
  code: spokenLanguageCodeSchema,
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: spokenLanguageTranslationsSchema,
  creating: z.boolean(),
});

export const saveSpokenLanguageSchema = z.object({
  language: spokenLanguageInputSchema,
});

export type SaveSpokenLanguageSchemaInput = z.input<typeof saveSpokenLanguageSchema>;
