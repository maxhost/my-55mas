'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import type { FieldGroupWithFields } from '@/shared/lib/field-catalog/admin-types';

type Props = {
  groups: FieldGroupWithFields[];
  locale: string;
  excludeFieldIds: string[];
  onAdd: (field_definition_id: string, required: boolean) => void;
};

// Dropdown plano con fields activos del catálogo, agrupados por group.
// Excluye fields ya presentes en el step.
export function CatalogFieldPicker({
  groups,
  locale,
  excludeFieldIds,
  onAdd,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');
  const [selected, setSelected] = useState<string>('');
  const [required, setRequired] = useState(true);

  const excluded = new Set(excludeFieldIds);

  const flat: { group_name: string; field_id: string; label: string; key: string }[] = [];
  for (const g of groups) {
    if (!g.is_active) continue;
    const groupName = g.translations[locale as keyof typeof g.translations] || g.slug;
    for (const f of g.fields) {
      if (!f.is_active) continue;
      if (excluded.has(f.id)) continue;
      const label =
        f.translations[locale as keyof typeof f.translations]?.label || f.key;
      flat.push({ group_name: groupName, field_id: f.id, label, key: f.key });
    }
  }

  const handleAdd = () => {
    if (!selected) return;
    onAdd(selected, required);
    setSelected('');
    setRequired(true);
  };

  return (
    <div className="flex items-end gap-2 rounded-md border border-dashed p-3">
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs">{t('addField')}</Label>
        <Select
          value={selected}
          onValueChange={(v) => setSelected(v ?? '')}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('addField')} />
          </SelectTrigger>
          <SelectContent>
            {flat.length === 0 ? (
              <div className="text-muted-foreground p-2 text-xs">
                {t('noFields')}
              </div>
            ) : (
              flat.map((f) => (
                <SelectItem key={f.field_id} value={f.field_id}>
                  <span className="text-muted-foreground mr-2 text-xs">
                    [{f.group_name}]
                  </span>
                  {f.label}
                  <span className="text-muted-foreground ml-2 text-xs">
                    ({f.key})
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1.5 pb-2">
        <Checkbox
          id="field-picker-required"
          checked={required}
          onCheckedChange={(v) => setRequired(v === true)}
        />
        <Label htmlFor="field-picker-required" className="text-xs">
          *
        </Label>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={!selected}
        onClick={handleAdd}
      >
        <Plus className="mr-1 h-3 w-3" />
        {t('addField')}
      </Button>
    </div>
  );
}
