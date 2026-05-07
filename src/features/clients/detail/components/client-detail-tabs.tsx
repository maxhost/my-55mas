'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientHeader } from './header/client-header';
import { HighlightsRow } from './highlights/highlights-row';
import { OrdersTab } from './tabs/orders-tab';
import { PaymentsTab } from './tabs/payments/payments-tab';
import { DetailsTab } from './tabs/details/details-tab';
import {
  getClientDetail,
  getClientDetailsData,
} from '@/features/clients/detail';
import type {
  ClientDetail,
  ClientDetailContext,
  ClientDetailsData,
  ClientOrderRow,
  ClientPayment,
  ClientStats,
  DetailsTabHints,
  DetailTabsHints,
  HeaderHints,
  HighlightsHints,
  OrdersTabHints,
  PaymentsTabHints,
} from '@/features/clients/detail';

type Props = {
  initialClient: ClientDetail;
  initialStats: ClientStats;
  initialOrders: ClientOrderRow[];
  initialOrdersTotal: number;
  initialPayments: ClientPayment[];
  initialDetailsData: ClientDetailsData;
  initialDetailsContext: ClientDetailContext;
  locale: string;
  hints: {
    header: HeaderHints;
    highlights: HighlightsHints;
    tabs: DetailTabsHints;
    orders: OrdersTabHints;
    payments: PaymentsTabHints;
    details: DetailsTabHints;
  };
};

export function ClientDetailTabs(props: Props) {
  const {
    initialClient,
    initialStats,
    initialOrders,
    initialOrdersTotal,
    initialPayments,
    initialDetailsData,
    initialDetailsContext,
    locale,
    hints,
  } = props;

  const router = useRouter();
  const [client, setClient] = useState(initialClient);
  const [detailsData, setDetailsData] = useState(initialDetailsData);
  const [, startTransition] = useTransition();

  function refetchDetails() {
    startTransition(async () => {
      const fresh = await getClientDetail(client.id, locale);
      if (fresh) setClient(fresh);
      const result = await getClientDetailsData(client.id, locale);
      if (result) setDetailsData(result.data);
    });
  }

  function handleDeleted() {
    router.push(`/${locale}/admin/clients`);
  }

  return (
    <div className="space-y-6">
      <ClientHeader client={client} hints={hints.header} onDeleted={handleDeleted} />
      <HighlightsRow stats={initialStats} hints={hints.highlights} />

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">{hints.tabs.orders}</TabsTrigger>
          <TabsTrigger value="payments">{hints.tabs.payments}</TabsTrigger>
          <TabsTrigger value="details">{hints.tabs.details}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="pt-4">
          <OrdersTab
            clientId={client.id}
            initialOrders={initialOrders}
            totalCount={initialOrdersTotal}
            hints={hints.orders}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="payments" className="pt-4">
          <PaymentsTab
            clientId={client.id}
            initialPayments={initialPayments}
            hints={hints.payments}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="details" className="pt-4">
          <DetailsTab
            clientId={client.id}
            data={detailsData}
            context={initialDetailsContext}
            hints={hints.details}
            locale={locale}
            onSectionSaved={refetchDetails}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
