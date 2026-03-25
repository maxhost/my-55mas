'use client';

import type { FormWithTranslations } from '../types';
import { FormBuilder } from './form-builder';
import { FormTranslations } from './form-translations';

type Props = {
  serviceId: string;
  form: FormWithTranslations | null;
};

export function FormBuilderPanel({ serviceId, form }: Props) {
  return (
    <div className="space-y-8">
      <FormBuilder serviceId={serviceId} form={form} />
      {form && (
        <FormTranslations
          formId={form.id}
          schema={form.schema}
          translations={form.translations}
        />
      )}
    </div>
  );
}
