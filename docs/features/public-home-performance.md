# Public Home — Performance pass (Sesión 6)

Targets fijados en el spec:
- **LCP < 2.5s** en mobile throttled
- **INP < 200ms**
- **CLS < 0.1**

## Optimizaciones aplicadas durante la migración

### Bundle / JS shipped

| Optimización | Sesión | Efecto |
|---|---|---|
| RSC por default en TODAS las secciones | 1.1 → 2.4 | Cero JS para hero, services grid (cards/filter/carousel), howto, project, testimonials, joinCta, collaborators, footer, newsletter visual, whatsapp fab |
| Única Client island: `locator-select.tsx` | 1.1 | Solo el dropdown del header ship código al cliente |
| Filtro de servicios via URL searchParams (`?cat=...`) | 2.2 | Filter es link-based RSC, no Client component |
| Carrusel de servicios CSS scroll-snap | 2.2 | Cero JS para horizontal scroll |
| Carrusel de testimonios CSS scroll-snap | 2.4 | Idem |
| Marquee colaboradores CSS `@keyframes` | 2.4 | Cero JS; pausa con `:hover`, respeta `prefers-reduced-motion` |
| `dangerouslySetInnerHTML` para JSON-LD | 3.1 | Sin overhead de React reconciliation |

Resultado: home `/[locale]` ships **102 kB First Load JS** (medido en `pnpm build`), del cual ~87 kB es runtime compartido de Next/React/next-intl. El delta atribuible al public-home es ~15 kB principalmente locator-select.

### Fonts

| Optimización | Sesión | Efecto |
|---|---|---|
| `next/font/google` para Mulish self-hosted | 0.2 | No request a Google Fonts, sin layout shift |
| `display: 'swap'` | 0.2 | FOIT evitado |
| Subsets `latin` + `latin-ext` | 0.2 | Cubre todos los locales sin pesar de más |
| Weights pre-cargados: 400/500/600/700/800 | 0.2 | No FOUT entre weights |

### Images

| Optimización | Sesión | Efecto |
|---|---|---|
| `next/image` en TODAS las imágenes del sitio | 1.x → 2.4 | Auto-optimización WebP/AVIF al servir |
| `priority` en logo del header | 1.1 | Pre-cargado para LCP |
| `loading="lazy"` en iframe del Vimeo | 2.1 | No bloquea hero render |
| `sizes` con responsive breakpoints en ServiceCard | 2.2 | Servidor sirve la versión apropiada |
| `aspect-ratio` reservado en hero media | 2.1 | CLS = 0 en el media (no salta al cargar el iframe) |
| `width` + `height` en TODAS las `<Image>` | 2.x | CLS = 0 por imagen |

### Network

| Optimización | Sesión | Efecto |
|---|---|---|
| `<link rel="preconnect" href="https://player.vimeo.com">` | 6 | TCP+TLS arranca durante el HTML parse |
| `<link rel="dns-prefetch">` para Bubble CDN + Vimeo CDN | 6 | DNS resuelto antes del request real |
| Image whitelist en `next.config.mjs` | 2.2 | Solo dominios trusted |

### CSS

| Optimización | Sesión | Efecto |
|---|---|---|
| Tailwind v4 con purge automático | (existente) | CSS shipped solo contiene utilidades usadas |
| CSS vars para brand tokens en `:root` | 0.2 | Sin runtime cost |
| Cero `@import` de hojas externas | 0.2 → 6 | Todo inline en bundle de Next |

### A11y baseline (sin audit formal)

- `aria-label` en interactivos sin texto (logo, social icons, FAB).
- `role="region"` en carruseles + `aria-label`.
- `:focus-visible` en lugar de `:focus` para no perjudicar mouse users mientras preserva keyboard a11y.
- `prefers-reduced-motion` en marquee de colaboradores.
- `aria-hidden` en duplicado del marquee y decoraciones.
- `alt=""` (decorativo) vs alt descriptivo según el caso.

## Trabajo pendiente / opcional

| Tarea | Impacto | Esfuerzo | Estado |
|---|---|---|---|
| **Lighthouse CI con gates en PRs** | Catch regresiones | Medio | Parqueado |
| **Nonce-based CSP** via middleware en lugar de `'unsafe-inline'` | Hardening real | Medio | Parqueado |
| Migrar Group.svg / Light.svg a inline para evitar request adicional | LCP -50ms aprox | Bajo | Pendiente eval |
| WebP pipeline en admin upload (fase 5.1) | Reducir tamaño de uploads de admin | Medio | Fase 5.1 |
| Suspense boundaries por sección con skeletons | INP perceptual | Medio | Pendiente eval |
| Service worker para shell offline | UX en mobile spotty | Alto | Parqueado |
| Precompresión Brotli en Netlify | -20% wire size | Bajo | Netlify ya lo hace por default |

## Cómo medir en producción

Una vez deployado en el dominio final:

```bash
# Local audit con throttling mobile
npx lighthouse https://55mas.es/es \
  --preset=desktop \
  --output html --output-path ./reports/lh-desktop.html --view

npx lighthouse https://55mas.es/es \
  --emulated-form-factor=mobile \
  --throttling-method=simulate \
  --output html --output-path ./reports/lh-mobile.html --view
```

O usar [PageSpeed Insights](https://pagespeed.web.dev/) con la URL de producción.

## Tests de regresión

Para evitar que sesiones futuras rompan los gains:

- **No agregar `'use client'`** salvo por interactividad explícitamente necesaria. Cada uno se justifica en code review.
- **No agregar imports de librerías cliente** (analytics, animations) sin revisar bundle impact.
- **No agregar imágenes sin `width`/`height`** o `aspect-ratio`.
- **No remover `loading="lazy"`** en assets below-the-fold.
- **No agregar fonts adicionales** salvo necesidad real — cada peso suma ~30 KB.

## Gaps conocidos que afectan números

- **Lighthouse CI no configurado** — no hay gates automáticos. La auditoría se hace manualmente.
- **No Observability** — si LCP/CLS degrada en producción, no nos enteramos hasta que un usuario reporta. Plug Sentry / Vercel Analytics cuando se desparqueé el ítem #14 del scope.
- **Cookie consent** parqueado — cuando llegue, podría agregar JS adicional según qué tracking gate.
