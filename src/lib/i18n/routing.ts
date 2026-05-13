import { defineRouting } from 'next-intl/routing';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  // localeDetection true (the default, but made explicit) → bare visits
  // get redirected based on NEXT_LOCALE cookie + Accept-Language header.
  // Cookie is written by next-intl middleware on locale navigation, so
  // the LangSwitcher click also persists the choice automatically.
  localeDetection: true,
});
