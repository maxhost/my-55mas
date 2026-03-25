'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ServiceListItem, ServiceStatus } from '../types';

type Props = {
  services: ServiceListItem[];
  onDelete: (id: string) => void;
};

const statusVariant: Record<ServiceStatus, 'default' | 'secondary' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  archived: 'outline',
};

export function ServicesTable({ services, onDelete }: Props) {
  const t = useTranslations('AdminServices');

  if (services.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        {t('noServices')}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('name')}</TableHead>
          <TableHead>{t('status')}</TableHead>
          <TableHead>{t('createdAt')}</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id} className="cursor-pointer">
            <TableCell>
              <Link
                href={`/admin/services/${service.id}`}
                className="font-medium hover:underline"
              >
                {service.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[service.status as ServiceStatus] ?? 'outline'}>
                {t(service.status as ServiceStatus)}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {service.created_at
                ? new Date(service.created_at).toLocaleDateString()
                : '—'}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(service.id);
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
