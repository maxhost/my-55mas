'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { savePersonalData } from '../../actions/save-personal-data';
import { GENDER_VALUES, type Gender, type PersonalData } from '../../types';

type Hints = {
  title: string;
  genderLabel: string;
  genderMale: string;
  genderFemale: string;
  birthDateLabel: string;
  saveAndContinue: string;
  saveAndBackToSummary: string;
  validationError: string;
  /** Server-side rejection message (e.g. age < 55). */
  ageError: string;
};

type Props = {
  initial: PersonalData | null;
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: Hints;
};

type LocalState = {
  gender: Gender | undefined;
  birth_date: string;
};

export function PersonalDataStep({ initial, mode, onSaved, hints }: Props) {
  const [state, setState] = useState<LocalState>({
    gender: initial?.gender,
    birth_date: initial?.birth_date ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBirthDateValid = (() => {
    if (!state.birth_date) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(state.birth_date)) return false;
    const d = new Date(state.birth_date);
    return !Number.isNaN(d.getTime());
  })();

  const submit = () => {
    setError(null);

    if (!state.gender || !isBirthDateValid) {
      setError(hints.validationError);
      return;
    }

    const payload: PersonalData = {
      gender: state.gender,
      birth_date: state.birth_date,
    };

    startTransition(async () => {
      const result = await savePersonalData(payload);
      if ('error' in result) {
        // The server validates age >= 55. Map that specific Zod message to the
        // localized hint, fall back to the raw message for everything else.
        const msg = result.error.message;
        if (/at least \d+ years old/i.test(msg)) {
          setError(hints.ageError);
        } else {
          setError(msg);
        }
        return;
      }
      onSaved();
    });
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">{hints.title}</h2>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-gender">{hints.genderLabel}</Label>
        <Select
          value={state.gender ?? ''}
          onValueChange={(v) => {
            if (!v) return;
            if ((GENDER_VALUES as readonly string[]).includes(v)) {
              setState((s) => ({ ...s, gender: v as Gender }));
            }
          }}
        >
          <SelectTrigger id="onboarding-gender" className="w-full">
            <SelectValue placeholder={hints.genderLabel}>
              {(v: string) => {
                if (v === 'male') return hints.genderMale;
                if (v === 'female') return hints.genderFemale;
                return hints.genderLabel;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{hints.genderMale}</SelectItem>
            <SelectItem value="female">{hints.genderFemale}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="onboarding-birth-date">{hints.birthDateLabel}</Label>
        <Input
          id="onboarding-birth-date"
          type="date"
          value={state.birth_date}
          onChange={(e) =>
            setState((s) => ({ ...s, birth_date: e.target.value }))
          }
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
