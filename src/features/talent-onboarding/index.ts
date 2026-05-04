export * from './types';
export * from './schemas';
export { computeCurrentStep } from './lib/compute-current-step';
export {
  isPersonalDataComplete,
  isContactAddressComplete,
  isProfessionalSituationComplete,
  isServicesComplete,
  isPaymentsComplete,
  isLanguagesComplete,
  isSurveyComplete,
} from './lib/section-validators';
// Survey adapter lives in shared (used by anything consuming survey_questions).
// Re-exported here for back-compat with existing consumers.
export { adaptSurveyQuestion, mapResponseType } from '@/shared/lib/questions/survey-adapter';

// Read action
export { loadOnboardingState, type LoadResult } from './actions/load-onboarding-state';

// Save actions per step
export { savePersonalData } from './actions/save-personal-data';
export { saveContactAddress } from './actions/save-contact-address';
export { saveProfessionalSituation } from './actions/save-professional-situation';
export { saveServicesAndPricing } from './actions/save-services-and-pricing';
export { savePayments } from './actions/save-payments';
export { saveLanguages } from './actions/save-languages';
export { saveSurveyResponses } from './actions/save-survey-responses';
export { completeOnboarding } from './actions/complete-onboarding';

// Wizard orchestrator + summary + step header
export { OnboardingWizard } from './components/onboarding-wizard';
export type { WizardCityOption, WizardHints } from './components/onboarding-wizard';
export type { SummaryHints } from './components/summary';
