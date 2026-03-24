import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/lib/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase auth token (writes updated cookies to response)
  const supabaseResponse = await updateSession(request);

  // 2. Run next-intl locale detection and routing
  const intlResponse = intlMiddleware(request);

  // 3. Merge Supabase auth cookies into the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: [
    // Match all pathnames except:
    // - API routes, _next internals, _vercel, static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
