import { z } from 'zod';
import { locales } from '@/lib/i18n/config';

const localeKeySchema = z.enum(locales as unknown as [string, ...string[]]);

const fieldEntrySchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  help: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional(),
});

const localeEntrySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  submitLabel: z.string().optional(),
  fields: z.record(z.string(), fieldEntrySchema).optional(),
});

const i18nSchema = z.record(localeKeySchema, localeEntrySchema);

export const saveI18nSchema = z.object({
  formId: z.string().uuid(),
  i18n: i18nSchema,
});

export const saveActivationSchema = z.object({
  formId: z.string().uuid(),
  is_active: z.boolean(),
  countryIds: z.array(z.string().uuid()),
});

export type SaveI18nSchemaInput = z.input<typeof saveI18nSchema>;
export type SaveActivationSchemaInput = z.input<typeof saveActivationSchema>;
