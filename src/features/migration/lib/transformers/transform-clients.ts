import type { ColumnMapping, RowError } from '../../types';

export type TransformedClient = {
  profile: {
    email: string;
    full_name: string;
    phone: string | null;
    preferred_contact: string | null;
    nif: string | null;
    gender: string | null;
    birth_date: string | null;
    created_at: string | null;
    other_language_raw: string | null;
  };
  client_profile: {
    company_name: string | null;
    is_business: boolean;
    legacy_id: number | null;
    terms_accepted: boolean;
    billing_address: string | null;
    billing_state: string | null;
    billing_postal_code: string | null;
  };
  analytics: { key: string; value: string }[];
  city_name: string | null;
  country_name: string | null;
};

const GENDER_MAP: Record<string, string> = {
  male: 'male', female: 'female', masculino: 'male', feminino: 'female', m: 'male', f: 'female',
};

const CONTACT_MAP: Record<string, string> = {
  whatsapp: 'whatsapp',
  telefone: 'phone',
  telefono: 'phone',
  phone: 'phone',
  email: 'email',
  messenger: 'messenger',
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
    if (val === '-' || val === '–' || val === '—') continue;

    if (m.dbColumn === 'survey_question' && m.secondaryId) {
      surveys.push({ questionId: m.secondaryId, value: val });
    } else if (!mapped[m.dbColumn]) {
      // First non-empty wins (multi-map merge)
      mapped[m.dbColumn] = val;
    }
  }

  return { mapped, surveys };
}

export function transformClients(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  startIndex: number
): { data: TransformedClient[]; errors: RowError[] } {
  const data: TransformedClient[] = [];
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

    const contact = mapped.preferred_contact
      ? CONTACT_MAP[mapped.preferred_contact.toLowerCase()] ?? null
      : null;

    const isBusiness =
      mapped.is_business?.toLowerCase() === 'business' ||
      mapped.is_business?.toLowerCase() === 'true' ||
      mapped.is_business === '1';

    const termsVal = mapped.terms_accepted?.toLowerCase();
    const termsAccepted = termsVal === 'aceite' || termsVal === 'aceptado' || termsVal === 'accepted' || termsVal === 'yes' || termsVal === 'true' || termsVal === '1';

    const legacyId = mapped.legacy_id ? Number(mapped.legacy_id) : null;

    const gender = mapped.gender
      ? GENDER_MAP[mapped.gender.toLowerCase()] ?? null
      : null;

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
        other_language_raw: mapped.other_language || null,
      },
      client_profile: {
        company_name: isBusiness ? (mapped.company_name || mapped.full_name) : null,
        is_business: isBusiness,
        legacy_id: Number.isNaN(legacyId) ? null : legacyId,
        terms_accepted: termsAccepted,
        billing_address: mapped.billing_address || null,
        billing_state: mapped.billing_state || null,
        billing_postal_code: mapped.billing_postal_code || null,
      },
      analytics,
      city_name: mapped.city || null,
      country_name: mapped.country || null,
    });
  }

  return { data, errors };
}
