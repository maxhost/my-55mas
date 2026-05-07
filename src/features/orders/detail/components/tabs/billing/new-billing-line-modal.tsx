'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { addBillingLine } from '@/features/orders/detail/actions/add-billing-line';
import type {
  BillingLine,
  BillingTabHints,
} from '@/features/orders/detail/types';

type Scope = 'client' | 'talent';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  scope: Scope;
  talentId: string | null;
  hints: BillingTabHints;
  onCreated: (line: BillingLine) => void;
};

function parseNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (Number.isNaN(n)) return null;
  return n;
}

export function NewBillingLineModal({
  open,
  onOpenChange,
  orderId,
  scope,
  talentId,
  hints,
  onCreated,
}: Props) {
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [qty, setQty] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  const [, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setDescription('');
      setUnitPrice('');
      setQty('');
      setDiscountPct('0');
      setSubmitting(false);
    }
  }, [open]);

  const unitPriceNum = parseNumber(unitPrice);
  const qtyNum = parseNumber(qty);
  const discountNum = parseNumber(discountPct) ?? 0;

  const canSubmit =
    description.trim().length > 0 &&
    unitPriceNum != null &&
    unitPriceNum >= 0 &&
    qtyNum != null &&
    qtyNum >= 0 &&
    !submitting;

  const handleCreate = () => {
    if (!canSubmit || unitPriceNum == null || qtyNum == null) return;
    setSubmitting(true);
    startTransition(async () => {
      const res = await addBillingLine({
        orderId,
        scope,
        talentId,
        description: description.trim(),
        unit_price: unitPriceNum,
        qty: qtyNum,
        discount_pct: discountNum,
      });
      if ('error' in res) {
        toast.error(res.error.message || hints.modalCreateError);
        setSubmitting(false);
        return;
      }
      onCreated(res.data);
      toast.success(hints.modalCreate);
      onOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{hints.modalTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bl-description">{hints.modalDescriptionLabel}</Label>
            <Input
              id="bl-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={hints.modalDescriptionPlaceholder}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bl-unit-price">{hints.modalUnitPriceLabel}</Label>
            <Input
              id="bl-unit-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bl-qty">{hints.modalQtyLabel}</Label>
            <Input
              id="bl-qty"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bl-discount">{hints.modalDiscountLabel}</Label>
            <Input
              id="bl-discount"
              type="number"
              inputMode="decimal"
              min="0"
              max="100"
              step="0.01"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
            />
          </div>
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {hints.modalCancel}
          </Button>
          <Button
            variant="default"
            onClick={handleCreate}
            disabled={!canSubmit}
          >
            {hints.modalCreate}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
