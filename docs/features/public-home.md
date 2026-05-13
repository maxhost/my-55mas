# Public Home (and shared public site) — migración HTML mockup → Next.js

Migración del mockup HTML/CSS estático (`static-mockups/55mas-home/`) a Next.js dentro del proyecto Next existente, con componentes agnósticos reutilizables en home + listings + páginas adicionales, RSC-first, multi-locale, multi-país, security-first, production-grade.

## Goal

Que `/{locale}/` muestre la home pixel-equivalente al mockup, server-rendered por defecto (Astro-grade speed), con strings hardcoded centralizadas vía next-intl y la posibilidad — una sección a la vez, paced por el usuario — de reemplazar contenido hardcoded por data de Supabase (`services`, `testimonials`, `collaborators`, etc.) sin tocar los componentes presentacionales.

Misma base sirve para futuras páginas públicas (`/{locale}/servicios`, `/{locale}/sobre-55`, etc.) reutilizando los mismos componentes.

## Out of scope (parked, requieren input de cliente)

- **A11y audit formal** (WCAG 2.1 AA pass). Mantenemos HTML semántico básico y reglas obvias (no `outline: none` sin `:focus-visible`, contraste razonable, `alt` en imágenes) pero sin audit ni certificación.
- **Cookie consent / GDPR banner**. Sin esto NO se carga ningún analytics ni pixel.
- **Analytics / tag manager**. Cliente define qué sistema usa (GA4, Plausible, Mixpanel).
- **Observability (Sentry o equivalente)**. Parqueado para producción real.
- **Lighthouse audit CI con gates**. Lo medimos manualmente al final, sin bloquear PRs todavía.

Estos quedan como **gaps conocidos** documentados en la sección final.

## Decisiones cerradas (2026-05-12)

| Tema | Resolución |
|---|---|
| Stack | **Next.js 14 App Router** (ya en el repo) — NO Astro |
| Renderizado | **RSC por defecto**. `'use client'` solo donde hay interactividad real, justificado en review |
| Routing | `app/[locale]/(public)/` route group, paralelo a `(admin)/`/`(client)`/`(talent)`/`(auth)` |
| i18n hardcoded | **next-intl** (ya instalado). Namespace `home.*`, `nav.*`, `footer.*`, etc. |
| i18n DB | Patrón existente `i18n jsonb` por entidad + helper `localizedField()` |
| Multi-país | Cookie `country_id` + URL param `?country=ES` para shareables. Selector header escribe la cookie y dispara revalidate de RSC. Server Actions y queries DB **siempre** filtran por country_id |
| Diseño tokens | Mockup CSS vars → `tailwind.config.ts` colors/spacing/font + CSS vars globales en `globals.css` para retrocompatibilidad |
| Componentes agnósticos | `src/shared/components/marketing/` para reutilizables (Hero, ServiceCard, HowItWorks, etc.). `src/features/public-home/components/` solo para ensambles específicos de home |
| Data flow | Componentes reciben **props**, no fetchean. RSC parent fetchea via Server Actions. Cero data fetching en Client Components |
| Forms | Cuando arranquen: reusar patrón de `service-hire` (Server Action + Zod + safeParse) + hardening (rate limit + honeypot + CSRF gratis de Next 14) |
| Imágenes | `next/image` SIEMPRE + pipeline WebP en admin upload (Fase 5.1) |
| SEO técnico | sitemap.ts dinámico + robots.ts + generateMetadata per ruta con hreflang + JSON-LD Organization en layout + Service catalog en home (Fase 3.1) |
| Security headers | CSP estricto + HSTS + X-Frame-Options + Referrer-Policy + X-Content-Type-Options vía `next.config.ts` (Fase 3.2) |
| Error/loading/404 | `error.tsx`, `loading.tsx`, `not-found.tsx` globales y por route group — genéricos pero estilados (Fase 3.2) |
| Performance targets | **LCP <2.5s mobile, INP <200ms, CLS <0.1**. Medido al final de Fase 6 |

## Architectural overview

### Folder structure

