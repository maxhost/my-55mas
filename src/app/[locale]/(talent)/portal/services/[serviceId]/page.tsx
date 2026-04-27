import { redirect } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { TalentServiceFormEmbed } from '@/features/talent-services';

type Props = { params: { locale: string; serviceId: string } };

// Portal del talent — render del form de un servicio. El portal "es" el
// sitio del talent: por convención, siteCountryId === talent.country_id.
// La resolución del form (slug + variant + labels + valores) la hace el
// embed. La page sólo provee siteCountryId + slug + locale.
export default async function TalentServiceFormPage({
  params: { locale, serviceId },
}: Props) {
  unstable_setRequestLocale(locale);
  const supabase = createClient();

  // Auth + talent profile gate. Mantenemos redirect en este flujo
  // protegido (el portal ya asume talent autenticado). Si llega un user
  // sin talent_profiles, redirige a login en vez de mostrar el mensaje
  // inline del embed (UX del portal).
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: talentProfile } = await supabase
    .from('talent_profiles')
    .select('country_id')
    .eq('user_id', user.id)
    .single();
  if (!talentProfile) redirect('/login');

  // Resolver service slug desde el UUID del route param. El embed
  // requiere slug. Si el servicio no existe, el embed muestra
  // 'unknown-slug' inline.
  const { data: service } = await supabase
    .from('services')
    .select('slug')
    .eq('id', serviceId)
    .maybeSingle();

  // Service name (best-effort, sólo para el title de la page).
  const { data: serviceTrans } = await supabase
    .from('service_translations')
    .select('name')
    .eq('service_id', serviceId)
    .eq('locale', locale)
    .maybeSingle();
  const serviceName = serviceTrans?.name ?? service?.slug ?? serviceId;

  // siteCountryId: en el portal del talent, el sitio coincide con el
  // país del talent. (Si en el futuro el portal soporta multi-country,
  // habrá que hacer un picker explícito.)
  const siteCountryId = talentProfile.country_id;

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">{serviceName}</h1>
      {/* Si service no existe (slug null), forzamos un slug-inválido
          que dispare unknown-slug en el embed. */}
      <TalentServiceFormEmbed
        slug={service?.slug ?? '__missing__'}
        siteCountryId={siteCountryId ?? ''}
        locale={locale}
      />
    </div>
  );
}
