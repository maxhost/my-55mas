'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CATALOG_LOCALES,
  type CatalogLocale,
  type FieldGroupWithFields,
} from '../types';
import { FieldGroupSection } from './field-group-section';
import { FieldGroupSheet } from './field-group-sheet';

type Props = {
  initialGroups: FieldGroupWithFields[];
};

export function FieldCatalogManager({ initialGroups }: Props) {
  const t = useTranslations('AdminFieldCatalog');
  const [locale, setLocale] = useState<CatalogLocale>('es');
  const [editingGroup, setEditingGroup] = useState<FieldGroupWithFields | null>(
    null
  );
  const [addingGroup, setAddingGroup] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{t('description')}</p>
        <Button onClick={() => setAddingGroup(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addGroup')}
        </Button>
      </div>

      <Tabs value={locale} onValueChange={(v) => setLocale(v as CatalogLocale)}>
        <TabsList>
          {CATALOG_LOCALES.map((l) => (
            <TabsTrigger key={l} value={l}>
              {l.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {initialGroups.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          {t('noGroups')}
        </p>
      ) : (
        <div className="space-y-3">
          {initialGroups.map((group) => (
            <FieldGroupSection
              key={group.id}
              group={group}
              locale={locale}
              onEditGroup={() => setEditingGroup(group)}
            />
          ))}
        </div>
      )}

      <FieldGroupSheet
        open={addingGroup}
        onOpenChange={setAddingGroup}
        group={null}
      />
      <FieldGroupSheet
        open={!!editingGroup}
        onOpenChange={(o) => !o && setEditingGroup(null)}
        group={editingGroup}
      />
    </div>
  );
}
