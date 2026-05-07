'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderHeader } from './header/order-header';
import { ServiceTab } from './tabs/service/service-tab';
import { SpecialistsTab } from './tabs/specialists/specialists-tab';
import { HoursTab } from './tabs/hours/hours-tab';
import { BillingTab } from './tabs/billing/billing-tab';
import { DocumentsTab } from './tabs/documents-tab';
import { ActivityTab } from './tabs/activity-tab';
import {
  getOrderDetail,
  getOrderServiceData,
} from '@/features/orders/detail';
import type {
  ActivityTabHints,
  AssignedTalent,
  BillingTabData,
  BillingTabHints,
  DetailTabsHints,
  DocumentsTabHints,
  HeaderHints,
  HoursTabData,
  HoursTabHints,
  OrderActivityNote,
  OrderDetail,
  OrderDocumentEntry,
  OrderTagOption,
  ServiceTabContext,
  ServiceTabData,
  ServiceTabHints,
  SpecialistsTabHints,
  TalentSearchContext,
} from '@/features/orders/detail';

type Props = {
  initialOrder: OrderDetail;
  availableTags: OrderTagOption[];
  initialServiceData: ServiceTabData;
  initialServiceContext: ServiceTabContext;
  initialAssigned: AssignedTalent[];
  initialTalentSearchContext: TalentSearchContext;
  initialHours: HoursTabData;
  initialBilling: BillingTabData;
  initialDocuments: OrderDocumentEntry[];
  initialActivity: OrderActivityNote[];
  locale: string;
  hints: {
    header: HeaderHints;
    tabs: DetailTabsHints;
    service: ServiceTabHints;
    specialists: SpecialistsTabHints;
    hours: HoursTabHints;
    billing: BillingTabHints;
    documents: DocumentsTabHints;
    activity: ActivityTabHints;
  };
};

export function OrderDetailTabs(props: Props) {
  const {
    initialOrder,
    availableTags,
    initialServiceData,
    initialServiceContext,
    initialAssigned,
    initialTalentSearchContext,
    initialHours,
    initialBilling,
    initialDocuments,
    initialActivity,
    locale,
    hints,
  } = props;

  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [serviceData, setServiceData] = useState(initialServiceData);
  const [, startTransition] = useTransition();

  function refetchOrder() {
    startTransition(async () => {
      const fresh = await getOrderDetail(order.id, locale);
      if (fresh) setOrder(fresh);
    });
  }

  function refetchServiceData() {
    startTransition(async () => {
      const result = await getOrderServiceData(order.id, locale);
      if (result) setServiceData(result.data);
    });
  }

  function handleCancelled() {
    router.push(`/${locale}/admin/orders`);
  }

  return (
    <div className="space-y-6">
      <OrderHeader
        order={order}
        availableTags={availableTags}
        hints={hints.header}
        locale={locale}
        onStatusChanged={refetchOrder}
        onTagsChanged={refetchOrder}
        onCancelled={handleCancelled}
      />

      <Tabs defaultValue="service">
        <TabsList>
          <TabsTrigger value="service">{hints.tabs.service}</TabsTrigger>
          <TabsTrigger value="specialists">{hints.tabs.specialists}</TabsTrigger>
          <TabsTrigger value="hours">{hints.tabs.hours}</TabsTrigger>
          <TabsTrigger value="billing">{hints.tabs.billing}</TabsTrigger>
          <TabsTrigger value="documents">{hints.tabs.documents}</TabsTrigger>
          <TabsTrigger value="activity">{hints.tabs.activity}</TabsTrigger>
        </TabsList>

        <TabsContent value="service" className="pt-4">
          <ServiceTab
            orderId={order.id}
            data={serviceData}
            context={initialServiceContext}
            hints={hints.service}
            locale={locale}
            onSectionSaved={refetchServiceData}
          />
        </TabsContent>

        <TabsContent value="specialists" className="pt-4">
          <SpecialistsTab
            orderId={order.id}
            locale={locale}
            initialAssigned={initialAssigned}
            talentsNeeded={order.talents_needed}
            searchContext={initialTalentSearchContext}
            hints={hints.specialists}
          />
        </TabsContent>

        <TabsContent value="hours" className="pt-4">
          <HoursTab orderId={order.id} data={initialHours} hints={hints.hours} locale={locale} />
        </TabsContent>

        <TabsContent value="billing" className="pt-4">
          <BillingTab
            orderId={order.id}
            initialData={initialBilling}
            hints={hints.billing}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <DocumentsTab
            documents={initialDocuments}
            hints={hints.documents}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <ActivityTab
            orderId={order.id}
            initialNotes={initialActivity}
            hints={hints.activity}
            locale={locale}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
