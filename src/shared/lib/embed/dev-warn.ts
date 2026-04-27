// Logger gateado por NODE_ENV. Usa console.warn con un prefijo
// `[Component]` greppable. En production no loggea nada para evitar
// ruido en stdout/error reporting tools.
//
// Uso: devWarn('TalentServiceFormEmbed', { reason: 'country-mismatch', slug });
export function devWarn(component: string, ...payload: unknown[]): void {
  if (process.env.NODE_ENV === 'production') return;
  // eslint-disable-next-line no-console
  console.warn(`[${component}]`, ...payload);
}
