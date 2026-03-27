# Feature: Sub-tipos de Servicio

## Resumen

Sistema para definir sub-tipos dentro de un servicio. Ej: el servicio "Pet Sitting" tiene sub-tipos: perro, gato, pez. Los sub-tipos se definen a nivel de servicio y son usables en formularios de cliente y de talento como un field type especial.

## Requisitos

### Funcionales

1. **CRUD de sub-tipos**: Admin gestiona sub-tipos por servicio desde una nueva tab "Sub-tipos"
2. **Traducciones**: Cada sub-tipo tiene nombre traducido por locale
3. **Ordenamiento**: Sub-tipos tienen sort_order para controlar el orden de display
4. **Activar/desactivar**: Sub-tipos individuales pueden desactivarse sin eliminarlos
5. **Field type "subtype"**: Nuevo tipo de campo en el form builder que carga opciones de service_subtypes
6. **Relación talento↔subtipo**: Tabla normalizada `talent_service_subtypes` para queries eficientes

### No funcionales

- Feature aislado en `features/subtypes/`
- No importa de otros features
- Sub-tipos son propiedad del servicio (FK a services)
- Un set de sub-tipos por servicio (extensible a múltiples en el futuro)

## Esquema DB

### service_subtypes

```sql
CREATE TABLE service_subtypes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  sort_order  int DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (service_id, slug)
);
```

### service_subtype_translations

```sql
CREATE TABLE service_subtype_translations (
  subtype_id  uuid NOT NULL REFERENCES service_subtypes(id) ON DELETE CASCADE,
  locale      text NOT NULL REFERENCES languages(code),
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (subtype_id, locale)
);
```

### talent_service_subtypes

```sql
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
├── types.ts              — ServiceSubtype, SubtypeWithTranslations
├── schemas.ts            — Zod validation para CRUD
├── actions/
│   ├── list-subtypes.ts  — Por service_id, con traducciones
│   ├── save-subtypes.ts  — Create/update/delete + traducciones
│   └── get-subtypes.ts   — Con traducciones por locale
└── components/
    ├── subtypes-editor.tsx     — Lista editable con add/remove/reorder
    └── subtype-row.tsx         — Fila individual con slug + traducciones
```

### Admin UI

Tab "Sub-tipos" en el editor de servicio existente (`ServiceEditTabs`):
- 4to tab junto a Contenido, Configuración, Formulario
- SubtypesEditor con locale tabs para traducciones
- Drag-to-reorder con sort_order

### Field type "subtype" en form builder

En `shared/lib/forms/types.ts`:
```typescript
export const FIELD_TYPES = [
  'text', 'number', 'multiline_text', 'boolean',
  'single_select', 'multiselect', 'file',
  'subtype'
] as const;
```

Comportamiento:
- No muestra FieldOptionsEditor (opciones vienen de DB)
- Muestra SubtypeFieldConfig con info "opciones de sub-tipos del servicio"
- En runtime: renderiza multiselect con opciones de service_subtypes

## Cascade behavior

| Acción | Resultado |
|---|---|
| DELETE service | CASCADE → service_subtypes borrados |
| DELETE service_subtype | CASCADE → talent_service_subtypes borrados |
| DELETE talent_profile | CASCADE → talent_service_subtypes borrados |

## Limitaciones conocidas

- Un set de sub-tipos por servicio. Si se necesitan múltiples conjuntos (ej: "tipo de reparación" + "herramientas"), agregar concepto de `subtype_group` sin breaking changes.
- `talent_services.specializations` (JSONB temporal) será deprecada una vez este sistema esté en producción.

## Criterios de aceptación

- [ ] Admin puede crear sub-tipos para un servicio con traducciones
- [ ] Admin puede reordenar, activar/desactivar, eliminar sub-tipos
- [ ] Tab "Sub-tipos" aparece en el editor de servicio
- [ ] Field type "subtype" disponible en el form builder
- [ ] Talento puede seleccionar sub-tipos al completar talent form
- [ ] Selección se guarda en talent_service_subtypes (normalizado)
- [ ] Queries eficientes: "¿qué talentos manejan perros en Lisboa?"
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
