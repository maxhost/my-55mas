import { describe, it, expect } from 'vitest';
import esJson from '../messages/es.json';
import enJson from '../messages/en.json';
import ptJson from '../messages/pt.json';
import frJson from '../messages/fr.json';
import caJson from '../messages/ca.json';

type LocaleMessages = Record<string, unknown>;

const LOCALES: Record<string, LocaleMessages> = {
  es: esJson as LocaleMessages,
  en: enJson as LocaleMessages,
  pt: ptJson as LocaleMessages,
  fr: frJson as LocaleMessages,
  ca: caJson as LocaleMessages,
};

// Aplana un objeto JSON a paths con dot-notation. Ej:
// { a: { b: 'x' }, c: 'y' } → ['a.b', 'c']
function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== 'object' || Array.isArray(obj)) return [prefix];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    keys.push(...flattenKeys(v, path));
  }
  return keys;
}

function diff(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((k) => !b.has(k));
}

describe('locale parity — todas las claves deben existir en los 5 locales', () => {
  const localeKeys: Record<string, Set<string>> = {};
  for (const [locale, msgs] of Object.entries(LOCALES)) {
    localeKeys[locale] = new Set(flattenKeys(msgs));
  }

  const referenceLocale = 'es';
  const referenceKeys = localeKeys[referenceLocale];

  it.each(Object.keys(LOCALES).filter((l) => l !== referenceLocale))(
    '%s tiene las mismas claves que es',
    (locale) => {
      const otherKeys = localeKeys[locale];
      const missing = diff(referenceKeys, otherKeys);
      const extra = diff(otherKeys, referenceKeys);
      // Reporta de forma legible: lista de keys faltantes/extra.
      if (missing.length > 0 || extra.length > 0) {
        const lines: string[] = [];
        if (missing.length > 0) {
          lines.push(`  Missing in ${locale}.json (presentes en ${referenceLocale}.json):`);
          for (const k of missing) lines.push(`    - ${k}`);
        }
        if (extra.length > 0) {
          lines.push(`  Extra in ${locale}.json (no están en ${referenceLocale}.json):`);
          for (const k of extra) lines.push(`    + ${k}`);
        }
        throw new Error(
          `Locale parity violation between ${referenceLocale} and ${locale}:\n${lines.join('\n')}`
        );
      }
      expect(missing).toEqual([]);
      expect(extra).toEqual([]);
    }
  );

  it('cubre los namespaces críticos del embed', () => {
    const requiredKeys = [
      'TalentServiceEmbed.unavailable.unknownSlug',
      'TalentServiceEmbed.unavailable.serviceNotActive',
      'TalentServiceEmbed.unavailable.countryMismatch',
      'TalentServiceEmbed.unavailable.talentCountryNotSet',
      'TalentServiceEmbed.unavailable.cityNotConfigured',
      'TalentServiceEmbed.unavailable.noActiveForm',
      'TalentServiceEmbed.unavailable.emptySchema',
      'TalentServiceEmbed.unavailable.legacySchema',
      'TalentServiceEmbed.unavailable.notAuthenticated',
      'TalentServiceEmbed.unavailable.noTalentProfile',
      'TalentServiceEmbed.error.auth',
      'TalentServiceEmbed.error.config',
      'TalentServiceEmbed.error.db',
      'AdminTalentServices.tabEmbed',
      'AdminTalentServices.embedCode',
      'AdminTalentServices.embedHint',
      'Embed.unavailable.unknownSlug',
      'Embed.unavailable.cityNotConfigured',
      'Embed.unavailable.noActiveForm',
      'Embed.unavailable.emptySchema',
      'Embed.unavailable.legacySchema',
      // Onboarding services step 3 (S5+S8 del feature onboarding-services).
      'OnboardingServices.commitSelection',
      'OnboardingServices.commitPending',
      'OnboardingServices.commitInFlight',
      'OnboardingServices.commitSuccess',
      'OnboardingServices.commitError',
      'OnboardingServices.statusPending',
      'OnboardingServices.statusSaved',
      'OnboardingServices.emptyState',
      'OnboardingServices.atLeastOneService',
      'OnboardingServices.saveAllServicesFirst',
      'OnboardingServices.savedCount',
      'OnboardingServices.accordionTitle',
      // talent_services_panel renderer (S5b del feature talent-services-panel).
      'OnboardingServices.loadingService',
      'OnboardingServices.expandError',
      'OnboardingServices.retry',
    ];
    for (const locale of Object.keys(LOCALES)) {
      const keys = localeKeys[locale];
      for (const required of requiredKeys) {
        expect(
          keys.has(required),
          `${locale}.json is missing required key: ${required}`
        ).toBe(true);
      }
    }
  });
});
