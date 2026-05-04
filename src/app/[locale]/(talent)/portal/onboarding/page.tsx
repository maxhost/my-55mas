import { redirect } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { localizedField } from '@/shared/lib/i18n/localize';
import {
  loadOnboardingState,
  OnboardingWizard,
  type WizardCityOption,
  type WizardHints,
} from '@/features/talent-onboarding';
import { PageHeader } from '@/shared/components/page-header';

type Props = { params: { locale: string } };

/** Where to redirect once the talent confirms the summary. TBD with the user. */
const POST_ONBOARDING_PATH = '/portal';

export default async function TalentOnboardingPage({ params: { locale } }: Props) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('TalentOnboarding');

  const result = await loadOnboardingState(locale);

  if (!result.ok) {
    if (result.reason === 'no_session') redirect(`/${locale}/login`);
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <PageHeader title={t('pageTitle')} />
        <p className="text-destructive text-sm">
          {result.reason === 'no_talent_profile'
            ? 'No se encontró tu perfil de talento. Contacta a soporte.'
            : 'No se encontró el país asociado a tu perfil. Contacta a soporte.'}
        </p>
      </main>
    );
  }

  // If onboarding is already complete, send the talent to the portal landing.
  if (result.state.onboardingCompletedAt) {
    redirect(`/${locale}${POST_ONBOARDING_PATH}`);
  }

  // Cities catalog scoped to the talent's country (for step 2 manual fallback).
  const cities = await loadCitiesForCountry(result.context.countryId, locale);

  const hints: WizardHints = buildHints(t);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PageHeader title={t('pageTitle')} />
      <p className="text-muted-foreground text-sm">{t('pageDescription')}</p>
      <OnboardingWizard
        initialState={result.state}
        initialContext={result.context}
        locale={locale}
        cities={cities}
        postOnboardingPath={`/${locale}${POST_ONBOARDING_PATH}`}
        hints={hints}
      />
    </main>
  );
}

async function loadCitiesForCountry(
  countryId: string,
  locale: string,
): Promise<WizardCityOption[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('cities')
    .select('id, country_id, i18n')
    .eq('country_id', countryId)
    .eq('is_active', true);

  type I18n = Record<string, Record<string, unknown>> | null;
  return (data ?? []).map((c) => ({
    id: c.id,
    country_id: c.country_id,
    name: localizedField(c.i18n as I18n, locale, 'name') ?? c.id,
  }));
}

function buildHints(
  t: Awaited<ReturnType<typeof getTranslations<'TalentOnboarding'>>>,
): WizardHints {
  const common = {
    saveAndContinue: t('common.saveAndContinue'),
    saveAndBackToSummary: t('common.saveAndBackToSummary'),
    validationError: t('common.validationError'),
  };
  const questionHints = {
    yes: t('common.yes'),
    no: t('common.no'),
    fileTooLarge: t('common.fileTooLarge'),
    fileWrongType: t('common.fileWrongType'),
  };

  return {
    header: {
      progress: t('header.progress'),
      summary: t('header.summary'),
      stepNames: {
        1: t('header.step1'),
        2: t('header.step2'),
        3: t('header.step3'),
        4: t('header.step4'),
        5: t('header.step5'),
        6: t('header.step6'),
        7: t('header.step7'),
      },
    },
    summary: {
      title: t('summary.title'),
      description: t('summary.description'),
      sectionPersonal: t('summary.sectionPersonal'),
      sectionContact: t('summary.sectionContact'),
      sectionProfessional: t('summary.sectionProfessional'),
      sectionServices: t('summary.sectionServices'),
      sectionPayments: t('summary.sectionPayments'),
      sectionLanguages: t('summary.sectionLanguages'),
      sectionSurvey: t('summary.sectionSurvey'),
      edit: t('summary.edit'),
      finalContinue: t('summary.finalContinue'),
      errorPrefix: t('summary.errorPrefix'),
      genderMale: t('step1.genderMale'),
      genderFemale: t('step1.genderFemale'),
      contactWhatsapp: t('step2.contactWhatsapp'),
      contactEmail: t('step2.contactEmail'),
      contactPhone: t('step2.contactPhone'),
      professionalPreRetired: t('step3.statusPreRetired'),
      professionalUnemployed: t('step3.statusUnemployed'),
      professionalEmployed: t('step3.statusEmployed'),
      professionalRetired: t('step3.statusRetired'),
      paymentMonthly: t('step5.paymentMonthlyInvoice'),
      paymentAccumulate: t('step5.paymentAccumulateCredit'),
      yes: t('common.yes'),
      no: t('common.no'),
      noServices: t('summary.noServices'),
      noLanguages: t('summary.noLanguages'),
      noSurvey: t('summary.noSurvey'),
    },
    steps: {
      personalData: {
        title: t('step1.title'),
        genderLabel: t('step1.genderLabel'),
        genderMale: t('step1.genderMale'),
        genderFemale: t('step1.genderFemale'),
        birthDateLabel: t('step1.birthDateLabel'),
        ageError: t('step1.ageError'),
        ...common,
      },
      contactAddress: {
        title: t('step2.title'),
        preferredContactLabel: t('step2.preferredContactLabel'),
        preferredContactWhatsapp: t('step2.contactWhatsapp'),
        preferredContactEmail: t('step2.contactEmail'),
        preferredContactPhone: t('step2.contactPhone'),
        countryLabel: t('step2.countryLabel'),
        addressLabel: t('step2.addressLabel'),
        addressPlaceholder: t('step2.addressPlaceholder'),
        cityLabel: t('step2.cityLabel'),
        cityPlaceholder: t('step2.cityPlaceholder'),
        cityNotDetectedHint: t('step2.cityNotDetectedHint'),
        ...common,
      },
      professionalSituation: {
        title: t('step3.title'),
        professionalStatusLabel: t('step3.professionalStatusLabel'),
        professionalStatusPreRetired: t('step3.statusPreRetired'),
        professionalStatusUnemployed: t('step3.statusUnemployed'),
        professionalStatusEmployed: t('step3.statusEmployed'),
        professionalStatusRetired: t('step3.statusRetired'),
        previousExperienceLabel: t('step3.previousExperienceLabel'),
        previousExperiencePlaceholder: t('step3.previousExperiencePlaceholder'),
        ...common,
      },
      services: {
        title: t('step4.title'),
        pickServicesLabel: t('step4.pickServicesLabel'),
        noServicesAvailable: t('step4.noServicesAvailable'),
        noServiceSelected: t('step4.noServiceSelected'),
        suggestedPriceLabel: t('step4.suggestedPriceLabel'),
        overridePriceLabel: t('step4.overridePriceLabel'),
        customPriceLabel: t('step4.customPriceLabel'),
        questionHints,
        ...common,
      },
      payments: {
        title: t('step5.title'),
        socialSecurityLabel: t('step5.socialSecurityLabel'),
        yes: t('common.yes'),
        no: t('common.no'),
        preferredPaymentLabel: t('step5.preferredPaymentLabel'),
        preferredPaymentMonthlyInvoice: t('step5.paymentMonthlyInvoice'),
        preferredPaymentAccumulateCredit: t('step5.paymentAccumulateCredit'),
        ...common,
      },
      languages: {
        title: t('step6.title'),
        languagesLabel: t('step6.languagesLabel'),
        atLeastOneLanguage: t('step6.atLeastOneLanguage'),
        ...common,
      },
      survey: {
        title: t('step7.title'),
        description: t('step7.description'),
        noQuestions: t('step7.noQuestions'),
        questionHints,
        ...common,
      },
    },
  };
}
