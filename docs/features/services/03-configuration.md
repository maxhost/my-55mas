# Spec: Configuración del Servicio (Admin)

## Requisitos

Tab "Configuración" en la edición del servicio. Aquí el admin gestiona:

1. **Disponibilidad por país** — en qué países se ofrece el servicio
2. **Precio por país** — precio/hora en la moneda local del país
3. **Datos generales** — recurrencia, estado

### Wireframe

```
┌──────────────────────────────────────────────────────┐
│  Configuración                                        │
│                                                       │
│  ┌─ Países y precios ─────────────────────────────┐  │
│  │                                                 │  │
│  │  País        │ Precio/hora │ Moneda │ Activo   │  │
│  │  ─────────────────────────────────────────────  │  │
│  │  España      │  25.00      │ EUR    │ [✓]      │  │
│  │  Portugal    │  22.00      │ EUR    │ [✓]      │  │
│  │  Francia     │  30.00      │ EUR    │ [ ]      │  │
│  │  Argentina   │  15000.00   │ ARS    │ [✓]      │  │
│  │  México      │  450.00     │ MXN    │ [ ]      │  │
│  │  Colombia    │  80000.00   │ COP    │ [ ]      │  │
│  │                                                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  Estado: [Borrador ▾]                                 │
│  Permite recurrencia: [Toggle]                        │
│                                                       │
│                                        [Guardar]      │
└──────────────────────────────────────────────────────┘
```

### Flujo de países y precios

1. Se cargan todos los países activos del sistema (tabla `countries`)
2. Para cada país, se muestra una fila con:
   - **Nombre del país** (traducido al locale del admin)
   - **Precio/hora** (input numérico, editable)
   - **Moneda** (read-only, viene de `countries.currency`)
   - **Activo** (toggle switch)
3. Al guardar:
   - País con precio y activo → upsert en `service_countries` con `is_active = true`
   - País con precio pero inactivo → upsert en `service_countries` con `is_active = false`
   - País sin precio → no se crea fila (o se elimina si existía)

### Estado del servicio

| Estado | Significado |
|--------|------------|
| `draft` | Borrador. No visible en catálogo público. Default al crear. |
| `published` | Publicado. Visible en catálogo donde esté activo. |
| `archived` | Archivado. No visible. No se puede contratar. Soft-delete. |

Transiciones permitidas:
- draft → published (requiere al menos 1 país activo con precio)
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
| base_price | numeric(10,2) | >= 0, obligatorio |
| is_active | boolean | Default true |

### `countries` (lectura)

| Columna relevante | Uso |
|-------------------|-----|
| id | FK para service_countries |
| code | Display (ES, PT, FR...) |
| currency | Moneda del precio (EUR, ARS, MXN, COP) |
| is_active | Solo mostrar países activos |

---

## Criterios de aceptación

- [ ] Se muestran todos los países activos del sistema
- [ ] El admin puede poner precio por hora para cada país
- [ ] La moneda es read-only (viene del país)
- [ ] El toggle activa/desactiva el servicio en ese país
- [ ] Guardar hace upsert correcto en `service_countries`
- [ ] No se puede publicar sin al menos 1 país activo con precio
- [ ] El admin puede cambiar el estado del servicio
- [ ] Archivar = soft delete (estado 'archived')
- [ ] Build pasa sin errores
