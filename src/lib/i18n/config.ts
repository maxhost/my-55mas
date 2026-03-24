export const locales = ['es', 'en', 'pt', 'fr', 'ca'] as const;
export const defaultLocale = 'es' as const;

export type Locale = (typeof locales)[number];
