'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { savePayments } from '../../actions/save-payments';
import {
  PREFERRED_PAYMENT_VALUES,
  type Payments,
  type PreferredPayment,
} from '../../types';

type Hints = {
  title: string;
  socialSecurityLabel: string;
  yes: string;
  no: string;
  preferredPaymentLabel: string;
  preferredPaymentMonthlyInvoice: string;
  preferredPaymentAccumulateCredit: string;
  saveAndContinue: string;
  saveAndBackToSummary: string;
};

type Props = {
  initial: Payments | null;
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: Hints;
};

type LocalState = {
  has_social_security: boolean | undefined;
  preferred_payment: PreferredPayment | undefined;
};

function paymentLabel(value: PreferredPayment, hints: Hints): string {
  switch (value) {
    case 'monthly_invoice':
      return hints.preferredPaymentMonthlyInvoice;
    case 'accumulate_credit':
      return hints.preferredPaymentAccumulateCredit;
  }
}

export function PaymentsStep({ initial, mode, onSaved, hints }: Props) {
  const [state, setState] = useState<LocalState>({
    has_social_security: initial?.has_social_security,
    preferred_payment: initial?.preferred_payment,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);

    const payload: Payments = {
      has_social_security: state.has_social_security as boolean,
      preferred_payment: state.preferred_payment as PreferredPayment,
    };

    startTransition(async () => {
      const result = await savePayments(payload);
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      onSaved();
    });
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">{hints.title}</h2>

      <div className="space-y-1.5">
        <Label>{hints.socialSecurityLabel}</Label>
        <div className="flex gap-4" role="radiogroup">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="onboarding-social-security"
              checked={state.has_social_security === true}
              onChange={() =>
                setState((s) => ({ ...s, has_social_security: true }))
              }
              className="h-4 w-4"
            />
            {hints.yes}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="onboarding-social-security"
              checked={state.has_social_security === false}
              onChange={() =>
                setState((s) => ({ ...s, has_social_security: false }))
              }
              className="h-4 w-4"
            />
            {hints.no}
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-preferred-payment">
          {hints.preferredPaymentLabel}
        </Label>
        <Select
          value={state.preferred_payment ?? ''}
          onValueChange={(v) => {
            if (!v) return;
            if ((PREFERRED_PAYMENT_VALUES as readonly string[]).includes(v)) {
              setState((s) => ({ ...s, preferred_payment: v as PreferredPayment }));
            }
          }}
        >
          <SelectTrigger id="onboarding-preferred-payment" className="w-full">
            <SelectValue placeholder={hints.preferredPaymentLabel}>
              {(v: string) => {
                if ((PREFERRED_PAYMENT_VALUES as readonly string[]).includes(v)) {
                  return paymentLabel(v as PreferredPayment, hints);
                }
                return hints.preferredPaymentLabel;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PREFERRED_PAYMENT_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {paymentLabel(value, hints)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button onClick={submit} disabled={isPending} className="w-full">
        {isPending
          ? '…'
          : mode === 'edit'
            ? hints.saveAndBackToSummary
            : hints.saveAndContinue}
      </Button>
    </section>
  );
}
