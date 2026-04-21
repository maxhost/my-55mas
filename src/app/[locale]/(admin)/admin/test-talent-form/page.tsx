import { unstable_setRequestLocale } from 'next-intl/server';
import { getCountries } from '@/features/services/actions/get-countries';
import { getCities } from '@/features/services/actions/get-cities';
import { listRegistrationForms } from '@/features/general-forms/actions/list-registration-forms';
import { listSurveyQuestions } from '@/features/survey-questions/actions/list-survey-questions';
import { getServiceOptionsForForm } from '@/features/services/actions/get-service-options-for-form';
import type { SurveyQuestionRenderData } from '@/shared/lib/forms/types';
import { TestTalentFormClient } from './test-talent-form-client';

type Props = { params: { locale: string } };

export default async function TestTalentFormPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  const [countries, cities, registrationForms, surveyQuestions, serviceOptions] = await Promise.all([
    getCountries(locale),
    getCities(locale),
    listRegistrationForms(),
    listSurveyQuestions(),
    getServiceOptionsForForm(locale),
  ]);

  const countryOptions = countries.map((c) => ({ id: c.id, name: c.name }));
  const cityOptions = cities.map((c) => ({ id: c.id, name: c.name, country_id: c.country_id }));

  // Transform survey questions to render data for current locale
  const surveyMap: Record<string, SurveyQuestionRenderData> = {};
  for (const q of surveyQuestions) {
    if (!q.is_active) continue;
    const t = q.translations[locale] ?? q.translations['es'];
    if (!t) continue;
    surveyMap[q.key] = {
      key: q.key,
      response_type: q.response_type,
      options: q.options,
      label: t.label,
      description: t.description,
      option_labels: t.option_labels,
    };
  }

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold">Test: Talent Form Embed</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Página de prueba — selecciona país/ciudad para probar disponibilidad del formulario.
      </p>
      <TestTalentFormClient
        locale={locale}
        countries={countryOptions}
        cities={cityOptions}
        registrationForms={registrationForms}
        surveyQuestions={surveyMap}
        serviceOptions={serviceOptions}
      />
    </div>
  );
}
