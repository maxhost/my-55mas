'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { FIELD_TYPES_WITH_OPTIONS, type FormField } from '../types';
import { sanitizeKey } from '../utils';
import { FieldTypePicker } from './field-type-picker';
import { FieldOptionsEditor } from './field-options-editor';

type Props = {
  field: FormField;
  index: number;
  total: number;
  label: string;
  placeholder: string;
  optionLabels: Record<string, string>;
  onChange: (field: FormField) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onLabelChange: (key: string, value: string) => void;
  onPlaceholderChange: (key: string, value: string) => void;
  onOptionLabelChange: (compositeKey: string, value: string) => void;
};

export function FieldEditor({
  field,
  index,
  total,
  label,
  placeholder,
  optionLabels,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onLabelChange,
  onPlaceholderChange,
  onOptionLabelChange,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const hasOptions = FIELD_TYPES_WITH_OPTIONS.includes(field.type);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          value={field.key}
          onChange={(e) => onChange({ ...field, key: sanitizeKey(e.target.value) })}
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
      {field.key && (
        <div className="ml-6 grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <Label className="text-xs">{t('fieldLabel')}</Label>
            <Input
              value={label}
              onChange={(e) => onLabelChange(field.key, e.target.value)}
              placeholder={t('fieldLabel')}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-xs">{t('fieldPlaceholder')}</Label>
            <Input
              value={placeholder}
              onChange={(e) => onPlaceholderChange(field.key, e.target.value)}
              placeholder={t('fieldPlaceholder')}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}
      {hasOptions && (
        <FieldOptionsEditor
          fieldKey={field.key}
          options={field.options ?? []}
          optionLabels={optionLabels}
          onChange={(options) => onChange({ ...field, options })}
          onOptionLabelChange={onOptionLabelChange}
        />
      )}
    </div>
  );
}
