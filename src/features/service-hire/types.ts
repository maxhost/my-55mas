import type { AddressValue } from '@/shared/components/address-autocomplete';
import type { AnswersMap } from '@/shared/components/question-renderers';

export type SchedulingValue = {
  schedule_type: 'once' | 'recurring';
  start_date: string;        // ISO YYYY-MM-DD
  time_start: string;        // HH:MM
  time_end?: string;         // HH:MM
  // Recurring only:
  frequency?: 'weekly' | 'monthly';
  weekdays?: number[];       // 0=Mon ... 6=Sun
  day_of_month?: number;     // 1..31
  end_date?: string;         // ISO YYYY-MM-DD
};

export type BillingPartyValue = {
  name: string;
  phone: string;
  fiscal_id_type_id: string;
  fiscal_id: string;
};

export type BillingChoiceValue =
  | { mode: 'same' }
  | { mode: 'custom'; data: BillingPartyValue };

export type ServiceHireFormState = {
  address: AddressValue;
  scheduling: SchedulingValue;
  answers: AnswersMap;
  notes: string;
  terms_accepted: boolean;
  billing: BillingChoiceValue;
};

export const emptyScheduling: SchedulingValue = {
  schedule_type: 'once',
  start_date: '',
  time_start: '',
};

export const emptyBilling: BillingChoiceValue = { mode: 'same' };
