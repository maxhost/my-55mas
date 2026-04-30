import { describe, it, expect } from 'vitest';
// Side-effect imports: simulan el bootstrap completo del root layout —
// (a) shared registra built-ins, (b) talent-services registra su panel.
import '@/shared/components/field-renderers';
import '../init/register-renderers';
import { inputRenderers } from '@/shared/components/field-renderers/registry';
import { INPUT_TYPES } from '@/shared/lib/field-catalog/types';

describe('talent-services registry integration', () => {
  it('tras el side-effect import, el registry tiene un renderer para CADA INPUT_TYPE', () => {
    // Esta es la garantía runtime que reemplaza al `_exhaustive: never`
    // del switch original. Si en el futuro se agrega un input_type al
    // enum sin agregar su renderer al registro correspondiente, este
    // test detecta el gap.
    for (const type of INPUT_TYPES) {
      expect(
        inputRenderers.has(type),
        `Falta renderer registrado para input_type: ${type}`
      ).toBe(true);
    }
  });

  it('talent_services_panel está registrado como función', () => {
    const renderer = inputRenderers.get('talent_services_panel');
    expect(renderer).toBeDefined();
    expect(typeof renderer).toBe('function');
  });
});
