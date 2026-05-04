'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { locales } from '@/lib/i18n/config';
import type { ManualOption } from '@/shared/lib/questions/types';

type Props = {
  options: ManualOption[];
  onChange: (options: ManualOption[]) => void;
};

export function ManualOptionsEditor({ options, onChange }: Props) {
  const t = useTranslations('AdminServiceQuestions');
  const primaryLocale = locales[0];

  const update = (index: number, next: ManualOption) => {
    onChange(options.map((o, i) => (i === index ? next : o)));
  };
  const remove = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };
  const add = () => {
    onChange([...options, { value: `opt_${options.length + 1}`, i18n: {} }]);
  };

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">{t('manualOptionsHint')}</p>
      {options.length === 0 && (
        <p className="text-muted-foreground text-xs italic">{t('noOptions')}</p>
      )}
      {options.map((opt, i) => (
        <div key={i} className="space-y-1.5 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <Input
              value={opt.value}
              onChange={(e) => update(i, { ...opt, value: e.target.value })}
              placeholder="value"
              className="h-8 w-32 font-mono text-xs"
            />
            <span className="text-muted-foreground text-xs">{t('value')}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => remove(i)}
              className="ml-auto"
            >
              <X />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-5">
            {locales.map((loc) => (
              <Input
                key={loc}
                value={opt.i18n[loc]?.label ?? ''}
                onChange={(e) =>
                  update(i, {
                    ...opt,
                    i18n: { ...opt.i18n, [loc]: { label: e.target.value } },
                  })
                }
                placeholder={`${loc.toUpperCase()}${loc === primaryLocale ? ' *' : ''}`}
                className="h-8 text-xs"
              />
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-3 w-3" />
        {t('addOption')}
      </Button>
    </div>
  );
}
