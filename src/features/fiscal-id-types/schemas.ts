import { z } from 'zod';
import { locales } from '@/lib/i18n/config';

const codeSchema = z
  .string()
  .min(1)
  .max(20)
  .regex(/^[A-Z][A-Z0-9_-]*$/, 'Code must be uppercase, starting with a letter');

const localeKeySchema = z.enum(locales as unknown as [string, ...string[]]);

const translationsSchema = z
  .record(localeKeySchema, z.string().min(1))
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one translation is required',
  });

const countryIdsSchema = z.array(z.string().uuid());

export const fiscalIdTypeInputSchema = z.object({
  id: z.string().uuid().optional(),
  code: codeSchema,
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: translationsSchema,
  country_ids: countryIdsSchema,
});

export const saveFiscalIdTypeSchema = z.object({
  fiscalIdType: fiscalIdTypeInputSchema,
});

export type SaveFiscalIdTypeSchemaInput = z.input<typeof saveFiscalIdTypeSchema>;
