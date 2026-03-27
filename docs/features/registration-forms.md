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
