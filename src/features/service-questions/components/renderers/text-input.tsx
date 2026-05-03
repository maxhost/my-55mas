'use client';

import { Input } from '@/components/ui/input';

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
};

export function TextInputRenderer({ id, value, onChange, placeholder, required, hasError }: Props) {
  return (
    <Input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      aria-invalid={hasError ? 'true' : undefined}
      className="h-9 text-sm"
    />
  );
}
