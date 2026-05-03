'use client';

import { cn } from '@/lib/utils';

const TEXTAREA_CLASS =
  'flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30';

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
};

export function TextareaRenderer({ id, value, onChange, placeholder, required, hasError }: Props) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      aria-invalid={hasError ? 'true' : undefined}
      rows={4}
      className={cn(TEXTAREA_CLASS)}
    />
  );
}
