'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import type {
  CatalogFormStep,
  CatalogFieldRef,
} from '@/shared/lib/field-catalog/schema-types';
import type { StepAction } from '@/shared/lib/forms/types';
import type { FieldGroupWithFields } from '@/shared/lib/field-catalog/admin-types';
import { StepActionEditor } from '@/shared/components/form-builder/step-action-editor';
import { CatalogFieldPicker } from './catalog-field-picker';

type Props = {
  step: CatalogFormStep;
  stepIndex: number;
  totalSteps: number;
  uiLocale: string;
  activeLocale: string;
  labels: Record<string, string>;
  groups: FieldGroupWithFields[];
  onChange: (step: CatalogFormStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onLabelChange: (key: string, value: string) => void;
  onActionsChange: (actions: StepAction[]) => void;
};

type FieldMeta = {
  key: string;
  label: string;
  group_name: string;
  input_type: string;
  persistence_type: string;
};

function resolveFieldMeta(
  groups: FieldGroupWithFields[],
  uiLocale: string
): Map<string, FieldMeta> {
  const map = new Map<string, FieldMeta>();
  for (const g of groups) {
    const groupName =
      g.translations[uiLocale as keyof typeof g.translations] || g.slug;
    for (const f of g.fields) {
      const label =
        f.translations[uiLocale as keyof typeof f.translations]?.label || f.key;
      map.set(f.id, {
        key: f.key,
        label,
        group_name: groupName,
        input_type: f.input_type,
        persistence_type: f.persistence_type,
      });
    }
  }
  return map;
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function CatalogStepCard({
  step,
  stepIndex,
  totalSteps,
  uiLocale,
  activeLocale,
  labels,
  groups,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onLabelChange,
  onActionsChange,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const tCatalog = useTranslations('AdminFieldCatalog');

  const meta = resolveFieldMeta(groups, uiLocale);

  const addFieldRef = (field_definition_id: string, required: boolean) => {
    const newRef: CatalogFieldRef = { field_definition_id, required };
    onChange({ ...step, field_refs: [...step.field_refs, newRef] });
  };

  const removeFieldRef = (index: number) => {
    onChange({
      ...step,
      field_refs: step.field_refs.filter((_, i) => i !== index),
    });
  };

  const toggleRequired = (index: number) => {
    onChange({
      ...step,
      field_refs: step.field_refs.map((r, i) =>
        i === index ? { ...r, required: !r.required } : r
      ),
    });
  };

  const moveRef = (fromIndex: number, toIndex: number) => {
    onChange({ ...step, field_refs: swap(step.field_refs, fromIndex, toIndex) });
  };

  const usedIds = step.field_refs.map((r) => r.field_definition_id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <span className="text-muted-foreground text-sm font-medium">
          {t('stepTitle', { number: stepIndex + 1 })}
        </span>
        <Input
          value={step.key}
          onChange={(e) => onChange({ ...step, key: e.target.value })}
          className="h-8 max-w-[200px] font-mono text-xs"
          placeholder="step_1"
        />
        <div className="ml-auto flex gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveUp}
            disabled={stepIndex === 0}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onMoveDown}
            disabled={stepIndex === totalSteps - 1}
          >
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" onClick={onRemove}>
            <X />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Step label (current active locale) */}
        <div className="space-y-1">
          <Label className="text-xs">
            {t('stepLabel')} ({activeLocale.toUpperCase()})
          </Label>
          <Input
            value={labels[step.key] ?? ''}
            onChange={(e) => onLabelChange(step.key, e.target.value)}
            placeholder={t('stepLabel')}
            className="h-8 text-sm"
          />
        </div>

        {step.field_refs.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('noFields')}</p>
        ) : (
          <ul className="space-y-1.5">
            {step.field_refs.map((ref, i) => {
              const info = meta.get(ref.field_definition_id);
              return (
                <li
                  key={`${ref.field_definition_id}-${i}`}
                  className="flex items-center gap-2 rounded-md border p-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {info?.label ?? '(field no encontrado)'}
                      </span>
                      {info && (
                        <>
                          <Badge variant="outline" className="text-xs">
                            {info.key}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {info.input_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {info.persistence_type}
                          </Badge>
                        </>
                      )}
                    </div>
                    {info && (
                      <span className="text-muted-foreground text-xs">
                        [{info.group_name}]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id={`req-${stepIndex}-${i}`}
                      checked={ref.required}
                      onCheckedChange={() => toggleRequired(i)}
                    />
                    <Label htmlFor={`req-${stepIndex}-${i}`} className="text-xs">
                      {tCatalog('active').replace('Activo', 'Obligatorio')}
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => moveRef(i, i - 1)}
                    disabled={i === 0}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => moveRef(i, i + 1)}
                    disabled={i === step.field_refs.length - 1}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeFieldRef(i)}
                  >
                    <X />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        <CatalogFieldPicker
          groups={groups}
          locale={uiLocale}
          excludeFieldIds={usedIds}
          onAdd={addFieldRef}
        />

        <StepActionEditor
          actions={step.actions ?? []}
          stepIndex={stepIndex}
          stepKey={step.key}
          translations={{ labels }}
          onChange={onActionsChange}
          onLabelChange={onLabelChange}
        />
      </CardContent>
    </Card>
  );
}
