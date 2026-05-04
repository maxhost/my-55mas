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
import { saveProfessionalSituation } from '../../actions/save-professional-situation';
import {
  PROFESSIONAL_STATUS_VALUES,
  type ProfessionalSituation,
  type ProfessionalStatus,
} from '../../types';

type Hints = {
  title: string;
  professionalStatusLabel: string;
  professionalStatusPreRetired: string;
  professionalStatusUnemployed: string;
  professionalStatusEmployed: string;
  professionalStatusRetired: string;
  previousExperienceLabel: string;
  previousExperiencePlaceholder: string;
  saveAndContinue: string;
  saveAndBackToSummary: string;
};

type Props = {
  initial: ProfessionalSituation | null;
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: Hints;
};

type LocalState = {
  professional_status: ProfessionalStatus | undefined;
  previous_experience: string;
};

const TEXTAREA_CLASS =
  'flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

function statusLabel(value: ProfessionalStatus, hints: Hints): string {
  switch (value) {
    case 'pre_retired':
      return hints.professionalStatusPreRetired;
    case 'unemployed':
      return hints.professionalStatusUnemployed;
    case 'employed':
      return hints.professionalStatusEmployed;
    case 'retired':
      return hints.professionalStatusRetired;
  }
}

export function ProfessionalSituationStep({ initial, mode, onSaved, hints }: Props) {
  const [state, setState] = useState<LocalState>({
    professional_status: initial?.professional_status,
    previous_experience: initial?.previous_experience ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);

    const payload: ProfessionalSituation = {
      professional_status: state.professional_status as ProfessionalStatus,
      previous_experience:
        state.previous_experience.trim().length > 0
          ? state.previous_experience
          : null,
    };

    startTransition(async () => {
      const result = await saveProfessionalSituation(payload);
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
        <Label htmlFor="onboarding-professional-status">
          {hints.professionalStatusLabel}
        </Label>
        <Select
          value={state.professional_status ?? ''}
          onValueChange={(v) => {
            if (!v) return;
            if ((PROFESSIONAL_STATUS_VALUES as readonly string[]).includes(v)) {
              setState((s) => ({ ...s, professional_status: v as ProfessionalStatus }));
            }
          }}
        >
          <SelectTrigger id="onboarding-professional-status" className="w-full">
            <SelectValue placeholder={hints.professionalStatusLabel}>
              {(v: string) => {
                if ((PROFESSIONAL_STATUS_VALUES as readonly string[]).includes(v)) {
                  return statusLabel(v as ProfessionalStatus, hints);
                }
                return hints.professionalStatusLabel;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PROFESSIONAL_STATUS_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabel(value, hints)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-previous-experience">
          {hints.previousExperienceLabel}
        </Label>
        <textarea
          id="onboarding-previous-experience"
          value={state.previous_experience}
          onChange={(e) =>
            setState((s) => ({ ...s, previous_experience: e.target.value }))
          }
          placeholder={hints.previousExperiencePlaceholder}
          rows={4}
          className={TEXTAREA_CLASS}
        />
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
