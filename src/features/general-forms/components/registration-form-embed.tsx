import { EmbedUnavailable } from '@/shared/components/embed-unavailable';
import { devWarn } from '@/shared/lib/embed/dev-warn';
import { getResolvedEmbeddableForm } from '../actions/get-resolved-embeddable-form';
import { RegistrationFormEmbedRenderer } from './registration-form-embed-renderer';

type Props = {
  // Identifier del form (registration_forms.slug). Único globalmente.
  slug: string;
  // City donde se embebe — usada para resolver la variant del form.
  cityId: string;
  // Locale activa para traducciones del form.
  locale: string;
  // País contexto del embedder. Usado en signup (registerUser) para
  // pre-setear talent_profiles.country_id si el form crea un user.
  countryId?: string;
  // Callback opcional invocado después de un save exitoso, antes del
  // toast. Útil para tracking/redirect. Un error aquí no revierte el save.
  onSubmit?: (formData: Record<string, unknown>) => Promise<void> | void;
};

// API pública del embed de general forms. Server Component: resuelve
// internamente el form por slug + city y delega el render al Client
// `RegistrationFormEmbedRenderer`. Si el form no está disponible (slug
// desconocido, city sin configurar, schema legacy, etc.) renderiza un
// mensaje de no-disponibilidad con i18n.
//
// Recomendado envolver con <Suspense fallback={...}> en el embedder
// para mejor UX de loading.
export async function RegistrationFormEmbed({
  slug,
  cityId,
  locale,
  countryId,
  onSubmit,
}: Props) {
  const result = await getResolvedEmbeddableForm(slug, cityId, locale);
  if (!result.available) {
    devWarn('RegistrationFormEmbed', { reason: result.reason, slug, cityId });
    return (
      <EmbedUnavailable reason={result.reason} namespace="Embed.unavailable" />
    );
  }
  return (
    <RegistrationFormEmbedRenderer
      resolvedForm={result.resolvedForm}
      targetRole={result.meta.targetRole}
      countryId={countryId}
      cityId={cityId}
      onSubmit={onSubmit}
    />
  );
}
