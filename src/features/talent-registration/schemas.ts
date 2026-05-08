import { z } from 'zod';
import {
  additionalInfoSchema,
  addressSchema,
  cityIdSchema,
  countryIdSchema,
  emailSchema,
  fiscalIdSchema,
  fiscalIdTypeIdSchema,
  fullNameSchema,
  marketingConsentSchema,
  passwordSchema,
  phoneSchema,
  servicesSchema,
  termsAcceptedSchema,
} from './fields/schemas';

export const TalentRegistrationSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  country_id: countryIdSchema,
  city_id: cityIdSchema,
  address: addressSchema,
  fiscal_id_type_id: fiscalIdTypeIdSchema,
  fiscal_id: fiscalIdSchema,
  services: servicesSchema,
  additional_info: additionalInfoSchema,
  terms_accepted: termsAcceptedSchema,
  marketing_consent: marketingConsentSchema,
});

export type TalentRegistrationSchemaInput = z.input<typeof TalentRegistrationSchema>;
export type TalentRegistrationSchemaOutput = z.output<typeof TalentRegistrationSchema>;
