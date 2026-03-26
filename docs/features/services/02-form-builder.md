# Spec: Form Builder (Admin)

## Requisitos

El admin diseña el formulario de contratación de cada servicio sin programar. El formulario se organiza en **pasos** (steps), cada paso contiene **campos** (fields).

### Patrón UX: Step-based Card Builder

Inspirado en Tally.so y Typeform. Cards apiladas verticalmente, una por paso.

```
┌─────────────────────────────────────────────────────┐
│  Paso 1: Datos de contacto                  [↑][↓][✕]│
│  ┌─────────────────────────────────────────────────┐│
│  │ address   │ text          │ required ✓      [✕] ││
│  │ city      │ text          │ required ✓      [✕] ││
│  │                  [+ Agregar campo]              ││
│  └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│  Paso 2: Detalles del servicio              [↑][↓][✕]│
│  ┌─────────────────────────────────────────────────┐│
│  │ frequency │ single_select │ required ✓      [✕] ││
│  │   └─ opciones: [once] [weekly] [monthly] [+]   ││
│  │ notes     │ multiline_text│ required ✗      [✕] ││
│  │                  [+ Agregar campo]              ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│                 [+ Agregar paso]                     │
└─────────────────────────────────────────────────────┘
```

### Interacciones

| Acción | Comportamiento |
|--------|---------------|
| Agregar paso | Botón al final → card vacía con key editable |
| Agregar campo | Botón dentro del paso → inline: key, tipo, required |
| Escribir key de paso/campo | Sanitizada en tiempo real con `sanitizeKey()`: lowercase, caracteres inválidos → `_`, prefijo no-letra eliminado |
| Seleccionar tipo select/multiselect | Expande editor de opciones inline (keys técnicos) |
| Reordenar pasos | Flechas ↑↓ en header de card |
| Reordenar campos | Flechas ↑↓ en cada fila de campo |
| Eliminar paso/campo | Botón ✕ (con confirmación si tiene contenido) |
| Editar campo | Click para expandir/colapsar opciones |

### Tipos de campo

| Tipo | key en schema | Tiene opciones |
|------|--------------|----------------|
| Texto | `text` | No |
| Número | `number` | No |
| Texto largo | `multiline_text` | No |
| Sí/No | `boolean` | No |
| Selección única | `single_select` | Sí — lista de option keys |
| Selección múltiple | `multiselect` | Sí — lista de option keys |
| Archivo | `file` | No (tipos permitidos en v2) |

### Variantes por ciudad (modelo cascade)

Un servicio puede tener formularios diferentes por ciudad (regulaciones locales, requisitos municipales). Soportado via `service_forms.city_id`:
- `city_id = NULL` → formulario **General** (master, aplica a todas las ciudades)
- `city_id = uuid` → variante específica para esa ciudad

**Modelo cascade — General es el master:**
- Añadir/eliminar un campo o paso en General → se propaga automáticamente a TODAS las variantes de ciudad
- Traducir en General → las traducciones se copian a todas las variantes (si la variante no tiene una traducción customizada para ese campo)
- Las variantes de ciudad pueden tener campos adicionales propios (city-specific) que no se ven afectados por el cascade

**Detección de campos city-specific (sin tags en DB):**
Al guardar General, se comparan keys contra el schema General anterior. Un campo en una variante cuyo key NO existe en el General anterior se considera "city-specific" y se preserva.

**Merge de traducciones (inteligente):**
- Traducción nueva en General → se copia a variantes
- Traducción cambiada en General → se actualiza en variantes SI la variante aún tenía el valor anterior (heredado)
- Traducción customizada en variante (diferente del valor General anterior) → se preserva

**Selector jerárquico (País → Ciudad):**
El variant selector usa dos dropdowns jerárquicos:
1. Primer dropdown: "General" + países configurados
2. Segundo dropdown (visible al seleccionar un país): ciudades del país seleccionado

