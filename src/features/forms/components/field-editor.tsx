'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { FIELD_TYPES_WITH_OPTIONS, type FormField } from '../types';
import { FieldTypePicker } from './field-type-picker';
import { FieldOptionsEditor } from './field-options-editor';

type Props = {
  field: FormField;
  index: number;
  total: number;
  onChange: (field: FormField) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function FieldEditor({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const hasOptions = FIELD_TYPES_WITH_OPTIONS.includes(field.type);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          value={field.key}
          onChange={(e) => onChange({ ...field, key: e.target.value })}
          placeholder={t('fieldKey')}
          className="h-8 w-40 text-sm"
        />
        <FieldTypePicker
          value={field.type}
          onChange={(type) => {
            const updated = { ...field, type };
            if (FIELD_TYPES_WITH_OPTIONS.includes(type) && !updated.options) {
              updated.options = [''];
            } else if (!FIELD_TYPES_WITH_OPTIONS.includes(type)) {
              delete updated.options;
            }
            onChange(updated);
          }}
        />
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onChange({ ...field, required: e.target.checked })}
            className="h-3 w-3"
          />
          {t('required')}
        </label>
        <div className="ml-auto flex gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveDown}
            disabled={index === total - 1}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onRemove}
          >
            <X />
          </Button>
        </div>
      </div>
      {hasOptions && (
        <FieldOptionsEditor
          options={field.options ?? []}
          onChange={(options) => onChange({ ...field, options })}
        />
      )}
    </div>
  );
}
