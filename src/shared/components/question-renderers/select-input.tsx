'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SelectOption = { value: string; label: string };

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
};

export function SelectInputRenderer({
  id,
  value,
  onChange,
  options,
  placeholder,
  hasError,
}: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger id={id} aria-invalid={hasError ? 'true' : undefined}>
        <SelectValue placeholder={placeholder}>
          {(v: string) => options.find((o) => o.value === v)?.label ?? placeholder ?? ''}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
