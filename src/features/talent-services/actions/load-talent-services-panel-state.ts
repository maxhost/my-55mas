'use server';

import { createClient } from '@/lib/supabase/server';
import { loadAvailableServicesForTalent } from '@/shared/lib/field-catalog/service-options';
import { getTalentServicesStatus } from './get-talent-services-status';
import type { TalentServiceStatusItem } from './get-talent-services-status';

export type AvailableService = {
  id: string;
  name: string;
};

export type TalentServicesPanelState =
  | {
      ok: true;
      persistedSelection: string[];
      availableServices: AvailableService[];
      services: TalentServiceStatusItem[];
      saved: number;
      total: number;
      countryId: string;
      cityId: string | null;
    }
  | {
      ok: false;
      reason:
        | 'not-authenticated'
        | 'no-talent-profile'
        | 'talent-country-not-set';
    };

// Carga todo el state que el TalentServicesPanel renderer necesita en
// un solo round-trip.
//
// Identidad y context country+city resueltos server-side. El client
// nunca pasa talentId/countryId/cityId.
//
// Composición:
// - getTalentServicesStatus: rows del talent en talent_services + status
//   filtrados por country+city+published. Retorna también persistedSelection,
//   total, saved.
// - loadAvailableServicesForTalent: lista de servicios disponibles para
//   el talent (filtrada por country+city+published). El renderer lo usa
//   como override de field.options del multiselect.
//
// Notas:
// - persistedSelection se deriva de status.services (los serviceIds que
//   pasaron el filtro). Esto significa que si un servicio quedó fuera de
//   filtro (admin desactivó), no aparece en persistedSelection — el row
//   en DB queda intacto pero el renderer lo trata como "no elegido". El
//   user puede re-elegirlo si vuelve a estar disponible (re-aparece en
//   availableServices).
export async function loadTalentServicesPanelState(
  locale: string
): Promise<TalentServicesPanelState> {
  const status = await getTalentServicesStatus(locale);
  if (!status.ok) {
    return { ok: false, reason: status.reason };
  }

  const supabase = createClient();
  const availableServices = await loadAvailableServicesForTalent(
    supabase,
    locale,
    status.countryId,
    status.cityId
  );

  return {
    ok: true,
    persistedSelection: status.services.map((s) => s.serviceId),
    availableServices,
    services: status.services,
    saved: status.saved,
    total: status.total,
    countryId: status.countryId,
    cityId: status.cityId,
  };
}
