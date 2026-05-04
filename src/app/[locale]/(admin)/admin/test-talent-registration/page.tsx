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
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

export default async function TestTalentRegistrationPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('TalentRegistration');
  const context = await getFormContext(locale);
  if (!context) notFound();

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
    <div className="p-8">
      <PageHeader title={t('heading')} />
      <p className="text-muted-foreground mb-6 text-sm">{t('intro')}</p>
      <div className="max-w-2xl">
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
      </div>
    </div>
  );
}
