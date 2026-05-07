import { z } from 'zod';

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');

const addressSchema = z.object({
  street: z.string(),
  postal_code: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  mapbox_id: z.string().nullable(),
  raw_text: z.string(),
  country_code: z.string(),
  city_name: z.string(),
});

// ── Section saves ───────────────────────────────────────────

export const savePersonalDataSchema = z.object({
  clientId: uuid,
  full_name: z.string().min(1).max(200),
  is_business: z.boolean(),
  company_name: z.string().max(200).nullable(),
  phone: z.string().nullable(),
});
export type SavePersonalDataInput = z.infer<typeof savePersonalDataSchema>;

export const saveContactSchema = z.object({
  clientId: uuid,
  email: z.string().email().nullable(),
  address: addressSchema.nullable(),
  preferred_country: uuid.nullable(),
  preferred_city: uuid.nullable(),
});
export type SaveContactInput = z.infer<typeof saveContactSchema>;

export const saveBillingSchema = z.object({
  clientId: uuid,
  fiscal_id_type_id: uuid.nullable(),
  company_tax_id: z.string().max(50).nullable(),
  billing_address: z.string().max(500).nullable(),
  billing_state: z.string().max(100).nullable(),
  billing_postal_code: z.string().max(20).nullable(),
});
export type SaveBillingInput = z.infer<typeof saveBillingSchema>;

// ── Delete client ───────────────────────────────────────────

export const deleteClientSchema = z.object({
  clientId: uuid,
  /** User must type the client's full_name to confirm. */
  confirmName: z.string().min(1),
});
export type DeleteClientInput = z.infer<typeof deleteClientSchema>;

// ── Orders filters ──────────────────────────────────────────

export const getClientOrdersSchema = z.object({
  clientId: uuid,
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50),
  status: z.string().nullable().optional(),
  fromDate: isoDate.nullable().optional(),
  toDate: isoDate.nullable().optional(),
  search: z.string().nullable().optional(),
});
export type GetClientOrdersInput = z.infer<typeof getClientOrdersSchema>;
