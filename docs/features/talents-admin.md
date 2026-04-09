# Feature: Administración de Talentos (talents)

## Resumen

Panel de administración para visualizar y gestionar los talentos registrados en la plataforma. Muestra una tabla con nombre, servicios ofrecidos (chips), total ganado en EUR, y estado del talento. Solo lectura en la primera iteración.

## Requisitos

### Funcionales

1. **Tabla de talentos**: Lista todos los `talent_profiles` con datos del perfil base (`profiles`)
2. **Servicios como chips**: Muestra el primer servicio ofrecido + "+N" si hay más, con tooltip nativo para la lista completa
3. **Total ganado EUR**: Suma de `price_total` de órdenes completadas (`status = 'completado'`) en EUR
4. **Estado con badge**: Muestra `pending`, `approved`, `rejected`, `suspended` con colores diferenciados
5. **Búsqueda**: Filtro client-side por nombre del talento
6. **Filtro por estado**: Select dropdown para filtrar por status del talento
7. **Solo lectura**: Sin acciones de modificación en esta versión

### No funcionales

- Feature aislado en `features/talents/`
- NO importa de otros features
- Cada archivo < 300 LOC, feature total < 1500 LOC
- Traducciones en 5 idiomas (es, en, pt, fr, ca)

## Esquema DB (tablas existentes)

### talent_profiles (lectura)

```sql
CREATE TABLE talent_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL UNIQUE REFERENCES profiles(id),
  birth_date          date NOT NULL,
  gender              text,
  address             text,
  postal_code         text,
  state               text,
  city_id             uuid REFERENCES cities(id),
  country_id          uuid REFERENCES countries(id),
  photo_url           text,
  has_car             boolean,
  professional_status text,
  preferred_payment   text,
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  handler_id          uuid REFERENCES profiles(id),
  approved_at         timestamptz,
  approved_by         uuid REFERENCES profiles(id),
  internal_notes      text,
  legacy_id           integer UNIQUE,
  terms_accepted      boolean NOT NULL DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

### Tablas relacionadas (JOINs)

- `profiles` — `full_name`, `email`, `phone`
- `talent_services` + `services` + `service_translations` — nombres de servicios por locale
- `orders` — `price_total` WHERE `status = 'completado'` AND `currency = 'EUR'`

## Arquitectura

### Feature structure

```
features/talents/
├── index.ts
├── types.ts
├── components/
│   ├── talents-list.tsx       — Orquestador (search + filter + table)
│   ├── talents-table.tsx      — Tabla shadcn/ui con badges y chips
│   └── talents-toolbar.tsx    — Búsqueda + filtro por estado
└── actions/
    ├── list-talents.ts        — Server action: 3 queries + merge
    └── __tests__/
        └── list-talents.test.ts
```

### Admin UI

- Lista: `/admin/talents/` — tabla con filtros
- Sin página de detalle en esta iteración

## Criterios de aceptación

- [ ] Admin puede ver tabla de talentos en `/admin/talents/`
- [ ] Tabla muestra: nombre, servicios (chips), total EUR, estado (badge), fecha registro
- [ ] Búsqueda filtra por nombre
- [ ] Select filtra por estado (todos/pending/approved/rejected/suspended)
- [ ] Chips de servicios muestran "+N" con tooltip
- [ ] Total EUR formateado con Intl.NumberFormat
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
- [ ] Traducciones en 5 idiomas
