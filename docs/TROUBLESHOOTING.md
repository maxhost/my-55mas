# Troubleshooting

Problemas encontrados durante la inicialización del proyecto y cómo se resolvieron.

## Build falla con `useContext null`

**Error:**
```
TypeError: Cannot read properties of null (reading 'useContext')
```

**Causa:** `NODE_ENV=development` en el entorno (default de Claude Code y algunas shells). Next.js 14 se comporta diferente durante static generation con NODE_ENV=development — las páginas internas `_not-found` y `_error` causan errores de React context con next-intl.

**Fix:**
```bash
NODE_ENV=production pnpm build
```

## next-intl v4 incompatible con Next.js 14

**Error:** Mismo `useContext null` en TODAS las páginas durante build, incluso con `NODE_ENV=production`.

**Causa:** next-intl v4.8.3 tiene un bug de compatibilidad con el runtime de React 18 en Next.js 14. El problema está en cómo v4 resuelve el contexto del servidor durante static generation.

**Fix:** Usar next-intl v3:
```bash
pnpm add next-intl@3
```
- `setRequestLocale` → `unstable_setRequestLocale`
- `createNavigation` → `createSharedPathnamesNavigation`
- `hasLocale` sigue disponible en v3
- `getRequestConfig` recibe `{ locale }` (no `{ requestLocale }`)

## shadcn genera componentes para Tailwind v4

**Error:**
```
The `border-border` class does not exist
```

**Causa:** `shadcn@latest` (2026) genera CSS con `@import "tailwindcss"`, `@import "shadcn/tailwind.css"`, oklch colors, y `@base-ui/react` — todo para Tailwind v4. Pero el proyecto tenía Tailwind v3 instalado.

**Fix:** Migrar a Tailwind v4:
```bash
pnpm remove tailwindcss postcss autoprefixer
pnpm add -D @tailwindcss/postcss
```
- Eliminar `tailwind.config.ts`
- En `postcss.config.mjs`: usar `'@tailwindcss/postcss': {}` en vez de `tailwindcss: {}`
- Dejar el `globals.css` generado por shadcn tal cual

## Route groups con page.tsx en la raíz

**Error:**
```
You cannot have two parallel pages that resolve to the same path
```

**Causa:** Todas las route groups `(public)/page.tsx`, `(auth)/page.tsx`, etc. resuelven a `/{locale}/` porque los paréntesis no crean segmentos de URL.

**Fix:** Cada route group necesita un segmento único:
- `(admin)/admin/page.tsx` → `/{locale}/admin`
- `(auth)/login/page.tsx` → `/{locale}/login`
- `(client)/dashboard/page.tsx` → `/{locale}/dashboard`
- `(talent)/portal/page.tsx` → `/{locale}/portal`

Se agregó un catch-all `[locale]/[...rest]/page.tsx` que llama `notFound()` para rutas no definidas.

## `next.config.ts` no soportado

**Error:**
```
Configuring Next.js via 'next.config.ts' is not supported
```

**Causa:** Next.js 14 solo acepta `.js` o `.mjs` para el archivo de configuración. El soporte de `.ts` se agregó en Next.js 15.

**Fix:** Renombrar a `next.config.mjs` y usar JSDoc para tipos:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};
```

## Google Fonts falla durante build offline

**Error:**
```
request to https://fonts.gstatic.com/... failed, reason:
```

**Causa:** `next/font/google` intenta descargar fonts durante el build. Sin conexión a internet, falla.

**Fix:** No usar Google Fonts. Usar `font-sans` del sistema:
```tsx
<body className="font-sans antialiased">
```

Si se necesitan Google Fonts en el futuro, descargarlas como archivos locales en `public/fonts/`.

## pnpm build scripts ignorados

**Warning:**
```
Ignored build scripts: @swc/core, @parcel/watcher
```

**Causa:** pnpm 10+ requiere aprobar build scripts de dependencias por seguridad.

**Fix:** Si causa problemas, aprobar explícitamente:
```bash
pnpm approve-builds @swc/core @parcel/watcher
```

En la práctica, Next.js 14 funciona sin estos build scripts nativos.
