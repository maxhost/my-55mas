import { z } from 'zod';
import { TALENT_STATUSES } from '../types';
import { TALENT_PAYMENT_METHODS } from './types';

const uuid = z.string().uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');

// ── Header / status / tags ──────────────────────────────────

export const updateTalentStatusSchema = z.object({
  talentId: uuid,
  status: z.enum(TALENT_STATUSES),
  reason: z.string().max(2000).optional(),
});
export type UpdateTalentStatusInput = z.infer<typeof updateTalentStatusSchema>;

export const updateTalentTagsSchema = z.object({
  talentId: uuid,
  tagIds: z.array(uuid),
});
export type UpdateTalentTagsInput = z.infer<typeof updateTalentTagsSchema>;

// ── Section saves ───────────────────────────────────────────

export const savePersonalDataSchema = z.object({
  talentId: uuid,
  full_name: z.string().min(1).max(200),
  gender: z.string().nullable(),
  birth_date: isoDate.nullable(),
});
export type SavePersonalDataInput = z.infer<typeof savePersonalDataSchema>;

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

export const saveContactSchema = z.object({
  talentId: uuid,
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  preferred_contact: z.string().nullable(),
  address: addressSchema.nullable(),
  preferred_country: uuid.nullable(),
  preferred_city: uuid.nullable(),
});
export type SaveContactInput = z.infer<typeof saveContactSchema>;

export const saveProfessionalSituationSchema = z.object({
  talentId: uuid,
  professional_status: z.string().nullable(),
  previous_experience: z.string().max(5000).nullable(),
});
export type SaveProfessionalSituationInput = z.infer<typeof saveProfessionalSituationSchema>;

const talentServiceEntrySchema = z.object({
  service_id: uuid,
  unit_price: z.number().min(0),
  answers: z.record(z.string(), z.unknown()),
});

export const saveTalentServicesSchema = z.object({
  talentId: uuid,
  countryId: uuid,
  entries: z.array(talentServiceEntrySchema),
});
export type SaveTalentServicesInput = z.infer<typeof saveTalentServicesSchema>;

export const savePaymentPrefsSchema = z.object({
  talentId: uuid,
  preferred_payment: z.string().nullable(),
  has_social_security: z.boolean().nullable(),
  fiscal_id_type_id: uuid.nullable(),
  fiscal_id: z.string().nullable(),
});
export type SavePaymentPrefsInput = z.infer<typeof savePaymentPrefsSchema>;

export const saveLanguagesSchema = z.object({
  talentId: uuid,
  language_codes: z.array(z.string().min(2)),
});
export type SaveLanguagesInput = z.infer<typeof saveLanguagesSchema>;

export const saveOtherSurveySchema = z.object({
  talentId: uuid,
  responses: z.record(z.string(), z.unknown()),
});
export type SaveOtherSurveyInput = z.infer<typeof saveOtherSurveySchema>;

// ── Payments ────────────────────────────────────────────────

export const markPaymentAsPaidSchema = z.object({
  paymentId: uuid,
  payment_method: z.enum(TALENT_PAYMENT_METHODS),
  payment_proof_url: z.string().url().nullable(),
  notes: z.string().max(2000).nullable(),
});
export type MarkPaymentAsPaidInput = z.infer<typeof markPaymentAsPaidSchema>;

// ── Notes ───────────────────────────────────────────────────

export const createTalentNoteSchema = z.object({
  talentId: uuid,
  body: z.string().min(1).max(5000),
});
export type CreateTalentNoteInput = z.infer<typeof createTalentNoteSchema>;

export const pinTalentNoteSchema = z.object({
  noteId: uuid,
  pinned: z.boolean(),
});
export type PinTalentNoteInput = z.infer<typeof pinTalentNoteSchema>;

// ── Orders / Payments query filters ─────────────────────────

export const getTalentOrdersSchema = z.object({
  talentId: uuid,
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(50),
  status: z.string().nullable().optional(),
  serviceId: uuid.nullable().optional(),
  fromDate: isoDate.nullable().optional(),
  toDate: isoDate.nullable().optional(),
  search: z.string().nullable().optional(),
});
export type GetTalentOrdersInput = z.infer<typeof getTalentOrdersSchema>;
