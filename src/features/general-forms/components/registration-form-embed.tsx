import { EmbedUnavailable } from '@/shared/components/embed-unavailable';
import { devWarn } from '@/shared/lib/embed/dev-warn';
import type {
  ActionGuard,
  FieldSlots,
} from '@/shared/components/form-renderer';
import type { ServiceFilter } from '@/shared/lib/field-catalog/resolve-form';
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
  // Slots opcionales para inyectar UI custom debajo de fields específicos.
  // Scoped por stepKey + fieldKey. Útil para composer onboarding pages
  // que necesitan agregar acordeones, badges, etc., bajo un field.
  fieldSlots?: FieldSlots;
  // Guards opcionales scoped por stepKey. Bloquean avance/submit con un
  // mensaje inline si retornan string. Útil para validar estado externo
  // (ej: "todos los servicios deben estar guardados").
  actionGuards?: Record<string, ActionGuard>;
  // Filtro de service_select options por (countryId, cityId, published).
  // Pasado al resolver. Útil en flows de talent donde el multiselect
  // "Tipo de servicios" debe mostrar solo lo disponible para el talent.
  serviceFilter?: ServiceFilter;
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
  fieldSlots,
  actionGuards,
  serviceFilter,
}: Props) {
  const result = await getResolvedEmbeddableForm(
    slug,
    cityId,
    locale,
    serviceFilter
  );
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
      fieldSlots={fieldSlots}
      actionGuards={actionGuards}
    />
  );
}
