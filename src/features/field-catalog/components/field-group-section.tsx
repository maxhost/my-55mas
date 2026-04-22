'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pencil, Plus, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toggleFieldActive } from '../actions/toggle-field-active';
import type {
  CatalogLocale,
  FieldDefinitionWithTranslations,
  FieldGroupWithFields,
} from '../types';
import type { SubtypeGroupOption } from '@/shared/lib/field-catalog/subtype-groups';
import { FieldDefinitionSheet } from './field-definition-sheet';

type Props = {
  group: FieldGroupWithFields;
  locale: CatalogLocale;
  subtypeGroups: SubtypeGroupOption[];
  onEditGroup: () => void;
};

export function FieldGroupSection({
  group,
  locale,
  subtypeGroups,
  onEditGroup,
}: Props) {
  const t = useTranslations('AdminFieldCatalog');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingField, setEditingField] =
    useState<FieldDefinitionWithTranslations | null>(null);
  const [addingField, setAddingField] = useState(false);

  const toggleField = (field: FieldDefinitionWithTranslations) => {
    startTransition(async () => {
      const result = await toggleFieldActive(field.id, !field.is_active);
      if (!result.ok) {
        toast.error(t('errors.saveFailed'));
        return;
      }
      if (!field.is_active === false && result.data.usage.length > 0) {
        toast.warning(
          t('usageWarning', { count: result.data.usage.length })
        );
      } else {
        toast.success(t('savedSuccess'));
      }
      router.refresh();
    });
  };

  const groupName = group.translations[locale] || group.slug;

  return (
    <>
      <Card className={group.is_active ? '' : 'opacity-60'}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            {groupName}
            <Badge variant="outline" className="text-xs">
              {group.slug}
            </Badge>
            {!group.is_active && (
              <Badge variant="secondary" className="text-xs">
                {t('inactive')}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={onEditGroup}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddingField(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('addField')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {group.fields.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noFields')}</p>
          ) : (
            <ul className="space-y-2">
              {group.fields.map((field) => {
                const label = field.translations[locale]?.label || field.key;
                return (
                  <li
                    key={field.id}
                    className={`flex items-center justify-between gap-2 border-b py-1.5 last:border-b-0 ${
                      field.is_active ? '' : 'opacity-60'
                    }`}
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <span className="font-medium">{label}</span>
                      <Badge variant="outline" className="text-xs">
                        {field.key}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {field.input_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {field.persistence_type}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingField(field)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => toggleField(field)}
                        title={field.is_active ? t('toggleOff') : t('toggleOn')}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <FieldDefinitionSheet
        open={addingField}
        onOpenChange={setAddingField}
        groupId={group.id}
        field={null}
        subtypeGroups={subtypeGroups}
      />
      <FieldDefinitionSheet
        open={!!editingField}
        onOpenChange={(o) => !o && setEditingField(null)}
        groupId={group.id}
        field={editingField}
        subtypeGroups={subtypeGroups}
      />
    </>
  );
}
