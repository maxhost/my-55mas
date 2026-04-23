'use client';

import { useTranslations } from 'next-intl';

type Props = {
  staticOptions: string[] | null;
  source: string | undefined;
};

// Banner informativo en el sheet cuando la columna db_column elegida tiene
// options/optionsSource en el DB_COLUMN_REGISTRY — el admin no tipea opciones.
export function RegistryOptionsPreview({ staticOptions, source }: Props) {
  const t = useTranslations('AdminFieldCatalog');
  return (
    <div className="rounded-md border border-dashed p-3 text-xs">
      <p className="text-muted-foreground mb-1 font-medium">
        {t('optionsFromRegistry')}
      </p>
      {staticOptions ? (
        <div className="flex flex-wrap gap-1">
          {staticOptions.map((opt) => (
            <span
              key={opt}
              className="bg-muted rounded px-1.5 py-0.5 font-mono"
            >
              {opt}
            </span>
          ))}
        </div>
      ) : source ? (
        <p className="text-muted-foreground">
          {t('optionsFromSource', { source })}
        </p>
      ) : null}
    </div>
  );
}
