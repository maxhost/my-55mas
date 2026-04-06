'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { SurveyQuestionRenderData } from '@/shared/lib/forms/types';

type Props = {
  question: SurveyQuestionRenderData;
  value: unknown;
  onChange: (value: unknown) => void;
};

export function SurveyFieldRenderer({ question, value, onChange }: Props) {
  const { response_type, label, description, options, option_labels } = question;

  const header = (
    <div className="space-y-0.5">
      <Label>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );

  if (response_type === 'text') {
    return (
      <div className="space-y-1">
        {header}
        <Textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      </div>
    );
  }

  if (response_type === 'yes_no') {
    const yesLabel = option_labels?.['yes'] ?? 'Yes';
    const noLabel = option_labels?.['no'] ?? 'No';
    return (
      <div className="space-y-2">
        {header}
        <div className="flex gap-4">
          {[{ key: 'yes', label: yesLabel }, { key: 'no', label: noLabel }].map((opt) => (
            <label key={opt.key} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name={question.key}
                value={opt.key}
                checked={value === opt.key}
                onChange={() => onChange(opt.key)}
                className="h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (response_type === 'scale_1_5' || response_type === 'scale_1_10') {
    const max = response_type === 'scale_1_5' ? 5 : 10;
    const points = Array.from({ length: max }, (_, i) => i + 1);
    return (
      <div className="space-y-2">
        {header}
        <div className="flex flex-wrap gap-3">
          {points.map((n) => {
            const pointLabel = option_labels?.[String(n)] ?? String(n);
            return (
              <label key={n} className="flex flex-col items-center gap-1 text-xs">
                <input
                  type="radio"
                  name={question.key}
                  value={n}
                  checked={value === n || value === String(n)}
                  onChange={() => onChange(n)}
                  className="h-4 w-4"
                />
                {pointLabel}
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (response_type === 'single_select') {
    return (
      <div className="space-y-1">
        {header}
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="border-border bg-background h-9 w-full rounded-md border px-3 text-sm"
        >
          <option value="" />
          {(options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {option_labels?.[opt] ?? opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Fallback for unknown response types
  return (
    <div className="space-y-1">
      {header}
      <Textarea
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />
    </div>
  );
}
