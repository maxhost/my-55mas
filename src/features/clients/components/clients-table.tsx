'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ClientListItem, ClientStatus } from '../types';

type Props = {
  clients: ClientListItem[];
};

const statusVariant: Record<ClientStatus, 'default' | 'outline'> = {
  active: 'default',
  suspended: 'outline',
};

export function ClientsTable({ clients }: Props) {
  const t = useTranslations('AdminClients');

  if (clients.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        {t('noClients')}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('fullName')}</TableHead>
          <TableHead>{t('country')}</TableHead>
          <TableHead>{t('city')}</TableHead>
          <TableHead>{t('company')}</TableHead>
          <TableHead>{t('status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">
              {client.full_name ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.country_name ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.city_name ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {client.company_name ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[client.status] ?? 'outline'}>
                {t(client.status)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
