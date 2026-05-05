'use client';

import { useState, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TalentHeader } from './header/talent-header';
import { HighlightsRow } from './highlights/highlights-row';
import { OrdersTab } from './tabs/orders-tab';
import { PaymentsTab } from './tabs/payments/payments-tab';
import { DocumentsTab } from './tabs/documents-tab';
import { DetailsTab } from './tabs/details/details-tab';
import { NotesTab } from './tabs/notes-tab';
import { ReviewsTab } from './tabs/reviews-tab';
import {
  getTalentDetail,
  getTalentDetailsData,
  getTalentDocuments,
  getTalentNotes,
  getTalentOrders,
  getTalentPayments,
  getTalentReviews,
  getTalentTagOptions,
} from '@/features/talents/detail';
import type {
  DetailTabsHints,
  DocumentsTabHints,
  HeaderHints,
  HighlightsHints,
  NotesTabHints,
  OrdersTabHints,
  PaymentsTabHints,
  ReviewsTabHints,
  DetailsTabHints,
  TalentDetail,
  TalentDetailContext,
  TalentDetailsData,
  TalentDocumentEntry,
  TalentHighlightsStats,
  TalentNote,
  TalentOrderRow,
  TalentPayment,
  TalentPaymentsStats,
  TalentReviewByService,
  TalentTagOption,
} from '@/features/talents/detail';

type Props = {
  initialTalent: TalentDetail;
  initialAvailableTags: TalentTagOption[];
  initialStats: TalentHighlightsStats;
  initialOrders: TalentOrderRow[];
  initialOrdersTotal: number;
  initialPayments: TalentPayment[];
  initialPaymentStats: TalentPaymentsStats;
  initialDocuments: TalentDocumentEntry[];
  initialDetailsData: TalentDetailsData;
  initialDetailsContext: TalentDetailContext;
  initialNotes: TalentNote[];
  initialReviews: TalentReviewByService[];
  currentUserName: string;
  locale: string;
  hints: {
    header: HeaderHints;
    highlights: HighlightsHints;
    tabs: DetailTabsHints;
    orders: OrdersTabHints;
    payments: PaymentsTabHints;
    documents: DocumentsTabHints;
    details: DetailsTabHints;
    notes: NotesTabHints;
    reviews: ReviewsTabHints;
  };
};

export function TalentDetailTabs(props: Props) {
  const {
    initialTalent,
    initialAvailableTags,
    initialStats,
    initialOrders,
    initialOrdersTotal,
    initialPayments,
    initialPaymentStats,
    initialDocuments,
    initialDetailsData,
    initialDetailsContext,
    initialNotes,
    initialReviews,
    currentUserName,
    locale,
    hints,
  } = props;

  const [talent, setTalent] = useState(initialTalent);
  const [availableTags, setAvailableTags] = useState(initialAvailableTags);
  const [detailsData, setDetailsData] = useState(initialDetailsData);
  const [, startTransition] = useTransition();

  function refetchHeader() {
    startTransition(async () => {
      const fresh = await getTalentDetail(talent.id, locale);
      if (fresh) setTalent(fresh);
      const tags = await getTalentTagOptions(locale);
      setAvailableTags(tags);
    });
  }

  function refetchDetails() {
    startTransition(async () => {
      const result = await getTalentDetailsData(talent.id, locale);
      if (result) setDetailsData(result.data);
    });
  }

  return (
    <div className="space-y-6">
      <TalentHeader
        talent={talent}
        availableTags={availableTags}
        hints={hints.header}
        onStatusChanged={refetchHeader}
        onTagsChanged={refetchHeader}
      />
      <HighlightsRow stats={initialStats} hints={hints.highlights} />

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">{hints.tabs.orders}</TabsTrigger>
          <TabsTrigger value="payments">{hints.tabs.payments}</TabsTrigger>
          <TabsTrigger value="documents">{hints.tabs.documents}</TabsTrigger>
          <TabsTrigger value="details">{hints.tabs.details}</TabsTrigger>
          <TabsTrigger value="notes">{hints.tabs.notes}</TabsTrigger>
          <TabsTrigger value="reviews">{hints.tabs.reviews}</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="pt-4">
          <OrdersTab
            talentId={talent.id}
            initialOrders={initialOrders}
            totalCount={initialOrdersTotal}
            hints={hints.orders}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="payments" className="pt-4">
          <PaymentsTab
            talentId={talent.id}
            preferredPayment={talent.preferred_payment}
            initialPayments={initialPayments}
            initialStats={initialPaymentStats}
            hints={hints.payments}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="documents" className="pt-4">
          <DocumentsTab documents={initialDocuments} hints={hints.documents} locale={locale} />
        </TabsContent>

        <TabsContent value="details" className="pt-4">
          <DetailsTab
            talentId={talent.id}
            data={detailsData}
            context={initialDetailsContext}
            hints={hints.details}
            locale={locale}
            talentCountryId={talent.country_id}
            onSectionSaved={refetchDetails}
          />
        </TabsContent>

        <TabsContent value="notes" className="pt-4">
          <NotesTab
            talentId={talent.id}
            initialNotes={initialNotes}
            hints={hints.notes}
            currentUserName={currentUserName}
            locale={locale}
          />
        </TabsContent>

        <TabsContent value="reviews" className="pt-4">
          <ReviewsTab reviews={initialReviews} hints={hints.reviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
