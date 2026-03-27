# Blueprint — 55mas v1

## Roles

| Rol | Descripción |
|-----|-------------|
| **Visitante** | Navega el catálogo, elige idioma/país |
| **Invitado** | Contrata servicios sin registrarse; proporciona email, nombre, teléfono y dirección; recibe updates por email; puede registrarse después para reclamar sus pedidos |
| **Cliente** | Se registra, contrata servicios, sigue sus pedidos |
| **Talento** | Persona 55+, completa perfil, sube documentación, recibe notificaciones de trabajos compatibles, acepta o rechaza |
| **Admin** | Acceso global; gestiona servicios, talentos, pedidos y formularios; puede intervenir, reasignar y gestionar miembros del equipo |
| **Manager** | Miembro del equipo interno con acceso restringido por país y ciudad; permisos granulares por recurso (lectura/escritura configurable) |
| **Viewer** | Miembro del equipo interno con acceso de solo lectura y exportación; restringido a un país/ciudad concretos |

## Combinaciones de roles permitidas

| Combinación | Permitida |
|-------------|-----------|
| Cliente + Talento | ✓ — una persona puede contratar y ofrecer servicios |
| Admin + Manager | ✗ — los roles de staff son mutuamente excluyentes entre sí |
| Admin + Viewer | ✗ — los roles de staff son mutuamente excluyentes entre sí |
| Manager + Viewer | ✗ — los roles de staff son mutuamente excluyentes entre sí |
| Staff (admin/manager/viewer) + Cliente o Talento | ✗ — cuentas separadas; staff no puede ser también cliente o talento |

Los nombres de los roles de staff (admin, manager, viewer) son editables desde el panel de administración. La clave técnica (`key`) permanece inmutable.

> **Nota sobre Invitado:** No es un rol en `user_roles`. Técnicamente es un `client` con sesión anónima (`auth.users.is_anonymous = true`). Al registrarse se convierte en Cliente. El middleware combina `active_role` + `is_anonymous` para decidir qué rutas mostrar:
> - Sin sesión → `(public)/` (catálogo)
> - Anónimo → `(public)/` + confirmación de pedido (sin dashboard)
> - Cliente registrado → `(public)/` + `(client)/` dashboard
> - Talento → `(public)/` + `(talent)/` portal
> - Staff → `(admin)/` panel

## Estados de un pedido

`nuevo` → `buscando_talento` → `asignado` → `en_curso` → `completado` · En cualquier punto → `cancelado`

### Flujo de asignación

1. Cliente o Invitado crea pedido → estado `nuevo`
2. Sistema filtra talentos compatibles (servicio, ubicación/distancia, perfil) → estado `buscando_talento`
3. Se notifica a los talentos candidatos
4. Talento acepta → estado `asignado`
5. Si ningún talento acepta en tiempo razonable, Admin asigna manualmente
6. Admin puede reasignar el talento en cualquier momento

## Modelo de intermediación

- El catálogo de servicios pertenece a 55mas, no a los talentos
- 55mas factura al cliente (B2C); el talento factura a 55mas para cobrar
- Los formularios dinámicos de contratación los diseña el Admin
- Tras cada servicio completado, el cliente valora al talento; las valoraciones se acumulan en su perfil

## Orden de implementación v1

| # | Feature | Depende de | Criterio de terminado |
|---|---------|------------|-----------------------|
| 1 | Soporte multi-idioma | — | Diccionarios ES/EN/PT/FR/CA cargados; switcher funcional; todas las rutas bajo `[locale]` |
| 2 | Soporte multi-país | #1 | Selector de país; servicios y precios filtrados por país; config por país en DB |
| 3 | Registro y acceso de clientes | #1 | Signup, login, recuperar contraseña con Supabase Auth; RLS activo |
| 4 | Registro y acceso de talentos | #1 | Igual que #3 con rol `talent`; validación edad 55+ |
| 5 | Acceso del equipo interno | #1 | Login admin; middleware protege rutas `(admin)`; rol `admin` en DB |
| 5.5 | Gestión de miembros | #5 | CRUD de miembros staff desde admin: invitar por email, asignar rol (`manager`/`viewer`), configurar país/ciudad; renombrar roles; trigger DB bloquea auto-asignación de roles staff |
| 6 | Administración de servicios | #2, #5 | CRUD de servicios con país, precio orientativo, estado draft/publicado |
| 7 | Constructor de formularios | #6 | Editor de pasos y campos con flechas ↑↓ para reordenar (text, number, select, file); schema JSON guardado por servicio; variantes por ciudad con cascade |
| 8 | Catálogo de servicios | #2, #6 | Lista pública filtrable por país; paginación; SSR |
| 9 | Página de cada servicio | #8 | Detalle con descripción, precio, incluye, botón "Contratar"; SEO meta tags |
| 10 | Formulario de contratación | #7, #9 | Renderiza formulario dinámico del servicio; captura contacto (email, nombre, teléfono, dirección); soporta guest (anon auth) y cliente registrado; fecha, horario, frecuencia; crea pedido en DB |
| 11 | Perfil del talento | #4 | Formulario de datos personales, experiencia, foto, selección de servicios |
| 12 | Documentación del talento | #6, #11 | Subida de archivos a Supabase Storage; lista de docs requeridos por servicio |
| 13 | Administración de talentos | #5, #11, #12 | Lista de talentos; aprobar/rechazar registro; revisar docs; pedir info adicional |
| 14 | Zona personal del cliente | #3, #10 | Dashboard con lista de pedidos, estado actual, datos del talento asignado |
| 15 | Administración de pedidos | #5, #10, #13 | Lista de pedidos; asignar talento; cambiar estado; filtros por país/estado |
| 16 | Avisos por email | #10, #15 | Emails transaccionales: nuevo pedido, talento asignado, cambio de estado; templates por idioma |

## Idiomas soportados

`es` (default) · `en` · `pt` · `fr` · `ca`

## Países iniciales

España · Portugal · Francia · Argentina · México · Colombia

## Features futuros (no incluidos en v1)

- Gestión de cobros y pagos
- Valoraciones y opiniones de clientes
- Calendario de servicios recurrentes
- Panel de estadísticas del negocio
- Calendario de disponibilidad del talento
