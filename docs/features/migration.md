# Feature: Migración CSV → Supabase (migration)

## Resumen

Herramienta admin para importar datos desde archivos CSV a la base de datos. Wizard de 4 pasos: seleccionar tabla destino, subir CSV, mapear columnas visualmente, validar e importar con progreso por batch. Soporta importación de clientes, talentos y pedidos.

## Requisitos

### Funcionales

1. **Selección de destino**: Elegir qué tipo de datos importar (clientes, talentos, pedidos)
2. **Upload CSV**: Drag & drop o file input, auto-detección de separador
3. **Preview**: Mostrar primeras 5 filas parseadas para verificación
4. **Column mapping**: Interfaz visual para mapear columnas CSV → columnas DB
5. **Auto-match**: Matching automático por similitud de nombre de columna
6. **Validación pre-import**: Mostrar errores antes de ejecutar (email inválido, ciudad no encontrada)
7. **Batch processing**: Importar en batches de 50/500 filas con progreso visual (X/total)
8. **Error accumulation**: Errores por fila se acumulan sin detener el proceso
9. **Resultado final**: Resumen con insertados/errores/omitidos + detalle de errores

### No funcionales

- Feature aislado en `features/migration/`
- CSV parsing en client-side (papaparse)
- Inserts via server actions con service role client
- Cada archivo < 300 LOC
- Traducciones en 5 idiomas (es, en, pt, fr, ca)

## Orden de importación

```
PREREQUISITO: Servicios, categorías, ciudades y países deben existir.
FASE 1: Talentos → profiles + talent_profiles + user_roles + talent_services + talent_analytics
FASE 2: Clientes → profiles + client_profiles + user_roles
FASE 3: Pedidos  → orders (lookups por nombre a service, client, talent, city)
```

### Campos por target

**Clientes** (15 campos mapeables):
- profiles: full_name, email, phone, preferred_contact, nif, preferred_city, preferred_country, created_at
- client_profiles: company_name, is_business, legacy_id, terms_accepted, billing_address, billing_state, billing_postal_code

**Talentos** (21 campos mapeables):
- profiles: full_name, email, phone, preferred_contact, nif, created_at
- talent_profiles: birth_date, gender, status, legacy_id, terms_accepted, has_car, preferred_payment, professional_status, address, state, postal_code, city_id, country_id
- talent_analytics: how_found, why_join (key-value)

**Pedidos** (11 campos mapeables):
- orders: contact_name, contact_email, contact_phone, service_name, talent_name, city, status, price_subtotal, price_total, schedule_type, created_at

```
```

## Arquitectura

```
features/migration/
├── index.ts
├── types.ts
├── lib/
│   ├── csv-parser.ts
│   ├── column-matcher.ts
│   └── transformers/
│       ├── transform-clients.ts
│       ├── transform-talents.ts
│       └── transform-orders.ts
├── actions/
│   ├── execute-batch.ts
│   ├── get-table-columns.ts
│   └── get-lookup-data.ts
├── components/
│   ├── migration-wizard.tsx
│   ├── target-selector.tsx
│   ├── csv-uploader.tsx
│   ├── column-mapper.tsx
│   ├── import-executor.tsx
│   └── batch-progress.tsx
└── __tests__/
    ├── csv-parser.test.ts
    └── column-matcher.test.ts
```

## Criterios de aceptación

- [ ] Admin puede subir CSV y ver preview parseado
- [ ] Auto-match de columnas funciona por similitud de nombre
- [ ] Mapeo manual de columnas con validación de requeridas
- [ ] Validación pre-import muestra errores por fila
- [ ] Progreso visual durante importación batch (X/total)
- [ ] Resumen final con insertados/errores/omitidos
- [ ] Funciona con CSV de 500+ filas sin timeout
- [ ] Build pasa: `NODE_ENV=production pnpm build`
- [ ] Tests escritos y pasando
- [ ] Traducciones en 5 idiomas
