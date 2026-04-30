import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({}) as never),
}));
vi.mock('../actions/get-talent-services-status', () => ({
  getTalentServicesStatus: vi.fn(),
}));
vi.mock('@/shared/lib/field-catalog/service-options', () => ({
  loadAvailableServicesForTalent: vi.fn(),
}));

import { loadTalentServicesPanelState } from '../actions/load-talent-services-panel-state';
import { getTalentServicesStatus } from '../actions/get-talent-services-status';
import { loadAvailableServicesForTalent } from '@/shared/lib/field-catalog/service-options';

const mockedStatus = vi.mocked(getTalentServicesStatus);
const mockedAvailable = vi.mocked(loadAvailableServicesForTalent);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadTalentServicesPanelState — denied paths', () => {
  it('passes through not-authenticated', async () => {
    mockedStatus.mockResolvedValue({
      ok: false,
      reason: 'not-authenticated',
    });
    const result = await loadTalentServicesPanelState('es');
    expect(result).toEqual({ ok: false, reason: 'not-authenticated' });
    expect(mockedAvailable).not.toHaveBeenCalled();
  });

  it('passes through no-talent-profile', async () => {
    mockedStatus.mockResolvedValue({
      ok: false,
      reason: 'no-talent-profile',
    });
    const result = await loadTalentServicesPanelState('es');
    expect(result).toEqual({ ok: false, reason: 'no-talent-profile' });
  });

  it('passes through talent-country-not-set', async () => {
    mockedStatus.mockResolvedValue({
      ok: false,
      reason: 'talent-country-not-set',
    });
    const result = await loadTalentServicesPanelState('es');
    expect(result).toEqual({
      ok: false,
      reason: 'talent-country-not-set',
    });
  });
});

describe('loadTalentServicesPanelState — happy', () => {
  it('combines status + availableServices into single payload', async () => {
    mockedStatus.mockResolvedValue({
      ok: true,
      services: [
        { serviceId: 'A', slug: 'a', label: 'A', hasFormData: true },
        { serviceId: 'B', slug: 'b', label: 'B', hasFormData: false },
      ],
      saved: 1,
      total: 2,
      countryId: 'ar',
      cityId: 'baires',
    });
    mockedAvailable.mockResolvedValue([
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
      { id: 'C', name: 'C' },
    ]);

    const result = await loadTalentServicesPanelState('es');
    if (!result.ok) throw new Error('expected ok');

    expect(result.persistedSelection.sort()).toEqual(['A', 'B']);
    expect(result.availableServices).toHaveLength(3);
    expect(result.services).toHaveLength(2);
    expect(result.saved).toBe(1);
    expect(result.total).toBe(2);
    expect(result.countryId).toBe('ar');
    expect(result.cityId).toBe('baires');
    expect(mockedAvailable).toHaveBeenCalledWith(
      expect.anything(),
      'es',
      'ar',
      'baires'
    );
  });

  it('handles cityId null (talent sin city)', async () => {
    mockedStatus.mockResolvedValue({
      ok: true,
      services: [],
      saved: 0,
      total: 0,
      countryId: 'ar',
      cityId: null,
    });
    mockedAvailable.mockResolvedValue([]);
    const result = await loadTalentServicesPanelState('es');
    if (!result.ok) throw new Error('expected ok');
    expect(result.cityId).toBeNull();
    expect(mockedAvailable).toHaveBeenCalledWith(
      expect.anything(),
      'es',
      'ar',
      null
    );
  });

  it('persistedSelection deriva solo de services post-filter (silent skip)', async () => {
    // Servicio C estaba en talent_services pero quedó fuera del filtro
    // (admin desactivó). status.services no lo incluye.
    mockedStatus.mockResolvedValue({
      ok: true,
      services: [
        { serviceId: 'A', slug: 'a', label: 'A', hasFormData: true },
      ],
      saved: 1,
      total: 1,
      countryId: 'ar',
      cityId: 'baires',
    });
    mockedAvailable.mockResolvedValue([
      { id: 'A', name: 'A' },
      { id: 'B', name: 'B' },
    ]);
    const result = await loadTalentServicesPanelState('es');
    if (!result.ok) throw new Error('expected ok');
    expect(result.persistedSelection).toEqual(['A']);
  });
});
