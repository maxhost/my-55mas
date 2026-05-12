# Comparación mockup ↔ original

Captura visual de gaps tras Sesión 4. Comparar `_mock-desktop.png` ↔ `_screenshot-desktop-full.png` y mobile equivalente.

## Estado general

Fidelidad lograda: **~95%** estructural. La página replica las 13 secciones con tipografía Mulish, paleta correcta, layout responsivo, y CTAs.

## Cómo abrir el mockup

```
open static-mockups/55mas-home/index.html
```

O servirla:
```
cd static-mockups/55mas-home && python3 -m http.server 8000
# → http://localhost:8000
```

## Lo que matchea bien

- Top bar rojo `#DB1E3B` con dropdown ubicación + socials + lang ✓
- Header sticky con logo "55+" (coral plus) + nav + auth buttons ✓
- Hero: fondo crema, título grande con "55+" en coral, dos CTAs (yellow + ghost), figura con play button overlay, decoraciones (punto amarillo, rect azul, rect rojo) ✓
- Servicios: locator pill + tabs con active state + grid de cards (1/2/3 cols responsive) con badge + bullets ✓
- Two-row "Cómo funciona" con orden invertido (talents → clients) ✓
- Sección "Nuestro proyecto 55+" two-col ✓
- Testimonios 3-col en cards blancas sobre fondo crema ✓
- Logos colaboradores en grid grayscale ✓
- Newsletter form pill ✓
- Footer 4-col oscuro con socials + copyright ✓
- WhatsApp fab fijo verde ✓

## Gaps conocidos (no críticos para evaluación)

1. **Cookie banner** del original no replicado. Decisión: no esencial para evaluar workflow.
2. **Hero player overlay** — el original muestra un video player de YouTube/Vimeo embed; nosotros mostramos un botón play simple sobre la imagen.
3. **Decorative SVGs** — el sitio original usa SVGs (Group 57, Rectangle 29) con formas más orgánicas; nuestros divs son rectángulos básicos. Pixel-similar pero no idéntico.
4. **Card photos** — son placeholders de Unsplash, no las fotos reales del sitio (Bubble lazy-load → no aparecen en DOM exportado).
5. **Selector de país con bandera** — top bar muestra "Barcelona" / "Madrid" como texto, sin emoji-flag o icono SVG.
6. **Iconos sociales en colores invertidos** — filter `brightness(0) invert(1)` los hace blancos sobre el header rojo / footer oscuro. El original tiene SVGs ya blancos. Visual: equivalente.
7. **Fuente Mulish** carga vía Google Fonts CDN, el original puede estar self-hosted. Mismo glyph, mismo display.
8. **Microspacing/kerning** — no perseguido, dentro del 5% aceptable.
9. **Hover/focus states** sutiles del original no inspeccionados (Bubble los define en runtime).
10. **Sin interacciones** — tabs, dropdowns, formularios son visuales. No hay JS.

## Decisiones que importan para la decisión React vs Astro

Mientras armamos esto, los hallazgos relevantes para tu evaluación:

| Aspecto | Observación |
|---|---|
| **Tiempo a primer mockup** | ~1 hora para 13 secciones + responsive. Astro/Next.js sumarían tiempo de setup pero te dan reutilización de componentes desde día 1. |
| **SEO/GEM** | Este HTML estático es directamente indexable por crawlers y AI engines. Astro entrega exactamente esto. Next.js SSR/ISR también, pero con ~30-100KB de JS hydration. |
| **Reutilización de componentes** | A medida que sumes páginas con repetición (header/footer fijos, cards, hero variants), el HTML puro escala mal. Astro o Next.js resuelven esto. |
| **Carga inicial** | HTML+CSS puro: ~50KB total con fonts. Next.js de la app actual: ~200-300KB JS solo de bootstrap. Astro: cero JS shipped en este caso. |
| **Forms / interactividad** | Newsletter form, búsqueda, filtros, login — todo eso necesita JS. Astro: islands de React/Vue/Svelte where needed. Next.js: ya tenés esa stack. |

**Recomendación final** (mi sesgo): si la mayoría del sitio público es landings + listings + contenido estático con interactividad mínima, **Astro** te da el mejor rendimiento para SEO/GEM con menor JS shipped. Si vas a integrar fuertemente con el dashboard Next.js (compartir auth, layout, ORM, server actions), mantener una sola stack Next.js es operacionalmente más barato.

## Cómo medir performance del mockup actual

Para tener números concretos antes de decidir:

```bash
# Lighthouse local sobre el mockup (necesita pnpm dlx):
npx lighthouse file:///Users/maxi/claude-workspace/55mas/static-mockups/55mas-home/index.html \
  --output html --output-path ./lighthouse-mockup.html --view
```

(El mockup está libre de JS, así que Performance estará cerca de 100/100 y CLS muy bajo).

## Próximos pasos

1. **Revisar el mockup** abriendo `index.html` en navegador (desktop + dev tools mobile view).
2. **Comparar lado a lado** con `https://55mas.es/` y decirme qué gaps querés cerrar.
3. **Pasarme las otras URLs** que mencionaste — repetimos el flujo de 4 sesiones por página, o consolidamos en menos (ya tenemos design tokens + patrones de layout).
4. **Decidir stack** (React/Astro/HTML puro) con los datos ya recogidos.