**Flujo:**
1. El admin configura países y ciudades en la tab **Configuración** (debe ser la tab anterior)
2. En la tab Formulario, primer dropdown muestra "General" + países configurados
3. Al seleccionar un país, segundo dropdown muestra las ciudades de ese país
4. Al seleccionar una ciudad que no tiene variante, se auto-crea clonando de General
5. Editar General propaga cambios automáticamente a todas las variantes de ciudad
6. Editar una variante de ciudad permite ajustes puntuales sin afectar a General ni a otras ciudades

### Traducciones integradas

Las traducciones de labels, placeholders y opciones se editan **dentro del mismo builder**, no en una sección separada. El patrón es idéntico a la tab Contenido:
- Tabs de idioma (ES, EN, PT, FR, CA) arriba del builder
- Al cambiar de idioma, la estructura del formulario se mantiene pero los campos de etiqueta/placeholder cambian al idioma seleccionado
- Guardar persiste estructura + traducciones del idioma activo en una sola llamada

---

## Esquema DB

### `service_forms`

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Auto-generado |
| service_id | uuid FK → services | Obligatorio |
| city_id | uuid FK → cities | NULL = default (General) |
| schema | jsonb NOT NULL | Estructura del formulario (ver abajo) |
| version | int | Default 1, incrementa en cada guardado |
| is_active | boolean | Default true |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### Schema JSONB (estructura)

```json
{
  "steps": [
    {
      "key": "contact",
      "fields": [
        { "key": "address", "type": "text", "required": true },
        { "key": "city", "type": "text", "required": true }
      ]
    },
    {
      "key": "details",
      "fields": [
        {
          "key": "frequency",
          "type": "single_select",
          "options": ["once", "weekly", "monthly"],
          "required": true
        },
        { "key": "notes", "type": "multiline_text", "required": false }
      ]
    }
  ]
}
```

**Reglas del schema:**
- Cada step tiene `key` único dentro del formulario
- Cada field tiene `key` único dentro del formulario (no solo del step)
- Keys: snake_case, **deben empezar con letra** (no número ni `_`), solo `[a-z0-9_]`, mínimo 1 carácter, máximo 50 caracteres
- `options` solo existe para `single_select` y `multiselect`; estos tipos requieren **mínimo 1 opción**
- Cada opción: string de 1–100 caracteres
- `required` es boolean, default false

**Retrocompatibilidad:** Schema legacy con `fields` (flat, sin steps) se normaliza al leer: se envuelve en un step único con `key: "default"`. Si el schema es inválido o nulo, se devuelve `{ steps: [] }`.

### `service_form_translations`

| Columna | Tipo | Notas |
|---------|------|-------|
| form_id | uuid FK → service_forms | PK compuesta |
| locale | text FK → languages | PK compuesta |
| labels | jsonb NOT NULL | Step keys + field keys → texto traducido |
| placeholders | jsonb | Field keys → placeholder traducido |
| option_labels | jsonb | `field_key.option_key` → opción traducida |

Ver spec detallada en [04-translations.md](./04-translations.md).

---

## Tipos TypeScript

Definidos en `src/features/forms/types.ts`:

```typescript
// ── Estructura del formulario ─────────────────────────
type FormField = {
  key: string
  type: FieldType                 // 'text' | 'number' | 'multiline_text' | 'boolean' | 'single_select' | 'multiselect' | 'file'
  required: boolean
  options?: string[]              // solo para single_select y multiselect
}

type FormStep = {
  key: string
  fields: FormField[]
}

type FormSchema = {
  steps: FormStep[]
}

// ── Traducciones ──────────────────────────────────────
type FormTranslationData = {
  labels: Record<string, string>         // step key o field key → label traducido
  placeholders: Record<string, string>   // field key → placeholder traducido
  option_labels: Record<string, string>  // "fieldKey.optionValue" → opción traducida
}

// ── DTOs de DB ────────────────────────────────────────
type FormDetail = {
  id: string
  service_id: string
  city_id: string | null
  schema: FormSchema
  version: number
  is_active: boolean
}

type FormWithTranslations = FormDetail & {
  translations: Record<string, FormTranslationData>  // locale → traducciones
}

// ── Selector jerárquico ───────────────────────────────
type FormVariantSummary = { id: string; city_id: string | null; city_name: string | null; country_id: string | null; version: number }
type FormCountryOption  = { id: string; name: string }
type FormCityOption     = { id: string; name: string; country_id: string }
```

