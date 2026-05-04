'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { computeCurrentStep } from '../lib/compute-current-step';
import { loadOnboardingState } from '../actions/load-onboarding-state';
import { completeOnboarding } from '../actions/complete-onboarding';
import type {
  OnboardingContext,
  OnboardingState,
  OnboardingStep,
  StepIndex,
} from '../types';
import { StepHeader } from './step-header';
import { Summary, type SummaryHints } from './summary';
import { PersonalDataStep } from './steps/personal-data-step';
import { ContactAddressStep } from './steps/contact-address-step';
import { ProfessionalSituationStep } from './steps/professional-situation-step';
import { ServicesStep } from './steps/services-step';
import { PaymentsStep } from './steps/payments-step';
import { LanguagesStep } from './steps/languages-step';
import { SurveyStep } from './steps/survey-step';

export type WizardCityOption = { id: string; name: string; country_id: string };

export type WizardHints = {
  header: React.ComponentProps<typeof StepHeader>['hints'];
  summary: SummaryHints;
  steps: {
    personalData: React.ComponentProps<typeof PersonalDataStep>['hints'];
    contactAddress: React.ComponentProps<typeof ContactAddressStep>['hints'];
    professionalSituation: React.ComponentProps<typeof ProfessionalSituationStep>['hints'];
    services: React.ComponentProps<typeof ServicesStep>['hints'];
    payments: React.ComponentProps<typeof PaymentsStep>['hints'];
    languages: React.ComponentProps<typeof LanguagesStep>['hints'];
    survey: React.ComponentProps<typeof SurveyStep>['hints'];
  };
};

type Props = {
  initialState: OnboardingState;
  initialContext: OnboardingContext;
  locale: string;
  /** Catalog of cities, scoped to the talent's country. Passed by the page (server side). */
  cities: WizardCityOption[];
  /** Where to redirect after completeOnboarding succeeds. */
  postOnboardingPath: string;
  hints: WizardHints;
};

export function OnboardingWizard({
  initialState,
  initialContext,
  locale,
  cities,
  postOnboardingPath,
  hints,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(initialState);
  const [context] = useState<OnboardingContext>(initialContext);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    computeCurrentStep(initialState, initialContext),
  );
  const [mode, setMode] = useState<'wizard' | 'edit'>('wizard');
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isCompleting, startCompleteTransition] = useTransition();

  /** Re-load state from DB after a save and decide where to navigate. */
  const handleSaved = async () => {
    const result = await loadOnboardingState(locale);
    if (!result.ok) return;
    setState(result.state);
    if (mode === 'edit') {
      setCurrentStep('summary');
      setMode('wizard');
      return;
    }
    // wizard mode: advance one step
    setCurrentStep((prev) => {
      if (prev === 'summary') return prev;
      return prev === 7 ? 'summary' : ((prev + 1) as StepIndex);
    });
  };

  const handleEditSection = (step: StepIndex) => {
    setMode('edit');
    setCurrentStep(step);
  };

  const handleComplete = async (): Promise<{ error?: string } | void> => {
    setCompleteError(null);
    return new Promise((resolve) => {
      startCompleteTransition(async () => {
        const result = await completeOnboarding();
        if ('error' in result) {
          setCompleteError(result.error.message);
          resolve({ error: result.error.message });
          return;
        }
        router.push(postOnboardingPath);
        resolve();
      });
    });
  };

  return (
    <div className="space-y-6">
      <StepHeader current={currentStep} hints={hints.header} />

      {currentStep === 'summary' ? (
        <>
          <Summary
            state={state}
            context={context}
            hints={hints.summary}
            onEdit={handleEditSection}
            onComplete={handleComplete}
          />
          {completeError && (
            <p className="text-destructive text-sm">
              {hints.summary.errorPrefix}: {completeError}
            </p>
          )}
          {isCompleting && <p className="text-muted-foreground text-xs">…</p>}
        </>
      ) : (
        renderStep({
          step: currentStep,
          state,
          context,
          locale,
          cities,
          mode,
          onSaved: handleSaved,
          hints,
        })
      )}
    </div>
  );
}

function renderStep({
  step,
  state,
  context,
  locale,
  cities,
  mode,
  onSaved,
  hints,
}: {
  step: StepIndex;
  state: OnboardingState;
  context: OnboardingContext;
  locale: string;
  cities: WizardCityOption[];
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: WizardHints;
}) {
  switch (step) {
    case 1:
      return (
        <PersonalDataStep
          initial={state.personalData}
          mode={mode}
          onSaved={onSaved}
          hints={hints.steps.personalData}
        />
      );
    case 2:
      return (
        <ContactAddressStep
          initial={state.contactAddress}
          mode={mode}
          onSaved={onSaved}
          hints={hints.steps.contactAddress}
          countryCode={context.countryCode}
          countryName={context.countryName}
          cities={cities}
        />
      );
    case 3:
      return (
        <ProfessionalSituationStep
          initial={state.professionalSituation}
          mode={mode}
          onSaved={onSaved}
          hints={hints.steps.professionalSituation}
        />
      );
    case 4:
      return (
        <ServicesStep
          initial={state.services}
          context={context}
          locale={locale}
          mode={mode}
          onSaved={onSaved}
          hints={hints.steps.services}
        />
      );
    case 5:
      return (
        <PaymentsStep
          initial={state.payments}
          mode={mode}
          onSaved={onSaved}
          hints={hints.steps.payments}
        />
      );
    case 6:
      return (
        <LanguagesStep
          initial={state.languages}
          spokenLanguages={context.spokenLanguages}
          defaultLanguageCode={locale}
          mode={mode}
          onSaved={onSaved}
          hints={hints.steps.languages}
        />
      );
    case 7:
      return (
        <SurveyStep
          initial={state.survey}
          surveyQuestions={context.surveyQuestions}
          locale={locale}
          mode={mode}
          onSaved={onSaved}
          hints={hints.steps.survey}
        />
      );
  }
}
