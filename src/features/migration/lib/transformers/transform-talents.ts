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

const GENDER_MAP: Record<string, string> = {
  male: 'male',
  female: 'female',
  masculino: 'male',
  feminino: 'female',
  m: 'male',
  f: 'female',
};

function applyMapping(
  row: Record<string, string>,
  mappings: ColumnMapping[]
): { mapped: Record<string, string>; surveys: { questionId: string; value: string }[] } {
  const mapped: Record<string, string> = {};
  const surveys: { questionId: string; value: string }[] = [];

  for (const m of mappings) {
    if (!m.dbColumn || !row[m.csvColumn]?.trim()) continue;
    const val = row[m.csvColumn].trim();

    if (m.dbColumn === 'survey_question' && m.surveyQuestionId) {
      surveys.push({ questionId: m.surveyQuestionId, value: val });
    } else if (!mapped[m.dbColumn]) {
      mapped[m.dbColumn] = val;
    }
  }

  return { mapped, surveys };
}

export function transformTalents(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  startIndex: number
): { data: TransformedTalent[]; errors: RowError[] } {
  const data: TransformedTalent[] = [];
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { mapped, surveys } = applyMapping(rows[i], mappings);
    const rowIndex = startIndex + i;

    if (!mapped.email) {
      errors.push({ rowIndex, message: 'Email is required' });
      continue;
    }

    if (!mapped.full_name) {
      errors.push({ rowIndex, message: 'Name is required' });
      continue;
    }

    if (!mapped.birth_date) {
      errors.push({ rowIndex, message: 'Birth date is required' });
      continue;
    }

    const contact = mapped.preferred_contact
      ? CONTACT_MAP[mapped.preferred_contact.toLowerCase()] ?? null
      : null;

    const gender = mapped.gender
      ? GENDER_MAP[mapped.gender.toLowerCase()] ?? null
      : null;

    const status = mapped.status
      ? STATUS_MAP[mapped.status.toLowerCase()] ?? 'pending'
      : 'pending';

    const legacyId = mapped.legacy_id ? parseInt(mapped.legacy_id, 10) : null;

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
        birth_date: mapped.birth_date || null,
        created_at: mapped.created_at || null,
      },
      talent_profile: {
        status,
        legacy_id: Number.isNaN(legacyId) ? null : legacyId,
        terms_accepted: termsAccepted,
        has_car: hasCar,
        preferred_payment: mapped.preferred_payment || null,
        professional_status: mapped.professional_status || null,
        address: mapped.address || null,
        state: mapped.state || null,
        postal_code: mapped.postal_code || null,
      },
      analytics,
      city_name: mapped.city || null,
      country_name: mapped.country || null,
    });
  }

  return { data, errors };
}
