// Strips a leading 2-letter locale segment (e.g. '/es/foo' → '/foo').
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/[a-z]{2}(\/.*)?$/);
  if (!match) return pathname;
  return match[1] ?? '/';
}
