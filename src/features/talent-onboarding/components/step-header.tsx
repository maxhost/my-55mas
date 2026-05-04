'use client';

import type { OnboardingStep, StepIndex } from '../types';

type Props = {
  current: OnboardingStep;
  hints: {
    /** Pattern: "Paso {current} de {total}". Both placeholders required. */
    progress: string;
    stepNames: Record<StepIndex, string>;
    summary: string;
  };
};

const TOTAL_STEPS = 7;

/**
 * Visual progress indicator at the top of the wizard. Shows "Paso 3 de 7" + the
 * current step name. Stays static when on summary view (just shows summary label).
 */
export function StepHeader({ current, hints }: Props) {
  if (current === 'summary') {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase">{hints.summary}</p>
        <ProgressBar current={TOTAL_STEPS} total={TOTAL_STEPS} />
      </div>
    );
  }

  const label = hints.stepNames[current];
  const text = hints.progress
    .replace('{current}', String(current))
    .replace('{total}', String(TOTAL_STEPS));

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs uppercase">
        {text} · {label}
      </p>
      <ProgressBar current={current} total={TOTAL_STEPS} />
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="bg-muted h-1 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      <div
        className="bg-primary h-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
