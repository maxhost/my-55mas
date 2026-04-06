# Feature: Administración de Miembros del Staff (members)

## Resumen

Panel de administración para gestionar los miembros del equipo interno de 55mas. Permite ver, crear e invitar miembros del staff (admin/manager/viewer), asignarles un rol con scope geográfico, y organizarlos en equipos de trabajo. También permite crear nuevos equipos.

## Requisitos

### Funcionales

1. **Tabla de miembros**: Lista todos los usuarios con rol staff (admin/manager/viewer)
2. **Columnas**: nombre, rol (badge con display_name), email, equipo(s) (chips)
3. **Búsqueda**: Filtro client-side por nombre o email
4. **Filtro país**: Select con países activos (de staff_role_scopes)
5. **Filtro ciudad**: Select dependiente de país (de staff_role_scopes), disabled sin país
6. **Filtro equipo**: Select con equipos activos
7. **Crear miembro**: Sheet con formulario (nombre, apellido, email, rol, país, ciudad, equipo)
8. **Invitación por email**: Usa `auth.admin.inviteUserByEmail()` con service role
9. **Crear equipo**: Sheet con formulario simple (nombre)
10. **Validación condicional**: País/ciudad requeridos solo para manager/viewer, opcional para admin

### No funcionales

- Feature aislado en `features/members/`
- NO importa de otros features
- Service role client aislado en `lib/supabase/admin.ts`
- `SUPABASE_SERVICE_ROLE_KEY` env var (nunca expuesta al browser)
- Cada archivo < 300 LOC, feature total < 1500 LOC
- Traducciones en 5 idiomas (es, en, pt, fr, ca)

## Esquema DB

### staff_profiles (nueva)

```sql
CREATE TABLE staff_profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

Trigger `sync_full_name`: auto-actualiza `profiles.full_name` = first_name + ' ' + last_name.

### Tablas relacionadas (lectura)

- `user_roles` — role del miembro (admin/manager/viewer)
- `staff_roles` — display_name del rol
- `staff_role_scopes` — country_id, city_id del scope
- `team_members` + `teams` — equipos del miembro
- `profiles` — full_name, email

## Flujo de creación de miembro

1. Validar con Zod (first_name, last_name, email, role, country_id?, city_id?, team_id?)
2. `auth.admin.inviteUserByEmail()` → trigger crea profile + user_roles
3. INSERT staff_profiles (first_name, last_name)
4. UPDATE user_roles SET granted_by = admin actual
5. Si manager/viewer: INSERT staff_role_scopes (country_id, city_id)
6. Si equipo seleccionado: INSERT team_members
7. Cleanup en caso de error parcial: `auth.admin.deleteUser()`

## Arquitectura

```
features/members/
├── index.ts
├── types.ts
├── schemas.ts
├── components/
│   ├── members-list.tsx
│   ├── members-table.tsx
│   ├── members-toolbar.tsx
│   ├── create-member-sheet.tsx
│   └── create-team-sheet.tsx
└── actions/
    ├── list-members.ts
    ├── list-members-helpers.ts
    ├── create-member.ts
    ├── create-team.ts
    ├── get-filter-options.ts
    └── __tests__/
        └── list-members-helpers.test.ts
```

## Criterios de aceptación

- [ ] Admin puede ver tabla de miembros en `/admin/members/`
- [ ] Tabla muestra: nombre, rol (badge), email, equipos (chips)
- [ ] Búsqueda filtra por nombre o email
- [ ] Filtros de país, ciudad (dependiente), equipo funcionan
- [ ] Admin puede crear miembro vía Sheet (invitación por email)
- [ ] Admin puede crear equipo vía Sheet
- [ ] Validación: país/ciudad requeridos para manager/viewer
- [ ] Cleanup en caso de error parcial
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
- [ ] Traducciones en 5 idiomas
