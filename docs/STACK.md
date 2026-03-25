# Stack técnico — Decisiones reales

Este documento refleja lo que está implementado, no lo planificado originalmente. Cada decisión incluye el motivo.

## Next.js 14.2.35

- App Router con Server Components por defecto
- `next.config.mjs` (no `.ts` — Next.js 14 no soporta TypeScript config, solo 15+)
- `params` es un objeto síncrono (`{ locale: string }`), no `Promise` como en Next.js 15
- `cookies()` de `next/headers` es síncrono, no async como en Next.js 15

## React 18.3.1

Peer dependency de Next.js 14. React 19 no es compatible.

## TypeScript 5.9.3

- Strict mode habilitado
- Path alias: `@/*` → `./src/*`
- Plugins: `next` (para type-checking de App Router)

## next-intl 3.26.5 (v3, NO v4)

**Por qué v3 y no v4:** next-intl v4.8.3 causa `TypeError: Cannot read properties of null (reading 'useContext')` durante static generation con Next.js 14 + React 18. El error ocurre en las páginas internas `_not-found` y `_error`. Es un bug de compatibilidad entre el runtime de React 18 y cómo v4 resuelve el contexto del servidor. v3 funciona correctamente.

**Consecuencias:**
- Usar `unstable_setRequestLocale(locale)` (no `setRequestLocale` que es de v4)
- En Server Components: `getTranslations('Namespace')` de `next-intl/server`
- En Client Components: `useTranslations('Namespace')` de `next-intl`
- `createSharedPathnamesNavigation` (no `createNavigation` que es de v4)

**Archivos clave:** `src/lib/i18n/config.ts`, `routing.ts`, `navigation.ts`, `request.ts`

## Tailwind CSS 4.2.2 (v4, NO v3)

**Por qué v4 y no v3:** shadcn@latest genera componentes y CSS para Tailwind v4. Intentar usar v3 con estos componentes causa errores de `border-border class does not exist` y otros conflictos de sintaxis.

**Diferencias con v3:**
- No existe `tailwind.config.ts` — la configuración se hace vía CSS (`globals.css`)
- PostCSS usa `@tailwindcss/postcss` (no `tailwindcss` + `autoprefixer`)
- Directiva `@import "tailwindcss"` reemplaza a `@tailwind base/components/utilities`
- Colores en formato oklch (no hsl)
- `@theme inline { }` para mapear CSS variables a tokens de Tailwind
- `@custom-variant dark (&:is(.dark *))` para dark mode

## shadcn/ui — estilo base-nova

**Por qué base-nova y no new-york:** Es el estilo default de shadcn@latest (2026). No existía opción de elegir en `shadcn init -y -d`.

**Diferencias con estilos anteriores:**
- Usa `@base-ui/react` (sucesor de Radix UI), no `@radix-ui/react`
- Componentes en `src/components/ui/` (path configurado en `components.json`)
- Helper `cn()` en `src/lib/utils.ts` (clsx + tailwind-merge)

**Componentes instalados:** button, dropdown-menu, avatar, sheet, separator

## Supabase SSR

- `@supabase/ssr` 0.9.0 — patrón moderno, reemplaza `@supabase/auth-helpers-nextjs`
- `createServerClient` para Server Components y Server Actions (`src/lib/supabase/server.ts`)
- `createBrowserClient` para Client Components (`src/lib/supabase/client.ts`)
- Middleware client para auth refresh (`src/lib/supabase/middleware.ts`)
- Tipos generados desde Supabase remoto en `src/lib/supabase/database.types.ts`
- Type helpers en `src/lib/supabase/types.ts`: `Tables<'profiles'>`, `TablesInsert<>`, `TablesUpdate<>`

## @t3-oss/env-nextjs

Validación de env vars con Zod en `src/lib/env.ts`. Si `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` faltan o tienen formato inválido, el build falla con un mensaje claro.

## Vitest 4.1.1

- Environment: jsdom
- Setup: `src/test/setup.ts` (jest-dom matchers)
- Path aliases configurados en `vitest.config.ts`
- Coverage: solo `src/features/` y `src/shared/`
- Smoke test: `src/test/smoke.test.ts`

## ESLint 8 + eslint-plugin-boundaries

- `eslint-config-next` para reglas de Next.js
- `eslint-plugin-boundaries` enforce aislamiento de features en build time

**Reglas de imports:**

| Desde | Puede importar de |
|-------|-------------------|
| `features/*` | `shared/`, `lib/`, `components/ui/` |
| `shared/*` | `shared/`, `lib/`, `components/ui/` |
| `app/*` | `features/`, `shared/`, `lib/`, `components/ui/`, `app/` |
| `lib/*` | `lib/` |
| `components/ui/*` | `lib/`, `components/ui/` |
| `test/*` | `features/`, `shared/`, `lib/`, `components/ui/` |

Un feature **nunca** puede importar de otro feature. `pnpm lint` falla si se viola.

## Zod 3.25.x

Instalado como dependencia de producción. Se usa para:
- Validación de env vars (`src/lib/env.ts`)
- Validación de inputs en Server Actions (futuro)
- Resolvers de react-hook-form (futuro)
