import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { RegistrationFormEmbed } from '@/features/general-forms';

type Props = { params: { locale: string } };

// Onboarding del talent — form post-registro. Step 3 ("Servicios") tiene
// un field con input_type='talent_services_panel' que se renderea como
// la unidad compuesta completa (multiselect + committer + acordeón con
// embeds + status badges + bloqueo de submit) gracias al registry pattern.
//
// Cero código en esta page: el feature talent-services se registra a sí
// mismo via side-effect import desde el root layout, y el panel se
// despliega automáticamente cuando el FormRenderer encuentra el field.
//
// Auth gate + lookup de country+city se mantienen porque el embed
// `RegistrationFormEmbed` los exige como props.
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
    .select('country_id, city_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile) redirect('/login');

  if (!profile.country_id || !profile.city_id) {
    // El embed requiere cityId no null. Si el talent llegó al onboarding
    // sin completar su address (city), mostramos un mensaje compacto.
    // Out of scope v1: redirección automática al picker de city.
    return (
      <div className="p-8">
        <p className="text-muted-foreground text-sm">{t('emptyState')}</p>
      </div>
    );
  }

  const countryId = profile.country_id;
  const cityId = profile.city_id;

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
        />
      </Suspense>
    </div>
  );
}
