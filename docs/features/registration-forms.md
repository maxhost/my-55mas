# Feature: Talento Formulario (Registration Forms)

## Propósito

Formularios dinámicos de registro para talentos. El admin crea formularios con nombre (ej: "Talentos Premium"), define pasos/campos con el form builder, configura países/ciudades disponibles, y puede crear variantes por ciudad.

## Diferencia con Servicios Talento

- **Servicios Talento**: formularios atados a un servicio. El talento los completa al registrarse para ofrecer un servicio específico.
- **Talento Formulario**: formularios de registro/onboarding. No atados a un servicio. Agrupados por slug con nombre admin.

## Tablas

- `registration_forms` — Formularios (General + variantes). Agrupados por slug. parent_id para CASCADE de variantes.
- `registration_form_translations` — Labels, placeholders, option_labels por locale.
- `registration_form_countries` — Países configurados para el formulario.
- `registration_form_cities` — Ciudades configuradas.

## Campo tipo 'survey'

Nuevo tipo de campo en el form builder que referencia una pregunta de `survey_questions`. Al renderizar, muestra el tipo de input definido en la pregunta. La respuesta se guarda en `talent_analytics`.

## Admin UI

- Lista: tabla con nombre, variantes, fecha creación, última actualización
- Crear: página `/admin/talent-registration/new` con nombre + slug (kebab-case, auto-generado, editable). Mismo patrón que Servicios.
- Editor: tabs Config (países/ciudades) + Formulario (form builder)
- Config: add/remove países/ciudades (como ServiceConfig pero sin precios)

## Consideraciones de producción

- Slug kebab-case auto-generado del nombre, editable por el admin. Duplicados detectados por UNIQUE constraint con mensaje amigable.
- parent_id FK con CASCADE para limpiar variantes al eliminar General
- countries/cities FK al General form con CASCADE
- Key de survey question inmutable después de creación

## Eliminación

- Solo formularios General (`parent_id IS NULL`) pueden eliminarse desde la lista admin
- CASCADE elimina automáticamente: traducciones, config países/ciudades, y variantes hijas
- No afecta datos externos: perfiles de talentos, pedidos, respuestas de formularios de servicio
- Requiere confirmación explícita con modal destructivo que describe qué se eliminará
- La acción verifica que el DELETE afectó filas; si el form no existe o ya fue eliminado, muestra error
- Variantes no pueden eliminarse individualmente — se eliminan vía CASCADE al eliminar su formulario General padre

## Sistema de embed

Los formularios pueden insertarse en cualquier página de la app (pública o privada) usando su slug.

### Componentes

- `FormRenderer` (`shared/components/form-renderer.tsx`) — Renderizador genérico de formularios. Recibe `FormWithTranslations`, maneja estado de campos, delega submit vía callback. Sin imports de features/. Soporta `renderCustomField` para tipos de campo específicos de un feature.
- `RegistrationFormEmbed` (`features/registration/components/registration-form-embed.tsx`) — Wrapper que agrega `useTransition`, error display y toast. La página carga el form vía `getRegistrationForm(slug)` y lo pasa como prop.

### Uso

```tsx
// En page.tsx (server component):
const form = await getRegistrationForm('mi-formulario');

// En JSX:
<RegistrationFormEmbed form={form} locale={locale} onSubmit={myServerAction} />
```

La página decide qué hacer con los datos (crear usuario, actualizar perfil, guardar en tabla genérica).

### Embed code en admin

El editor muestra el snippet de embed en la tab Configuración con botón copiar. El slug del formulario es el identificador para el embed.

## Acciones y navegación wizard

### Casos de uso

**Signup de talento**:
- Paso 1: Nombre, Dirección, Email (tipo email), Contraseña (tipo password) → [Siguiente]
- Paso 2: Preguntas estadísticas → [Volver] [Registrar cuenta]
- Registrar crea usuario en Supabase Auth + perfil → redirige a `/portal`

**Encuesta**:
- Paso 1: Preguntas generales → [Siguiente]
- Paso 2: Preguntas específicas → [Volver] [Enviar]
- Enviar guarda respuestas → redirige a `/encuesta/gracias`

### Schema extendido

```typescript
// Nuevos field types
FIELD_TYPES = [...existing, 'email', 'password'] as const;

// Acciones por paso
type StepAction = {
  key: string;              // ej: 'btn_next', 'btn_register'
  type: 'next' | 'back' | 'submit' | 'register';
  redirect_url?: string;    // ruta interna sin locale (ej: '/gracias')
};

// FormStep extendido
type FormStep = {
  key: string;
  fields: FormField[];
  actions?: StepAction[];   // botones al final del paso
};
```

- `actions` es opcional — forms sin acciones: último paso muestra submit genérico, otros muestran next
- Labels de acciones vía traducciones: `translations.labels[action.key]`
- Redirect: ruta sin locale, el renderer auto-prepende `/{locale}/`

### Wizard mode (FormRenderer)

- Solo muestra un paso a la vez (`currentStepIndex` state)
- Indicador de progreso: "Paso X de N"
- Validación de campos requeridos antes de next/submit
- Datos persisten al navegar back/next (useState)
- `onSubmit(formData, meta?)` — meta incluye `action` y `redirect_url`

### Acciones en el Builder (admin)

- StepActionEditor por cada paso: agregar/eliminar botones, tipo, label, redirect
- Validaciones: no back en paso 1, máximo 1 submit/register por paso
- Checkbox "¿Redirigir?" en acciones submit/register → input de ruta interna

### Register Action

- Server action: `supabase.auth.signUp` + insert `profiles` + insert `talent_profiles`
- Campos email/password detectados por `field.type` (no por key)
- Password nunca se incluye en form_data guardado — se extrae y descarta
- Supabase maneja email de verificación automáticamente
- Si signUp falla, error en paso actual sin redirigir

### Sessions de implementación

1. **Schema + Types + Zod + Tests** — StepAction, email/password types, Zod validation
2. **FormRenderer Wizard Mode** — Step navigation, action buttons, validación, email/password render
3. **Form Builder - Tipos + Acciones + i18n** — FieldTypePicker, StepActionEditor, builder integration
4. **Register Action + Redirect** — Signup server action, RegistrationFormEmbed integration
