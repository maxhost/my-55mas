# Deployment — Vercel

Setup actual del sitio público. Replaza al deploy de Netlify (donde nos quedamos sin créditos del Free tier).

## Pre-requisitos

- Repo conectado a Vercel (`maxhost/my-55mas`).
- Sin necesidad de plugin: Next.js 14 App Router corre nativo en Vercel.
- `vercel.json` ya está commiteado en raíz con `regions: ["fra1"]` (Frankfurt — la mejor latencia para España).

## Variables de entorno

Cargar en **Vercel → Project → Settings → Environment Variables** para los 3 entornos (Production / Preview / Development):

| Nombre | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vkfolbfchkwezrbkxpiv.supabase.co` | Dev project (sólo este existe hoy). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon key pública) | Usada por el cliente con RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | (service-role key) | **Server-only**. Marcar "Sensitive" en Vercel. Bypassa RLS — la usan acciones admin (upload de imagen, etc.). |
| `NEXT_PUBLIC_SITE_URL` | `https://55mas.es` en prod | Usada por sitemap, JSON-LD, OG. En preview Vercel pone su URL automáticamente. |

Si en el futuro suman analítica / observability / email provider, esas keys van acá también.

## Dominios

1. Vercel → Project → Settings → Domains.
2. Añadir `55mas.es` (y `55mas.pt` cuando exista).
3. Vercel da los registros DNS (A / CNAME). Apuntá el DNS del registrar (CloudFlare / etc.).
4. SSL se genera solo (Let's Encrypt vía Vercel).

Multi-país: el codebase detecta el TLD vía `getDomainCountry()` (ver `src/shared/lib/country/domain.ts`). 1 deploy, N dominios.

## Build settings

Vercel auto-detecta Next.js. Si necesitás overrides:

| Setting | Valor |
|---|---|
| Build command | `pnpm build` (default) |
| Output directory | `.next` (default) |
| Install command | `pnpm install` (default) |
| Node version | 20.x o superior |
| Region | `fra1` (definido en `vercel.json`) |

## Sharp + imágenes

- `sharp` está en `dependencies` (no en devDeps) — procesa los uploads de cover de servicio.
- En `next.config.mjs` se añadió `experimental.serverComponentsExternalPackages: ['sharp']` para que el bundle de la Server Action no exceda 50 MB.
- Supabase Storage hostname (`vkfolbfchkwezrbkxpiv.supabase.co`) está whitelisted en `images.remotePatterns`.

## Checklist primer deploy

- [ ] Repo conectado al Vercel project.
- [ ] Env vars cargadas en los 3 environments.
- [ ] Branch `main` configurado como production.
- [ ] Primer build verde (`pnpm tsc --noEmit` + `pnpm lint` + `pnpm test:run` + `pnpm build` ya corren en CI implícito de Vercel).
- [ ] Probar `/{locale}/` en preview URL (verificar idiomas, locator, mobile menu, hero video, footer stripe).
- [ ] DNS apuntado (después de validar preview).
- [ ] Forzar redeploy tras cambios de env.

## Si algo se rompe

- **Sharp falla en runtime** → confirmar que `experimental.serverComponentsExternalPackages` está en `next.config.mjs` y que sharp está en `dependencies` (no en devDeps).
- **Imagenes no cargan** → revisar `images.remotePatterns` en `next.config.mjs` — agregar el host nuevo.
- **CSP bloquea algo** → ver `next.config.mjs` SECURITY_HEADERS, agregar el origin a la directiva correspondiente.
- **Middleware bucle de redirects** → revisar `src/middleware.ts` (next-intl + Supabase auth combinados; no tocar sin tests).

## Volver a Netlify

Si por alguna razón se necesita revertir:

```bash
git checkout <sha-anterior-a-vercel-prep> -- netlify.toml
# o usá el commit que borró netlify.toml para recuperar el archivo
```

Vercel y Netlify pueden coexistir sin que cada uno se pise (Vercel no lee `netlify.toml`, Netlify no lee `vercel.json`).
