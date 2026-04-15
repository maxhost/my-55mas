import { z } from 'zod';
import { TALENT_TAG_LOCALES } from './types';

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9_-]*$/, 'Slug must be lowercase, starting with a letter');

const localeKeySchema = z.enum(TALENT_TAG_LOCALES);

const translationsSchema = z
  .record(localeKeySchema, z.string().min(1))
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one translation is required',
  });

export const talentTagInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: slugSchema,
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: translationsSchema,
});

export const saveTalentTagSchema = z.object({
  tag: talentTagInputSchema,
});

export type SaveTalentTagSchemaInput = z.input<typeof saveTalentTagSchema>;
