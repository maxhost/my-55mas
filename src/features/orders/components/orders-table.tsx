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
import type { OrderListItem, OrderStatus } from '../types';

type Props = {
  orders: OrderListItem[];
  /** URL prefix for the `#order_number` link. Default `/admin/orders/`. */
  linkBasePath?: string;
};

const DEFAULT_LINK_BASE = '/admin/orders/';

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pendiente: 'secondary',
  asignado: 'default',
  confirmado: 'default',
  completado: 'default',
  pendiente_de_pago: 'secondary',
  terminado: 'outline',
  rechazado: 'destructive',
  archivado: 'outline',
  cancelado: 'destructive',
};

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function OrdersTable({ orders, linkBasePath }: Props) {
  const t = useTranslations('AdminOrders');
  const locale = useLocale();
  const linkBase = linkBasePath ?? DEFAULT_LINK_BASE;

  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">
        {t('noOrders')}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">{t('orderNumber')}</TableHead>
          <TableHead>{t('serviceName')}</TableHead>
          <TableHead>{t('clientName')}</TableHead>
          <TableHead>{t('appointmentDate')}</TableHead>
          <TableHead>{t('scheduleType')}</TableHead>
          <TableHead>{t('staffMember')}</TableHead>
          <TableHead>{t('talentName')}</TableHead>
          <TableHead>{t('status')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-sm">
              <Link
                href={`/${locale}${linkBase}${order.id}`}
                className="text-foreground hover:text-primary hover:underline"
              >
                #{order.order_number}
              </Link>
            </TableCell>
            <TableCell>{order.service_name ?? '—'}</TableCell>
            <TableCell className="font-medium">{order.client_name ?? '—'}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(order.appointment_date, 'es')}
            </TableCell>
            <TableCell>{t(order.schedule_type)}</TableCell>
            <TableCell className="text-muted-foreground">
              {order.staff_member_name ?? '—'}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {order.talent_name ?? '—'}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariant[order.status] ?? 'outline'}>
                {t(order.status)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
