# Spec: Configuración del Servicio (Admin)

## Requisitos

Tab "Configuración" en la edición del servicio. Aquí el admin gestiona:

1. **Disponibilidad por país y ciudad** — en qué ciudades se ofrece el servicio
2. **Precio por ciudad** — precio/hora en la moneda local del país, configurable por ciudad
3. **Precio plantilla por país** — precio base que se copia a todas las ciudades (UX accelerator)
4. **Datos generales** — recurrencia, estado

### Wireframe

```
┌────────────────────────────────────────────────────────────┐
│  Configuración                                              │
│                                                             │
│  [Seleccionar país ▾] [+ Agregar]                          │
│                                                             │
│  ▼ España  — Plantilla: [25.00] EUR [Aplicar a ciudades] [✕]│
│    ┌────────────────────────────────────────────────────┐   │
│    │ [Seleccionar ciudad ▾] [+ Agregar]                 │   │
│    │                                                     │   │
│    │  Ciudad    │ Precio/hora │ Activo │                 │   │
│    │  ──────────────────────────────────                 │   │
│    │  Madrid    │  25.00      │  [✓]   │ [✕]            │   │
│    │  Barcelona │  28.00      │  [✓]   │ [✕]            │   │
│    └────────────────────────────────────────────────────┘   │
│                                                             │
│  ▶ Portugal — Plantilla: [22.00] EUR              [✕]      │
│                                                             │
│  Estado: [Borrador ▾]                                       │
│  Permite recurrencia: [Toggle]                              │
│                                              [Guardar]      │
└────────────────────────────────────────────────────────────┘
```

**Nota**: La tab Configuración debe ir ANTES de la tab Formulario, ya que los países configurados aquí determinan qué variantes están disponibles en el Form Builder.

### Flujo de países y ciudades

1. Se cargan todos los países activos del sistema (tabla `countries`) como opciones disponibles
2. Se cargan todas las ciudades activas del sistema (tabla `cities`) agrupadas por país
3. Inicialmente solo se muestran los países ya configurados para el servicio
4. El admin añade países mediante dropdown + botón "Agregar"
5. Cada país configurado se muestra como un card colapsable con:
   - **Header**: nombre del país, precio plantilla (input numérico), moneda (read-only), botón "Aplicar a ciudades", chevron expand/collapse, botón eliminar (✕)
   - **Body (colapsable)**: dropdown para agregar ciudades + tabla de ciudades configuradas
6. Cada ciudad configurada se muestra con:
   - **Nombre de la ciudad** (traducido al locale del admin)
   - **Precio/hora** (input numérico, editable, inicializado desde precio plantilla del país)
   - **Activo** (checkbox)
   - **Eliminar** (botón ✕)
7. **Botón "Aplicar a ciudades"**: copia el precio plantilla del país a TODAS las ciudades de ese país (acción client-side, inmediata)
8. Al guardar:
   - `service_countries`: se persisten con `is_active` auto-calculado (true si ≥1 ciudad activa en el país)
   - `service_cities`: se persisten todas las ciudades configuradas con su precio individual y estado activo
   - Países/ciudades no presentes → se eliminan (delete-all + insert)
9. Los países configurados se comparten con la tab Formulario para determinar variantes disponibles

### Formularios y ciudades

Los formularios de contratación son por **ciudad** (`service_forms.city_id` FK a `cities`). La tab Configuración determina qué ciudades están disponibles en el Form Builder: el selector jerárquico muestra las ciudades configuradas aquí como destinos para crear variantes de formulario.

### Estado del servicio

| Estado | Significado |
|--------|------------|
| `draft` | Borrador. No visible en catálogo público. Default al crear. |
| `published` | Publicado. Visible en catálogo donde esté activo. |
| `archived` | Archivado. No visible. No se puede contratar. Soft-delete. |

Transiciones permitidas:
- draft → published (requiere al menos 1 ciudad activa con precio > 0)
- published → draft
- published → archived
- draft → archived
- archived → draft (reactivar)

---

## Esquema DB

### `service_countries`

| Columna | Tipo | Notas |
|---------|------|-------|
| service_id | uuid FK → services | PK compuesta |
| country_id | uuid FK → countries | PK compuesta |
| base_price | numeric(10,2) | >= 0, **precio plantilla** (UX accelerator para ciudades) |
| is_active | boolean | **Auto-calculado**: true si ≥1 ciudad activa en el país |

### `service_cities` (NUEVO)

| Columna | Tipo | Notas |
|---------|------|-------|
| service_id | uuid FK → services (CASCADE) | PK compuesta |
| city_id | uuid FK → cities | PK compuesta |
| base_price | numeric(10,2) | >= 0, **precio real** del servicio en esta ciudad |
| is_active | boolean | Default true |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Trigger handle_updated_at() |

Nota: `country_id` se deriva de `cities.country_id` — sin denormalización.

### `countries` (lectura)

| Columna relevante | Uso |
|-------------------|-----|
| id | FK para service_countries |
| code | Display (ES, PT, FR...) |
| currency | Moneda del precio (EUR, ARS, MXN, COP) |
| is_active | Solo mostrar países activos |

### `cities` (lectura)

| Columna relevante | Uso |
|-------------------|-----|
| id | FK para service_cities |
| country_id | Agrupar ciudades por país |
| name | Display |
| is_active | Solo mostrar ciudades activas |

---

## Criterios de aceptación

- [ ] Se muestran solo los países ya configurados (no todos los del sistema)
- [ ] El admin puede agregar países desde un dropdown
- [ ] El admin puede eliminar países de la configuración con botón ✕
- [ ] Cada país es un card colapsable con tabla de ciudades dentro
- [ ] El admin puede agregar ciudades dentro de cada país
- [ ] El admin puede eliminar ciudades con botón ✕
- [ ] El admin puede poner precio por hora para cada ciudad
- [ ] La moneda es read-only (viene del país)
- [ ] El precio plantilla del país + "Aplicar a ciudades" copia a todas las ciudades
- [ ] `service_countries.is_active` se auto-calcula al guardar (≥1 ciudad activa)
- [ ] Guardar persiste correctamente service_countries + service_cities
- [ ] No se puede publicar sin al menos 1 ciudad activa con precio > 0
- [ ] El admin puede cambiar el estado del servicio
- [ ] Archivar = soft delete (estado 'archived')
- [ ] Los formularios muestran variantes por ciudad (selector jerárquico País → Ciudad)
- [ ] Build pasa sin errores
