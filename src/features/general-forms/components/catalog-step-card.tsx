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
import type { FieldGroupWithFields } from '@/shared/lib/field-catalog/admin-types';
import { CatalogFieldPicker } from './catalog-field-picker';

type Props = {
  step: CatalogFormStep;
  stepIndex: number;
  totalSteps: number;
  locale: string;
  groups: FieldGroupWithFields[];
  onChange: (step: CatalogFormStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

// Mapa rápido field_definition_id → metadata para render labels.
function buildFieldMap(
  groups: FieldGroupWithFields[]
): Map<string, { key: string; label: string; group_name: string; input_type: string; persistence_type: string }> {
  const map = new Map<
    string,
    { key: string; label: string; group_name: string; input_type: string; persistence_type: string }
  >();
  return map;
}

function resolveFieldMeta(
  groups: FieldGroupWithFields[],
  locale: string
): Map<string, { key: string; label: string; group_name: string; input_type: string; persistence_type: string }> {
  const map = buildFieldMap(groups);
  for (const g of groups) {
    const groupName =
      g.translations[locale as keyof typeof g.translations] || g.slug;
    for (const f of g.fields) {
      const label =
        f.translations[locale as keyof typeof f.translations]?.label || f.key;
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
  locale,
  groups,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: Props) {
  const t = useTranslations('AdminFormBuilder');
  const tCatalog = useTranslations('AdminFieldCatalog');

  const meta = resolveFieldMeta(groups, locale);

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
                      id={`req-${i}`}
                      checked={ref.required}
                      onCheckedChange={() => toggleRequired(i)}
                    />
                    <Label htmlFor={`req-${i}`} className="text-xs">
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
          locale={locale}
          excludeFieldIds={usedIds}
          onAdd={addFieldRef}
        />
      </CardContent>
    </Card>
  );
}
