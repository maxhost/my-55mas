'use client';

import { FormBuilderPanel } from '@/shared/components/form-builder/form-builder-panel';
import { getRegistrationForm } from '../actions/get-registration-form';
import { saveRegistrationFormWithTranslations } from '../actions/save-registration-form';
import { cascadeRegistrationSave } from '../actions/cascade-registration-save';
import { cloneRegistrationVariant } from '../actions/clone-registration-variant';
import type {
  FormWithTranslations,
  FormVariantSummary,
  FormCountryOption,
  FormCityOption,
  SaveFormResult,
  CloneFormResult,
} from '@/shared/lib/forms/types';
import type { SaveFormWithTranslationsInput } from '@/shared/lib/forms/schemas';
import type { SurveyQuestionOption } from '@/shared/components/form-builder/survey-field-config';
import type { RegistrationFormWithTranslations, SaveRegistrationFormInput } from '../types';

/** Convert registration form to shared FormWithTranslations (adds fake service_id) */
function toSharedForm(form: RegistrationFormWithTranslations): FormWithTranslations {
  return { ...form, service_id: form.slug };
}

type Props = {
  formSlug: string;
  form: RegistrationFormWithTranslations | null;
  formVariants: FormVariantSummary[];
  serviceCountries: FormCountryOption[];
  serviceCities: FormCityOption[];
  surveyQuestions?: SurveyQuestionOption[];
};

export function RegistrationFormBuilder({
  formSlug, form, formVariants, serviceCountries, serviceCities, surveyQuestions,
}: Props) {
  const handleGetForm = async (
    slug: string, cityId: string | null, fallback?: boolean
  ): Promise<FormWithTranslations | null> => {
    const result = await getRegistrationForm(slug, cityId, fallback);
    return result ? toSharedForm(result) : null;
  };

  const handleClone = async (input: {
    service_id: string; source_city_id: string | null; target_city_id: string;
  }): Promise<CloneFormResult> => {
    const result = await cloneRegistrationVariant({
      slug: input.service_id,
      source_city_id: input.source_city_id,
      target_city_id: input.target_city_id,
    });
    return { data: result.data as FormWithTranslations | undefined, error: result.error };
  };

  const handleSave = async (input: SaveFormWithTranslationsInput): Promise<SaveFormResult> => {
    // Re-map service_id → slug for registration-specific actions
    const regInput = {
      slug: input.service_id,
      city_id: input.city_id ?? null,
      schema: input.schema as unknown as SaveRegistrationFormInput['schema'],
      locale: input.locale,
      labels: input.labels,
      placeholders: input.placeholders,
      option_labels: input.option_labels,
    };
    if (input.city_id === null) {
      return cascadeRegistrationSave(regInput);
    }
    return saveRegistrationFormWithTranslations(regInput);
  };

  return (
    <FormBuilderPanel
      serviceId={formSlug}
      form={form ? toSharedForm(form) : null}
      formVariants={formVariants}
      serviceCountries={serviceCountries}
      serviceCities={serviceCities}
      surveyQuestions={surveyQuestions}
      onGetForm={handleGetForm}
      onCloneVariant={handleClone}
      onSave={handleSave}
    />
  );
}
