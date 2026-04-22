import { redirect } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getTalentServiceForm } from '@/features/talent-services/actions/get-talent-service-form';
import { resolveFormFromJson } from '@/shared/lib/field-catalog/resolve-form-from-json';
import { TalentServiceRenderer } from '@/features/talent-services/components/talent-service-renderer';

type Props = { params: { locale: string; serviceId: string } };

export default async function TalentServiceFormPage({ params: { locale, serviceId } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('TalentPortal');
  const supabase = createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get talent profile (including city_id for form variant resolution)
  const { data: talentProfile } = await supabase
    .from('talent_profiles')
    .select('id, city_id')
    .eq('user_id', user.id)
    .single();

  if (!talentProfile) redirect('/login');

  // Get talent's service registration to find country_id
  const { data: talentService } = await supabase
    .from('talent_services')
    .select('country_id')
    .eq('talent_id', talentProfile.id)
    .eq('service_id', serviceId)
    .limit(1)
    .single();

  // Get service name
  const { data: serviceTrans } = await supabase
    .from('service_translations')
    .select('name')
    .eq('service_id', serviceId)
    .eq('locale', locale)
    .single();

  const serviceName = serviceTrans?.name ?? serviceId;
  const countryId = talentService?.country_id ?? '';

  // Load form + existing data (use talent's city, no fallback to General)
  const formData = await getTalentServiceForm(
    talentProfile.id,
    serviceId,
    countryId,
    talentProfile.city_id,
    locale
  );

  if (!formData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">{serviceName}</h1>
        <p className="text-muted-foreground py-4">{t('noForm')}</p>
      </div>
    );
  }

  const resolvedForm = await resolveFormFromJson({
    supabase,
    schemaJson: formData.form.schema,
    userId: user.id,
    locale,
  });

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">{serviceName}</h1>
      <TalentServiceRenderer
        talentId={talentProfile.id}
        serviceId={serviceId}
        countryId={countryId}
        formId={formData.form.id}
        resolvedForm={resolvedForm}
      />
    </div>
  );
}
