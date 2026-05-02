import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { getFormContext } from '@/features/talent-registration/actions/get-form-context';
import {
  getCitiesByCountry,
  getServicesByLocation,
} from '@/features/talent-registration/actions/get-services-by-location';
import { registerTalent } from '@/features/talent-registration/actions/register';
import { TalentRegistrationForm } from '@/features/talent-registration';
import type { TalentRegistrationSchemaInput } from '@/features/talent-registration';

type Props = { params: { locale: string } };

export async function generateMetadata({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('TalentRegistration');
  return { title: t('title'), description: t('description') };
}

export default async function TalentRegistrationPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('TalentRegistration');
  const context = await getFormContext(locale);
  if (!context) notFound();

  // Pre-load all cities for all activated countries (small dataset; ~250 rows max)
  const allCities = (
    await Promise.all(context.countries.map((c) => getCitiesByCountry(c.id, locale)))
  ).flat();

  async function loadServices(countryId: string, cityId?: string) {
    'use server';
    return getServicesByLocation(countryId, cityId ?? null, locale);
  }

  async function submit(data: TalentRegistrationSchemaInput) {
    'use server';
    const result = await registerTalent(data, locale);
    return result ?? undefined;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">{t('heading')}</h1>
        <p className="text-muted-foreground">{t('intro')}</p>
      </header>
      <TalentRegistrationForm
        context={context}
        cities={allCities}
        hints={{
          locationNotDetected: t('locationNotDetected'),
          cityManualHint: t('cityManualHint'),
        }}
        loadServices={loadServices}
        onSubmit={submit}
      />
    </main>
  );
}
