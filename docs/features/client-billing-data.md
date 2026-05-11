# Client billing data — contacto y facturación en service-hire

Datos de contacto y facturación capturados durante el flujo público de contratación (`service-hire`), tanto para guests como para cuentas nuevas. Asegura que cada orden tenga datos fiscales completos para emisión de factura, con la posibilidad de facturar a un tercero distinto del contacto.

## Goal

Que toda orden generada desde `service-hire` quede con:

1. Datos de **contacto** completos (nombre, email, teléfono, tipo + número fiscal) — snapshot en `orders`.
2. Datos de **facturación** = los del contacto **o** distintos (override en `orders.billing_override` jsonb).
3. Para clientes registrados: los datos fiscales también persisten en `client_profiles` para reuso.
4. Bloqueo del flujo guest si el email ya pertenece a una cuenta registrada (forzar login).

## Out of scope

- Linking de órdenes guest pasadas a una cuenta nueva (no requerido — entorno dev sin órdenes históricas valiosas).
- Admin UI para editar regex de validación fiscal (se decide validación hardcoded).
- Emisión real de factura/PDF (esta feature solo persiste los datos).
- Validación de dígito verificador (CUIT/CUIL, NIF español) — por ahora solo formato vía regex; cálculo de verificador queda futuro.
- Dirección de facturación, razón social/empresa en `billing_override` — el override actual cubre solo nombre + teléfono + ID fiscal.

## Decisiones cerradas

| Decisión | Resolución |
|---|---|
| Storage de billing override | `jsonb` column en `orders` (Opción C de discusión previa) |
| `fiscal_id` en `client_profiles` | SÍ se agrega; consistente con `talent_profiles` (Phase B) |
| Misma captura en signup que en guest | SÍ; datos fiscales también guardan en `client_profiles` |
| Guest con email de cuenta existente | **Bloquear** (B1): mostrar "ya tenés cuenta, hacé login", no permitir continuar |
| Linking órdenes guest pasadas | NO |
| Validación de número fiscal | **Hardcoded** (C-i): regex por `code` en `src/shared/fiscal/validators.ts` |

## Shape de datos

### Tablas afectadas

- **`client_profiles`** (alteración)
  - Agregar: `fiscal_id text NULL` (consistente con `talent_profiles.fiscal_id`)

- **`orders`** (alteración)
  - Agregar: `contact_fiscal_id_type_id uuid REFERENCES fiscal_id_types(id) ON DELETE SET NULL NULL`
  - Agregar: `contact_fiscal_id text NULL`
  - Agregar: `billing_override jsonb NULL`
  - `CHECK` constraint: si `billing_override IS NOT NULL`, deben existir claves `name, phone, fiscal_id_type_id, fiscal_id`

- **`fiscal_id_types`** — sin cambios. Validación vive en código.

### Shape de `orders.billing_override`

```json
{
  "name": "Empresa SL",
  "phone": "+34 600 000 000",
  "fiscal_id_type_id": "uuid-of-NIF",
  "fiscal_id": "B12345678"
}
```

`NULL` = facturar con los datos de `contact_*` de la misma orden.

## Flujos

### Flujo Guest

1. Usuario elige "Continuar como invitado" en `AuthGate`.
2. Se ejecuta `signinAsGuest()` (anonymous auth de Supabase).
3. Se muestra `guest-contact-fields` con: nombre completo, email, teléfono, tipo fiscal (select), número fiscal (input).
4. **Validación email duplicado** (al hacer blur del campo email):
   - Llamada a `check-email-status(email)`.
   - Si `hasAccount === true` → bloquear submit + mostrar mensaje "Ya tenés una cuenta con este email. Iniciá sesión." con CTA "Ir a login".
   - Si `false` → permitir continuar.
5. Se muestra `billing-choice-fields`: radio "Facturar a los mismos datos" / "Otros datos".
   - Si "otros datos" → sub-form con nombre, teléfono, tipo fiscal, número fiscal (NO email).
