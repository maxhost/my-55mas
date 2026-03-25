# Spec: Service CRUD (Admin)

## Requisitos

### Lista de servicios (`/admin/services`)

El admin ve todos los servicios en una tabla paginada.

**Columnas:**
- Nombre (en el locale actual del admin)
- Estado (badge: borrador, publicado, archivado)
- Fecha de creación

**Acciones:**
- Buscar por nombre (filtro client-side o server-side según volumen)
- Botón "Crear servicio" → navega a `/admin/services/new`
- Click en fila → navega a `/admin/services/[id]`

**Wireframe:**

```
┌──────────────────────────────────────────────────────────┐
│  Servicios                              [+ Crear servicio]│
│                                                           │
│  [🔍 Buscar servicios...]                                 │
│                                                           │
│  Nombre            │ Estado     │ Creado                  │
│  ──────────────────────────────────────────────────────── │
│  Limpieza hogar    │ Publicado  │ 15/03/26                │
│  Cuidado personal  │ Borrador   │ 12/03/26                │
│  Jardinería        │ Archivado  │ 01/02/26                │
│                                                           │
│  < 1 2 3 >                                                │
└──────────────────────────────────────────────────────────┘
```

### Crear servicio (`/admin/services/new`)

Formulario mínimo para crear el servicio:
- Nombre (obligatorio, en locale por defecto 'es')
- Slug (auto-generado desde nombre, editable)

Al guardar: se crea `services` + `service_translations` (locale 'es') + redirect a `/admin/services/[id]`.

### Editar servicio (`/admin/services/[id]`)

Tres tabs:

1. **Contenido** — Datos multi-idioma (ver campos abajo)
2. **Formulario** — Form builder (spec en `02-form-builder.md`)
3. **Configuración** — Países y precios (spec en `03-configuration.md`)

### Archivar servicio

No hay delete real. El admin cambia estado a "archivado" desde la tab Configuración.
Un servicio archivado no aparece en el catálogo público ni puede ser contratado.

---

## Esquema DB

### `services`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Auto-generado |
| slug | text UNIQUE | kebab-case, derivado del nombre |
| status | text | 'draft' (default), 'published', 'archived' |
| cover_image_url | text | NULL en v1 (upload en v2) |
| allows_recurrence | boolean | Default false |

### `service_translations`

| Columna | Tipo | Notas |
|---------|------|-------|
| service_id | uuid FK → services | PK compuesta |
| locale | text FK → languages | PK compuesta |
| name | text NOT NULL | Nombre del servicio |
| description | text | Descripción general |
| includes | text | Qué incluye el servicio |
| hero_title | text | Título hero (landing) |
| hero_subtitle | text | Subtítulo hero |
| benefits | jsonb | `["Beneficio 1", "Beneficio 2"]` |
| guarantees | jsonb | `["Garantía 1", "Garantía 2"]` |
| faqs | jsonb | `[{"question": "...", "answer": "..."}]` |

---

## Criterios de aceptación

- [ ] La lista muestra servicios con nombre traducido al locale actual
- [ ] La búsqueda filtra por nombre
- [ ] Crear servicio genera slug automático y redirige a edición
- [ ] Editar servicio guarda traducciones por locale
- [ ] Archivar cambia estado a 'archived'
- [ ] Todos los textos de UI usan claves i18n (namespace `AdminServices`)
- [ ] Build pasa sin errores: `NODE_ENV=production pnpm build`
