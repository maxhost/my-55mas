'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { saveFieldGroup } from '../actions/save-field-group';
import {
  CATALOG_LOCALES,
  type CatalogLocale,
  type FieldGroupInput,
  type FieldGroupWithFields,
  type GroupTranslations,
} from '../types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: FieldGroupWithFields | null;
};

function emptyTranslations(): GroupTranslations {
  return CATALOG_LOCALES.reduce(
    (acc, l) => ({ ...acc, [l]: '' }),
    {} as GroupTranslations
  );
}

export function FieldGroupSheet({ open, onOpenChange, group }: Props) {
  const t = useTranslations('AdminFieldCatalog');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [translations, setTranslations] = useState<GroupTranslations>(
    emptyTranslations()
  );

  useEffect(() => {
    if (open) {
      setSlug(group?.slug ?? '');
      setSortOrder(group?.sort_order ?? 0);
      setIsActive(group?.is_active ?? true);
      setTranslations(group?.translations ?? emptyTranslations());
    }
  }, [open, group]);

  const setTranslation = (locale: CatalogLocale, value: string) => {
    setTranslations((prev) => ({ ...prev, [locale]: value }));
  };

  const handleSave = () => {
    const input: FieldGroupInput = {
      id: group?.id ?? null,
      slug,
      sort_order: sortOrder,
      is_active: isActive,
      translations,
    };
    startTransition(async () => {
      const result = await saveFieldGroup(input);
      if (!result.ok) {
        const key = mapErrorKey(result.error);
        toast.error(t(`errors.${key}`));
        return;
      }
      toast.success(t('savedSuccess'));
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{group ? t('editGroup') : t('addGroup')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label>{t('slug')}</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p className="text-muted-foreground text-xs">{t('slugHint')}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{t('sortOrder')}</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="group-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v === true)}
            />
            <Label htmlFor="group-active">{t('active')}</Label>
          </div>

          <div className="space-y-2">
            <Label>{t('translations')}</Label>
            <Tabs defaultValue="es">
              <TabsList>
                {CATALOG_LOCALES.map((l) => (
                  <TabsTrigger key={l} value={l}>
                    {l.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {CATALOG_LOCALES.map((l) => (
                <TabsContent key={l} value={l} className="pt-2">
                  <Input
                    value={translations[l]}
                    onChange={(e) => setTranslation(l, e.target.value)}
                    placeholder={t('label')}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function mapErrorKey(error: string): string {
  if (error === 'duplicateSlug') return 'duplicateSlug';
  if (error === 'invalidSlug') return 'invalidSlug';
  if (error.includes('missingTranslation')) return 'missingTranslation';
  return 'saveFailed';
}
