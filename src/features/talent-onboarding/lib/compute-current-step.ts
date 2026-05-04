import type { OnboardingContext, OnboardingState, OnboardingStep } from '../types';
import {
  isContactAddressComplete,
  isLanguagesComplete,
  isPaymentsComplete,
  isPersonalDataComplete,
  isProfessionalSituationComplete,
  isServicesComplete,
  isSurveyComplete,
} from './section-validators';

/**
 * Returns the first step that is not yet complete. If every step is complete,
 * returns 'summary'. The wizard uses this to resume where the talent left off.
 */
export function computeCurrentStep(
  state: OnboardingState,
  context: OnboardingContext,
): OnboardingStep {
  if (!isPersonalDataComplete(state)) return 1;
  if (!isContactAddressComplete(state)) return 2;
  if (!isProfessionalSituationComplete(state)) return 3;
  if (!isServicesComplete(state, context.availableServices)) return 4;
  if (!isPaymentsComplete(state)) return 5;
  if (!isLanguagesComplete(state)) return 6;
  if (!isSurveyComplete(state, context.surveyQuestions)) return 7;
  return 'summary';
}
