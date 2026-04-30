import { describe, it, expect } from 'vitest';
// Side-effect import: pobla el registry con built-ins.
import '../../field-renderers';
import { inputRenderers, registerInputRenderer } from '../registry';
import { INPUT_TYPES } from '@/shared/lib/field-catalog/types';

describe('field-renderers registry', () => {
  it('contiene un renderer registrado para cada INPUT_TYPE built-in', () => {
    // Built-ins son los 13 input_types que vienen con shared/. Los
    // feature-specific (ej: talent_services_panel) NO están registrados
    // en este test (se registran en sus features via side-effect import
    // desde app/layout.tsx).
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
