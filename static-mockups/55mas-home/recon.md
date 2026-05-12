# Recon — 55mas.es homepage

Source URL: https://55mas.es/
Captured: 2026-05-11

## Stack identificado

El sitio actual corre sobre **Bubble.io** (no-code). El HTML inicial está vacío y todo el render se hace en JS al cargar. Esto explica por qué `curl` directo trae un bootstrap sin contenido visible. Captura: vía Chrome headless `--dump-dom` + screenshots.

## Archivos auxiliares

- `_raw.html` — HTML inicial (bootstrap Bubble, sin contenido)
- `_rendered.html` — DOM tras ejecutar JS (149 KB, 117 tags top-level)
- `_screenshot-desktop.png` — captura a 1440×2400 (viewport)
- `_screenshot-desktop-full.png` — captura a 1440×4000 (full page)
- `_screenshot-mobile.png` — captura a 390×5000 (iPhone-width)

Estos `_*` quedan fuera del build final (prefijo subrayado). El mockup vivirá en `index.html` + `styles.css` + opcional `assets/` (vacío porque linkeamos al CDN original).

## Design tokens

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#F0513A` (coral) | Acento principal, "55+" logo |
| `--color-secondary` | `#FEC35A` (yellow) | CTAs primarios |
| `--color-bg-cream` | `#F3E9E1` | Fondo del hero |
| `--color-text` | `#171F46` (navy oscuro) | Texto principal |
| `--color-top-bar` | `#DB1E3B` (rojo intenso) | Top bar superior |
| `--color-accent-blue` | `#C5E8F2` (celeste claro) | Detalle decorativo |
| `--color-accent-salmon` | `#EE684F` | Variante coral |
| `--font-primary` | `Mulish` (Google Fonts) | Todo el sitio |
| Pesos | 400, 500, 600, 700 | |

## Estructura de la página

En orden vertical, lo que se ve al cargar:

1. **Top bar (rojo)**
   - Dropdown de ubicación con bandera ("Barcelona" / "Madrid")
   - Iconos sociales (Facebook, Instagram, LinkedIn, YouTube, WhatsApp)
   - Selector de idioma ("Español")

2. **Header**
   - Logo "55+"
   - Nav: Inicio · Sobre 55+ · Nuestros servicios · Preguntas Frecuentes · Contacta con el 55+
   - Botones: "Iniciar sesión" / "Registrarse"

3. **Hero** (fondo crema `#F3E9E1`)
   - H1: "Únete a la revolución 55+ y descubre que el talento no tiene edad"
   - Subtítulo: "Contrata los servicios de personas de más de 55 años para ayudarte en tus tareas cotidianas. Si eres una persona de más de 55 años, únete activo y aporta valor en bienestar, registrate y consigue un ingreso extra."
   - Dos columnas de CTAs:
     - "Para Clientes:" → botón amarillo "Contrata un servicio"
     - "Para personas de más de 55:" → link "Ofrece un servicio"
   - Imagen/video a la derecha (con player overlay)
   - Decoraciones: punto amarillo, rectángulos rojo y celeste

4. **Sección "El servicio que necesitas, cerca de ti"**
   - Selector "Elige tu ubicación" + dropdown
   - Tabs: Todos · Acompañamiento · Clases · Reparaciones · Casa
   - Grid de cards de servicio (3 columnas desktop, 1 mobile)
     - Cada card: imagen, badge categoría, título, bullets, divisor
   - CTA "Ver todos los servicios"

5. **Sección "Ganas tú. Ganan ellos. Ganamos todos ¿Cómo funciona?"**
   - Dos columnas: imagen + lista numerada
     - "Haz lo que mejor se te da y ayuda a los demás con tu talento"
     - 3 pasos con bullets: "Regístrate en 55+ y crea tu perfil", "Recibe solicitudes de tu servicio", "Trabaja y recibe tu pago con flexibilidad"
   - CTA secundario

6. **Sección "Contribuye a mejorar la vida de los 55+..."**
   - Layout reverso: lista + imagen
   - 3 bullets: "Descubre todos los servicios disponibles cerca de ti", "Disfruta un servicio con confianza y calidad", "Conócelos a todos"
   - CTA

7. **Sección "Nuestro proyecto 55+"**
   - Imagen + heading + descripción
   - CTA "Descubre la asociación"

8. **Testimonios**
   - "Ellos ya forman parte de 55+. Esto es lo que cuentan."
   - "Descubre testimonios inspiradores"

9. **Colaboradores** (logos de fundaciones — Juan Entrecanales, Banco Sabadell, Ship2b, B-VALUE, Barcelona Activa, etc.)

10. **Newsletter**
    - "Recibe nuestra newsletter"
    - "Entérate de las últimas novedades, logros y eventos de 55+. En tu correo, una vez al mes."
    - Input email + botón "Subscríbete"

11. **Footer**
    - Copyright "© 2026 55+"
    - Links: Política de privacidad · Términos de Uso · Condiciones de uso · Configuración de cookies
    - Dirección: "Gran Vía, 33, Centro, 28013 Madrid, Spain"
    - Teléfono: T.930 49 14 50
    - Email: info@55mas.es
    - Iconos sociales

12. **Floating WhatsApp button** (verde, bottom-right, fixed)

13. **Cookie banner** (modal overlay al cargar)

## Decisiones de implementación

- **Linkeamos al CDN de Bubble** para imágenes y logos: `https://725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io/...` (decisión del usuario — no descargamos). Riesgo: si la organización rota el CDN o borra archivos, las imágenes se rompen. Aceptado para la mockup de evaluación.
- **Font Mulish** via Google Fonts CDN (gratis, libre).
- **Sin JS** en sesiones 2-4 salvo lo mínimo para tabs y formularios visuales si hace falta. El cookie banner, lang switcher, location dropdown se renderizan estáticos.
- **Responsive** mobile-first con breakpoints `~640px` (tablet) y `~1024px` (desktop).
- **Fidelidad 95%** — no perseguimos sombras exactas ni kerning pixel-perfect.

## Próximas sesiones

- **Sesión 2:** `index.html` con HTML semántico cubriendo las 13 secciones.
- **Sesión 3:** `styles.css` con variables CSS para tokens, mobile + desktop.
- **Sesión 4:** polish (responsive fine-tune, fuentes, micro-ajustes), comparación side-by-side, lista de gaps.

## Assets que vamos a linkear

URLs guardadas durante el recon (extracto):

- Iconos sociales SVG: Facebook, Linkedin, Instagram, Whatsapp, Youtube (Bubble CDN)
- Logos de colaboradores: 8+ imágenes en `cdn-cgi/image/w=96,h=96/...`
- Imágenes hero/sections: `image.png`, `Group%2041.png`, `Group%2042.png`
- Decoraciones SVG: `Vector.svg`, `Group%2057.svg`, `Rectangle%2029.svg`, `Light.svg`, `Colorful.svg`

Detalles completos en `_rendered.html`.
