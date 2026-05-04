import { isAnswerMissing, type Question } from '@/shared/lib/questions';
import type { OnboardingState, AvailableService } from '../types';

/**
 * Predicates that say "this section is complete" — used by compute-current-step
 * and the wizard to know when each step has all required data filled.
 *
 * These are NOT the same as Zod schema validation (which is stricter and
 * applied at save time). These are loose "have we ever filled this?" checks.
 */

export function isPersonalDataComplete(state: OnboardingState): boolean {
  const p = state.personalData;
  return Boolean(p?.gender && p?.birth_date);
}

export function isContactAddressComplete(state: OnboardingState): boolean {
  const c = state.contactAddress;
  if (!c) return false;
  return (
    Boolean(c.preferred_contact) &&
    Boolean(c.address?.raw_text) &&
    Boolean(c.address?.country_code) &&
    Boolean(c.city_id)
  );
}

export function isProfessionalSituationComplete(state: OnboardingState): boolean {
  return Boolean(state.professionalSituation?.professional_status);
}

export function isServicesComplete(
  state: OnboardingState,
  availableServices: AvailableService[],
): boolean {
  const entries = state.services.entries;
  if (entries.length === 0) return false;
  for (const entry of entries) {
    if (!Number.isFinite(entry.unit_price) || entry.unit_price < 0) return false;
    const service = availableServices.find((s) => s.id === entry.service_id);
    if (!service) continue; // unknown service — skip strict check
    for (const q of service.talent_questions) {
      if (q.required && isAnswerMissing(q, entry.answers[q.key])) return false;
    }
  }
  return true;
}

export function isPaymentsComplete(state: OnboardingState): boolean {
  const p = state.payments;
  if (!p) return false;
  return typeof p.has_social_security === 'boolean' && Boolean(p.preferred_payment);
}

export function isLanguagesComplete(state: OnboardingState): boolean {
  return state.languages.language_codes.length >= 1;
}

export function isSurveyComplete(state: OnboardingState, questions: Question[]): boolean {
  // All survey questions are treated as optional today (no is_required column),
  // so the section is always considered complete. If admin adds required surveys
  // in the future, mirror that flag here.
  void state;
  void questions;
  return true;
}
