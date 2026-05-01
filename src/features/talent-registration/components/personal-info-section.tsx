'use client';

import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { FullNameInput } from '../fields/full-name';
import { EmailInput } from '../fields/email';
import { PasswordInput } from '../fields/password';
import type { FormFieldsI18n } from '@/shared/lib/i18n/form-errors';
import type { TalentRegistrationSchemaInput } from '../schemas';

type Props = {
  control: Control<TalentRegistrationSchemaInput>;
  errors: FieldErrors<TalentRegistrationSchemaInput>;
  fieldsI18n: FormFieldsI18n;
};

export function PersonalInfoSection({ control, errors, fieldsI18n }: Props) {
  return (
    <>
      <Controller
        control={control}
        name="full_name"
        render={({ field }) => (
          <FullNameInput
            id="full_name"
            label={fieldsI18n.full_name?.label ?? 'Nombre completo'}
            placeholder={fieldsI18n.full_name?.placeholder}
            help={fieldsI18n.full_name?.help}
            error={errors.full_name?.message}
            value={field.value}
            onChange={field.onChange}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <EmailInput
            id="email"
            label={fieldsI18n.email?.label ?? 'Email'}
            placeholder={fieldsI18n.email?.placeholder}
            help={fieldsI18n.email?.help}
            error={errors.email?.message}
            value={field.value}
            onChange={field.onChange}
            required
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <PasswordInput
            id="password"
            label={fieldsI18n.password?.label ?? 'Contraseña'}
            help={fieldsI18n.password?.help}
            error={errors.password?.message}
            value={field.value}
            onChange={field.onChange}
            required
          />
        )}
      />
    </>
  );
}
