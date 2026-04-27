import type { EmbedReason } from '@/shared/lib/embed/types';
import { getTranslations } from 'next-intl/server';

type Props = {
  reason: EmbedReason;
  // Namespace donde viven las traducciones de las reasons. General forms
  // usa 'Embed.unavailable', talent forms usa 'TalentServiceEmbed.unavailable'.
  // El reason se usa como key dentro del namespace, transformado a camelCase.
  // Ej: reason='unknown-slug' → namespace.unknownSlug.
  namespace: string;
};

const REASON_TO_KEY: Record<EmbedReason, string> = {
  'unknown-slug': 'unknownSlug',
  'service-not-active': 'serviceNotActive',
  'country-mismatch': 'countryMismatch',
  'talent-country-not-set': 'talentCountryNotSet',
  'city-not-configured': 'cityNotConfigured',
  'no-active-form': 'noActiveForm',
  'empty-schema': 'emptySchema',
  'legacy-schema': 'legacySchema',
  'not-authenticated': 'notAuthenticated',
  'no-talent-profile': 'noTalentProfile',
};

// Server Component que renderiza un mensaje de no-disponibilidad para un
// embed. Usado por los Server wrappers de general forms y talent forms.
// El `reason` mapea a una key i18n bajo `namespace.<camelCase>`.
export async function EmbedUnavailable({ reason, namespace }: Props) {
  const t = await getTranslations(namespace);
  const message = t(REASON_TO_KEY[reason]);
  return (
    <div className="rounded-md border border-dashed p-6 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
