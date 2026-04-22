import { unstable_setRequestLocale } from 'next-intl/server';
import { getCountries } from '@/features/services/actions/get-countries';
import { getCities } from '@/features/services/actions/get-cities';
import { listRegistrationForms } from '@/features/general-forms/actions/list-registration-forms';
import { TestTalentFormClient } from './test-talent-form-client';

type Props = { params: { locale: string } };

export default async function TestTalentFormPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);

  const [countries, cities, registrationForms] = await Promise.all([
    getCountries(locale),
    getCities(locale),
    listRegistrationForms(),
  ]);

  const countryOptions = countries.map((c) => ({ id: c.id, name: c.name }));
  const cityOptions = cities.map((c) => ({
    id: c.id,
    name: c.name,
    country_id: c.country_id,
  }));

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
      />
    </div>
  );
}
