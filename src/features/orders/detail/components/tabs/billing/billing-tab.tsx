'use client';

import { useCallback, useState } from 'react';
import type {
  BillingLine,
  BillingTabData,
  BillingTabHints,
  ClientBillingState,
  TalentBillingBlock,
} from '@/features/orders/detail/types';
import { ClientBillingSection } from './client-billing-section';
import { NewBillingLineModal } from './new-billing-line-modal';
import { TalentBillingSection } from './talent-billing-section';

type Props = {
  orderId: string;
  initialData: BillingTabData;
  hints: BillingTabHints;
  locale: string;
  readOnly?: boolean;
};

type AddingLineFor =
  | { scope: 'client'; talentId: null }
  | { scope: 'talent'; talentId: string }
  | null;

function recomputeClient(state: ClientBillingState, line: BillingLine): ClientBillingState {
  const lines = [...state.lines, line];
  const subtotal = round(lines.reduce((acc, l) => acc + l.total, 0));
  const tax_amount = round(subtotal * state.tax_rate);
  const total = round(subtotal + tax_amount);
  const total_owed = round(total - state.total_paid);
  return { ...state, lines, subtotal, tax_amount, total, total_owed };
}

function recomputeTalent(block: TalentBillingBlock, line: BillingLine): TalentBillingBlock {
  const lines = [...block.lines, line];
  const subtotal = round(lines.reduce((acc, l) => acc + l.total, 0));
  return { ...block, lines, subtotal, total: subtotal };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function BillingTab({ orderId, initialData, hints, locale, readOnly = false }: Props) {
  const [data, setData] = useState<BillingTabData>(initialData);
  const [addingLineFor, setAddingLineFor] = useState<AddingLineFor>(null);

  const handleClientInvoiced = useCallback(() => {
    setData((prev) => ({
      ...prev,
      clientBilling: { ...prev.clientBilling, invoiced: true },
    }));
  }, []);

  const handleTalentInvoiced = useCallback((talentId: string) => {
    setData((prev) => ({
      ...prev,
      talentBlocks: prev.talentBlocks.map((b) =>
        b.talent_id === talentId ? { ...b, invoiced: true } : b,
      ),
    }));
  }, []);

  const handleLineCreated = useCallback(
    (line: BillingLine) => {
      if (!addingLineFor) return;
      if (addingLineFor.scope === 'client') {
        setData((prev) => ({
          ...prev,
          clientBilling: recomputeClient(prev.clientBilling, line),
        }));
      } else {
        const tid = addingLineFor.talentId;
        setData((prev) => ({
          ...prev,
          talentBlocks: prev.talentBlocks.map((b) =>
            b.talent_id === tid ? recomputeTalent(b, line) : b,
          ),
        }));
      }
    },
    [addingLineFor],
  );

  return (
    <div className="flex flex-col gap-6">
      <ClientBillingSection
        orderId={orderId}
        state={data.clientBilling}
        hints={hints}
        locale={locale}
        onAddLineRequested={() => setAddingLineFor({ scope: 'client', talentId: null })}
        onInvoiced={handleClientInvoiced}
        readOnly={readOnly}
      />

      {data.talentBlocks.length === 0 ? (
        <section className="flex flex-col gap-2 rounded-lg border border-dashed p-6 text-sm">
          <h3 className="text-base font-semibold">{hints.noTalentsAssigned}</h3>
          <p className="text-muted-foreground">{hints.noTalentsAssignedHelp}</p>
        </section>
      ) : (
        data.talentBlocks.map((block) => (
          <TalentBillingSection
            key={block.talent_id}
            orderId={orderId}
            block={block}
            hints={hints}
            locale={locale}
            onAddLineRequested={() =>
              setAddingLineFor({ scope: 'talent', talentId: block.talent_id })
            }
            onInvoiced={() => handleTalentInvoiced(block.talent_id)}
            readOnly={readOnly}
          />
        ))
      )}

      <NewBillingLineModal
        open={addingLineFor !== null}
        onOpenChange={(open) => {
          if (!open) setAddingLineFor(null);
        }}
        orderId={orderId}
        scope={addingLineFor?.scope ?? 'client'}
        talentId={addingLineFor?.scope === 'talent' ? addingLineFor.talentId : null}
        hints={hints}
        onCreated={handleLineCreated}
      />
    </div>
  );
}
