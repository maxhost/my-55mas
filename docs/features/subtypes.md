# Feature: Sub-tipos de Servicio

## Resumen

Sistema para definir sub-tipos dentro de un servicio usando una jerarquía de dos niveles: **grupos** (ej: "tipo_de_mascota") que contienen **ítems** (ej: perro, gato, pez). Los sub-tipos se definen a nivel de servicio y se usan para filtrar talentos por especialidad.

## Requisitos

### Funcionales

1. **CRUD de grupos e ítems**: Admin gestiona grupos y sus ítems por servicio desde la tab "Sub-tipos"
2. **Traducciones**: Cada grupo e ítem tiene nombre traducido por locale
3. **Ordenamiento**: Grupos e ítems tienen sort_order para controlar el orden de display (flechas ↑↓)
4. **Activar/desactivar**: Grupos e ítems individuales pueden desactivarse sin eliminarlos
5. **Field type "subtype"**: Nuevo tipo de campo en el form builder — **pendiente de implementar** (ver nota)
6. **Relación talento↔subtipo**: Tabla normalizada `talent_service_subtypes` para queries eficientes

### No funcionales

- Feature aislado en `features/subtypes/`
- No importa de otros features
- Grupos son propiedad del servicio (FK a services)
- Un servicio puede tener múltiples grupos independientes

> **Nota — field type "subtype" no implementado:** `FIELD_TYPES` en `src/features/forms/types.ts` aún no incluye `'subtype'`. Está definido como requisito pero no implementado en esta versión.

## Esquema DB

### Jerarquía: service → grupos → ítems

```sql
-- Grupos de sub-tipos (primer nivel)
-- Ej: "tipo_de_mascota", "tamaño"
CREATE TABLE service_subtype_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  sort_order  int NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (service_id, slug)
);

CREATE TABLE service_subtype_group_translations (
  group_id   uuid NOT NULL REFERENCES service_subtype_groups(id) ON DELETE CASCADE,
  locale     text NOT NULL REFERENCES languages(code),
  name       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, locale)
);

-- Ítems dentro de un grupo (segundo nivel)
-- Ej: grupo "tipo_de_mascota" → ítems: dog, cat, fish
CREATE TABLE service_subtypes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES service_subtype_groups(id) ON DELETE CASCADE,
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
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

**Nota crítica:** `service_subtypes.group_id` referencia a `service_subtype_groups`, NO a `services` directamente. La relación con el servicio es indirecta: `service_subtypes → service_subtype_groups → services`.

## Tipos TypeScript

Definidos en `src/features/subtypes/types.ts`:

```typescript
// ── Grupos ────────────────────────────────────────────
type SubtypeGroup = {
  id: string
  service_id: string
  slug: string
  sort_order: number
  is_active: boolean
}

type SubtypeGroupWithTranslations = SubtypeGroup & {
  translations: Record<string, string>  // locale → name
  items: SubtypeItemWithTranslations[]
}

// ── Ítems ─────────────────────────────────────────────
type SubtypeItem = {
  id: string
  group_id: string
  slug: string
  sort_order: number
  is_active: boolean
}

type SubtypeItemWithTranslations = SubtypeItem & {
  translations: Record<string, string>  // locale → name
}

// ── Inputs para save action ───────────────────────────
type SubtypeItemInput = {
  id?: string  // presente para update, ausente para create
  slug: string
  sort_order: number
  is_active: boolean
  translations: Record<string, string>
}

type SubtypeGroupInput = {
  id?: string
  slug: string
  sort_order: number
  is_active: boolean
  translations: Record<string, string>
  items: SubtypeItemInput[]
}

type SaveSubtypeGroupsInput = {
  service_id: string
  groups: SubtypeGroupInput[]
}
```

## Schemas Zod

Definidos en `src/features/subtypes/schemas.ts`:

```typescript
// slug: snake_case, empieza con letra, 1–50 chars
const slugSchema = z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/)

subtypeItemInputSchema   // id?, slug, sort_order, is_active, translations
subtypeGroupInputSchema  // id?, slug, sort_order, is_active, translations, items[]
saveSubtypeGroupsSchema  // service_id (UUID), groups[]
```

## Arquitectura

### Feature structure

```
features/subtypes/
├── index.ts
├── types.ts              — SubtypeGroup, SubtypeItem, *WithTranslations, *Input
├── schemas.ts            — subtypeItemInputSchema, subtypeGroupInputSchema, saveSubtypeGroupsSchema
├── actions/
│   ├── list-subtypes.ts  — Por service_id, retorna SubtypeGroupWithTranslations[]
│   ├── save-subtypes.ts  — Upsert grupos + ítems + traducciones
│   └── get-subtypes.ts   — Con traducciones por locale
└── components/
    ├── subtypes-editor.tsx     — Lista editable de grupos (add/remove/reorder)
    ├── subtype-group-card.tsx  — Card de grupo con ítems inline
    └── subtype-item-row.tsx    — Fila individual de ítem con slug + traducciones
```

### Admin UI

Tab "Sub-tipos" en el editor de servicio existente (`ServiceEditTabs`):
- 4to tab junto a Contenido, Configuración, Formulario
- `SubtypesEditor` con locale tabs para traducciones
- Reordenar con flechas ↑↓ (no drag-and-drop)

## Cascade behavior

| Acción | Resultado |
|---|---|
| DELETE service | CASCADE → service_subtype_groups → service_subtypes → talent_service_subtypes borrados |
| DELETE service_subtype_group | CASCADE → service_subtypes → talent_service_subtypes borrados |
| DELETE service_subtype | CASCADE → talent_service_subtypes borrados |
| DELETE talent_profile | CASCADE → talent_service_subtypes borrados |

## Criterios de aceptación

- [ ] Admin puede crear grupos de sub-tipos para un servicio
- [ ] Admin puede crear ítems dentro de cada grupo, con traducciones
- [ ] Admin puede reordenar (flechas ↑↓), activar/desactivar, eliminar grupos e ítems
- [ ] Tab "Sub-tipos" aparece como 4to tab en el editor de servicio
- [ ] Talento puede seleccionar sub-tipos al completar talent form
- [ ] Selección se guarda en talent_service_subtypes (normalizado)
- [ ] Queries eficientes: "¿qué talentos manejan perros en Lisboa?"
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
- [ ] Field type "subtype" en form builder: pendiente (marcado como TODO)
