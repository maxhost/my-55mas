import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  const validLocale = routing.locales.includes(locale as typeof routing.locales[number])
    ? locale
    : routing.defaultLocale;

  return {
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
