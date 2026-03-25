# Feature: Servicios (Admin)

## Alcance v1

Gestión completa de servicios desde el panel de administración. El admin puede:

- Ver lista de servicios con búsqueda y filtrado por estado
- Crear y editar servicios con contenido multi-idioma (es, en, pt, fr, ca)
- Diseñar formularios de contratación por pasos (form builder)
- Configurar disponibilidad y precio por país

## Estructura de la feature

Dos módulos independientes según `architecture.md`:

- `src/features/services/` — CRUD de servicios, contenido, configuración de países/precios
- `src/features/forms/` — Form builder y traducciones de formularios

## Tablas de DB involucradas

- `services` — Datos base del servicio (slug, estado, imagen)
- `service_translations` — Contenido traducible (nombre, descripción, hero, benefits, FAQs)
- `service_countries` — Precio y disponibilidad por país
- `service_forms` — Schema JSONB del formulario de contratación
- `service_form_translations` — Labels, placeholders y opciones traducidas
- `countries` — Países disponibles (lectura)

## Páginas

| Ruta | Descripción |
|------|------------|
| `/admin/services` | Lista de servicios |
| `/admin/services/new` | Crear servicio |
| `/admin/services/[id]` | Editar servicio (3 tabs: Contenido, Formulario, Configuración) |

## Exclusiones v1

- Rich text editor (se usa JSON arrays para benefits/guarantees/FAQs)
- Drag-and-drop en el form builder (flechas ↑↓ para reordenar)
- Preview en vivo del formulario público
- Versionado visual de formularios (la DB lo soporta, UI en v2)
- Upload de imagen de portada (campo existe, upload en v2)
- Precios por ciudad (v1 solo por país)

## Specs detalladas

- [01-service-crud.md](./01-service-crud.md) — Lista, crear, editar, archivar
- [02-form-builder.md](./02-form-builder.md) — Diseño de formularios por pasos
- [03-configuration.md](./03-configuration.md) — Países, precios, activación
- [04-translations.md](./04-translations.md) — Multi-idioma en cada área
