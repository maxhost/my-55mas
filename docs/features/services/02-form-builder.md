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

### Variantes por país

Un servicio puede tener formularios diferentes por país (regulaciones, preguntas locales). Soportado via `service_forms.country_id`:
- `country_id = NULL` → formulario general (aplica a todos los países sin variante propia)
- `country_id = uuid` → variante específica para ese país

**Flujo:**
1. El admin crea el formulario general (se muestra por defecto)
2. Opcionalmente, desde un dropdown "Variante", clona el general a un país específico
3. La variante clonada es 100% independiente: puede añadir/quitar pasos y campos
4. Todas las traducciones se clonan junto con la estructura

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
- [ ] Crear variante para un país clona estructura + traducciones
- [ ] Variantes son independientes (cambios no afectan al general ni a otras variantes)
- [ ] Cambiar entre variantes recarga el formulario correcto
- [ ] Build pasa sin errores
