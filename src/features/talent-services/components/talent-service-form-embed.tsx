import { createClient } from '@/lib/supabase/server';
import { EmbedUnavailable } from '@/shared/components/embed-unavailable';
import { devWarn } from '@/shared/lib/embed/dev-warn';
import { resolveTalentAccess } from '../actions/resolve-talent-access';
import { getResolvedEmbeddableTalentForm } from '../actions/get-resolved-embeddable-talent-form';
import { TalentServiceFormEmbedRenderer } from './talent-service-form-embed-renderer';

type Props = {
  // Identifier del servicio (services.slug). Único globalmente.
  slug: string;
  // País del sitio donde se embebe. Si el talent autenticado no está en
  // este país, el embed muestra un mensaje de no-disponibilidad.
  siteCountryId: string;
  // Locale activa para traducciones del form.
  locale: string;
  // Callback opcional invocado después de un save exitoso, antes del
  // toast. Útil para tracking/redirect. Un error aquí no revierte el save.
  onSubmit?: (formData: Record<string, unknown>) => Promise<void> | void;
};

// API pública del embed de talent service. Server Component: resuelve
// internamente identidad + country gate + form por slug y delega el
// render al Client `TalentServiceFormEmbedRenderer`.
//
// Sequence estrictamente serial — cada paso depende del anterior:
// 1. auth.getUser() → userId (puede ser null).
// 2. resolveTalentAccess(userId, siteCountryId) → granted | reason.
//    Reasons cubren: not-authenticated, no-talent-profile,
//    talent-country-not-set, country-mismatch.
// 3. (Si granted) getResolvedEmbeddableTalentForm(slug, cityId, locale,
//    userId) → available | reason. Reasons cubren: unknown-slug,
//    service-not-active, no-active-form, empty-schema, legacy-schema.
// 4. (Si available) Render Renderer.
//
// Recomendado envolver con <Suspense fallback={...}> en el embedder
// para mejor UX de loading.
export async function TalentServiceFormEmbed({
  slug,
  siteCountryId,
  locale,
  onSubmit,
}: Props) {
  const supabase = createClient();

  // 1. Identity.
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;

  // 2. Country gate + profile resolution.
  const access = await resolveTalentAccess(supabase, userId, siteCountryId);
  if (!access.granted) {
    devWarn('TalentServiceFormEmbed', {
      reason: access.reason,
      slug,
      siteCountryId,
    });
    return (
      <EmbedUnavailable
        reason={access.reason}
        namespace="TalentServiceEmbed.unavailable"
      />
    );
  }

  // 3. Form resolution by slug + city.
  const formResult = await getResolvedEmbeddableTalentForm(
    slug,
    access.cityId,
    locale,
    userId
  );
  if (!formResult.available) {
    devWarn('TalentServiceFormEmbed', {
      reason: formResult.reason,
      slug,
      cityId: access.cityId,
    });
    return (
      <EmbedUnavailable
        reason={formResult.reason}
        namespace="TalentServiceEmbed.unavailable"
      />
    );
  }

  // 4. Render Client.
  return (
    <TalentServiceFormEmbedRenderer
      serviceId={formResult.meta.serviceId}
      formId={formResult.meta.formId}
      resolvedForm={formResult.resolvedForm}
      onSubmit={onSubmit}
    />
  );
}
