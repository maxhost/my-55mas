import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { RegistrationFormEmbed } from '@/features/general-forms';
import {
  TalentServicesAccordion,
  TalentServiceSelectionCommitter,
  getTalentServicesStatus,
} from '@/features/talent-services';

type Props = { params: { locale: string } };

// Onboarding del talent — form post-registro. Step 3 ("Servicios") usa
// fieldSlots para inyectar el committer + accordion debajo del field
// "mis_servicios" (multiselect).
//
// Identidad y contexto country/city se resuelven server-side desde
// talent_profiles. Si el talent no tiene city seteada, mostramos un
// fallback compacto en lugar del embed (porque el embed busca el form
// por slug + cityId).
export default async function OnboardingPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('OnboardingServices');
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('talent_profiles')
    .select('id, country_id, city_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/login');

  if (!profile.country_id || !profile.city_id) {
    // El embed requiere cityId no null. Si el talent llegó al onboarding
    // sin completar su address (city), redirigimos al portal donde puede
    // completarlo. Out of scope v1 hacer un onboarding "Step 0 — completá
    // tu ciudad".
    return (
      <div className="p-8">
        <p className="text-muted-foreground text-sm">{t('emptyState')}</p>
      </div>
    );
  }

  const countryId = profile.country_id;
  const cityId = profile.city_id;

  // Pre-cargar la persistedSelection para el committer.
  const { data: persistedRows } = await supabase
    .from('talent_services')
    .select('service_id')
    .eq('talent_id', profile.id)
    .eq('country_id', countryId);
  const persistedSelection = (persistedRows ?? []).map(
    (r) => r.service_id as string
  );

  // Status pre-render para el actionGuard del step "Servicios".
  // El actionGuard se ejecuta en CADA click → debe ser una función pura
  // del client. Pre-calculamos el snapshot acá y lo capturamos en el
  // closure del guard. Después de cada router.refresh (post commit/save),
  // la page re-renderea y el guard recibe nuevo snapshot.
  const status = await getTalentServicesStatus(locale);
  const total = status.ok ? status.total : 0;
  const saved = status.ok ? status.saved : 0;

  return (
    <div className="p-8 space-y-6">
      <Suspense
        fallback={
          <p className="text-muted-foreground text-sm">{t('commitInFlight')}</p>
        }
      >
        <RegistrationFormEmbed
          slug="onboarding-talento"
          cityId={cityId}
          locale={locale}
          countryId={countryId}
          serviceFilter={{ countryId, cityId }}
          fieldSlots={{
            Servicios: {
              mis_servicios: ({ value }) => (
                <div className="space-y-4 rounded-md border border-dashed p-4">
                  <TalentServiceSelectionCommitter
                    currentSelection={
                      Array.isArray(value)
                        ? (value as string[])
                        : []
                    }
                    persistedSelection={persistedSelection}
                  />
                  <TalentServicesAccordion
                    siteCountryId={countryId}
                    locale={locale}
                  />
                </div>
              ),
            },
          }}
          actionGuards={{
            Servicios: () => {
              if (total === 0) return t('atLeastOneService');
              if (saved < total) return t('saveAllServicesFirst');
              return true;
            },
          }}
        />
      </Suspense>
    </div>
  );
}
