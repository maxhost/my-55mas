# 55mas

Marketplace donde personas mayores de 55 años ofrecen servicios profesionales. Los clientes contratan a través de formularios dinámicos y un equipo administrativo coordina asignaciones, cobros y seguimiento. Opera en múltiples países e idiomas.

## Stack y tecnologías

- **Framework:** Next.js 14 (App Router, Server Components, Server Actions)
- **Lenguaje:** TypeScript (strict mode)
- **Base de datos y auth:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Estilos:** Tailwind CSS + shadcn/ui
- **Formularios:** react-hook-form + Zod
- **Internacionalización:** next-intl
- **Email:** Resend (o equivalente via Supabase Edge Functions)
- **Paradigma:** Feature-Folder Architecture, ~200 LOC máximo por archivo

## Documentos de referencia

- architecture.md — Decisiones técnicas, estructura de capas, convenciones
- blueprint.md — Reglas de negocio, flujos, roles, estados de pedidos
- docs/features/ — Un archivo por feature con requisitos, esquema DB y criterios de aceptación

## Estructura de directorios

- src/app/[locale]/(public)/ — Catálogo, páginas de servicio, contratación
- src/app/[locale]/(auth)/ — Login, registro, recuperación (clientes y talentos)
- src/app/[locale]/(client)/ — Zona personal del cliente
- src/app/[locale]/(talent)/ — Portal del talento (perfil, documentación)
- src/app/[locale]/(admin)/ — Panel de administración
- src/features/ — Lógica por feature: services/, orders/, talents/, clients/, forms/, notifications/
- src/shared/ — Componentes UI compartidos, hooks, utils, tipos globales
- src/lib/supabase/ — Cliente Supabase, helpers, tipos generados de DB
- src/lib/i18n/ — Configuración next-intl, diccionarios
- supabase/migrations/ — Migraciones SQL versionadas

## Comandos útiles

- pnpm dev → Servidor de desarrollo
- pnpm build → Build de producción
- pnpm lint → ESLint + TypeScript check
- supabase start → Levantar Supabase local (Docker)
- supabase db push → Aplicar migraciones a Supabase local
- supabase gen types typescript --local > src/lib/supabase/database.types.ts → Regenerar tipos de DB
- pnpm dlx shadcn@latest add [componente] → Agregar componente de shadcn/ui

## Gotchas

Agregar aquí los problemas descubiertos durante el desarrollo.

## Límites de tamaño

- Archivos: máximo 300 líneas
- Funciones: máximo 60 líneas
- Feature completo: máximo 1500 líneas
- Servicio/módulo: máximo 800 líneas

## Reglas de vibecoding

- Diagnosticar antes de implementar: leer archivos, reportar estado actual, NO asumir
- TDD obligatorio: escribir tests → verificar que fallan → implementar → verificar que pasan
- Spec antes de código: features nuevas requieren spec en docs/features/ antes de implementar
- Un prompt por responsabilidad: si un cambio toca >5 archivos o mezcla backend/renderer, dividir en sesiones
- Cada sesión se auto-verifica: tests + typecheck + reportar líneas de archivos tocados
- Documentar decisiones: cambios arquitectónicos se registran en docs/ para que el contexto persista
- Nunca asumir el estado del código: siempre leer el archivo antes de modificarlo
