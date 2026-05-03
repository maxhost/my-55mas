'use client';

import { useId } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FileConfig } from '../../types';

type Props = {
  id: string;
  value: File[];
  onChange: (v: File[]) => void;
  config: FileConfig;
  required?: boolean;
  hasError?: boolean;
  errorTooLarge: string;
  errorWrongType: string;
};

function matchesAllowed(mime: string, allowed: string[]): boolean {
  return allowed.some((pattern) => {
    if (pattern.endsWith('/*')) return mime.startsWith(pattern.slice(0, -1));
    return mime === pattern;
  });
}

export function FileInputRenderer({
  id,
  value,
  onChange,
  config,
  required,
  hasError,
  errorTooLarge,
  errorWrongType,
}: Props) {
  const inputId = useId();
  const maxBytes = config.maxSizeMb * 1024 * 1024;

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted: File[] = [];
    const rejected: string[] = [];
    for (const f of Array.from(incoming)) {
      if (!matchesAllowed(f.type, config.allowedTypes)) {
        rejected.push(`${f.name}: ${errorWrongType}`);
        continue;
      }
      if (f.size > maxBytes) {
        rejected.push(`${f.name}: ${errorTooLarge}`);
        continue;
      }
      accepted.push(f);
    }
    if (rejected.length > 0) alert(rejected.join('\n'));
    if (accepted.length > 0) onChange([...value, ...accepted]);
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <input
        id={id ?? inputId}
        type="file"
        multiple
        accept={config.allowedTypes.join(',')}
        onChange={(e) => handleFiles(e.target.files)}
        required={required && value.length === 0}
        aria-invalid={hasError ? 'true' : undefined}
        className="text-sm"
      />
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="bg-muted/30 flex items-center gap-2 rounded-md border p-2 text-xs"
            >
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-muted-foreground">
                {(f.size / 1024 / 1024).toFixed(2)} MB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => remove(i)}
                aria-label="remove"
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