6. Validación con Zod (cliente + server) usando `validateFiscalId` por `code`.
7. Al continuar:
   - `save-guest-contact` action escribe `profiles` (full_name, phone) + `client_profiles` (fiscal_id_type_id, fiscal_id).
   - Submit final de la orden (`submit-service-hire`) escribe `contact_*` + `billing_override` (si aplica) en `orders`.

### Flujo Signup (Crear cuenta nueva)

1. Usuario elige "Crear cuenta nueva" en `AuthGate`.
2. Mismo form: nombre, email, password, teléfono, tipo fiscal, número fiscal + `billing-choice-fields`.
3. `signupClient` action:
   - `supabase.auth.signUp({ email, password, options: { data: { full_name } } })` (si email ya existe → error nativo de Supabase, mostrar i18n).
   - Update `profiles` (full_name, phone, active_role='client').
   - Insert/update `client_profiles` (fiscal_id_type_id, fiscal_id).
4. Submit final de la orden = igual que guest: escribe `contact_*` + `billing_override` (si aplica).

### Flujo Login (Ya tengo cuenta)

Sin cambios. Tras login, el form continúa al submit de orden usando los datos fiscales del `client_profiles` ya existente. Si el cliente no tiene `fiscal_id` cargado (cuenta antigua), pedirlo en este momento — sale del scope actual, pero el spec lo nota como **gap conocido**.

## Validación de número fiscal

### Ubicación

`src/shared/fiscal/validators.ts` exporta un map `FISCAL_VALIDATORS: Record<string, RegExp>` indexado por `fiscal_id_types.code`. Ejemplo inicial:

```ts
export const FISCAL_VALIDATORS: Record<string, RegExp> = {
  NIF: /^[0-9]{8}[A-Z]$/,
  NIE: /^[XYZ][0-9]{7}[A-Z]$/,
  CIF: /^[A-HJ-NP-SUVW][0-9]{7}[0-9A-J]$/,
  DNI: /^[0-9]{8}[A-Z]$/,
  CUIT: /^[0-9]{2}-?[0-9]{8}-?[0-9]{1}$/,
  CUIL: /^[0-9]{2}-?[0-9]{8}-?[0-9]{1}$/,
  RUT: /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-?[0-9kK]$/,
  PASSPORT: /^[A-Z0-9]{6,12}$/,
};
```

(La lista final se cierra durante Sesión 2 contra `fiscal_id_types` activos en DB.)

### Función pública

```ts
validateFiscalId(value: string, code: string): { ok: boolean; reason?: 'empty' | 'format' | 'unknown_type' }
```

- Devuelve `ok: false, reason: 'unknown_type'` si el `code` no tiene validador → server action acepta el valor pero loggea warning (para detectar codes faltantes).
- Se llama en cliente (on blur) y server (en Zod refine).

### Estrategia para nuevos tipos fiscales

Agregar entrada al map + test. Si un admin agrega un tipo a DB sin entrada en el map, el comportamiento es "aceptar con warning" (no romper el form). La lista en código se considera el source-of-truth de validación.

## Migración (Sesión 1)

Tres migraciones aditivas, todas no destructivas:

1. `20260511_client_fiscal_id.sql`
2. `20260511_orders_contact_fiscal_and_billing.sql`
3. ~~`20260511_fiscal_id_types_validation.sql`~~ **eliminada** — validación es hardcoded.

Backfill: no aplica. Las órdenes existentes quedan con NULL en los campos nuevos.

## Acceptance criteria

