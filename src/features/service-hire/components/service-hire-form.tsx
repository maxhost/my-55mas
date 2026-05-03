'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AddressAutocomplete, emptyAddress } from '@/shared/components/address-autocomplete';
import { ServiceQuestionsRenderer } from '@/features/service-questions';
import type { ServiceForHire } from '../actions/get-service-for-hire';
import type { ServiceHireFormState } from '../types';
import { emptyScheduling } from '../types';
import { SchedulingBlock } from './scheduling-block';
import { AuthGatePlaceholder } from './auth-gate-placeholder';

type Props = {
  service: ServiceForHire;
  locale: string;
  hints: {
    addressLabel: string;
    addressPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    termsLabel: string;
    submitDryRun: string;
    scheduling: React.ComponentProps<typeof SchedulingBlock>['hints'];
    auth: React.ComponentProps<typeof AuthGatePlaceholder>['hints'];
    questions: { yes: string; no: string; fileTooLarge: string; fileWrongType: string };
  };
};

const TEXTAREA_CLASS =
  'flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

export function ServiceHireForm({ service, locale, hints }: Props) {
  const [state, setState] = useState<ServiceHireFormState>({
    address: emptyAddress,
    scheduling: emptyScheduling,
    answers: {},
    notes: '',
    terms_accepted: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // S4 dry-run: print to console so we can verify everything is captured.
    // Real submit + auth + DB write happens in S5.
    // eslint-disable-next-line no-console
    console.log('[ServiceHireForm] submit dry-run', {
      service: { id: service.id, slug: service.slug },
      ...state,
    });
    alert(hints.submitDryRun);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="address">{hints.addressLabel}</Label>
        <AddressAutocomplete
          id="address"
          value={state.address}
          onChange={(v) => setState((s) => ({ ...s, address: v }))}
          countryCodes={service.activeCountryCodes}
          language={locale}
          placeholder={hints.addressPlaceholder}
        />
      </div>

      <SchedulingBlock
        value={state.scheduling}
        onChange={(v) => setState((s) => ({ ...s, scheduling: v }))}
        hints={hints.scheduling}
      />

      <ServiceQuestionsRenderer
        questions={service.questions}
        answers={state.answers}
        onChange={(v) => setState((s) => ({ ...s, answers: v }))}
        locale={locale}
        assignedGroups={service.assignedGroups}
        hints={hints.questions}
      />

      <div className="space-y-1.5">
        <Label htmlFor="notes">{hints.notesLabel}</Label>
        <textarea
          id="notes"
          value={state.notes}
          onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
          placeholder={hints.notesPlaceholder}
          rows={3}
          className={TEXTAREA_CLASS}
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={state.terms_accepted}
          onChange={(e) => setState((s) => ({ ...s, terms_accepted: e.target.checked }))}
          className="mt-1 h-4 w-4"
        />
        <span>{hints.termsLabel}</span>
      </label>

      <AuthGatePlaceholder hints={hints.auth} />

      <Button type="submit" className="w-full">
        {hints.submitDryRun}
      </Button>
    </form>
  );
}
