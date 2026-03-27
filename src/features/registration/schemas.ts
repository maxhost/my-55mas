import { z } from 'zod';
import { formSchemaSchema } from '@/shared/lib/forms/schemas';

const slugSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case');

// ── Save form schema + translations ─────────────────

export const saveRegistrationFormSchema = z.object({
  slug: slugSchema,
  city_id: z.string().uuid().nullable().default(null),
  schema: formSchemaSchema,
  locale: z.string().min(2).max(5),
  labels: z.record(z.string()),
  placeholders: z.record(z.string()),
  option_labels: z.record(z.string()),
});

export type SaveRegistrationFormSchemaInput = z.input<typeof saveRegistrationFormSchema>;

// ── Create form ──────────────────────────────────────

export const createRegistrationFormSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
});

// ── Save config (countries + cities) ─────────────────

export const saveRegistrationConfigSchema = z.object({
  form_id: z.string().uuid(),
  country_ids: z.array(z.string().uuid()),
  city_ids: z.array(z.string().uuid()),
});

// ── Delete form ─────────────────────────────────────

export const deleteRegistrationFormSchema = z.object({
  id: z.string().uuid(),
});
