import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';

// Razones por las que un embed puede negarse a renderizar el form.
// Cada una mapea a una key i18n bajo TalentServiceEmbed.unavailable.* o
// equivalente. Cubre tanto bugs de configuración como estados esperados.
export const EMBED_REASONS = [
  'unknown-slug',
  'service-not-active',
  'country-mismatch',
  'talent-country-not-set',
  'city-not-configured',
  'no-active-form',
  'empty-schema',
  'legacy-schema',
  'not-authenticated',
  'no-talent-profile',
] as const;

export type EmbedReason = (typeof EMBED_REASONS)[number];

export function isEmbedReason(value: unknown): value is EmbedReason {
  return (
    typeof value === 'string' &&
    (EMBED_REASONS as readonly string[]).includes(value)
  );
}

// Resultado discriminado de un loader/resolver de embed. TMeta carga la
// info que el caller necesita pasar al renderer (formId, serviceId, etc.).
export type EmbedResolverResult<TMeta> =
  | { available: true; resolvedForm: ResolvedForm; meta: TMeta }
  | { available: false; reason: EmbedReason };
