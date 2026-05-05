'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TalentListItem, TalentStatus } from '../types';

type Props = {
  talents: TalentListItem[];
};

const statusVariant: Record<TalentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  registered: 'secondary',
  evaluation: 'secondary',
  active: 'default',
  archived: 'outline',
  excluded: 'destructive',
  inactive: 'outline',
};

const eurFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export function TalentsTable({ talents }: Props) {
  const t = useTranslations('AdminTalents');
  const locale = useLocale();

  if (talents.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        {t('noTalents')}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('name')}</TableHead>
          <TableHead>{t('services')}</TableHead>
          <TableHead>{t('totalEarned')}</TableHead>
          <TableHead>{t('status')}</TableHead>
          <TableHead>{t('registeredAt')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {talents.map((talent) => (
          <TableRow key={talent.id}>
            <TableCell className="font-medium">
              <Link
                href={`/${locale}/admin/talents/${talent.id}`}
                className="text-foreground hover:text-primary hover:underline"
              >
                {talent.full_name ?? '—'}
              </Link>
            </TableCell>
            <TableCell>
              <ServiceChips
                services={talent.services}
                noServicesLabel={t('noServices')}
                moreServicesLabel={
                  talent.services.length > 1
                    ? t('moreServices', { count: talent.services.length - 1 })
                    : undefined
                }
              />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {eurFormatter.format(talent.total_earned_eur)}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[talent.status] ?? 'outline'}>
                {t(talent.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {talent.created_at
                ? new Date(talent.created_at).toLocaleDateString()
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Service Chips ───────────────────────────────────

type ServiceChipsProps = {
  services: TalentListItem['services'];
  noServicesLabel: string;
  moreServicesLabel?: string;
};

function ServiceChips({ services, noServicesLabel, moreServicesLabel }: ServiceChipsProps) {
  if (services.length === 0) {
    return <span className="text-muted-foreground text-xs">{noServicesLabel}</span>;
  }

  const first = services[0].name;
  const rest = services.slice(1);

  return (
    <div className="flex items-center gap-1">
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
        {first}
      </span>
      {rest.length > 0 && (
        <span
          className="text-muted-foreground cursor-default text-xs"
          title={rest.map((s) => s.name).join(', ')}
        >
          {moreServicesLabel}
        </span>
      )}
    </div>
  );
}
