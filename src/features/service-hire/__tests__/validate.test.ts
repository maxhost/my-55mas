import { describe, it, expect } from 'vitest';
import { validateServiceHire, type ValidationMessages } from '../lib/validate';
import { emptyAddress } from '@/shared/components/address-autocomplete';
import type { ServiceHireFormState } from '../types';
import type { Question } from '@/features/service-questions';

const m: ValidationMessages = {
  addressRequired: 'addr',
  dateRequired: 'date',
  timeStartRequired: 'time',
  frequencyRequired: 'freq',
  weekdaysRequired: 'wd',
  dayOfMonthRequired: 'dom',
  termsRequired: 'terms',
  authRequired: 'auth',
  fieldRequired: 'field',
};

const baseState = (): ServiceHireFormState => ({
  address: {
    ...emptyAddress,
    street: 'Calle 1',
    raw_text: 'Calle 1, Madrid, Spain',
    country_code: 'es',
    city_name: 'Madrid',
  },
  scheduling: {
    schedule_type: 'once',
    start_date: '2026-06-01',
    time_start: '10:00',
  },
  answers: {},
  notes: '',
  terms_accepted: true,
});

describe('validateServiceHire', () => {
  it('returns null when everything is OK', () => {
    expect(
      validateServiceHire({
        state: baseState(),
        questions: [],
        isAuthenticated: true,
        messages: m,
      }),
    ).toBeNull();
  });

  it('flags missing address', () => {
    const s = baseState();
    s.address = emptyAddress;
    const errs = validateServiceHire({ state: s, questions: [], isAuthenticated: true, messages: m });
    expect(errs?.address).toBe('addr');
  });

  it('flags missing date / time', () => {
    const s = baseState();
    s.scheduling.start_date = '';
    s.scheduling.time_start = '';
    const errs = validateServiceHire({ state: s, questions: [], isAuthenticated: true, messages: m });
    expect(errs?.scheduling?.start_date).toBe('date');
    expect(errs?.scheduling?.time_start).toBe('time');
  });

  it('recurring without frequency', () => {
    const s = baseState();
    s.scheduling.schedule_type = 'recurring';
    const errs = validateServiceHire({ state: s, questions: [], isAuthenticated: true, messages: m });
    expect(errs?.scheduling?.frequency).toBe('freq');
  });

  it('recurring weekly without weekdays', () => {
    const s = baseState();
    s.scheduling.schedule_type = 'recurring';
    s.scheduling.frequency = 'weekly';
    s.scheduling.weekdays = [];
    const errs = validateServiceHire({ state: s, questions: [], isAuthenticated: true, messages: m });
    expect(errs?.scheduling?.weekdays).toBe('wd');
  });

  it('recurring monthly without day_of_month', () => {
    const s = baseState();
    s.scheduling.schedule_type = 'recurring';
    s.scheduling.frequency = 'monthly';
    const errs = validateServiceHire({ state: s, questions: [], isAuthenticated: true, messages: m });
    expect(errs?.scheduling?.day_of_month).toBe('dom');
  });

  it('flags required question with missing answer', () => {
    const q: Question = { key: 'tipo', type: 'text', required: true, i18n: {} };
    const errs = validateServiceHire({ state: baseState(), questions: [q], isAuthenticated: true, messages: m });
    expect(errs?.answers?.tipo).toBe('field');
  });

  it('does not flag optional question with no answer', () => {
    const q: Question = { key: 'extra', type: 'text', required: false, i18n: {} };
    const errs = validateServiceHire({ state: baseState(), questions: [q], isAuthenticated: true, messages: m });
    expect(errs?.answers).toBeUndefined();
  });

  it('flags missing terms', () => {
    const s = baseState();
    s.terms_accepted = false;
    const errs = validateServiceHire({ state: s, questions: [], isAuthenticated: true, messages: m });
    expect(errs?.terms).toBe('terms');
  });

  it('flags missing auth', () => {
    const errs = validateServiceHire({ state: baseState(), questions: [], isAuthenticated: false, messages: m });
    expect(errs?.auth).toBe('auth');
  });
});
