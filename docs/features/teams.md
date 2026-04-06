# Feature: Equipos de trabajo (teams)

## Resumen

Sistema de equipos de trabajo internos para organizar al staff de 55mas. Un equipo (ej: "Marketing", "Customer Success") agrupa a uno o más miembros del staff. Un miembro puede pertenecer a múltiples equipos. Solo usuarios con rol staff (admin/manager/viewer) pueden ser miembros.

## Requisitos

### Funcionales

1. **CRUD de equipos**: Crear, editar, desactivar equipos con nombre único y descripción
2. **Asignación de miembros**: Agregar/remover miembros del staff a equipos
3. **Multi-equipo**: Un miembro puede pertenecer a varios equipos simultáneamente
4. **Solo staff**: Restricción a nivel de DB que impide agregar usuarios sin rol staff
5. **Limpieza automática**: Al perder el último rol staff, el usuario se elimina de todos los equipos
6. **Auditoría**: Registro de quién creó el equipo y quién agregó cada miembro
7. **Soft-delete**: Equipos se desactivan (`is_active = false`) en lugar de borrarse

### No funcionales

- Feature aislado en `features/teams/` (cuando se implemente la UI)
- Nombres de equipo sin traducción (fijos en todos los idiomas)
- Cada archivo < 300 LOC, feature total < 1500 LOC

## Esquema DB

### teams

```sql
CREATE TABLE teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### team_members

```sql
CREATE TABLE team_members (
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

### Triggers

1. **`ensure_team_member_is_staff`** (BEFORE INSERT/UPDATE on team_members): valida que `user_id` tenga rol staff en `user_roles`
2. **`cleanup_team_members_on_role_loss`** (AFTER DELETE on user_roles): elimina de `team_members` si el usuario pierde su último rol staff

## Cascade behavior

| Acción | Resultado |
|--------|-----------|
| DELETE team | CASCADE → team_members del equipo se borran |
| DELETE profile (usuario) | CASCADE → team_members del usuario se borran |
| DELETE user_role (último rol staff) | Trigger → team_members del usuario se borran |

## Arquitectura futura (UI)

```
features/teams/
├── index.ts
├── types.ts
├── components/
│   ├── teams-list.tsx
│   ├── teams-table.tsx
│   ├── team-form.tsx
│   └── team-members-editor.tsx
└── actions/
    ├── list-teams.ts
    ├── create-team.ts
    ├── update-team.ts
    ├── add-team-member.ts
    └── remove-team-member.ts
```

## Criterios de aceptación

- [x] Tablas `teams` y `team_members` existen en DB
- [x] Trigger impide agregar non-staff a equipos
- [x] Trigger limpia membresías al perder rol staff
- [x] Índice en `team_members.user_id`
- [x] Tipos TypeScript generados
- [x] Schema doc actualizado
- [ ] UI admin para gestionar equipos (pendiente)
- [ ] Server actions (pendiente)
- [ ] RLS policies (pendiente)
