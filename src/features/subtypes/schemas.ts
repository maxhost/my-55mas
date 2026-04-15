import { z } from 'zod';

const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9_-]*$/, 'Slug must be lowercase, starting with a letter');

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
  groups: z.array(subtypeGroupInputSchema),
});

export type SaveSubtypeGroupsSchemaInput = z.input<typeof saveSubtypeGroupsSchema>;

export const assignGroupsSchema = z.object({
  service_id: z.string().uuid(),
  group_ids: z.array(
    z.object({
      group_id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    })
  ),
});
