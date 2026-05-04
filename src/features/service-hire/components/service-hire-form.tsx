'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AddressAutocomplete, emptyAddress } from '@/shared/components/address-autocomplete';
import { ServiceQuestionsRenderer } from '@/shared/components/question-renderers';
import type { ServiceForHire } from '../actions/get-service-for-hire';
import { submitServiceHire } from '../actions/submit-service-hire';
import type { ServiceHireFormState } from '../types';
import { emptyScheduling } from '../types';
import { SchedulingBlock } from './scheduling-block';
import { AuthGate, type AuthState } from './auth-gate';
import { validateServiceHire, type ServiceHireErrors, type ValidationMessages } from '../lib/validate';

type Props = {
  service: ServiceForHire;
  locale: string;
  hints: {
    addressLabel: string;
    addressPlaceholder: string;
    notesLabel: string;
    notesPlaceholder: string;
    termsLabel: string;
    submit: string;
    submitDisabledHint: string;
    submitSuccess: string;
    addressError: string;
    scheduling: React.ComponentProps<typeof SchedulingBlock>['hints'];
    auth: React.ComponentProps<typeof AuthGate>['hints'];
    questions: { yes: string; no: string; fileTooLarge: string; fileWrongType: string };
    validation: ValidationMessages;
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
  const [authState, setAuthState] = useState<AuthState>({ status: 'idle' });
  const [errors, setErrors] = useState<ServiceHireErrors | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAuthenticated = authState.status === 'authenticated';
  const canSubmit = isAuthenticated && state.terms_accepted && !isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateServiceHire({
      state,
      questions: service.questions,
      isAuthenticated,
      messages: hints.validation,
    });
    setErrors(validationErrors);
    if (validationErrors) return;

    // Build FormData: state JSON + file entries (named file:{questionKey}:{idx}).
    // Files are stripped from the JSON so the server only sees URLs after upload.
    const fd = new FormData();
    const cleanAnswers: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(state.answers)) {
      if (Array.isArray(value) && value.every((v) => v instanceof File)) {
        (value as File[]).forEach((f, i) => {
          fd.append(`file:${key}:${i}`, f);
        });
        cleanAnswers[key] = []; // server replaces with paths after upload
      } else {
        cleanAnswers[key] = value;
      }
    }
    fd.append(
      'state',
      JSON.stringify({ ...state, serviceId: service.id, answers: cleanAnswers }),
    );

    startTransition(async () => {
      const result = await submitServiceHire(fd);
      if ('error' in result) {
        setSubmitError(result.error.message);
        return;
      }
      setSubmittedOrderId(result.data.orderId);
    });
  };

  if (submittedOrderId) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-6 text-center">
        <h2 className="text-xl font-semibold text-green-900">{hints.submitSuccess}</h2>
        <p className="mt-2 font-mono text-xs text-green-800">order_id: {submittedOrderId}</p>
      </div>
    );
  }

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
          hasError={Boolean(errors?.address)}
        />
        {errors?.address && (
          <p className="text-destructive text-xs">{errors.address}</p>
        )}
      </div>

      <SchedulingBlock
        value={state.scheduling}
        onChange={(v) => setState((s) => ({ ...s, scheduling: v }))}
        errors={errors?.scheduling}
        hints={hints.scheduling}
      />

      <ServiceQuestionsRenderer
        questions={service.questions}
        answers={state.answers}
        onChange={(v) => setState((s) => ({ ...s, answers: v }))}
        errors={errors?.answers}
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

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.terms_accepted}
            onChange={(e) => setState((s) => ({ ...s, terms_accepted: e.target.checked }))}
            className="mt-1 h-4 w-4"
          />
          <span>{hints.termsLabel}</span>
        </label>
        {errors?.terms && <p className="text-destructive text-xs">{errors.terms}</p>}
      </div>

      <AuthGate authState={authState} onAuthenticated={setAuthState} hints={hints.auth} />
      {errors?.auth && <p className="text-destructive text-xs">{errors.auth}</p>}

      {submitError && <p className="text-destructive text-sm">{submitError}</p>}

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {isPending ? '…' : hints.submit}
      </Button>
      {!canSubmit && !isPending && (
        <p className="text-muted-foreground text-center text-xs">{hints.submitDisabledHint}</p>
      )}
    </form>
  );
}
