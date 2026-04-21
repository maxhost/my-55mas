# Feature: Admin Orders List

## Descripción

Vista de tabla en el panel admin para listar, buscar y filtrar las órdenes del marketplace. Corresponde al feature #15 del blueprint (fase 1: solo lectura, sin acciones de asignación/cambio de estado).

## Requisitos funcionales

- Mostrar todas las órdenes en una tabla paginada (client-side)
- Columnas visibles: Order #, Servicio, Cliente, Fecha cita, Recurrencia, Staff asignado, Talento asignado, Status
- Filtros: búsqueda libre (nombre/order#), país, ciudad, talento, cliente, status, rango de fechas
- Empty state localizado cuando no hay órdenes
- Los filtros de ciudad dependen del país seleccionado
- Los dropdowns de talento/cliente solo muestran personas que aparecen en órdenes

## Schema DB

### Nueva columna

| Columna | Tipo | Constraints |
|---------|------|-------------|
| `order_number` | integer | NOT NULL, UNIQUE, DEFAULT nextval(sequence) |

### Columnas existentes usadas

| Columna | Uso en tabla |
|---------|-------------|
| `service_id` → `service_translations.name` | Nombre del servicio |
| `client_id` → `profiles.full_name` | Nombre del cliente |
| `talent_id` → `profiles.full_name` | Nombre del talento |
| `staff_member_id` → `staff_profiles` | Nombre del staff |
| `appointment_date` | Fecha de la cita |
| `schedule_type` | once / weekly |
| `status` | Badge con color |
| `country_id` | Para filtro |
| `service_city_id` | Para filtro |

## Statuses

`nuevo` | `buscando_talento` | `asignado` | `en_curso` | `completado` | `cancelado`

## Criterios de aceptación

- [ ] La tabla muestra datos correctos con FKs resueltas a nombres
- [ ] order_number es secuencial y se asigna automáticamente a nuevas órdenes
- [ ] Todos los filtros funcionan individualmente y en combinación
- [ ] El filtro de ciudad se resetea al cambiar país
- [ ] La búsqueda filtra por nombre de cliente, talento, servicio y order_number
- [ ] Empty state se muestra correctamente
- [ ] Funciona en los 5 locales (en, es, fr, pt, ca)
- [ ] Build de producción pasa sin errores
- [ ] Sin imports cruzados a otros features
- [ ] Total LOC del feature < 1500
