'use client';

import type { SelectOption } from './select-input';

type Props = {
  id: string;
  value: string[];
  onChange: (v: string[]) => void;
  options: SelectOption[];
  hasError?: boolean;
};

export function MultiSelectInputRenderer({ id, value, onChange, options, hasError }: Props) {
  const toggle = (val: string, checked: boolean) => {
    onChange(checked ? [...value, val] : value.filter((v) => v !== val));
  };

  return (
    <div
      id={id}
      role="group"
      aria-invalid={hasError ? 'true' : undefined}
      className="grid grid-cols-1 gap-1.5 md:grid-cols-2"
    >
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.includes(opt.value)}
            onChange={(e) => toggle(opt.value, e.target.checked)}
            className="h-4 w-4"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
