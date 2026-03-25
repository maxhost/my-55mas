# Spec: Multi-idioma en Servicios

## Estrategia general

Siguiendo `00-database-schema.md`:
- **UI estática** (labels, botones, mensajes) → next-intl con JSON files
- **Contenido dinámico** (datos del servicio) → tablas `_translations` en DB
- **Formularios dinámicos** (labels de campos) → `service_form_translations` en DB

Los 5 locales soportados: `es`, `en`, `pt`, `fr`, `ca`.

---

## 1. UI del admin (next-intl)

Dos namespaces nuevos en los archivos JSON de cada locale:

### `AdminServices`

Labels de la UI de gestión de servicios: títulos de página, botones, nombres de columnas, estados, tabs, mensajes de confirmación.

### `AdminFormBuilder`

Labels de la UI del form builder: tipos de campo, acciones (agregar paso/campo/opción), panel de traducciones.

**Archivos afectados:** `src/lib/i18n/messages/{es,en,pt,fr,ca}.json`

---

## 2. Contenido del servicio (`service_translations`)

Cada servicio tiene una fila por locale en `service_translations`.

| Campo | Tipo | Traducible |
|-------|------|-----------|
| name | text | Sí — nombre del servicio |
| description | text | Sí — descripción general |
| includes | text | Sí — qué incluye |
| hero_title | text | Sí — título hero de la landing |
| hero_subtitle | text | Sí — subtítulo hero |
| benefits | jsonb | Sí — array de strings por locale |
| guarantees | jsonb | Sí — array de strings por locale |
| faqs | jsonb | Sí — array de {question, answer} por locale |

### UI de traducción

Tab "Contenido" en la edición del servicio. Sub-tabs por idioma:

```
┌──────────────────────────────────────────────────────┐
│  Contenido                                            │
│                                                       │
│  [ES] [EN] [PT] [FR] [CA]                            │
│  ─────────────────────────────────────────────────── │
│  Nombre:        [Limpieza del hogar          ]       │
│  Descripción:   [Servicio profesional de...   ]       │
│  Incluye:       [Productos de limpieza, ...   ]       │
│  Hero título:   [Tu hogar, siempre limpio     ]       │
│  Hero subtítulo:[Profesionales con experiencia]       │
│                                                       │
│  Beneficios:                                          │
│  [Beneficio 1                          ] [✕] [↑][↓]  │
│  [Beneficio 2                          ] [✕] [↑][↓]  │
│  [+ Agregar]                                          │
│                                                       │
│  Garantías:                                           │
│  [Garantía 1                           ] [✕] [↑][↓]  │
│  [+ Agregar]                                          │
│                                                       │
│  Preguntas frecuentes:                                │
│  ┌─ FAQ 1 ────────────────────────────── [✕] [↑][↓] │
│  │ Pregunta: [¿Qué productos usan?              ]   │
│  │ Respuesta: [Usamos productos ecológicos...    ]   │
│  └───────────────────────────────────────────────── │
│  [+ Agregar FAQ]                                      │
│                                                       │
│                                        [Guardar]      │
└──────────────────────────────────────────────────────┘
```

**Flujo:**
1. El admin selecciona un tab de idioma (ES por defecto)
2. Ve todos los campos del servicio en ese idioma
3. Edita y guarda → upsert en `service_translations` para ese locale
4. Cambia de tab → carga traducciones del otro locale
5. Si un locale no tiene traducción, los campos aparecen vacíos

**Nota:** `name` es obligatorio en `es` (locale default). En otros locales puede estar vacío (fallback a `es`).

---

## 3. Formularios dinámicos (`service_form_translations`)

El schema JSONB en `service_forms` almacena **solo estructura** (keys, tipos, opciones como keys técnicos). Todo el texto visible está en `service_form_translations`.

### Estructura de las traducciones

```json
{
  "labels": {
    "contact": "Datos de contacto",
    "details": "Detalles del servicio",
    "address": "Dirección",
    "city": "Ciudad",
    "frequency": "Frecuencia",
    "notes": "Notas adicionales"
  },
  "placeholders": {
    "address": "Calle, número, piso",
    "notes": "Información adicional para el profesional"
  },
  "option_labels": {
    "frequency.once": "Una vez",
    "frequency.weekly": "Semanal",
    "frequency.monthly": "Mensual"
  }
}
```

**Convenciones:**
- `labels` contiene step keys y field keys en el mismo objeto
- `placeholders` solo contiene field keys (los steps no tienen placeholder)
- `option_labels` usa formato `field_key.option_key`

### UI de traducción del formulario

Panel separado dentro del tab "Formulario". Tabs por idioma, mostrando todos los textos traducibles del formulario actual:

```
┌──────────────────────────────────────────────────────┐
│  Traducciones del formulario                          │
│                                                       │
│  [ES] [EN] [PT] [FR] [CA]                            │
│  ─────────────────────────────────────────────────── │
│                                                       │
│  ── Paso: contact ──                                  │
│  Label del paso:  [Datos de contacto          ]       │
│                                                       │
│  Campo: address                                       │
│    Label:       [Dirección                    ]       │
│    Placeholder: [Calle, número, piso          ]       │
│                                                       │
│  Campo: city                                          │
│    Label:       [Ciudad                       ]       │
│    Placeholder: [                             ]       │
│                                                       │
│  ── Paso: details ──                                  │
│  Label del paso:  [Detalles del servicio      ]       │
│                                                       │
│  Campo: frequency                                     │
│    Label:       [Frecuencia                   ]       │
│    Placeholder: [                             ]       │
│    Opciones:                                          │
│      once:    [Una vez                        ]       │
│      weekly:  [Semanal                        ]       │
│      monthly: [Mensual                        ]       │
│                                                       │
│  Campo: notes                                         │
│    Label:       [Notas adicionales            ]       │
│    Placeholder: [Información adicional...     ]       │
│                                                       │
│                                        [Guardar]      │
└──────────────────────────────────────────────────────┘
```

**Flujo:**
1. El admin diseña la estructura del formulario (pasos, campos, opciones) — idioma-agnóstico
2. Luego traduce los textos visibles en el panel de traducciones
3. Cada idioma se guarda como una fila en `service_form_translations`

---

## Fallback chain

Al mostrar contenido al usuario final (catálogo público):

```
locale solicitado → locale default del país → 'es'
```

Ejemplo: usuario en Francia pide `fr`. Si no hay traducción `fr`, se busca `fr` (locale default de Francia). Si no existe, fallback a `es`.

Esta lógica es del consumo público, no del admin. El admin ve exactamente lo que hay en cada locale.

---

## Criterios de aceptación

- [ ] Contenido del servicio se edita por locale con tabs
- [ ] `name` es obligatorio solo en locale 'es'
- [ ] Benefits, guarantees y FAQs son editables como listas dinámicas por locale
- [ ] Traducciones del formulario reflejan la estructura actual del schema
- [ ] Al agregar un campo nuevo al formulario, aparece en todos los tabs de traducción
- [ ] Al eliminar un campo, sus traducciones se limpian
- [ ] Cada locale se guarda independientemente
- [ ] Build pasa sin errores
