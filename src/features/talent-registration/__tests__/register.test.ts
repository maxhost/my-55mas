import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- mocks ----------------------------------------------------------
const signUp = vi.fn();
const serverFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { signUp, resend: vi.fn().mockResolvedValue({}) },
    from: serverFrom,
  }),
}));

const rpc = vi.fn();
const adminTalentMaybeSingle = vi.fn();
const deleteUser = vi.fn().mockResolvedValue({});
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    rpc,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: adminTalentMaybeSingle }),
      }),
    }),
    auth: { admin: { deleteUser } },
  }),
}));

const getServicesByLocation = vi.fn();
vi.mock('../actions/get-services-by-location', () => ({
  getServicesByLocation: (...a: unknown[]) => getServicesByLocation(...a),
}));

const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock('next/navigation', () => ({ redirect: (u: string) => redirect(u) }));

import { registerTalent } from '../actions/register';

const UUID = '11111111-1111-1111-1111-111111111111';
const validInput = {
  full_name: 'Ana López',
  email: 'ana@example.com',
  password: 'supersecret1',
  phone: '+34600000000',
  country_id: UUID,
  city_id: UUID,
  address: {
    street: 'Calle 1',
    postal_code: '08001',
    lat: 1,
    lng: 2,
    mapbox_id: 'm1',
    raw_text: 'Calle 1, Barcelona',
    country_code: 'ES',
    city_name: 'Barcelona',
  },
  fiscal_id_type_id: UUID,
  fiscal_id: 'X1234567',
  services: [UUID],
  additional_info: undefined,
  terms_accepted: true as const,
  marketing_consent: false,
};

// Recursive chainable builder: .select()/.eq() return self,
// .maybeSingle() resolves the given result (handles 1..3 chained eq).
function chain(result: { data: unknown }) {
  const self: Record<string, unknown> = {};
  self.select = () => self;
  self.eq = () => self;
  self.maybeSingle = () => Promise.resolve(result);
  return self;
}

function setRefs(result: { data: unknown }) {
  serverFrom.mockImplementation(() => chain(result));
}

// All 4 pre-signUp reference checks resolve "found".
function refsOk() {
  setRefs({ data: { id: 'x', code: 'es' } });
  getServicesByLocation.mockResolvedValue([{ id: UUID, slug: 's', name: 'S' }]);
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteUser.mockResolvedValue({});
});

describe('registerTalent', () => {
  it('Zod invalid → code "invalid" + fieldErrors, no signUp', async () => {
    const res = await registerTalent({ ...validInput, email: 'bad' }, 'es');
    expect(res).toMatchObject({ error: { code: 'invalid' } });
    expect(signUp).not.toHaveBeenCalled();
  });

  it('ref invalid (country missing) → invalid_location, no signUp', async () => {
    setRefs({ data: null });
    const res = await registerTalent(validInput, 'es');
    expect(res).toEqual({ error: { code: 'invalid_location' } });
    expect(signUp).not.toHaveBeenCalled();
  });

  it('duplicate email → duplicate_email, RPC and deleteUser NOT called', async () => {
    refsOk();
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });
    const res = await registerTalent(validInput, 'es');
    expect(res).toEqual({ error: { code: 'duplicate_email' } });
    expect(rpc).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('weak password → weak_password', async () => {
    refsOk();
    signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Password should be at least 8 characters' },
    });
    const res = await registerTalent(validInput, 'es');
    expect(res).toEqual({ error: { code: 'weak_password' } });
  });

  it('happy + session → redirect onboarding', async () => {
    refsOk();
    signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(registerTalent(validInput, 'es')).rejects.toThrow(
      'REDIRECT:/es/portal/onboarding',
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('happy + NO session → redirect login?registered=talent', async () => {
    refsOk();
    signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: null },
      error: null,
    });
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    await expect(registerTalent(validInput, 'es')).rejects.toThrow(
      'REDIRECT:/es/login?registered=talent',
    );
  });

  it('rpc {ok:false} + no talent profile → deleteUser + typed code', async () => {
    refsOk();
    signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });
    rpc.mockResolvedValue({
      data: { ok: false, code: 'invalid_location' },
      error: null,
    });
    adminTalentMaybeSingle.mockResolvedValue({ data: null });
    const res = await registerTalent(validInput, 'es');
    expect(res).toEqual({ error: { code: 'invalid_location' } });
    expect(deleteUser).toHaveBeenCalledWith('u1');
  });

  it('rpc throws but talent profile exists (lost response) → success, no delete', async () => {
    refsOk();
    signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });
    rpc.mockRejectedValue(new Error('network'));
    adminTalentMaybeSingle.mockResolvedValue({ data: { id: 'tp1' } });
    await expect(registerTalent(validInput, 'es')).rejects.toThrow(
      'REDIRECT:/es/portal/onboarding',
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('rpc {ok:true, already_registered} → success/redirect', async () => {
    refsOk();
    signUp.mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 't' } },
      error: null,
    });
    rpc.mockResolvedValue({
      data: { ok: true, code: 'already_registered' },
      error: null,
    });
    await expect(registerTalent(validInput, 'es')).rejects.toThrow(
      'REDIRECT:/es/portal/onboarding',
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });
});
