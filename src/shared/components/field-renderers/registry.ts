import type { ReactNode } from 'react';
import type { InputType } from '@/shared/lib/field-catalog/types';
import type { RenderProps } from './shared';

// Registry de renderers por input_type. Los built-ins se registran en el
// module init de `field-renderers.tsx` (importado en cualquier consumer
// que use renderResolvedField). Los feature-specific renderers se
// registran via side-effect import desde `app/[locale]/layout.tsx`
// (ver, por ejemplo, `features/talent-services/init/register-renderers.ts`).
//
// Por qué registry en vez de switch: el dispatcher vive en `shared/`. Si
// fuera un switch que importe del feature, violaría architecture.md §3.
// El registry invierte la dependencia: features escriben al map; shared
// solo lo lee.
//
// Trade-off: TS exhaustivity estática del switch se pierde. Mitigado con
// test runtime que itera INPUT_TYPES y valida inputRenderers.has(it).

export type InputRenderer = (props: RenderProps) => ReactNode;

export const inputRenderers = new Map<InputType, InputRenderer>();

// Guard contra doble registro. Útil para detectar bugs durante dev — un
// feature no debería registrar dos veces, ni sobrescribir built-ins.
export function registerInputRenderer(
  type: InputType,
  fn: InputRenderer
): void {
  if (inputRenderers.has(type)) {
    throw new Error(
      `Renderer already registered for input_type: ${type}. Cannot re-register.`
    );
  }
  inputRenderers.set(type, fn);
}

// Helper para tests / dev utilities: limpia el registry para reset.
// NO usar en producción.
export function _clearRegistryForTesting(): void {
  inputRenderers.clear();
}
