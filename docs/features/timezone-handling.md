# Timezone handling — appointments multi-país, viewer-agnostic

Cómo la app representa, almacena y muestra los horarios de servicio
(`orders.appointment_date`, `order_schedules.time_start/time_end`).

## Goal

Una orden creada en España con horario `10:00 – 11:00` debe mostrar siempre
`10:00 – 11:00` cuando un admin la ve, sin importar si el admin está en
Madrid, Buenos Aires o Nueva York. La hora del servicio es **local del país
donde se presta el servicio** y comunica un compromiso al talento ("estaré
ahí a las 10am") que no admite reinterpretación según el viewer.

## Convención

1. **Storage**: `orders.appointment_date` es `timestamptz` (UTC en DB).
2. **Service timezone**: cada orden tiene `orders.timezone` (IANA, ej.
   `Europe/Madrid`) snapshotted del país del servicio al crear la orden.
3. **Render**: toda hora derivada de `appointment_date` se formatea con
   `Intl.DateTimeFormat({ timeZone: order.timezone })` — **nunca** en la
   TZ del navegador del viewer.
4. **No hay "view in my timezone"**: el horario es el del servicio, punto.
   Si en el futuro pidiéramos un toggle, se discute con producto y se
   añade como decoración opcional sin cambiar el storage.

`created_at`, `updated_at`, `paid_at` y similares quedan fuera de scope:
son timestamps de acción administrativa, no del servicio. Se renderizan
en TZ del viewer (comportamiento default de `Intl.DateTimeFormat`).

## Source of truth

- Tabla `countries` tiene columna `timezone text NOT NULL` (ej. `ES → Europe/Madrid`).
- Al crear la orden, el action resuelve `country.timezone` (vía `country_code`
  desde Mapbox o desde city.country) y lo persiste en `orders.timezone`.
- Snapshot deliberado: si en el futuro reasignamos la TZ del país (ej. España
  decide cambiar a `Europe/Lisbon`, escenario hipotético), las órdenes ya
  creadas no se reinterpretan.

### Multi-TZ países (futuro)

Cuando entre USA / Brasil / Canadá / etc., agregar `cities.timezone text NULL`
en migration aditiva. Resolver así:

```ts
const tz = city.timezone ?? country.timezone;
```

No hace falta cambiar el resto del código — el snapshot a `orders.timezone`
sigue funcionando idéntico.

## API pública del helper `src/shared/lib/datetime/`

```ts
/** Construye un timestamp UTC correcto a partir de (date, time, tz IANA). */
export function composeAppointmentUtc(
  dateIso: string,    // 'YYYY-MM-DD'
  timeHm: string,     // 'HH:MM'
  timeZone: string,   // ej. 'Europe/Madrid'
): string;            // ISO UTC, ej. '2026-05-10T08:00:00.000Z'

export function formatTimeInTz(isoUtc: string, timeZone: string): string;
//   '2026-05-10T08:00:00Z' + 'Europe/Madrid' → '10:00'

export function formatDateInTz(isoUtc: string, timeZone: string, locale: string): string;
//   '2026-05-10T08:00:00Z' + 'Europe/Madrid' + 'es' → '10 may 2026'

export function addMinutesInTz(isoUtc: string, minutes: number): string;
//   suma minutos preservando UTC ISO. La TZ se aplica en el formatter.
```

Cero dependencias externas. `Intl.DateTimeFormat` resuelve DST correctamente
desde Node 16+.

### Casos de DST

- Madrid CEST en mayo (UTC+2): `('2026-05-10', '10:00', 'Europe/Madrid')` →
  `2026-05-10T08:00:00.000Z`.
- Madrid CET en febrero (UTC+1): `('2026-02-10', '10:00', 'Europe/Madrid')` →
  `2026-02-10T09:00:00.000Z`.
- Lisbon WEST en mayo (UTC+1): `('2026-05-10', '10:00', 'Europe/Lisbon')` →
  `2026-05-10T09:00:00.000Z`.
- DST start ES (29 mar 2026, 02:00 → 03:00 local): el helper aplica el
  offset real de esa fecha; los tests cubren el boundary.

### Inválidos

- TZ desconocida (`'Foo/Bar'`) → `composeAppointmentUtc` y los formatters
  lanzan error con mensaje claro. Capturado en el action y devuelto como
  error del form.
- `country.timezone` null/empty (defensivo): el action hace fallback a
  `'Europe/Madrid'` + `console.warn`. No rompe el flujo.

## Round-trip property

Para cualquier `tz` IANA y `(date, time)` válidos:

```ts
formatTimeInTz(composeAppointmentUtc(date, time, tz), tz) === time
```

Esta property cierra la regresión del bug original (server runtime UTC-5
interpretando el string sin `Z` como local) y la cubrimos en tests.

## Render policy por superficie

| Superficie                                          | Campo                  | TZ aplicada              |
|-----------------------------------------------------|------------------------|--------------------------|
| `/admin/orders/[id]` header                         | `appointment_date`     | `order.timezone`         |
| `/admin/orders/[id]` header time range              | derivado start/end     | `order.timezone`         |
| `/admin/orders` lista                               | `appointment_date`     | `order.timezone` por row |
| `/admin/clients/[id]` orders tab                    | `appointment_date`     | `order.timezone` por row |
| `/admin/clients/[id]` payments sheet                | `appointment_date`     | `order.timezone` por row |
| `/admin/orders/[id]` recurrence (Phase 2)           | `time_window_start/end`| `order.timezone`         |
| Activity timeline / created_at / updated_at         | timestamps de acción   | TZ del viewer (default)  |

## Form UX

`/registro/contratar` y `/admin/test-service-hire` muestran al cliente la TZ
activa una vez resuelta la dirección:

> Hora local del servicio: **Europe/Madrid**

Esto es feedback de UX, no validación. El TZ resuelto del país se usa al
guardar via Server Action.

## Doble fuente de verdad para recurring

`order_schedules.timezone` ya existe (NOT NULL). Para órdenes `recurring`,
el action garantiza:

```ts
orders.timezone === order_schedules.timezone
```

`orders.timezone` es la fuente primaria (consultada por el composer del
detail y por las listas). `order_schedules.timezone` se mantiene para queries
existentes y por consistencia con la entidad de schedule.

## Migración (S1)

```sql
ALTER TABLE orders
  ADD COLUMN timezone text NOT NULL DEFAULT 'Europe/Madrid';
```

Default seguro porque toda orden existente fue creada en contexto España.
No requiere backfill (la única fila pre-existente, `#8`, queda con la TZ
default + `appointment_date` ya escrito en UTC literal — render post-fix
mostrará `17:00` Madrid, esperado para esa fila de prueba con datos rotos).

## Criterios de aceptación

1. Crear orden via `/admin/test-service-hire` con dirección ES y horario
   `10:00–11:00` → DB tiene `appointment_date = '<date>T08:00:00+00:00'`,
   `timezone = 'Europe/Madrid'`.
2. `/admin/orders/<id>` header muestra `10:00 – 11:00 (Europe/Madrid)`
   con cualquier TZ del navegador.
3. Cambiar TZ del navegador a Argentina o USA: las horas no cambian.
4. Repetir con dirección PT → `Europe/Lisbon`, render coherente.
5. Tests round-trip pasan para Madrid y Lisbon en mayo y febrero.
6. Tests específicos en DST boundary (29 mar 2026 ES) pasan.
