import { describe, it, expect } from 'vitest';
import { computeCurrentStep } from '../lib/compute-current-step';
import type {
  AvailableService,
  OnboardingContext,
  OnboardingState,
} from '../types';

const baseAddress = {
  street: 'X',
  postal_code: '00000',
  lat: null,
  lng: null,
  mapbox_id: null,
  raw_text: 'Carrer Mayor 1, Madrid, Spain',
  country_code: 'es',
  city_name: 'Madrid',
};

const blankState = (): OnboardingState => ({
  personalData: null,
  contactAddress: null,
  professionalSituation: null,
  services: { entries: [] },
  payments: null,
  languages: { language_codes: [] },
  survey: {},
  onboardingCompletedAt: null,
});

const baseContext = (overrides: Partial<OnboardingContext> = {}): OnboardingContext => ({
  talentId: 't1',
  userId: 'u1',
  countryId: 'c1',
  countryCode: 'ES',
  countryName: 'España',
  cityIdFromRegistration: null,
  spokenLanguages: [],
  surveyQuestions: [],
  availableServices: [],
  ...overrides,
});

describe('computeCurrentStep', () => {
  it('returns 1 for blank state', () => {
    expect(computeCurrentStep(blankState(), baseContext())).toBe(1);
  });

  it('returns 2 once personal data is filled', () => {
    const s = blankState();
    s.personalData = { gender: 'male', birth_date: '1960-01-01' };
    expect(computeCurrentStep(s, baseContext())).toBe(2);
  });

  it('returns 3 once contact + address are complete', () => {
    const s = blankState();
    s.personalData = { gender: 'male', birth_date: '1960-01-01' };
    s.contactAddress = {
      preferred_contact: 'whatsapp',
      address: baseAddress,
      city_id: 'city-1',
    };
    expect(computeCurrentStep(s, baseContext())).toBe(3);
  });

  it('returns 4 once professional is set', () => {
    const s = blankState();
    s.personalData = { gender: 'male', birth_date: '1960-01-01' };
    s.contactAddress = {
      preferred_contact: 'email',
      address: baseAddress,
      city_id: 'city-1',
    };
    s.professionalSituation = { professional_status: 'employed', previous_experience: null };
    expect(computeCurrentStep(s, baseContext())).toBe(4);
  });

  it('blocks at step 4 when a required talent_question is unanswered', () => {
    const services: AvailableService[] = [
      {
        id: 'srv-1',
        name: 'Chef',
        slug: 'chef',
        suggested_price: 30,
        assignedGroups: [],
        talent_questions: [
          { key: 'cert', type: 'text', required: true, i18n: {} },
        ],
      },
    ];
    const s = blankState();
    s.personalData = { gender: 'male', birth_date: '1960-01-01' };
    s.contactAddress = {
      preferred_contact: 'phone',
      address: baseAddress,
      city_id: 'c',
    };
    s.professionalSituation = { professional_status: 'retired', previous_experience: null };
    s.services.entries = [
      { service_id: 'srv-1', unit_price: 30, override_price: false, answers: {} },
    ];
    expect(computeCurrentStep(s, baseContext({ availableServices: services }))).toBe(4);
  });

  it('returns summary when everything is complete', () => {
    const s = blankState();
    s.personalData = { gender: 'male', birth_date: '1960-01-01' };
    s.contactAddress = {
      preferred_contact: 'phone',
      address: baseAddress,
      city_id: 'c',
    };
    s.professionalSituation = { professional_status: 'retired', previous_experience: null };
    s.services.entries = [
      { service_id: 'srv-1', unit_price: 30, override_price: false, answers: {} },
    ];
    s.payments = { has_social_security: true, preferred_payment: 'monthly_invoice' };
    s.languages.language_codes = ['es'];
    expect(
      computeCurrentStep(
        s,
        baseContext({
          availableServices: [
            {
              id: 'srv-1',
              name: 'Chef',
              slug: 'chef',
              suggested_price: 30,
              assignedGroups: [],
              talent_questions: [],
            },
          ],
        }),
      ),
    ).toBe('summary');
  });
});
