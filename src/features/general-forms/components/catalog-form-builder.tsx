'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, Save } from 'lucide-react';
import type {
  CatalogFormSchema,
  CatalogFormStep,
} from '@/shared/lib/field-catalog/schema-types';
import type { FieldGroupWithFields } from '@/shared/lib/field-catalog/admin-types';
import { saveCatalogFormSchema } from '../actions/save-catalog-form-schema';
import { CatalogStepCard } from './catalog-step-card';

type Props = {
  formId: string;
  initialSchema: CatalogFormSchema | null;
  groups: FieldGroupWithFields[];
};

function emptySchema(): CatalogFormSchema {
  return { steps: [{ key: 'step_1', field_refs: [] }] };
}

// Coerces whatever es lo que vino del DB (jsonb) a CatalogFormSchema si ya
// lo es, o schema vacío si es legacy.
function initSchema(incoming: CatalogFormSchema | null): CatalogFormSchema {
  if (!incoming || !Array.isArray(incoming.steps)) return emptySchema();
  const steps = incoming.steps
    .filter((s): s is CatalogFormStep => typeof s === 'object' && s !== null)
    .map((s) => ({
      key: s.key,
      field_refs: Array.isArray(s.field_refs) ? s.field_refs : [],
      actions: s.actions,
    }));
  return steps.length > 0 ? { steps } : emptySchema();
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function CatalogFormBuilder({ formId, initialSchema, groups }: Props) {
  const t = useTranslations('AdminFormBuilder');
  const tc = useTranslations('Common');
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [schema, setSchema] = useState<CatalogFormSchema>(() =>
    initSchema(initialSchema)
  );

  const updateStep = (index: number, step: CatalogFormStep) => {
    setSchema((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? step : s)),
    }));
  };

  const addStep = () => {
    setSchema((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        { key: `step_${prev.steps.length + 1}`, field_refs: [] },
      ],
    }));
  };

  const removeStep = (index: number) => {
    setSchema((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const moveStep = (from: number, to: number) => {
    setSchema((prev) => ({ ...prev, steps: swap(prev.steps, from, to) }));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveCatalogFormSchema({ form_id: formId, schema });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error || tc('saveError'));
        console.error('[CatalogFormBuilder] save error:', result.error);
        return;
      }
      toast.success(tc('savedSuccess'));
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('title')}</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="mr-1 h-3 w-3" />
            {t('addStep')}
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending}>
            <Save className="mr-1 h-3 w-3" />
            {isPending ? tc('saving') : tc('save')}
          </Button>
        </div>
      </div>

      {schema.steps.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          {t('noSteps')}
        </p>
      ) : (
        <div className="space-y-3">
          {schema.steps.map((step, i) => (
            <CatalogStepCard
              key={i}
              step={step}
              stepIndex={i}
              totalSteps={schema.steps.length}
              locale={locale}
              groups={groups}
              onChange={(s) => updateStep(i, s)}
              onRemove={() => removeStep(i)}
              onMoveUp={() => moveStep(i, i - 1)}
              onMoveDown={() => moveStep(i, i + 1)}
            />
          ))}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
