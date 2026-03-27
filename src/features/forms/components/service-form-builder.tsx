'use client';

import { FormBuilderPanel } from '@/shared/components/form-builder/form-builder-panel';
import { getForm } from '../actions/get-form';
import { saveFormWithTranslations } from '../actions/save-form';
import { cascadeGeneralSave } from '../actions/cascade-general-save';
import { cloneFormVariant } from '../actions/clone-form-variant';
import type {
  FormWithTranslations,
  FormVariantSummary,
  FormCountryOption,
  FormCityOption,
} from '@/shared/lib/forms/types';
import type { SaveFormWithTranslationsInput } from '@/shared/lib/forms/schemas';

type Props = {
  serviceId: string;
  form: FormWithTranslations | null;
  formVariants: FormVariantSummary[];
  serviceCountries: FormCountryOption[];
  serviceCities: FormCityOption[];
};

export function ServiceFormBuilder({
  serviceId,
  form,
  formVariants,
  serviceCountries,
  serviceCities,
}: Props) {
  const handleSave = async (input: SaveFormWithTranslationsInput) => {
    if (input.city_id === null) {
      return cascadeGeneralSave(input);
    }
    return saveFormWithTranslations(input);
  };

  return (
    <FormBuilderPanel
      serviceId={serviceId}
      form={form}
      formVariants={formVariants}
      serviceCountries={serviceCountries}
      serviceCities={serviceCities}
      onGetForm={getForm}
      onCloneVariant={cloneFormVariant}
      onSave={handleSave}
    />
  );
}
