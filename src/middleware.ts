import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import {
  time,
  formatServerTiming,
  type Timing,
} from '@/shared/lib/perf/server-timing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const timings: Timing[] = [];
  const total = performance.now();

  // 1. Refresh Supabase auth token (writes updated cookies to response).
  // Esto hace una llamada a Supabase eu-west-1; mide su latencia.
  const supabaseResponse = await time(timings, 'mw_auth', () =>
    updateSession(request)
  );

  // 2. Run next-intl locale detection and routing (puro, sin I/O).
  const intlResponse = intlMiddleware(request);

  // 3. Merge Supabase auth cookies into the intl response.
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  timings.push(['mw_total', performance.now() - total]);
  intlResponse.headers.set('Server-Timing', formatServerTiming(timings));

  return intlResponse;
}

export const config = {
  matcher: [
    // Match all pathnames except:
    // - API routes, _next internals, _vercel, static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
