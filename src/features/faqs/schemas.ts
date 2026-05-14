import { z } from 'zod';
import { FAQ_LOCALES } from './types';

const localeKeySchema = z.enum(FAQ_LOCALES);

const translationSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
});

// At least one locale (typically ES) must have a translation. Other
// locales are optional — the public layer falls back to ES via the
// shared `localize` helper.
const translationsSchema = z
  .record(localeKeySchema, translationSchema)
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one translation is required',
  })
  .refine((obj) => 'es' in obj, {
    message: 'ES translation is required',
  });

export const faqInputSchema = z.object({
  id: z.string().uuid().optional(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: translationsSchema,
});

export const saveFaqSchema = z.object({
  faq: faqInputSchema,
});

export type SaveFaqSchemaInput = z.input<typeof saveFaqSchema>;
