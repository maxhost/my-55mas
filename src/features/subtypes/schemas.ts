import { z } from 'zod';

const slugSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, 'Slug must be snake_case starting with a letter');

export const subtypeItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: slugSchema,
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: z.record(z.string().min(1)),
});

export const subtypeGroupInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: slugSchema,
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: z.record(z.string().min(1)),
  items: z.array(subtypeItemInputSchema),
});

export const saveSubtypeGroupsSchema = z.object({
  service_id: z.string().uuid(),
  groups: z.array(subtypeGroupInputSchema),
});

export type SaveSubtypeGroupsSchemaInput = z.input<typeof saveSubtypeGroupsSchema>;
