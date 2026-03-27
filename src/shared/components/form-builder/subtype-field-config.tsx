'use client';

import { useTranslations } from 'next-intl';

export function SubtypeFieldConfig() {
  const t = useTranslations('AdminFormBuilder');

  return (
    <div className="bg-muted/50 ml-6 rounded-md p-3">
      <p className="text-muted-foreground text-xs">
        {t('subtypeFieldInfo')}
      </p>
    </div>
  );
}
