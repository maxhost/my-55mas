import { Suspense } from 'react';
import { unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getCountries } from '@/features/services/actions/get-countries';
import { TalentServiceFormEmbed } from '@/features/talent-services';
import { TestTalentServiceEmbedClient } from './test-talent-service-embed-client';

type Props = {
  params: { locale: string };
  searchParams: { slug?: string; country?: string };
};

// Harness para verificar el embed de talent service forms. El admin
// elige (a) un service slug y (b) un siteCountryId — el embed resuelve
// el resto desde la sesión + talent_profiles. Los selectors viven en
// searchParams para que la page Server pueda renderizar el embed con
// esos valores.
export default async function TestTalentServiceEmbedPage({
  params: { locale },
  searchParams,
}: Props) {
  unstable_setRequestLocale(locale);
  const supabase = createClient();

  const [{ data: services }, countries] = await Promise.all([
    supabase
      .from('services')
      .select('slug, status')
      .eq('status', 'active')
      .order('slug'),
    getCountries(locale),
  ]);

  const slug = searchParams.slug ?? '';
  const country = searchParams.country ?? '';
  const ready = slug && country;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold">Test: Talent Service Embed</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Selecciona un servicio y un país de site (siteCountryId) para
          probar el embed. El embed compara siteCountryId contra el
          country_id del talent autenticado.
        </p>
        <TestTalentServiceEmbedClient
          locale={locale}
          services={(services ?? []).map((s) => ({ slug: s.slug }))}
          countries={countries.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>

      {ready && (
        <div className="max-w-lg rounded-md border p-6">
          <Suspense
            fallback={
              <p className="text-muted-foreground text-sm">
                Cargando formulario…
              </p>
            }
          >
            <TalentServiceFormEmbed
              slug={slug}
              siteCountryId={country}
              locale={locale}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