- [ ] DB: nuevas columnas presentes con tipos correctos; CHECK constraint del jsonb funciona.
- [ ] `database.types.ts` regenerado y commiteado.
- [ ] Tests unitarios de `validateFiscalId` cubren: NIF válido/inválido, NIE, CUIT con/sin guiones, código desconocido, string vacío.
- [ ] Tests de schemas: `billingChoiceSchema` parsea correctamente `same` y `custom`.
- [ ] Tests de actions (con DB local): `save-guest-contact`, `signupClient` extendido, `check-email-status` no leakea info sensible.
- [ ] Flujo guest end-to-end: usuario completa form → orden persistida con `contact_fiscal_*` y `billing_override` (cuando aplica).
- [ ] Flujo signup end-to-end: cuenta creada → `client_profiles.fiscal_id` populado → orden persistida.
- [ ] Bloqueo de email existente funciona en flujo guest (no permite submit).
- [ ] Validación de número fiscal funciona en cliente (on blur) y server (Zod refine).
- [ ] i18n: todas las strings nuevas presentes en ES, EN, PT, FR, CA. Sin literales en TSX.
- [ ] A11y: labels asociados, `aria-describedby` para errores, focus management en error.
- [ ] Responsive (mobile + desktop) — el flujo es público.
- [ ] `pnpm lint` limpio.
- [ ] `NODE_ENV=production pnpm build` limpio.
- [ ] Cada archivo nuevo respeta 300 LOC; ninguna función excede 60 LOC.

## Gaps conocidos (fuera de scope)

- **Cliente registrado sin `fiscal_id` cargado** (cuentas previas): al contratar, no le pedimos completar. Futuro: middleware que detecte y bloquee submit hasta completar perfil.
- **Validación de dígito verificador**: solo validamos formato. CUIT con dígito verificador inválido pasa.
- **Sin admin UI para editar map de validadores**: cambios requieren deploy.
- **Cleanup de anonymous users huérfanos**: cada guest deja un row en `auth.users`. Cleanup nightly queda para otra feature.

## Excepción de LOC para `service-hire`

El feature ya está en 1365 LOC (límite: 1500). Con este plan agregaremos ~1450 LOC distribuidas entre `src/features/service-hire/` y `src/shared/fiscal/`. Estimación post-implementación:

| Métrica | Antes | Después estimado |
|---|---|---|
| `src/features/service-hire/` total | 1365 | ~1750 |
| Archivos > 300 LOC | 0 | 0 (todos divididos) |
| Funciones > 60 LOC | 0 | 0 |
| `src/shared/fiscal/` | 0 | ~420 |

**Justificación de exceder 1500 LOC en feature** (architecture.md §5):

1. ✅ `service-hire` es un wizard cohesivo end-to-end; partir rompería el test de independencia (regla §3).
2. ✅ Cada archivo individual respeta 300 LOC (verificado por plan de Sesión 5 — split de `auth-gate.tsx` si excede).
3. ✅ Cada función respeta 60 LOC.
4. ✅ Lo genuinamente reusable (`fiscal/`, `billing-choice-fields` si surge demanda externa) se mueve a `src/shared/`.
5. ✅ No hay cross-feature imports desde la feature.

**Plan futuro de migración:** si el feature rebasa 2000 LOC, extraer flujo guest a sub-feature `src/features/service-hire-guest/` con shared schemas/types.

## Sesiones de implementación

Las sesiones se ejecutan secuencialmente. Cada una se auto-verifica con tests + typecheck + reporte de líneas tocadas.

1. **DB foundation** — migraciones + tipos generados (no toca TS de la app).
2. **Validación + schemas** — `src/shared/fiscal/` + extensión de schemas Zod de service-hire.
3. **Server actions** — extensión de `signupClient`, nuevas `save-guest-contact`, `check-email-status`, refactor de `submit-service-hire.ts` (división porque está en 244 LOC).
4. **UI Guest flow** — `guest-contact-fields`, `billing-choice-fields`, `fiscal-id-input`, extensión de `auth-gate.tsx`, i18n 5 locales.
5. **UI Signup flow + bloqueo email** — extensión de signup form con los mismos campos, `email-conflict-block` (bloqueante), i18n 5 locales, possible split de `auth-gate.tsx` si excede 300 LOC.

Cada sesión:
- Sigue TDD (tests primero).
- Reporta LOC final por archivo tocado.
- Verifica que `service-hire` total no rebase 1750 (margen de seguridad).
- Termina con `pnpm lint` limpio.
