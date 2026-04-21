'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { resolveSpokenLanguages } from '../lib/resolve-spoken-languages';
import type { MigrationTarget, BatchResult, RowError, ImportLookups } from '../types';
import type { TransformedClient } from '../lib/transformers/transform-clients';
import type { TransformedTalent } from '../lib/transformers/transform-talents';
import type { TransformedOrder } from '../lib/transformers/transform-orders';
import { insertTalentServices } from './insert-talent-services';
import { insertOrders } from './insert-orders';

export async function executeBatch(
  target: MigrationTarget,
  rows: unknown[],
  startIndex: number,
  lookups?: ImportLookups,
  csvLocale?: string
): Promise<BatchResult> {
  switch (target) {
    case 'clients':
      return insertClients(rows as TransformedClient[], startIndex, lookups);
    case 'talents':
      return insertTalents(rows as TransformedTalent[], startIndex, lookups, csvLocale);
    case 'orders':
      return insertOrders(rows as TransformedOrder[], startIndex);
    default:
      return { inserted: 0, errors: [{ rowIndex: 0, message: `Unknown target: ${target}` }] };
  }
}

async function insertClients(
  rows: TransformedClient[],
  startIndex: number,
  lookups?: ImportLookups
): Promise<BatchResult> {
  const admin = createAdminClient();
  let inserted = 0;
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = startIndex + i;

    try {
      const { data: authData, error: authError } =
        await admin.auth.admin.createUser({
          email: row.profile.email,
          email_confirm: true,
          user_metadata: { role: 'client', full_name: row.profile.full_name },
        });

      if (authError) {
        errors.push({ rowIndex, message: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Resolve city/country names → UUIDs, fallback to default country from CSV locale
      const cityId = row.city_name && lookups?.citiesByName
        ? lookups.citiesByName.get(row.city_name.toLowerCase()) ?? null
        : null;
      const countryId = row.country_name && lookups?.countriesByName
        ? lookups.countriesByName.get(row.country_name.toLowerCase()) ?? null
        : lookups?.defaultCountryId ?? null;

      const otherLanguage = resolveSpokenLanguages(
        row.profile.other_language_raw,
        lookups,
        rowIndex,
        errors
      );

      // Update profile (shared fields)
      await admin.from('profiles').update({
        phone: row.profile.phone,
        nif: row.profile.nif,
        preferred_contact: row.profile.preferred_contact,
        gender: row.profile.gender,
        birth_date: row.profile.birth_date,
        preferred_city: cityId,
        preferred_country: countryId,
        other_language: otherLanguage,
      }).eq('id', userId);

      // Insert client_profile (role-specific fields)
      const { error: cpError } = await admin
        .from('client_profiles')
        .insert({
          user_id: userId,
          company_name: row.client_profile.company_name,
          is_business: row.client_profile.is_business,
          legacy_id: row.client_profile.legacy_id,
          terms_accepted: row.client_profile.terms_accepted,
          billing_address: row.client_profile.billing_address,
          billing_state: row.client_profile.billing_state,
          billing_postal_code: row.client_profile.billing_postal_code,
        });

      if (cpError) {
        await admin.auth.admin.deleteUser(userId);
        errors.push({ rowIndex, message: cpError.message });
        continue;
      }

      // Insert survey responses
      if (row.analytics.length > 0) {
        const surveyRows = row.analytics.map((a) => ({
          user_id: userId,
          key: a.key,
          value: a.value,
        }));
        await admin.from('survey_responses').insert(surveyRows);
      }

      inserted++;
    } catch (err) {
      errors.push({ rowIndex, message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return { inserted, errors };
}

async function insertTalents(
  rows: TransformedTalent[],
  startIndex: number,
  lookups?: ImportLookups,
  csvLocale?: string
): Promise<BatchResult> {
  const admin = createAdminClient();
  let inserted = 0;
  const errors: RowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = startIndex + i;

    try {
      const { data: authData, error: authError } =
        await admin.auth.admin.createUser({
          email: row.profile.email,
          email_confirm: true,
          user_metadata: { role: 'talent', full_name: row.profile.full_name },
        });

      if (authError) {
        errors.push({ rowIndex, message: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Resolve city/country names → UUIDs, fallback to default country from CSV locale
      const cityId = row.city_name && lookups?.citiesByName
        ? lookups.citiesByName.get(row.city_name.toLowerCase()) ?? null
        : null;
      const countryId = row.country_name && lookups?.countriesByName
        ? lookups.countriesByName.get(row.country_name.toLowerCase()) ?? null
        : lookups?.defaultCountryId ?? null;

      const otherLanguage = resolveSpokenLanguages(
        row.profile.other_language_raw,
        lookups,
        rowIndex,
        errors
      );

      // Update profile (shared fields: phone, nif, gender, birth_date)
      await admin.from('profiles').update({
        phone: row.profile.phone,
        nif: row.profile.nif,
        preferred_contact: row.profile.preferred_contact,
        gender: row.profile.gender,
        birth_date: row.profile.birth_date,
        other_language: otherLanguage,
      }).eq('id', userId);

      // Insert talent_profile (role-specific fields only)
      const { error: tpError } = await admin
        .from('talent_profiles')
        .insert({
          user_id: userId,
          status: row.talent_profile.status,
          legacy_id: row.talent_profile.legacy_id,
          terms_accepted: row.talent_profile.terms_accepted,
          has_car: row.talent_profile.has_car,
          preferred_payment: row.talent_profile.preferred_payment,
          professional_status: row.talent_profile.professional_status,
          address: row.talent_profile.address,
          state: row.talent_profile.state,
          postal_code: row.talent_profile.postal_code,
          internal_notes: row.internal_notes,
          city_id: cityId,
          country_id: countryId,
        });

      if (tpError) {
        await admin.auth.admin.deleteUser(userId);
        errors.push({ rowIndex, message: tpError.message });
        continue;
      }

      // Insert survey responses
      if (row.analytics.length > 0) {
        const surveyRows = row.analytics.map((a) => ({
          user_id: userId,
          key: a.key,
          value: a.value,
        }));
        await admin.from('survey_responses').insert(surveyRows);
      }

      // Resolve talent profile id once for downstream inserts (services, tags).
      let talentProfileId: string | null = null;
      if (row.services.length > 0 || row.subtypeEntries.length > 0 || row.tagNames.length > 0) {
        const tpRes = await admin
          .from('talent_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();
        talentProfileId = tpRes.data?.id ?? null;
      }

      // Insert talent services + subtypes
      if (talentProfileId && (row.services.length > 0 || row.subtypeEntries.length > 0)) {
        const svcCountryId = countryId || lookups?.defaultCountryId || 'a1000000-0000-0000-0000-000000000002';
        const svcResult = await insertTalentServices(
          admin, talentProfileId, svcCountryId, row.services, row.subtypeEntries, csvLocale ?? 'es'
        );
        for (const w of svcResult.warnings) {
          errors.push({ rowIndex, message: `[warning] ${w}` });
        }
      }

      // Insert talent tag assignments. Unknown tags generate non-fatal warnings.
      if (talentProfileId && row.tagNames.length > 0) {
        const tagIdsByName = lookups?.tagIdsByName;
        const assignments: { talent_id: string; tag_id: string }[] = [];
        const seenTagIds = new Set<string>();

        for (const name of row.tagNames) {
          const tagId = tagIdsByName?.get(name.toLowerCase());
          if (!tagId) {
            errors.push({ rowIndex, message: `[warning] Tag "${name}" not found, skipped` });
            continue;
          }
          if (seenTagIds.has(tagId)) continue;
          seenTagIds.add(tagId);
          assignments.push({ talent_id: talentProfileId, tag_id: tagId });
        }

        if (assignments.length > 0) {
          const { error: tagError } = await admin
            .from('talent_tag_assignments')
            .insert(assignments);
          if (tagError) {
            errors.push({ rowIndex, message: `[warning] Tag assignment failed: ${tagError.message}` });
          }
        }
      }

      inserted++;
    } catch (err) {
      errors.push({ rowIndex, message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return { inserted, errors };
}

