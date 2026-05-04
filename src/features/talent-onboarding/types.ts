import type { AddressValue } from '@/shared/components/address-autocomplete';
import type { AnswersMap } from '@/shared/components/question-renderers';
import type { Question } from '@/shared/lib/questions/types';
import type { AvailableService } from '@/shared/lib/services/types';

// ── Section value types ──────────────────────────────────────

export const GENDER_VALUES = ['male', 'female'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const PREFERRED_CONTACT_VALUES = ['whatsapp', 'email', 'phone'] as const;
export type PreferredContact = (typeof PREFERRED_CONTACT_VALUES)[number];

export const PROFESSIONAL_STATUS_VALUES = [
  'pre_retired',
  'unemployed',
  'employed',
  'retired',
] as const;
export type ProfessionalStatus = (typeof PROFESSIONAL_STATUS_VALUES)[number];

export const PREFERRED_PAYMENT_VALUES = ['monthly_invoice', 'accumulate_credit'] as const;
export type PreferredPayment = (typeof PREFERRED_PAYMENT_VALUES)[number];

// Step 1
export type PersonalData = {
  gender: Gender;
  birth_date: string; // ISO YYYY-MM-DD
};

// Step 2 — country is read-only (from registration), not part of editable state
export type ContactAddress = {
  preferred_contact: PreferredContact;
  address: AddressValue;
  city_id: string | null; // resolved from address.city_name; null = needs manual selection
};

// Step 3
export type ProfessionalSituation = {
  professional_status: ProfessionalStatus;
  previous_experience: string | null;
};

// Step 4 — one entry per service the talent will provide
export type TalentServiceEntry = {
  service_id: string;
  unit_price: number;
  /** UI flag — true if the talent overrode the suggested price. unit_price still has a value either way. */
  override_price: boolean;
  /** Answers to services.talent_questions, keyed by question.key. */
  answers: AnswersMap;
};

export type ServicesSection = {
  entries: TalentServiceEntry[];
};

// Step 5
export type Payments = {
  has_social_security: boolean;
  preferred_payment: PreferredPayment;
};

// Step 6
export type LanguagesSection = {
  language_codes: string[]; // FK to spoken_languages.code
};

// Step 7
export type SurveyResponses = Record<string, unknown>; // question.key → answer (scalar/array/etc.)

// ── Aggregate state ──────────────────────────────────────────

export type OnboardingState = {
  personalData: PersonalData | null;
  contactAddress: ContactAddress | null;
  professionalSituation: ProfessionalSituation | null;
  services: ServicesSection;
  payments: Payments | null;
  languages: LanguagesSection;
  survey: SurveyResponses;
  onboardingCompletedAt: string | null;
};

export const STEP_INDICES = [1, 2, 3, 4, 5, 6, 7] as const;
export type StepIndex = (typeof STEP_INDICES)[number];
export type OnboardingStep = StepIndex | 'summary';

// ── Context (read-only data the wizard needs) ────────────────

export type SpokenLanguageOption = {
  code: string;
  name: string;
};

/** Active survey question already adapted to the question-renderers framework. */
export type SurveyQuestion = Question;

/** Re-export of the shared AvailableService — feature consumers can `import { AvailableService } from '@/features/talent-onboarding'` without knowing it lives in shared. */
export type { AvailableService };

export type OnboardingContext = {
  /** talent_profiles.id */
  talentId: string;
  /** auth.users.id (== profiles.id) */
  userId: string;
  /** preferred_country from registration — country is locked for the wizard. */
  countryId: string;
  /** ISO 3166-1 alpha-2, used by AddressAutocomplete restriction. */
  countryCode: string;
  /** Locale-formatted country name, for display. */
  countryName: string;
  /** Pre-existing city from registration (if any). */
  cityIdFromRegistration: string | null;
  spokenLanguages: SpokenLanguageOption[];
  surveyQuestions: SurveyQuestion[];
  availableServices: AvailableService[];
};