```
src/app/[locale]/(public)/
├── layout.tsx              # Public layout: <Header> + <Navbar> + {children} + <Footer>
├── page.tsx                # Home (assembles section components from public-home feature)
├── error.tsx               # Public-specific error fallback (Fase 3.2)
├── loading.tsx             # Public-specific loading skeleton
├── not-found.tsx           # 404 estilado con tokens del sitio
├── servicios/              # Futuras páginas usan los mismos componentes shared
│   ├── page.tsx
│   └── [slug]/page.tsx
├── sobre-55/page.tsx
└── contacto/page.tsx

src/features/public-home/
├── components/             # Solo ensamblan/orquestan, NO se reutilizan fuera de home
│   ├── home-hero.tsx
│   ├── home-services-section.tsx
│   ├── home-howto-talents.tsx
│   ├── home-howto-clients.tsx
│   ├── home-project.tsx
│   ├── home-testimonials.tsx
│   ├── home-join-cta.tsx
│   └── home-collaborators.tsx
├── actions/
│   └── get-home-data.ts    # Server Action que orquesta todas las queries (Fase 4)
├── lib/
└── __tests__/

src/shared/components/marketing/
├── header/                 # Logo + locator + socials + signin + lang
│   ├── public-header.tsx
│   ├── locator-select.tsx  # Client island chico para el dropdown
│   └── socials-row.tsx
├── navbar/                 # Red strip nav
│   └── public-navbar.tsx
├── footer/
│   ├── public-footer.tsx
│   └── footer-color-stripe.tsx
├── hero/                   # Hero genérico parametrizable
│   ├── hero.tsx
│   └── hero-decorations.tsx
├── service-card/
│   └── service-card.tsx
├── services-grid/          # Carrusel + filtros (Client island)
│   ├── services-carousel.tsx
│   └── services-filter.tsx
├── howto/                  # Mismo componente con prop reversed para clients
│   ├── how-it-works.tsx
│   └── how-it-works-shapes.tsx
├── project/
│   └── project-section.tsx
├── testimonial/
│   ├── testimonial-card.tsx
│   └── testimonials-carousel.tsx
├── join-cta/
│   └── join-cta.tsx
├── collaborator-marquee/
│   └── collaborator-marquee.tsx
├── newsletter-form/        # Visual only en Fase 1; lógica en Fase 5.2
│   └── newsletter-form.tsx
├── whatsapp-fab/
│   └── whatsapp-fab.tsx
└── section/                # Wrapper genérico (title + subtitle + content)
    └── section.tsx

src/shared/lib/
├── country/
│   ├── country-cookie.ts   # read/write cookie de país
│   ├── use-country.ts      # hook client para país activo
│   └── country-context.tsx # opcional, si hace falta context
├── seo/
│   ├── generate-public-metadata.ts  # helper p/ generateMetadata
│   └── json-ld.ts          # builders de JSON-LD Organization, Service
└── analytics/              # PARKED, scaffolding mínimo cuando lleguemos
```

### Reglas de aislamiento (architecture.md §3 reaffirmed)

