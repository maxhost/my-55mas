import type { ColumnMapping, RowError } from '../../types';

export type TransformedTalent = {
  profile: {
    email: string;
    full_name: string;
    phone: string | null;
    preferred_contact: string | null;
    nif: string | null;
    gender: string | null;
    birth_date: string | null;
    created_at: string | null;
  };
  talent_profile: {
    status: string;
    legacy_id: number | null;
    terms_accepted: boolean;
    has_car: boolean;
    preferred_payment: string | null;
    professional_status: string | null;
    address: string | null;
    state: string | null;
    postal_code: string | null;
  };
  analytics: { key: string; value: string }[];
  services: { serviceId: string; tier: string }[];
  subtypeEntries: { groupId: string; names: string[] }[];
  city_name: string | null;
  country_name: string | null;
};

const CONTACT_MAP: Record<string, string> = {
  whatsapp: 'whatsapp',
  telefone: 'phone',
  telefono: 'phone',
  phone: 'phone',
  email: 'email',
  messenger: 'messenger',
};

const STATUS_MAP: Record<string, string> = {
  aceite: 'approved',
  approved: 'approved',
  pending: 'pending',
  pendente: 'pending',
  rejected: 'rejected',
  rejeitado: 'rejected',
  suspended: 'suspended',
  suspenso: 'suspended',
};

const PROFESSIONAL_STATUS_MAP: Record<string, string> = {
  unemployed: 'unemployed',
  retired: 'retired',
  employed: 'employed',
  self_employed: 'self_employed',
  other: 'other',
  desempregado: 'unemployed',
  reformado: 'retired',
  empregado: 'employed',
  autonomo: 'self_employed',
  outro: 'other',
  desempleado: 'unemployed',
  jubilado: 'retired',
  empleado: 'employed',
};

const PAYMENT_MAP: Record<string, string> = {
  'acumular valor': 'acumulate',
  'acumulate': 'acumulate',
  'ato isolado': 'per_service',
  'per_service': 'per_service',
  'por servicio': 'per_service',
  'other': 'other',
  'outro': 'other',
  'otro': 'other',
};

const GENDER_MAP: Record<string, string> = {
  male: 'male',
  female: 'female',
  masculino: 'male',
  feminino: 'female',
  m: 'male',
  f: 'female',
};

/**
 * Parse date strings in various formats to ISO date (YYYY-MM-DD).
 * Supports: "Jun 19, 1967 12:00 am", "1967-06-19", "19/06/1967", etc.
 */
function parseDate(val: string): string | null {
  if (!val) return null;
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  // Try native Date parse (handles "Jun 19, 1967 12:00 am")
  const d = new Date(val);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1900) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

type MappingResult = {
  mapped: Record<string, string>;
  surveys: { questionId: string; value: string }[];
  services: { serviceId: string; tier: string }[];
  subtypeEntries: { groupId: string; names: string[] }[];
};

function applyMapping(row: Record<string, string>, mappings: ColumnMapping[]): MappingResult {
  const mapped: Record<string, string> = {};
  const surveys: { questionId: string; value: string }[] = [];
  const services: { serviceId: string; tier: string }[] = [];
  const subtypeEntries: { groupId: string; names: string[] }[] = [];
  const seenServiceIds = new Set<string>();

  for (const m of mappings) {
    if (!m.dbColumn || !row[m.csvColumn]?.trim()) continue;
    const val = row[m.csvColumn].trim();
    if (val === '-' || val === '–' || val === '—') continue;

    if (m.dbColumn === 'survey_question' && m.secondaryId) {
      surveys.push({ questionId: m.secondaryId, value: val });
    } else if (m.dbColumn === 'service_column' && m.secondaryId) {
      if (!seenServiceIds.has(m.secondaryId)) {
        seenServiceIds.add(m.secondaryId);
        services.push({ serviceId: m.secondaryId, tier: val.toLowerCase() });
      }
    } else if (m.dbColumn === 'service_subtype_column' && m.secondaryId) {
      const names = val.split('\n').map((n) => n.trim()).filter(Boolean);
      if (names.length > 0) {
        subtypeEntries.push({ groupId: m.secondaryId, names });
      }
    } else if (!mapped[m.dbColumn]) {
      mapped[m.dbColumn] = val;
    }
  }

  return { mapped, surveys, services, subtypeEntries };
}

export function transformTalents(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  startIndex: number
): { data: TransformedTalent[]; errors: RowError[] } {
  const data: TransformedTalent[] = [];
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { mapped, surveys, services, subtypeEntries } = applyMapping(rows[i], mappings);
    const rowIndex = startIndex + i;

    if (!mapped.email) {
      errors.push({ rowIndex, message: 'Email is required' });
      continue;
    }

    if (!mapped.full_name) {
      errors.push({ rowIndex, message: 'Name is required' });
      continue;
    }

    const parsedBirthDate = mapped.birth_date ? parseDate(mapped.birth_date) : null;

    const contact = mapped.preferred_contact
      ? CONTACT_MAP[mapped.preferred_contact.toLowerCase()] ?? null
      : null;

    const gender = mapped.gender
      ? GENDER_MAP[mapped.gender.toLowerCase()] ?? null
      : null;

    const status = mapped.status
      ? STATUS_MAP[mapped.status.toLowerCase()] ?? 'pending'
      : 'pending';

    const legacyId = mapped.legacy_id ? Number(mapped.legacy_id) : null;

    const termsVal = mapped.terms_accepted?.toLowerCase();
    const termsAccepted = termsVal === 'aceite' || termsVal === 'aceptado' || termsVal === 'accepted' || termsVal === 'yes' || termsVal === 'true' || termsVal === '1';

    const hasCar = mapped.has_car?.toLowerCase() === 'sim' || mapped.has_car?.toLowerCase() === 'yes';

    const analytics = surveys.map((s) => ({ key: s.questionId, value: s.value }));

    data.push({
      profile: {
        email: mapped.email,
        full_name: mapped.full_name,
        phone: mapped.phone || null,
        preferred_contact: contact,
        nif: mapped.nif || null,
        gender,
        birth_date: parsedBirthDate,
        created_at: mapped.created_at || null,
      },
      talent_profile: {
        status,
        legacy_id: Number.isNaN(legacyId) ? null : legacyId,
        terms_accepted: termsAccepted,
        has_car: hasCar,
        preferred_payment: mapped.preferred_payment
          ? PAYMENT_MAP[mapped.preferred_payment.toLowerCase()] ?? null
          : null,
        professional_status: mapped.professional_status
          ? PROFESSIONAL_STATUS_MAP[mapped.professional_status.toLowerCase()] ?? null
          : null,
        address: mapped.address || null,
        state: mapped.state || null,
        postal_code: mapped.postal_code || null,
      },
      analytics,
      services,
      subtypeEntries,
      city_name: mapped.city || null,
      country_name: mapped.country || null,
    });
  }

  return { data, errors };
}
