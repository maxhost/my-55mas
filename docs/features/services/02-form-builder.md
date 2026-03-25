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

### Variantes por país (modelo cascade)

Un servicio puede tener formularios diferentes por país (regulaciones, preguntas locales). Soportado via `service_forms.country_id`:
- `country_id = NULL` → formulario **General** (master, aplica a todos los países)
- `country_id = uuid` → variante específica para ese país

**Modelo cascade — General es el master:**
- Añadir/eliminar un campo o paso en General → se propaga automáticamente a TODAS las variantes de país
- Traducir en General → las traducciones se copian a todas las variantes (si la variante no tiene una traducción customizada para ese campo)
- Las variantes de país pueden tener campos adicionales propios (country-specific) que no se ven afectados por el cascade

**Detección de campos country-specific (sin tags en DB):**
Al guardar General, se comparan keys contra el schema General anterior. Un campo en una variante cuyo key NO existe en el General anterior se considera "country-specific" y se preserva.

**Merge de traducciones (inteligente):**
- Traducción nueva en General → se copia a variantes
- Traducción cambiada en General → se actualiza en variantes SI la variante aún tenía el valor anterior (heredado)
- Traducción customizada en variante (diferente del valor General anterior) → se preserva

**Flujo:**
1. El admin configura países en la tab **Configuración** (debe ser la tab anterior)
2. En la tab Formulario, dropdown muestra "General" + países configurados
3. Al seleccionar un país que no tiene variante, se auto-crea clonando de General
4. Editar General propaga cambios automáticamente a todas las variantes
5. Editar una variante de país permite ajustes puntuales sin afectar a General ni a otros países

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
| country_id | uuid FK → countries | NULL = default |
| schema | jsonb NOT NULL | Estructura del formulario (ver abajo) |
| version | int | Default 1, incrementa al modificar |
| is_active | boolean | Default true |

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
- Keys son snake_case, solo letras minúsculas, números y guiones bajos
- `options` solo existe para `single_select` y `multiselect`
- `required` es boolean, default false

**Retrocompatibilidad:** Schema legacy con `fields` (flat) se envuelve en un step único al leer.

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

## Criterios de aceptación

- [ ] El admin puede agregar/eliminar/reordenar pasos
- [ ] El admin puede agregar/eliminar/reordenar campos dentro de un paso
- [ ] Campos single_select y multiselect muestran editor de opciones inline
- [ ] El schema se guarda como JSONB en `service_forms`
- [ ] Keys son validados (únicos, snake_case)
- [ ] Al guardar, se incrementa version si el schema cambió
- [ ] Formulario general (country_id = NULL) funciona correctamente
- [ ] Tabs de idioma muestran traducciones integradas en el builder
- [ ] Crear variante para un país clona estructura + traducciones (auto-clone al seleccionar)
- [ ] Añadir campo en General → aparece en todas las variantes de país
- [ ] Eliminar campo en General → desaparece de todas las variantes de país
- [ ] Campos country-specific (añadidos en una variante) se preservan al editar General
- [ ] Traducir en General → traducciones se copian a variantes para campos compartidos
- [ ] Traducción customizada en variante se preserva al re-guardar General
- [ ] Dropdown de variantes solo muestra países configurados en tab Configuración
- [ ] Cambiar entre variantes recarga el formulario correcto
- [ ] Tests unitarios para cascade algorithm (funciones puras)
- [ ] Build pasa sin errores
