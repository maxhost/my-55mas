import { z } from 'zod';
import { REVIEW_LOCALES } from './types';

const localeKeySchema = z.enum(REVIEW_LOCALES);

const translationsSchema = z
  .record(localeKeySchema, z.string().min(1).max(2000))
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one translation is required',
  });

const starsSchema = z
  .number()
  .refine(
    (n) =>
      Number.isFinite(n) &&
      n >= 0.5 &&
      n <= 5 &&
      n * 2 === Math.floor(n * 2),
    { message: 'stars-invalid' },
  );

export const reviewInputSchema = z.object({
  id: z.string().uuid().optional(),
  author_name: z.string().min(1).max(200),
  author_photo: z.string().nullable(),
  stars: starsSchema,
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
  translations: translationsSchema,
});

export const saveReviewSchema = z.object({
  review: reviewInputSchema,
});

export type SaveReviewSchemaInput = z.input<typeof saveReviewSchema>;
