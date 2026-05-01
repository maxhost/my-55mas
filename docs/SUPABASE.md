# Supabase — Configuración y uso

## Proyecto de desarrollo

| Campo | Valor |
|-------|-------|
| Nombre | `55mais-dev` |
| ID | `vkfolbfchkwezrbkxpiv` |
| Region | `eu-west-1` |
| URL | `https://vkfolbfchkwezrbkxpiv.supabase.co` |

**Producción:** No creado aún. Nunca ejecutar migraciones, SQL o operaciones destructivas contra producción desde Claude Code.

## Clientes

Tres clientes para diferentes contextos:

| Archivo | Uso | Contexto |
|---------|-----|----------|
| `src/lib/supabase/server.ts` | `createClient()` | Server Components, Server Actions |
| `src/lib/supabase/client.ts` | `createClient()` | Client Components |
| `src/lib/supabase/middleware.ts` | `updateSession(request)` | Middleware (auth refresh) |

El barrel export en `src/lib/supabase/index.ts` re-exporta como `createServerClient` y `createBrowserClient`.

## Type helpers

En `src/lib/supabase/types.ts`:

```typescript
import type { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase';

type Profile = Tables<'profiles'>;           // Row completo
type NewOrder = TablesInsert<'orders'>;       // Campos para INSERT
type OrderUpdate = TablesUpdate<'orders'>;    // Campos opcionales para UPDATE
```

## Regenerar tipos

Cuando el schema de DB cambia:

```bash
pnpm db:types
```

Esto ejecuta `supabase gen types typescript` contra el proyecto remoto y escribe `src/lib/supabase/database.types.ts`.

## Auth en middleware

`src/middleware.ts` llama `updateSession(request)` en cada request para refrescar el token de auth.

**Regla crítica:** Usar siempre `supabase.auth.getUser()`, nunca `supabase.auth.getSession()`.

- `getUser()` valida el token contra el servidor Supabase Auth — seguro
- `getSession()` lee del storage local sin validar — puede devolver un token expirado o manipulado

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas (por definir feature a feature) deben:

- Chequear `user_roles` (tabla de autorización), **nunca** `active_role` (preferencia de UI)
- Para admins: `EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')`
- Para managers/viewers: JOIN con `staff_role_scopes` para filtrar por país/ciudad
- Para clients: `client_id = auth.uid()`

## Schema actual

8 migraciones aplicadas con 27+ tablas:

1. `languages`, `countries`, `cities` (i18n jsonb en cada entidad)
2. `profiles`, `user_roles`, `staff_roles`, `staff_role_scopes`
3. `services` (i18n jsonb), `service_countries`
4. `talent_profiles`, `talent_services`, `talent_documents`
5. `orders`, `order_status_history`, `order_schedules`, `order_sessions`
6. Triggers: `handle_new_user`, `handle_updated_at`, `validate_active_role`, etc.
7. RLS habilitado en todas las tablas (políticas concretas pendientes por feature)

Detalle completo en `docs/features/00-database-schema.md`.
