# Guía de desarrollo local

## Prerequisitos

- Node.js 20+
- pnpm (el proyecto usa `pnpm@10.8.0`)

## Setup inicial

```bash
git clone <repo-url>
cd 55mas
pnpm install
```

## Variables de entorno

Copiar el archivo de ejemplo y rellenar con las credenciales del proyecto Supabase de desarrollo:

```bash
cp .env.example .env.local
```

Variables necesarias:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (JWT) del proyecto Supabase |

La validación de env vars (`src/lib/env.ts`) falla en build si alguna falta o tiene formato inválido.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo (localhost:3000) |
| `NODE_ENV=production pnpm build` | Build de producción (ver Gotcha abajo) |
| `pnpm start` | Servir el build de producción |
| `pnpm lint` | ESLint + validación TypeScript |
| `pnpm test` | Vitest en modo watch |
| `pnpm test:run` | Vitest single run (CI) |
| `pnpm db:types` | Regenerar tipos TypeScript desde Supabase remoto |
| `pnpm dlx shadcn@latest add [componente]` | Agregar componente shadcn/ui |

### Gotcha: NODE_ENV en build

`pnpm build` requiere `NODE_ENV=production`. Sin esto, el build falla con errores `useContext null` en las páginas internas de Next.js. Esto ocurre porque Claude Code y algunas shells setean `NODE_ENV=development` por defecto.

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # Todas las rutas bajo locale (es, en, pt, fr, ca)
│   │   ├── (public)/       # Catálogo, páginas de servicio
│   │   ├── (auth)/         # Login, registro
│   │   ├── (client)/       # Zona personal del cliente
│   │   ├── (talent)/       # Portal del talento
│   │   ├── (admin)/        # Panel de administración
│   │   └── [...rest]/      # Catch-all → 404
│   └── globals.css         # Tailwind v4 + shadcn CSS variables
├── components/ui/          # Componentes shadcn/ui (auto-generados)
├── features/               # Lógica de negocio por feature (vacío aún)
├── shared/                 # Componentes, hooks, utils compartidos (vacío aún)
├── lib/
│   ├── i18n/               # Config next-intl + mensajes por idioma
│   ├── supabase/           # Clients, tipos, helpers de Supabase
│   ├── env.ts              # Validación de env vars con Zod
│   └── utils.ts            # Helper cn() para clsx + tailwind-merge
├── test/                   # Setup Vitest + smoke tests
└── middleware.ts            # Supabase auth refresh + next-intl locale routing
```
