'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { saveSubtypes } from '../actions/save-subtypes';
import type { SubtypeWithTranslations, SubtypeInput } from '../types';
import { SubtypeRow } from './subtype-row';

type Props = {
  serviceId: string;
  initialSubtypes: SubtypeWithTranslations[];
};

function toInput(s: SubtypeWithTranslations): SubtypeInput {
  return {
    id: s.id,
    slug: s.slug,
    sort_order: s.sort_order,
    is_active: s.is_active,
    translations: { ...s.translations },
  };
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function SubtypesEditor({ serviceId, initialSubtypes }: Props) {
  const t = useTranslations('AdminSubtypes');
  const tc = useTranslations('Common');
  const [isPending, startTransition] = useTransition();
  const [subtypes, setSubtypes] = useState<SubtypeInput[]>(
    initialSubtypes.map(toInput)
  );

  const addSubtype = () => {
    const idx = subtypes.length + 1;
    setSubtypes([
      ...subtypes,
      {
        slug: `subtype_${idx}`,
        sort_order: subtypes.length,
        is_active: true,
        translations: {},
      },
    ]);
  };

  const updateSubtype = (index: number, subtype: SubtypeInput) => {
    setSubtypes(subtypes.map((s, i) => (i === index ? subtype : s)));
  };

  const removeSubtype = (index: number) => {
    setSubtypes(subtypes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Recompute sort_order from current array position
    const normalized = subtypes.map((s, i) => ({ ...s, sort_order: i }));

    startTransition(async () => {
      const result = await saveSubtypes({
        service_id: serviceId,
        subtypes: normalized,
      });

      if (result && 'error' in result) {
        const errors = result.error as Record<string, string[] | undefined>;
        const firstMsg = Object.values(errors).flat().filter(Boolean)[0];
        toast.error(firstMsg ?? tc('saveError'));
        return;
      }

      toast.success(tc('savedSuccess'));
      // Update local state with normalized sort_order
      setSubtypes(normalized);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t('title')}</h3>
      <p className="text-muted-foreground text-sm">{t('description')}</p>

      {subtypes.length === 0 && (
        <p className="text-muted-foreground py-4">{t('noSubtypes')}</p>
      )}

      {subtypes.map((subtype, index) => (
        <SubtypeRow
          key={subtype.id ?? `new-${index}`}
          subtype={subtype}
          index={index}
          total={subtypes.length}
          onChange={(s) => updateSubtype(index, s)}
          onRemove={() => removeSubtype(index)}
          onMoveUp={() => setSubtypes(swap(subtypes, index, index - 1))}
          onMoveDown={() => setSubtypes(swap(subtypes, index, index + 1))}
        />
      ))}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={addSubtype}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addSubtype')}
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
