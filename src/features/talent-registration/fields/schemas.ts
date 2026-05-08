/**
 * Server-safe Zod schemas for the talent-registration form fields.
 *
 * These live in a dedicated module (no `'use client'`) so the Server Action
 * `actions/register.ts` can import them without Next.js wrapping them as
 * client references — which would replace `_parse` with a client stub and
 * break server-side validation.
 *
 * Field React components live in `fields/<name>.tsx` and consume these
 * schemas only for inference of input types when needed.
 */

import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

export const fullNameSchema = z.string().min(2).max(200);
export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8).max(72);
export const phoneSchema = z
  .string()
  .min(1)
  .refine((v) => isValidPhoneNumber(v), { message: 'invalid_phone' });
export const countryIdSchema = z.string().uuid();
export const cityIdSchema = z.string().uuid();
export const addressSchema = z.object({
  street: z.string().min(1),
  postal_code: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  mapbox_id: z.string().nullable(),
  raw_text: z.string().min(1),
  country_code: z.string(),
  city_name: z.string(),
});
export const fiscalIdTypeIdSchema = z.string().uuid();
export const fiscalIdSchema = z.string().min(4).max(50);
export const servicesSchema = z.array(z.string().uuid()).min(1);
export const additionalInfoSchema = z.string().max(2000).optional();
export const termsAcceptedSchema = z.literal(true);
export const marketingConsentSchema = z.boolean();
