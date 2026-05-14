import { z } from 'zod';
import { SERVICE_CATEGORIES } from '@/shared/lib/services/types';

// ── FAQ Item ──────────────────────────────────────────

export const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

// ── Service Translation ───────────────────────────────

export const serviceTranslationSchema = z.object({
  locale: z.string().min(2).max(5),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  includes: z.string().max(2000).optional().default(''),
  hero_title: z.string().max(200).optional().default(''),
  hero_subtitle: z.string().max(300).optional().default(''),
  benefits: z.array(z.string().min(1).max(500)).default([]),
  guarantees: z.array(z.string().min(1).max(500)).default([]),
  faqs: z.array(faqItemSchema).default([]),
});

export type ServiceTranslationInput = z.input<typeof serviceTranslationSchema>;

// ── Create Service ────────────────────────────────────

export const createServiceSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  translation: serviceTranslationSchema,
});

export type CreateServiceInput = z.input<typeof createServiceSchema>;

// ── Update Service ────────────────────────────────────

export const updateServiceSchema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  allows_recurrence: z.boolean().optional(),
  cover_image_url: z.string().url().nullable().optional(),
});

export type UpdateServiceInput = z.input<typeof updateServiceSchema>;

// ── Save Translation (upsert one locale) ──────────────

export const saveTranslationSchema = z.object({
  service_id: z.string().uuid(),
  translation: serviceTranslationSchema,
});

export type SaveTranslationInput = z.input<typeof saveTranslationSchema>;

// ── Country Price ─────────────────────────────────────

export const countryPriceSchema = z.object({
  country_id: z.string().uuid(),
  base_price: z.number().min(0),
  is_active: z.boolean(),
});

export type CountryPriceInput = z.infer<typeof countryPriceSchema>;

// ── City Price ───────────────────────────────────────

export const cityPriceSchema = z.object({
  city_id: z.string().uuid(),
  country_id: z.string().uuid(),
  base_price: z.number().min(0),
  is_active: z.boolean(),
});

export type CityPriceInput = z.infer<typeof cityPriceSchema>;

// ── Save Configuration ────────────────────────────────

export const saveConfigSchema = z.object({
  service_id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  allows_recurrence: z.boolean().optional(),
  category: z.enum(SERVICE_CATEGORIES).nullable().optional(),
  countries: z.array(countryPriceSchema),
  cities: z.array(cityPriceSchema).default([]),
});

export type SaveConfigInput = z.input<typeof saveConfigSchema>;
