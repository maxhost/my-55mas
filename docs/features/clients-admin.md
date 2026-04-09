# Feature: Administración de Clientes (clients)

## Resumen

Panel de administración para visualizar los clientes registrados en la plataforma. Muestra tabla con nombre completo, país, ciudad, empresa y estado. Incluye filtros por país, ciudad (dependiente de país), y tipo empresa. Solo lectura en primera iteración.

## Requisitos

### Funcionales

1. **Tabla de clientes**: Lista `client_profiles` con datos de `profiles` (nombre, país, ciudad)
2. **País y ciudad localizados**: Nombres de país/ciudad en el idioma actual vía vistas `countries_localized` / `cities_localized`
3. **Empresa**: Muestra `company_name` del client_profile. "—" si no tiene
4. **Estado con badge**: `active` / `suspended`
5. **Búsqueda**: Filtro client-side por nombre
6. **Filtro país**: Select con países activos
7. **Filtro ciudad**: Select dependiente del país seleccionado. Disabled si no hay país
8. **Filtro empresa**: Select 3 opciones (Todos / Con empresa / Sin empresa)
9. **Solo lectura**: Sin acciones de modificación

### No funcionales

- Feature aislado en `features/clients/`
- NO importa de otros features
- Cada archivo < 300 LOC, feature total < 1500 LOC
- Traducciones en 5 idiomas (es, en, pt, fr, ca)

## Esquema DB (tablas existentes)

### client_profiles (lectura)

```sql
CREATE TABLE client_profiles (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  company_name         text,
  company_tax_id       text,
  is_business          boolean NOT NULL DEFAULT false,
  legacy_id            integer UNIQUE,
  terms_accepted       boolean NOT NULL DEFAULT false,
  billing_address      text,
  billing_state        text,
  billing_postal_code  text,
  status               text NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'suspended')),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
```

### Columnas relevantes de profiles

- `full_name`, `preferred_country` (FK → countries), `preferred_city` (FK → cities)

## Arquitectura

```
features/clients/
├── index.ts
├── types.ts
├── components/
│   ├── clients-list.tsx
│   ├── clients-table.tsx
│   └── clients-toolbar.tsx
└── actions/
    ├── list-clients.ts
    ├── list-clients-helpers.ts
    ├── get-filter-options.ts
    └── __tests__/
        └── list-clients-helpers.test.ts
```

## Criterios de aceptación

- [ ] Admin puede ver tabla de clientes en `/admin/clients/`
- [ ] Tabla muestra: nombre, país, ciudad, empresa, estado
- [ ] Búsqueda filtra por nombre
- [ ] Select país filtra y resetea ciudad
- [ ] Select ciudad disabled sin país seleccionado
- [ ] Select empresa filtra con/sin empresa
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
- [ ] Traducciones en 5 idiomas
