'use client';

import { useTranslations } from 'next-intl';
import { FIELD_TYPES, type FieldType } from '../types';

type Props = {
  value: FieldType;
  onChange: (type: FieldType) => void;
};

export function FieldTypePicker({ value, onChange }: Props) {
  const t = useTranslations('AdminFormBuilder');

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FieldType)}
      className="border-border bg-background h-8 rounded-md border px-2 text-sm"
    >
      {FIELD_TYPES.map((type) => (
        <option key={type} value={type}>
          {t(type)}
        </option>
      ))}
    </select>
  );
}
