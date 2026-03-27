'use client';

import { FormBuilderPanel } from '@/shared/components/form-builder/form-builder-panel';
import { getTalentForm } from '../actions/get-talent-form';
import { saveTalentFormWithTranslations } from '../actions/save-talent-form';
import { cascadeTalentGeneralSave } from '../actions/cascade-talent-general-save';
import { cloneTalentFormVariant } from '../actions/clone-talent-form-variant';
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

export function TalentFormBuilder({
  serviceId,
  form,
  formVariants,
  serviceCountries,
  serviceCities,
}: Props) {
  const handleSave = async (input: SaveFormWithTranslationsInput) => {
    if (input.city_id === null) {
      return cascadeTalentGeneralSave(input);
    }
    return saveTalentFormWithTranslations(input);
  };

  return (
    <FormBuilderPanel
      serviceId={serviceId}
      form={form}
      formVariants={formVariants}
      serviceCountries={serviceCountries}
      serviceCities={serviceCities}
      onGetForm={getTalentForm}
      onCloneVariant={cloneTalentFormVariant}
      onSave={handleSave}
    />
  );
}
