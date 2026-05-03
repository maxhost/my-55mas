'use client';

import { Input } from '@/components/ui/input';

type Props = {
  id: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
};

export function NumberInputRenderer({ id, value, onChange, placeholder, required, hasError }: Props) {
  return (
    <Input
      id={id}
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Number(v));
      }}
      placeholder={placeholder}
      required={required}
      aria-invalid={hasError ? 'true' : undefined}
      className="h-9 text-sm"
    />
  );
}
