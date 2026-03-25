# Patrones de implementación

Referencia rápida para implementar features siguiendo la arquitectura del proyecto.

## Estructura de un feature

```
src/features/<nombre>/
├── types.ts           # Tipos de dominio (NO tipos de DB)
├── validations.ts     # Schemas Zod
├── actions/           # Server Actions
│   └── *.ts
├── components/        # UI específica del feature
│   └── *.tsx
├── hooks/             # Client hooks (si necesarios)
│   └── *.ts
├── index.ts           # Barrel export (API pública)
└── __tests__/
    └── *.test.ts
```

Ver `docs/feature-template.md` para reglas completas.

## Server Action

```typescript
// src/features/orders/actions/create-order.ts
'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createOrderSchema } from '../validations';

export async function createOrder(input: z.infer<typeof createOrderSchema>) {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.flatten() };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('orders')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
```

**Reglas:**
- Siempre validar con Zod antes de tocar la DB
- Retornar `{ data, error }` — nunca throw
- Crear Supabase client dentro de la función (no reutilizar)

## Server Component (página)

```typescript
// src/app/[locale]/(admin)/admin/orders/page.tsx
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

type Props = { params: { locale: string } };

export default async function OrdersPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('Orders');
  const supabase = createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {/* Renderizar orders */}
    </div>
  );
}
```

**Reglas:**
- `unstable_setRequestLocale` primero (antes de cualquier otra llamada)
- `getTranslations` para texto traducido
- Componente async para fetch de datos

## Client Component

```tsx
// src/features/orders/components/order-filters.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type Props = { onFilter: (status: string) => void };

export function OrderFilters({ onFilter }: Props) {
  const t = useTranslations('Orders');

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => onFilter('nuevo')}>
        {t('statusNew')}
      </Button>
    </div>
  );
}
```

**Reglas:**
- `'use client'` al inicio
- `useTranslations` (no `getTranslations`)
- Props para comunicación con Server Components padres

## Validación con Zod

```typescript
// src/features/orders/validations.ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  service_id: z.string().uuid(),
  contact_email: z.string().email(),
  contact_name: z.string().min(1).max(200),
  contact_phone: z.string().min(1),
  form_data: z.record(z.unknown()),
});
```

El mismo schema se usa en Server Actions (validación server) y en forms con react-hook-form (validación client).

## Tipos

```typescript
// src/features/orders/types.ts
import type { Tables } from '@/lib/supabase/types';

// Tipos de DB vienen de Supabase
type Order = Tables<'orders'>;

// Tipos de dominio son propios del feature
export type OrderWithStatus = Order & {
  statusLabel: string;
  isEditable: boolean;
};
```

**Regla:** Nunca redefinir tipos que ya existen en `database.types.ts`. Usar `Tables<>`.

## Imports permitidos

Enforceado por `eslint-plugin-boundaries` (`pnpm lint` falla si se viola):

- `features/orders/` → `shared/`, `lib/`, `components/ui/`
- `features/orders/` → ~~`features/talents/`~~ PROHIBIDO
- `shared/` → `lib/`, `components/ui/`
- `shared/` → ~~`features/`~~ PROHIBIDO

## Testing

```typescript
// src/features/orders/validations.test.ts
import { describe, it, expect } from 'vitest';
import { createOrderSchema } from '../validations';

describe('createOrderSchema', () => {
  it('validates a correct order', () => {
    const result = createOrderSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      contact_email: 'test@example.com',
      contact_name: 'Test User',
      contact_phone: '+34600000000',
      form_data: { field1: 'value1' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = createOrderSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      contact_email: 'not-an-email',
      contact_name: 'Test',
      contact_phone: '+34600000000',
      form_data: {},
    });
    expect(result.success).toBe(false);
  });
});
```

**Regla:** Test validations y lógica pura primero. Mock Supabase client para tests de actions.
