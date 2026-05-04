'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { FILE_TYPE_OPTIONS, type FileConfig } from '@/shared/lib/questions/types';

type Props = {
  config: FileConfig;
  onChange: (config: FileConfig) => void;
};

export function FileConfigEditor({ config, onChange }: Props) {
  const t = useTranslations('AdminServiceQuestions');

  const toggleType = (mime: string, checked: boolean) => {
    const next = checked
      ? [...config.allowedTypes, mime]
      : config.allowedTypes.filter((t) => t !== mime);
    onChange({ ...config, allowedTypes: next });
  };

  return (
    <div className="space-y-2 rounded-md border p-2">
      <div>
        <p className="text-muted-foreground mb-1 text-xs">{t('allowedFileTypes')}</p>
        <div className="grid grid-cols-2 gap-1">
          {FILE_TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={config.allowedTypes.includes(opt.value)}
                onChange={(e) => toggleType(opt.value, e.target.checked)}
                className="h-3 w-3"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-muted-foreground text-xs whitespace-nowrap">
          {t('maxSizeMb')}
        </label>
        <Input
          type="number"
          min={1}
          max={100}
          value={config.maxSizeMb}
          onChange={(e) =>
            onChange({ ...config, maxSizeMb: Number(e.target.value) || 1 })
          }
          className="h-8 w-20 text-xs"
        />
      </div>
    </div>
  );
}
