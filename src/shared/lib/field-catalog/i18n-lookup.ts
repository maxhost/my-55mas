// Lookup de messages por clave + locale, sin depender de next-intl.
// Carga estáticamente los 5 JSONs al module load (son ~10-30KB cada uno,
// trivial). Soporta dot-notation ("DbColumnOptions.gender_male").

import esBundle from '@/lib/i18n/messages/es.json';
import enBundle from '@/lib/i18n/messages/en.json';
import ptBundle from '@/lib/i18n/messages/pt.json';
import frBundle from '@/lib/i18n/messages/fr.json';
import caBundle from '@/lib/i18n/messages/ca.json';

const BUNDLES: Record<string, Record<string, unknown>> = {
  es: esBundle,
  en: enBundle,
  pt: ptBundle,
  fr: frBundle,
  ca: caBundle,
};
const FALLBACK_LOCALE = 'es';

// Retorna string si se resuelve en el locale pedido o en 'es' (fallback).
// Null si no existe en ninguno.
export function lookupMessage(key: string, locale: string): string | null {
  const direct = resolve(key, BUNDLES[locale]);
  if (direct !== null) return direct;
  if (locale !== FALLBACK_LOCALE) {
    return resolve(key, BUNDLES[FALLBACK_LOCALE]);
  }
  return null;
}

function resolve(
  key: string,
  bag: Record<string, unknown> | undefined
): string | null {
  if (!bag) return null;
  const parts = key.split('.');
  let cur: unknown = bag;
  for (const p of parts) {
    if (typeof cur !== 'object' || cur === null) return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : null;
}

// snake_case → camelCase (para la convención fallback del B path cuando
// la option se definió como string crudo sin labelKey explícito).
export function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
