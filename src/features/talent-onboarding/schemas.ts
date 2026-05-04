import { z } from 'zod';
import {
  GENDER_VALUES,
  PREFERRED_CONTACT_VALUES,
  PROFESSIONAL_STATUS_VALUES,
  PREFERRED_PAYMENT_VALUES,
} from './types';

const MIN_AGE_YEARS = 55;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date');

const minAgeRefiner = (date: string): boolean => {
  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) return false;
  const now = new Date();
  const age =
    now.getFullYear() -
    birth.getFullYear() -
    (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
  return age >= MIN_AGE_YEARS;
};

const addressValueSchema = z.object({
  street: z.string(),
  postal_code: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  mapbox_id: z.string().nullable(),
  raw_text: z.string().min(1),
  country_code: z.string().min(2),
  city_name: z.string(),
});

// ── Per-section schemas ──────────────────────────────────────

export const personalDataSchema = z.object({
  gender: z.enum(GENDER_VALUES),
  birth_date: isoDate.refine(minAgeRefiner, {
    message: `Talent must be at least ${MIN_AGE_YEARS} years old`,
  }),
});

export const contactAddressSchema = z.object({
  preferred_contact: z.enum(PREFERRED_CONTACT_VALUES),
  address: addressValueSchema,
  city_id: z.string().uuid().nullable(),
});

export const professionalSituationSchema = z.object({
  professional_status: z.enum(PROFESSIONAL_STATUS_VALUES),
  previous_experience: z.string().nullable(),
});

const talentServiceEntrySchema = z.object({
  service_id: z.string().uuid(),
  unit_price: z.number().min(0),
  override_price: z.boolean(),
  answers: z.record(z.string(), z.unknown()),
});

export const servicesSectionSchema = z.object({
  entries: z.array(talentServiceEntrySchema).min(1, 'Pick at least one service'),
});

export const paymentsSchema = z.object({
  has_social_security: z.boolean(),
  preferred_payment: z.enum(PREFERRED_PAYMENT_VALUES),
});

export const languagesSectionSchema = z.object({
  language_codes: z.array(z.string().min(2)).min(1, 'Pick at least one language'),
});

export const surveyResponsesSchema = z.record(z.string(), z.unknown());

// ── Save action schemas (per step) ───────────────────────────

export const savePersonalDataSchema = personalDataSchema;

export const saveContactAddressSchema = contactAddressSchema;

export const saveProfessionalSituationSchema = professionalSituationSchema;

export const saveServicesSchema = z.object({
  /** country_id from registration — actions receive it to scope the writes. */
  country_id: z.string().uuid(),
  entries: z
    .array(talentServiceEntrySchema)
    .min(1)
    .superRefine((arr, ctx) => {
      const seen = new Set<string>();
      for (let i = 0; i < arr.length; i++) {
        if (seen.has(arr[i].service_id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, 'service_id'],
            message: 'Duplicate service entry',
          });
        }
        seen.add(arr[i].service_id);
      }
    }),
});

export const savePaymentsSchema = paymentsSchema;

export const saveLanguagesSchema = languagesSectionSchema;

export const saveSurveyResponsesSchema = surveyResponsesSchema;