`FormCountryOption` y `FormCityOption` se mapean desde los tipos del feature `services` en `service-edit-tabs.tsx` (`ServiceCountryDetail[]` → `FormCountryOption[]`, `ServiceCityDetail[]` → `FormCityOption[]`) antes de pasarse a `FormBuilderPanel`.

---

## Arquitectura — Server Actions

Definidos en `src/features/forms/actions/`:

| Action | Archivo | Descripción |
|--------|---------|-------------|
| `getForm(serviceId, cityId?, fallback?)` | `get-form.ts` | Carga form + todas sus traducciones. `fallback=true` (default): si no existe la variante de ciudad, cae al General |
| `saveForm(input)` | `save-form.ts` | Guarda solo el schema (upsert). Incrementa `version` en cada llamada |
| `saveFormTranslations(input)` | `save-form.ts` | Guarda traducciones de un locale (upsert por `form_id + locale`) |
| `saveFormWithTranslations(input)` | `save-form.ts` | Combina los dos anteriores + `revalidatePath`. **Usado para variantes de ciudad** |
| `cascadeGeneralSave(input)` | `cascade-general-save.ts` | Guarda el General y propaga la cascada a todas las variantes. **Usado solo cuando `city_id === null`** |
| `cloneFormVariant(input)` | `clone-form-variant.ts` | Clona schema + todas las traducciones desde una ciudad origen a una destino. Usa `fallback=false` (la fuente debe existir exactamente) |
| `listFormVariants(serviceId)` | `list-form-variants.ts` | Lista todas las variantes activas con metadata de ciudad/país. Devuelve `FormVariantSummary[]` |

**Distinción crítica:** el componente `FormBuilder` llama a `cascadeGeneralSave` si `cityId === null` y a `saveFormWithTranslations` si `cityId !== null`.

---

## Criterios de aceptación

- [ ] El admin puede agregar/eliminar/reordenar pasos
- [ ] El admin puede agregar/eliminar/reordenar campos dentro de un paso
- [ ] Campos single_select y multiselect muestran editor de opciones inline
- [ ] El schema se guarda como JSONB en `service_forms`
- [ ] Keys son validados (únicos, snake_case, empiezan con letra, 1–50 chars)
- [ ] Al guardar, se incrementa `version` en cada guardado
- [ ] Formulario general (city_id = NULL) funciona correctamente
- [ ] Tabs de idioma muestran traducciones integradas en el builder
- [ ] Selector jerárquico: primer dropdown (General/País), segundo dropdown (Ciudad)
- [ ] Crear variante para una ciudad clona estructura + traducciones (auto-clone al seleccionar)
- [ ] Añadir campo en General → aparece en todas las variantes de ciudad
- [ ] Eliminar campo en General → desaparece de todas las variantes de ciudad
- [ ] Campos city-specific (añadidos en una variante) se preservan al editar General
- [ ] Traducir en General → traducciones se copian a variantes para campos compartidos
- [ ] Traducción customizada en variante se preserva al re-guardar General
- [ ] Dropdown de países solo muestra países configurados en tab Configuración
- [ ] Dropdown de ciudades solo muestra ciudades del país seleccionado
- [ ] Cambiar de país resetea la selección de ciudad
- [ ] Cambiar entre variantes recarga el formulario correcto
- [ ] Tests unitarios para cascade algorithm (funciones puras)
- [ ] Build pasa sin errores
