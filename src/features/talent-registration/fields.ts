/**
 * Order of fields in the form (top → bottom).
 *
 * Adding a new field:
 * 1. Create `fields/<key>.tsx` exporting a component + Zod fragment.
 * 2. Add the key here in render order.
 * 3. Add the fragment to `schemas.ts`.
 * 4. Add a write to the corresponding DB target in `actions/register.ts`.
 * 5. Update `form_definitions['talent_registration'].schema.fields` (admin-managed translations).
 */
export const TALENT_REGISTRATION_FIELD_ORDER = [
  'full_name',
  'email',
  'password',
  'phone',
  'country_id',
  'city_id',
  'address',
  'fiscal_id_type_id',
  'fiscal_id',
  'services',
  'additional_info',
  'disclaimer',
  'terms_accepted',
  'marketing_consent',
] as const;

export type TalentRegistrationFieldKey = (typeof TALENT_REGISTRATION_FIELD_ORDER)[number];
