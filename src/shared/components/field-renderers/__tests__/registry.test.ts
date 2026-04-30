import { describe, it, expect } from 'vitest';
// Side-effect import: pobla el registry con built-ins de shared.
// El test de integración con feature-specific renderers vive en el
// feature mismo (no acá, porque shared/ no puede importar features/
// — regla architecture.md §3 enforced por boundaries plugin).
import '../../field-renderers';
import { inputRenderers, registerInputRenderer } from '../registry';
import { INPUT_TYPES } from '@/shared/lib/field-catalog/types';

describe('field-renderers registry — built-ins', () => {
  it('contiene un renderer registrado para cada INPUT_TYPE built-in', () => {
    // Built-ins son 13 input_types. Los feature-specific (ej:
    // talent_services_panel) se validan en tests de su propio feature.
    const builtInTypes = INPUT_TYPES.filter(
      (t) => t !== 'talent_services_panel'
    );
    for (const type of builtInTypes) {
      expect(
        inputRenderers.has(type),
        `Falta renderer registrado para input_type: ${type}`
      ).toBe(true);
    }
  });

  it('cada renderer es una función', () => {
    for (const [type, fn] of Array.from(inputRenderers.entries())) {
      expect(typeof fn, `renderer ${type} debe ser función`).toBe('function');
    }
  });

  it('no permite registrar dos veces el mismo input_type', () => {
    expect(() =>
      registerInputRenderer('text', () => null)
    ).toThrow(/already registered/i);
  });
});
