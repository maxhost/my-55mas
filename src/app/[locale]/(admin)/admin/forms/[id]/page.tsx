import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getRegistrationForm } from '@/features/general-forms/actions/get-registration-form';
import { listRegistrationVariants } from '@/features/general-forms/actions/list-registration-variants';
import { listSurveyQuestions } from '@/features/survey-questions/actions/list-survey-questions';
import { getCountries } from '@/features/services/actions/get-countries';
import { getCities } from '@/features/services/actions/get-cities';
import { PageHeader } from '@/shared/components/page-header';
import { RegistrationFormEditor } from './registration-form-editor';

type Props = { params: { locale: string; id: string } };

export default async function EditRegistrationFormPage({ params: { locale, id } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('AdminForms');
  const supabase = createClient();

  // Phase 1: get form row to extract slug
  const { data: formRow } = await supabase
    .from('registration_forms')
    .select('id, slug, name, city_id, target_role')
    .eq('id', id)
    .single();

  if (!formRow) notFound();

  // Phase 2: all queries in parallel
  const [
    form,
    formVariants,
    countries,
    allCities,
    surveyQuestions,
    { data: configCountries },
    { data: configCities },
  ] = await Promise.all([
    getRegistrationForm(formRow.slug, formRow.city_id, false),
    listRegistrationVariants(formRow.slug),
    getCountries(locale),
    getCities(locale),
    listSurveyQuestions(),
    supabase
      .from('registration_form_countries')
      .select('country_id')
      .eq('form_id', formRow.id),
    supabase
      .from('registration_form_cities')
      .select('city_id')
      .eq('form_id', formRow.id),
  ]);

  const configuredCountryIds = (configCountries ?? []).map((c) => c.country_id);
  const configuredCityIds = (configCities ?? []).map((c) => c.city_id);

  const allCountryOptions = countries.map((c) => ({ id: c.id, name: c.name }));
  const allCityOptions = allCities.map((c) => ({
    id: c.id,
    name: c.name,
    country_id: c.country_id,
  }));

  const surveyQuestionOptions = surveyQuestions
    .filter((q) => q.is_active)
    .map((q) => ({
      key: q.key,
      label: q.translations[locale]?.label ?? q.key,
    }));

  return (
    <div className="p-8">
      <PageHeader
        title={`${t('editForm')}: ${formRow.name}`}
        backHref="/admin/forms"
      />
      <RegistrationFormEditor
        formId={formRow.id}
        formSlug={formRow.slug}
        targetRole={(formRow.target_role as 'talent' | 'client') ?? 'talent'}
        form={form}
        formVariants={formVariants}
        allCountries={allCountryOptions}
        allCities={allCityOptions}
        configuredCountryIds={configuredCountryIds}
        configuredCityIds={configuredCityIds}
        surveyQuestions={surveyQuestionOptions}
      />
    </div>
  );
}
