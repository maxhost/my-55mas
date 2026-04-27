// Server-Timing helpers. Las mediciones aparecen en DevTools del browser:
// Network tab → click en cualquier request → Timing tab → "Server Timing".
// También quedan en los logs de Netlify Functions.
//
// Uso típico en Server Components:
//
//   import { time, formatServerTiming } from '@/shared/lib/perf/server-timing';
//
//   const timings: Array<[string, number]> = [];
//   const data = await time(timings, 'getUser', () =>
//     supabase.auth.getUser()
//   );
//   const profile = await time(timings, 'profileQuery', () =>
//     supabase.from('talent_profiles').select('*').single()
//   );
//   // En el JSX: <pre>{formatServerTiming(timings)}</pre> (debug)
//
// En el middleware/route handler se setea como header:
//   response.headers.set('Server-Timing', formatServerTiming(timings));

export type Timing = [name: string, durationMs: number];

// Mide la duración de una promise async y la pushea al array de timings.
// Retorna el resultado de la fn, así no rompe el flow.
export async function time<T>(
  timings: Timing[],
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    timings.push([name, performance.now() - start]);
  }
}

// Mide la duración de una fn sync.
export function timeSync<T>(
  timings: Timing[],
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    timings.push([name, performance.now() - start]);
  }
}

// Formatea timings al spec de Server-Timing header:
// "name1;dur=12.34, name2;dur=56.78"
// Sanitiza nombres (solo [a-zA-Z0-9_-]) para evitar romper el header.
export function formatServerTiming(timings: Timing[]): string {
  return timings
    .map(([name, dur]) => {
      const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${safe};dur=${dur.toFixed(2)}`;
    })
    .join(', ');
}
