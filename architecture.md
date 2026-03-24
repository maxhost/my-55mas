# Architecture — 55mas

## 1. Principios de organización

- **Feature-Folder Architecture**: cada funcionalidad vive en `src/features/<nombre>/` con su lógica, tipos, validaciones y componentes propios.
- **Single App, Route Groups**: una sola app Next.js 14 con App Router. Los grupos de rutas `(public)`, `(auth)`, `(client)`, `(talent)` y `(admin)` separan contextos sin multiplicar builds.
- **~200 LOC por archivo**: archivos pequeños, legibles, reemplazables. Si crece, se divide.
- **Server-first**: Server Components y Server Actions por defecto. Client Components solo cuando hay interactividad.
- **Supabase como backend**: PostgreSQL + Auth + Storage + RLS. Sin API REST propia; las Server Actions llaman directo a Supabase.

## 2. Estructura de directorios

```
src/
├── app/[locale]/
│   ├── (public)/        # Catálogo, páginas de servicio, contratación (clientes + guests)
│   ├── (auth)/          # Login, registro, recuperación
│   ├── (client)/        # Zona personal del cliente
│   ├── (talent)/        # Portal del talento
│   └── (admin)/         # Panel de administración
├── features/            # Lógica de negocio por feature
│   ├── services/        #   Catálogo y detalle de servicios
│   ├── orders/          #   Contratación, estados, seguimiento
│   ├── talents/         #   Perfiles, documentación, disponibilidad
│   ├── clients/         #   Datos y gestión de clientes
│   ├── forms/           #   Formularios dinámicos de contratación
│   ├── members/         #   Gestión de miembros staff (admin/manager/viewer)
│   └── notifications/   #   Emails y alertas
├── shared/              # UI compartida, hooks, utils, tipos globales
├── lib/
│   ├── supabase/        # Cliente, helpers, tipos generados
│   └── i18n/            # Configuración next-intl, diccionarios
supabase/
└── migrations/          # Migraciones SQL versionadas
```

## 3. Reglas de aislamiento entre módulos

| Regla | Detalle |
|-------|---------|
| Un feature no importa de otro feature | `features/orders/` nunca importa de `features/talents/`. Si necesitan comunicarse, pasan por `shared/`. |
| `shared/` no importa de `features/` | Flujo unidireccional: `features/ → shared/`, nunca al revés. |
| Route groups consumen features | `app/[locale]/(admin)/` importa de `features/orders/` pero nunca lógica directa de otro route group. |
| Tipos de DB aislados en `lib/supabase/` | Los features importan tipos de ahí, nunca definen esquemas propios de tablas. |
| Un feature debe funcionar sin que otros existan | Test de independencia: borrar otra carpeta de feature no debe romper la tuya. |

## 4. Flujo de datos

```
┌─────────┐    ┌──────────────┐    ┌──────────────────┐
│ Browser  │───▶│ Next.js App  │───▶│ Server Actions   │
│ (React)  │◀───│ Route Groups │◀───│ features/*.ts    │
└─────────┘    └──────────────┘    └────────┬─────────┘
                                            │
                                   ┌────────▼─────────┐
                                   │ Supabase          │
                                   │ (DB + Auth + RLS) │
                                   └──────────────────┘
```

Browser renderiza Server/Client Components → Server Actions ejecutan lógica de negocio desde `features/` → Supabase responde con datos filtrados por RLS según el rol del usuario.

## 5. Límites de tamaño

| Elemento | Máximo |
|----------|--------|
| Archivo | 300 líneas |
| Función | 60 líneas |
| Feature completo (todos sus archivos) | 1 500 líneas |
| Servicio / módulo | 800 líneas |
| LOC ideal por archivo | ~200 líneas |

Si un archivo se acerca a 300 líneas, dividirlo antes de que llegue.

## 6. Regla de sesiones de desarrollo

- **Una sesión = una sola responsabilidad.** Nunca mezclar capas en el mismo prompt: UI + lógica de negocio, o DB + API, van en sesiones separadas.
- **Cada feature debe caber en la ventana de contexto.** Si el conjunto de archivos de un feature supera el 70% del contexto disponible, dividir el feature en sub-features.
- **Cada sesión se auto-verifica:** tests pasan, typecheck limpio, reportar líneas de cada archivo tocado.
- **Orden recomendado por feature:**
  1. Esquema DB + migración
  2. Tipos + validaciones Zod
  3. Server Actions (lógica)
  4. Componentes UI
  5. Tests

## 7. Checklist de validación por feature

Antes de considerar un feature terminado:

- [ ] Todos los archivos están dentro de `src/features/<nombre>/`
- [ ] Sin imports cruzados a otros features
- [ ] Ningún archivo supera 300 líneas
- [ ] Ninguna función supera 60 líneas
- [ ] Feature total no supera 1 500 líneas
- [ ] Funciona sin que otros features existan (test de independencia)
- [ ] Tests escritos y pasando
- [ ] TypeScript compila sin errores
- [ ] Textos visibles usan claves de i18n, no strings hardcodeados
