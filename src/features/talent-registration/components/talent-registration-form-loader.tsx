'use client';

import dynamic from 'next/dynamic';
import type { CityOption, ServiceOption, TalentRegistrationContext } from '../types';
import type { TalentRegistrationSchemaInput } from '../schemas';

const TalentRegistrationForm = dynamic(
  () => import('./talent-registration-form').then((m) => m.TalentRegistrationForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-md bg-muted" />
        <div className="h-12 animate-pulse rounded-md bg-muted" />
        <div className="h-12 animate-pulse rounded-md bg-muted" />
      </div>
    ),
  },
);

type Props = {
  context: TalentRegistrationContext;
  cities: CityOption[];
  hints: { locationNotDetected: string; cityManualHint: string };
  loadServices: (countryId: string, cityId?: string) => Promise<ServiceOption[]>;
  onSubmit: (data: TalentRegistrationSchemaInput) => Promise<{ error?: Record<string, string[]> } | void>;
};

export function TalentRegistrationFormLoader(props: Props) {
  return <TalentRegistrationForm {...props} />;
}
