import { z } from 'zod';
import { fullNameSchema } from './fields/full-name';
import { emailSchema } from './fields/email';
import { passwordSchema } from './fields/password';
import { phoneSchema } from './fields/phone';
import { countryIdSchema, cityIdSchema } from './fields/country-city';
import { addressSchema } from './fields/address';
import { fiscalIdSchema, fiscalIdTypeIdSchema } from './fields/fiscal-id';
import { servicesSchema } from './fields/services';
import { additionalInfoSchema } from './fields/additional-info';
import { termsAcceptedSchema } from './fields/terms-accepted';
import { marketingConsentSchema } from './fields/marketing-consent';

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