| Capa | Puede importar de | NO puede importar de |
|---|---|---|
| `app/[locale]/(public)/` | `features/public-home/*`, `shared/*` | otro feature, otros route groups |
| `features/public-home/` | `shared/*`, `lib/*` | otros features, route groups |
| `shared/components/marketing/` | `shared/lib/*`, `shared/components/ui/*` | **features/**, **app/** |
| `shared/lib/country/` | nadie | features, app, otros shared |

**Componentes en `shared/components/marketing/` son agnósticos**: reciben props tipadas, no fetchean, no leen cookies directamente. Si necesitan país/locale, vienen como prop. Esto garantiza reuso en home + listing + landing futuras.

### Data flow

```
┌────────────────────────────────────────────┐
│ Browser solicita /es/                      │
└────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────┐
│ middleware.ts: detecta locale + country    │
│ (next-intl + country cookie)               │
└────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────┐
│ app/[locale]/(public)/layout.tsx (RSC)     │
│ - setRequestLocale(locale)                 │
│ - <PublicHeader locale country/>           │
│ - <PublicNavbar locale/>                   │
│ - {children}                               │
│ - <PublicFooter locale country/>           │
└────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────┐
│ app/[locale]/(public)/page.tsx (RSC)       │
│ - getHomeData(locale, country)             │ ─┐
│ - Render section components con data       │  │
└────────────────────────────────────────────┘  │
                                                │
                            ┌───────────────────┘
                            ▼
                  ┌──────────────────┐
                  │ Server Action    │
                  │ getHomeData()    │
                  │ - Supabase query │
                  │ - Zod validate   │
                  └──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Supabase (RLS)   │
                  │ - services       │
                  │ - testimonials   │
                  │ - collaborators  │
                  └──────────────────┘
```

**Hasta Fase 4**: `getHomeData()` retorna constantes hardcoded (mismas que el mockup). Cero llamadas DB. Esto permite Fase 1-3 sin tocar Supabase.

**A partir de Fase 4**: cada llamada se conecta a su tabla. Los componentes presentacionales NO cambian.

### Multi-país: cómo funciona

1. **URL param**: `/es?country=ES` o `/es/servicios?country=AR`. Si presente, sobreescribe cookie.
2. **Cookie** `55mas_country=ES`. Set by locator-select en header. Persistente 365 días.
3. **Fallback**: si no hay cookie ni URL, default `ES` (Spain).
4. **Detección server-side**: middleware lee cookie + URL param y los inyecta en headers para que el RSC layout/page acceda vía `cookies()` y `searchParams`.
5. **Queries**: Todas las Server Actions reciben `country_id` como argumento obligatorio.
6. **Selector**: `<LocatorSelect>` es Client Component pequeño. Al cambiar país, hace `router.refresh()` para que RSC se re-renderice con el nuevo filtro.

### Multi-locale: cómo funciona

1. URL prefix `[locale]` (ya implementado). 5 locales: `es`, `en`, `pt`, `fr`, `ca`.
2. Strings hardcoded en `src/lib/i18n/messages/{locale}.json`. Namespace por feature:
   ```json
   {
     "home": {
       "hero": { "title": "...", "lead": "...", "ctaClient": "...", "ctaTalent": "..." },
       "services": { "sectionTitle": "...", "tabAll": "Todos", "tabAccompaniment": "Acompañamiento", ... },
       "howtoTalents": { ... },
       ...
     },
     "nav": { "home": "Inicio", "services": "Nuestros servicios", ... },
     "footer": { ... }
   }
   ```
3. RSC usa `getTranslations('home.hero')`, Client Components usan `useTranslations('home.hero')`.
4. Entidades DB con i18n jsonb (pattern existente): `services.i18n`, `testimonials.i18n`, etc. → `localizedField(row.i18n, locale, 'title')` resuelve.
5. Mocked locale routes funcionan desde Fase 1; data DB con i18n llega en Fase 4.

## Component contracts (props agnósticas)

Ejemplos de componentes reutilizables (no exhaustivo — el contrato exacto se cierra al implementarlos):

```ts
// hero.tsx
type HeroProps = {
  title: string;                // ya localizado por el caller
  titleAccent?: string;         // parte resaltada en coral (ej: "55+")
  lead: string;
  ctas: { label: string; href: string; variant: 'primary' | 'secondary' | 'outlined' }[];
  media: { type: 'video'; vimeoId: string; hash?: string } | { type: 'image'; src: string; alt: string };
  decorations?: HeroDecoration[];  // ring, disc, dot, etc.
};

// service-card.tsx
type ServiceCardProps = {
  href: string;
  imageSrc: string;
  imageAlt: string;
  category: { label: string; tone?: 'coral' | 'salmon' };
  title: string;
  bullets: string[];
};

// how-it-works.tsx
type HowItWorksProps = {
  reversed?: boolean;           // false: imagen izq / pasos der | true: invertido
  imageSrc: string;
  imageAlt: string;
  shapes: HowToShapeConfig[];
  heading: string;
  steps: { num: number; label: string }[];
  cta: { label: string; href: string; variant: 'primary' | 'secondary' | 'outlined' };
};

// testimonial-card.tsx
type TestimonialCardProps = {
  roleLabel: string;            // "Cliente" o lo que corresponda
  rating: number;               // 1-5, render N estrellas
  quote: string;
  author: { name: string; initial?: string; avatarSrc?: string };
};
```

Cualquier componente futuro nuevo sigue el mismo patrón: **props tipadas, sin side effects, sin acceso a context global no declarado**.

## Phases

### **Fase 0 — Foundation** (esta sesión + 1 más)

**0.1 — Spec** (esta sesión). Documento commiteado.

**0.2 — Tokens + i18n scaffolding** (próxima sesión):
- Mapear CSS vars del mockup a `tailwind.config.ts` colors/spacing/fontFamily/radius/shadow.
- Crear `globals.css` con CSS vars para retrocompatibilidad.
- Crear stub `src/lib/i18n/messages/{locale}.json` con namespace `home.*`, `nav.*`, `footer.*` vacío (las claves se llenan en Fase 1+).
- Verificar que el setup de next-intl no rompe rutas existentes.

### **Fase 1 — Layout shell + Header/Footer** (2 sesiones)

**1.1 — Layout + Header + Navbar**:
- `app/[locale]/(public)/layout.tsx`.
- `shared/components/marketing/header/public-header.tsx` (RSC) que renderiza logo + locator + socials + lang + signin.
- `shared/components/marketing/header/locator-select.tsx` (Client island) — escribe cookie + `router.refresh()`.
- `shared/components/marketing/navbar/public-navbar.tsx` (RSC) — red strip con nav links del namespace `nav.*`.
- Country middleware reads.
- Tests smoke.

**1.2 — Footer + Newsletter visual + WhatsApp FAB**:
- `shared/components/marketing/footer/public-footer.tsx` + `footer-color-stripe.tsx`.
- `shared/components/marketing/newsletter-form/newsletter-form.tsx` — visual only, `<form>` submit que no hace nada hasta Fase 5.2.
- `shared/components/marketing/whatsapp-fab/whatsapp-fab.tsx`.

### **Fase 2 — Home sections sin DB** (4 sesiones)

Cada componente agnóstico + ensamble específico de home.

**2.1 — Hero**: `shared/components/marketing/hero/hero.tsx` + `hero-decorations.tsx` + `home-hero.tsx` (ensamble con copy hardcoded en i18n + Vimeo embed).

**2.2 — Servicios**: `service-card.tsx`, `services-carousel.tsx` (Client island), `services-filter.tsx` (Client island con tabs). `home-services-section.tsx` ensambla con 6 cards mock.

**2.3 — HowItWorks + Project**: `how-it-works.tsx` (un componente con prop `reversed`), `how-it-works-shapes.tsx`. `home-howto-talents.tsx` y `home-howto-clients.tsx` lo invocan con configs distintas. `project-section.tsx` + `home-project.tsx`.

**2.4 — Testimonials + JoinCTA + Collaborators**: `testimonial-card.tsx`, `testimonials-carousel.tsx` (Client). `join-cta.tsx`. `collaborator-marquee.tsx`. Ensambles de home.

Al final de Fase 2: home pixel-equivalente al mockup, en Next.js, multi-locale con copy hardcoded en JSON.

### **Fase 3 — Hardening pre-DB** (2 sesiones)

**3.1 — SEO técnico**:
- `app/sitemap.ts` dinámico con todos los locales y hreflang alternates.
- `app/robots.ts`.
- `generateMetadata` per ruta pública (title, description, og:image, canonical).
- JSON-LD Organization en `layout.tsx`.
- JSON-LD Service catalog en `home/page.tsx`.

**3.2 — Security headers + error states**:
- `next.config.ts` headers: CSP, HSTS, X-Frame-Options, Referrer-Policy, X-Content-Type-Options, Permissions-Policy.
- CSP cuidadoso: permitir `vimeo.com`, `images.unsplash.com`, `bubble.io` cdn (durante transición), Google Fonts.
- `app/[locale]/(public)/error.tsx` — fallback estilado con tokens.
- `app/[locale]/(public)/loading.tsx` — skeleton.
- `app/[locale]/(public)/not-found.tsx` — 404 estilado.

### **Fase 4 — Language switching** (re-scoped 2026-05-12)

Originalmente la fase era DB integration. Se reordenó porque el
cliente quiere primero garantizar que el sitio responde a cambios de
idioma. DB integration además bloquea sobre un ajuste de schema de
imágenes pendiente en admin, así que se difiere a **Fase 4b** más
abajo y arranca cuando aterrice ese schema.

**Sesiones**
- 4.1 — Tests + explicit localeDetection (commit `2f361e7`):
  RTL smoke tests del LangSwitcher + `localeDetection: true`
  explícito en routing.ts (es el default de next-intl, documentado
  para que la cookie NEXT_LOCALE + Accept-Language fallback queden
  obvios).
- 4.2 — Host → country (commit `df0b5ee`): `getDomainCountry()` lee
  Host header y mapea TLD → country code (`.es → ES`, `.pt → PT`,
  `.fr → FR`, `.br → BR`, `.com.ar → AR`, fallback ES).
  `getSelectedCity()` cae al primer city.countryCode matching cuando
  no hay cookie. Ready para `55mas.pt` en cuanto se sumen ciudades PT.
- 4.3 — Docs (este commit).

**End-to-end behaviour**

| Usuario | Resultado |
|---|---|
| Primera visita a `/` desde navegador en inglés | next-intl redirige a `/en/` (Accept-Language match) |
| Cambia a "Français" en el switcher | URL → `/fr/...`, cookie `NEXT_LOCALE=fr` escrita por next-intl |
| Próxima visita a `/` (días después) | Cookie NEXT_LOCALE gana → redirige a `/fr/` |
| Visita `55mas.pt/...` | `getDomainCountry() === 'PT'`; idioma sigue independiente |
| Cambia ciudad en el header | Cookie `55mas_location` gana sobre el TLD default |

**Out of scope de Fase 4**
- Servicios desde DB con i18n (espera schema admin).
- Testimonios desde DB.
- Colaboradores desde DB.
- Cualquier RSC dependiente de DB que necesite localización por fila.

### **Fase 4b — DB-driven sections** (parqueada hasta schema admin)

Patrón estándar por sesión cuando se arranque:
1. **DB**: RLS policy `for select using (true)` o filtrada por país.
2. **Action**: `getX(locale, countryId, filters)` con `localizedField`.
3. **Schema**: Zod schema de respuesta + safeParse defensivo.
4. **Wire-up**: RSC parent reemplaza data mock por `await getX(...)`.
5. **Error/loading**: handled por los archivos de Fase 3.2.
6. **Tests**: smoke + happy path del action.
7. **Commit + tag**.

Candidatos cuando arranque (usuario decide):
- Servicios (filtrados por país + categoría).
- Testimonios.
- Colaboradores.

### **Fase 5 — Image pipeline + Forms** (cuando hagan falta)

**5.1 — Pipeline WebP en admin upload**:
- En cada flow de upload de admin (`/admin/services/`, `/admin/collaborators/`, etc.), interceptar el upload server-side.
- Convertir a WebP con `sharp` (Node lib) en 3 sizes: thumbnail (96px), card (600px), hero (1440px).
- Guardar en Supabase Storage con nombres: `{base}-thumb.webp`, `{base}-card.webp`, `{base}-hero.webp`.
- `next/image` con `sizes="(max-width: 640px) 100vw, 600px"` selecciona automáticamente.
- Fallback al `original` si webp no carga.

**5.2 — Newsletter form real**:
- `submit-newsletter.ts` Server Action.
- Zod schema (email + optional name).
- Rate limit por IP (Upstash KV o in-memory bucket).
- Honeypot field.
- Integración con Resend/Mailchimp (decisión cliente).
- Email de confirmación.
- Tests.

**5.3 — Contact form** (si surge): mismo patrón.

### **Fase 6 — Performance pass** (1 sesión final)

- Lighthouse audit mobile throttled.
- Ajustes: `font-display: swap`, preload critical fonts, lazy below-the-fold images, code-split Client islands.
- Verificación de targets: **LCP <2.5s, INP <200ms, CLS <0.1**.
- Reporte final commiteado en `docs/features/public-home-performance.md`.

## Git Safety Protocol (NON-NEGOTIABLE)

Esta sección es **contrato**. Aplica a TODAS las sesiones de este feature y a futuros features migrados al sitio público.

### Política de commits

- **Una sesión = un commit atómico**. Cero commits intermedios durante el trabajo de una sesión.
- **Pre-flight check obligatorio antes de empezar cada sesión**:
  ```bash
  git status   # tree limpio o explicación de por qué no
  git log -3   # HEAD = commit final de la sesión anterior
  ```
  Si el estado no es el esperado, **STOP**. Reportar al usuario antes de cualquier acción.
- **Al cerrar la sesión**: tests + lint + typecheck verdes → `git add` con paths específicos (NO `git add -A` global desde la raíz) → commit con formato `<type>(scope): session N — <descripción>` + body explicativo + Co-Authored-By → `git status` post-commit (limpio) + `git log -1` (commit visible).
- **Opcional pero recomendado**: tag liviano `session-N-<keyword>` para checkpoints nombrados.

### Operaciones git PROHIBIDAS sin confirmación explícita

| Comando | Cuándo se permite |
|---|---|
| `git reset --hard <sha>` | Solo si el usuario tipea el SHA + confirma "sí, descarta esos commits". Default: usar `git revert` en su lugar. |
| `git push --force` / `--force-with-lease` | NUNCA a `main`/`master`. En branches feature, solo con confirmación. |
| `git revert <sha>` | Solo si el usuario menciona el commit explícitamente Y yo muestro qué contiene + qué commits encima podrían afectarse, antes de ejecutar. |
| `git rebase -i` | Solo en branch local no pusheado + confirmación. |
| `git checkout -- <file>` / `git restore <file>` | Solo si usuario pide descartar cambios explícitamente + yo muestro qué se pierde. |
| `git clean -fd` | Mostrar dry run `git clean -nd` primero, esperar confirmación. |
| `git stash drop` | Mostrar `git stash show -p stash@{N}` primero. |
| `git branch -D <branch>` | Confirmación explícita. |
| `git commit --amend` | Solo si NO fue pusheado + confirmación. |

### Política anti-reverts accidentales

El **incidente del agente que revirtió horas no se repite**. Procedimiento blindado:

1. **Cuando el usuario pide "revertir" o "volver atrás"**:
   - NO infiero qué commit. Pregunto: *"¿Qué commit exactamente? Necesito el SHA o un identificador inequívoco."*
   - Si menciona "el cambio del header" — busco con `git log --oneline | grep header`, muestro candidatos numerados, espero su elección.

2. **Antes de ejecutar el revert**:
   - `git show <sha> --stat` para ver qué archivos toca.
   - `git log <sha>..HEAD --oneline` para listar commits encima.
   - Mensaje al usuario:
     > "Voy a revertir `<sha> (<msg>)`. Toca archivos: X, Y. Por encima hay N commits — verificá que ninguno haga dependencia de esos cambios. ¿Confirmás?"
   - **Esperar respuesta antes de ejecutar.**

3. **Default: `git revert <sha>` (crea commit nuevo, preserva historia). NUNCA `git reset --hard` salvo excepción explícita.**

4. **Si el revert genera conflict**: NO forzar. Mostrar archivos en conflicto. Preguntar si abortar o resolver.

5. **Branch de seguridad antes de operaciones riesgosas**:
   - `git branch backup-pre-<operation>-<date>` antes de cualquier reset/rebase/cherry-pick conflictivo.
   - Si algo sale mal: `git reset --hard backup-pre-...` recupera todo.

### Recovery procedures

Si algo se rompió:
1. **`git reflog`** — muestra todos los HEADs históricos. Casi nada se pierde de verdad en git.
2. **`git fsck --lost-found`** — blobs huérfanos.
3. **`git cherry-pick <sha>`** — trae un commit perdido al branch actual.
4. **Backup branches** — si seguí la regla #5, hay un `backup-pre-*` para volver.

## Reglas de oro durante toda la migración

1. **Componentes reciben datos, no fetchean.** RSC parent fetchea via Server Actions; componentes son tontos.
2. **Cero strings hardcoded en TSX.** Todo via `useTranslations()` (client) o `getTranslations()` (server).
3. **`'use client'` se justifica en review.** Default es RSC.
4. **Cada Server Action valida con Zod.** Doble validación: cliente (UX) + server (verdad).
5. **Cada tabla pública tiene RLS habilitado.** Anon key en cliente; service role solo en server.
6. **TypeScript estricto.** Cero `any`. Props tipadas, retornos tipados.
7. **Imágenes vía `next/image`** con `width`/`height` o `fill` + `sizes`.
8. **≤300 LOC/archivo, ≤60 LOC/función** (architecture.md §5 hard rules).
9. **Tests smoke obligatorios** para Server Actions; **RTL tests** para Client Components con lógica.
10. **i18n keys agrupadas por feature** y consistentes con el árbol JSON (`home.hero.title` no `homeHeroTitle`).

## Acceptance criteria global

- [ ] `/{locale}/` renderiza la home pixel-equivalente al mockup para los 5 locales (es/en/pt/fr/ca).
- [ ] Cada sección es un componente agnóstico en `src/shared/components/marketing/` que recibe data por props.
- [ ] Cero `'use client'` injustificado. Páginas marketing ship <30KB JS al cliente (medido con Network tab).
- [ ] Multi-país funcional: selector de header escribe cookie, refresh server-side, queries (cuando lleguen) filtran por country.
- [ ] Cero string hardcoded en TSX. Todas las copies vienen de `messages/*.json` o de props de RSC.
- [ ] SEO técnico (Fase 3.1) operativo: sitemap, robots, hreflang, JSON-LD, canonical, metadata per ruta.
- [ ] Security headers (Fase 3.2) operativos en `next.config.ts`: CSP estricto, HSTS, etc.
- [ ] `error.tsx`, `loading.tsx`, `not-found.tsx` presentes y estilados.
- [ ] DB integration (Fase 4) reemplaza data mock una sección a la vez sin romper componentes.
- [ ] Image WebP pipeline (Fase 5.1) genera 3 sizes en cada upload de admin.
- [ ] Performance targets cumplidos (Fase 6): LCP <2.5s, INP <200ms, CLS <0.1.
- [ ] `pnpm lint` limpio, `pnpm tsc --noEmit` limpio, `pnpm test:run` verde, `NODE_ENV=production pnpm build` OK.
- [ ] **Git Safety Protocol respetado en cada sesión** — pre-flight check, commit atómico, sin reverts no autorizados.

## Gaps conocidos (parked)

- **A11y formal audit (WCAG 2.1 AA)** — esperando input cliente. Mientras: mantenemos HTML semántico, sin `outline: none` sin `:focus-visible`, alt en imágenes, ARIA donde sea evidente.
- **Cookie consent / GDPR banner** — esperando input cliente. Sin esto, NO carga analytics ni pixels.
- **Analytics / tag manager (GA4, Plausible, Mixpanel)** — cliente decide qué usar.
- **Observability (Sentry o equivalente)** — para producción real.
- **Lighthouse CI gates en PRs** — manualmente al final, sin bloqueo de PR todavía.

## Workflow operativo

1. **Para cada sesión**, el usuario me pide explícitamente "arrancá Sesión N.M".
2. Yo hago pre-flight check (git status + log).
3. Implemento la sesión completa.
4. Tests + lint + typecheck verdes.
5. Reporte LOC + métricas relevantes.
6. Commit atómico con mensaje formato + body.
7. Reporte final con SHA + estado de tree.
8. Espero indicación del usuario para siguiente sesión.

Cualquier cosa fuera de scope de la sesión actual (incluso si está en el plan) **NO se ejecuta** sin confirmación explícita. Esto previene el efecto "scope creep" silencioso.
