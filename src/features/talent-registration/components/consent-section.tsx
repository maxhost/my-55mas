'use client';

import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { DisclaimerField } from '../fields/disclaimer';
import { TermsAcceptedInput } from '../fields/terms-accepted';
import { MarketingConsentInput } from '../fields/marketing-consent';
import type { FormFieldsI18n } from '@/shared/lib/i18n/form-errors';
import type { TalentRegistrationSchemaInput } from '../schemas';

type Props = {
  control: Control<TalentRegistrationSchemaInput>;
  errors: FieldErrors<TalentRegistrationSchemaInput>;
  fieldsI18n: FormFieldsI18n;
};

export function ConsentSection({ control, errors, fieldsI18n }: Props) {
  const disclaimerContent = fieldsI18n.disclaimer?.help ?? fieldsI18n.disclaimer?.label;

  return (
    <>
      {disclaimerContent ? <DisclaimerField content={disclaimerContent} /> : null}

      <Controller
        control={control}
        name="terms_accepted"
        render={({ field }) => (
          <TermsAcceptedInput
            id="terms_accepted"
            label={fieldsI18n.terms_accepted?.label ?? 'Acepto los términos'}
            error={errors.terms_accepted?.message}
            value={field.value as unknown as boolean}
            onChange={(v) => field.onChange(v ? (true as never) : (false as never))}
          />
        )}
      />

      <Controller
        control={control}
        name="marketing_consent"
        render={({ field }) => (
          <MarketingConsentInput
            id="marketing_consent"
            label={fieldsI18n.marketing_consent?.label ?? 'Acepto comunicaciones de marketing'}
            error={errors.marketing_consent?.message}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    </>
  );
}
