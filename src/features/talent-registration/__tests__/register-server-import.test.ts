/**
 * Regression: TalentRegistrationSchema must remain importable from a
 * server-only context. If any field schema is colocated in a `.tsx` file
 * marked `'use client'`, Next.js wraps the chain as a client reference and
 * `safeParse()` fails at runtime with:
 *   "Attempted to call _parse() from the server but _parse is on the client"
 *
 * This test exercises the same import path the Server Action uses
 * (`actions/register.ts` → `../schemas` → `./fields/schemas`) and runs
 * `safeParse` to assert the schema is still a real Zod instance — not a
 * client stub.
 *
 * If this test fails, check `fields/schemas.ts` and `fields/*.tsx`: no
 * `.tsx` should declare `export const ...Schema = z....` while marked
 * `'use client'`. See `docs/features/talent-registration.md` →
 * "Estructura de fields: schema vs componente".
 */

import { describe, it, expect } from 'vitest';
import { TalentRegistrationSchema } from '../schemas';

describe('TalentRegistrationSchema (server import path)', () => {
  it('exposes a real Zod schema with a working _parse', () => {
    expect(typeof TalentRegistrationSchema.safeParse).toBe('function');
    // _parse is what Next.js replaces with a client stub on the wrong side
    // of the RSC boundary. Touching it confirms the import path is server-safe.
    expect(typeof (TalentRegistrationSchema as unknown as { _parse: unknown })._parse).toBe(
      'function',
    );
  });

  it('rejects empty input via safeParse without throwing client-reference errors', () => {
    const result = TalentRegistrationSchema.safeParse({});
    expect(result.success).toBe(false);
    // If the schema were a client reference, the line above would throw
    // before reaching here. Reaching this line proves the regression is closed.
  });

  it('accepts a fully valid payload', () => {
    const result = TalentRegistrationSchema.safeParse({
      full_name: 'Ana García',
      email: 'ana@example.com',
      password: 'hunter22ok',
      phone: '+34612345678',
      country_id: '550e8400-e29b-41d4-a716-446655440000',
      city_id: '550e8400-e29b-41d4-a716-446655440001',
      address: {
        street: 'Calle Mayor 1',
        postal_code: '28001',
        lat: 40.4168,
        lng: -3.7038,
        mapbox_id: 'mbx-123',
        raw_text: 'Calle Mayor 1, Madrid',
        country_code: 'es',
        city_name: 'Madrid',
      },
      fiscal_id_type_id: '550e8400-e29b-41d4-a716-446655440002',
      fiscal_id: 'X1234567Z',
      services: ['550e8400-e29b-41d4-a716-446655440003'],
      additional_info: undefined,
      terms_accepted: true,
      marketing_consent: false,
    });
    expect(result.success).toBe(true);
  });
});
