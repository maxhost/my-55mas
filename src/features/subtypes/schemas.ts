import { z } from 'zod';

const slugSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, 'Slug must be snake_case starting with a letter');

export const subtypeInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: slugSchema,
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: z.record(z.string().min(1)),
});

export const saveSubtypesSchema = z.object({
  service_id: z.string().uuid(),
  subtypes: z.array(subtypeInputSchema),
});

export type SaveSubtypesSchemaInput = z.input<typeof saveSubtypesSchema>;
