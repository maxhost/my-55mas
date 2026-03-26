import { getTranslations } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';

type PageHeaderProps = {
  title: string;
  backHref?: string;
  children?: React.ReactNode;
};

export async function PageHeader({
  title,
  backHref,
  children,
}: PageHeaderProps) {
  const t = await getTranslations('Common');

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">{t('back')}</span>
          </Link>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
