# Feature: Sub-tipos de Servicio

## Resumen

Sistema para definir sub-tipos usando una jerarquía de dos niveles: **grupos** (ej: "tipo_de_mascota") que contienen **ítems** (ej: perro, gato, pez). Los grupos son entidades independientes y reutilizables — se crean en `/admin/subtypes` y se asignan a servicios vía tabla junction many-to-many.

## Requisitos

### Funcionales

1. **CRUD global de grupos e ítems**: Admin gestiona grupos desde `/admin/subtypes` (sección dedicada)
2. **Asignación a servicios**: Un grupo puede asignarse a múltiples servicios desde la tab "Sub-tipos" del editor de servicio
3. **Traducciones**: Cada grupo e ítem tiene nombre traducido por locale
4. **Ordenamiento**: Grupos e ítems tienen sort_order para controlar el orden de display
5. **Activar/desactivar**: Grupos e ítems individuales pueden desactivarse sin eliminarlos
6. **Referencia por slug del grupo**: los forms estáticos referencian un grupo por su slug y muestran sus ítems activos como opciones
7. **Relación talento↔subtipo**: Tabla normalizada `talent_service_subtypes` para queries eficientes

### No funcionales

- Feature aislado en `features/subtypes/`
- No importa de otros features
- Grupos son entidades independientes (sin FK a services)
- Relación con servicios vía junction table `service_subtype_group_assignments`

## Esquema DB

### Jerarquía: grupos → ítems (independientes de servicios)

```sql
-- Grupos de sub-tipos (entidades independientes, reutilizables)
CREATE TABLE service_subtype_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,       -- globalmente único
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE service_subtype_group_translations (
  group_id   uuid NOT NULL REFERENCES service_subtype_groups(id) ON DELETE CASCADE,
  locale     text NOT NULL REFERENCES languages(code),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, locale)
);

-- Asignación many-to-many: qué grupos aplican a cada servicio
CREATE TABLE service_subtype_group_assignments (
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  group_id    uuid NOT NULL REFERENCES service_subtype_groups(id) ON DELETE CASCADE,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (service_id, group_id)
);

-- Ítems dentro de un grupo
CREATE TABLE service_subtypes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES service_subtype_groups(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  sort_order  int DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (group_id, slug)
);

CREATE TABLE service_subtype_translations (
  subtype_id  uuid NOT NULL REFERENCES service_subtypes(id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES languages(code),
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (subtype_id, locale)
);

-- Relación normalizada talento↔ítem de sub-tipo
CREATE TABLE talent_service_subtypes (
  talent_id   uuid NOT NULL REFERENCES talent_profiles(id) ON DELETE CASCADE,
  subtype_id  uuid NOT NULL REFERENCES service_subtypes(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (talent_id, subtype_id)
);
```

## Arquitectura

### Feature structure

```
features/subtypes/
├── index.ts
├── types.ts              — SubtypeGroup, SubtypeItem, *WithTranslations, *Input, AssignGroupsInput
├── schemas.ts            — saveSubtypeGroupsSchema, assignGroupsSchema
├── actions/
│   ├── list-subtypes.ts      — Por serviceId (via junction), retorna grupos asignados
│   ├── list-all-subtypes.ts  — Todos los grupos globalmente (para admin standalone)
│   ├── save-subtypes.ts      — Upsert grupos + ítems + traducciones (global)
│   ├── get-subtypes.ts       — Subtypes activos por servicio + locale (para formularios)
│   └── assign-groups.ts      — Asignar/desasignar grupos a un servicio
└── components/
    ├── subtypes-editor.tsx          — Editor global de grupos (CRUD)
    ├── group-assignment-editor.tsx  — Checklist para asignar grupos a un servicio
    ├── subtype-group-card.tsx       — Card de grupo con ítems inline
    └── subtype-item-row.tsx         — Fila individual de ítem
```

### Admin UI

- **`/admin/subtypes`**: Sección dedicada para CRUD global de grupos e ítems con traducciones
- **Tab "Sub-tipos" en editor de servicio**: Checklist para asignar grupos existentes al servicio
- **Form builder**: Dropdown de grupos (solo los asignados al servicio) para campo tipo "subtype"

## Cascade behavior

| Acción | Resultado |
|---|---|
| DELETE service | CASCADE → assignments borradas. Grupos sobreviven (independientes). |
| DELETE grupo | CASCADE → assignments + ítems + talent_service_subtypes borrados |
| DELETE ítem | CASCADE → talent_service_subtypes borrados |
| DELETE talent_profile | CASCADE → talent_service_subtypes borrados |

## Criterios de aceptación

- [x] Admin puede crear/editar/eliminar grupos de sub-tipos globalmente en `/admin/subtypes`
- [x] Admin puede asignar grupos a servicios desde la tab "Sub-tipos"
- [x] Un mismo grupo puede asignarse a múltiples servicios
- [x] Admin puede crear ítems dentro de cada grupo, con traducciones
- [x] Admin puede reordenar, activar/desactivar, eliminar grupos e ítems
- [x] Form builder muestra solo grupos asignados al servicio
- [x] Talento puede seleccionar sub-tipos al completar talent form
- [x] Selección se guarda en talent_service_subtypes (normalizado)
- [x] Build pasa: `NODE_ENV=production pnpm build`
- [x] Tests escritos y pasando (schemas)
