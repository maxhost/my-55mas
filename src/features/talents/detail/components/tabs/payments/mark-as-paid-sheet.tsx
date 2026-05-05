'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { markPaymentAsPaid } from '@/features/talents/detail/actions/mark-payment-as-paid';
import { TALENT_PAYMENT_METHODS, type PaymentsTabHints, type TalentPaymentMethod } from '@/features/talents/detail/types';

const PROOF_BUCKET = 'payment-proofs';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  talentId: string;
  hints: PaymentsTabHints;
  onSuccess: () => void;
};

type Step = 1 | 2 | 3;

export function MarkAsPaidSheet({
  open,
  onOpenChange,
  paymentId,
  talentId,
  hints,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<TalentPaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setStep(1);
    setMethod('');
    setNotes('');
    setFile(null);
    setErrorMsg(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const skipsStep2 = method === 'cash' || method === 'other';
  const goNext = () => {
    if (step === 1 && method) setStep(skipsStep2 ? 3 : 2);
    else if (step === 2) setStep(3);
  };
  const goBack = () => {
    if (step === 3) setStep(skipsStep2 ? 1 : 2);
    else if (step === 2) setStep(1);
  };

  const submit = () => {
    if (!method) return;
    setErrorMsg(null);
    startTransition(async () => {
      let proofUrl: string | null = null;
      if (file) {
        const supabase = createClient();
        const path = `${talentId}/${paymentId}/${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from(PROOF_BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadErr) {
          setErrorMsg(uploadErr.message);
          return;
        }
        // Build a full URL so server schema validation (.url()) passes;
        // get-payment-detail extracts the path back via the bucket marker.
        const { data: pub } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(path);
        proofUrl = pub?.publicUrl ?? null;
      }

      const result = await markPaymentAsPaid({
        paymentId,
        payment_method: method,
        payment_proof_url: proofUrl,
        notes: method === 'transfer' && notes.trim() ? notes.trim() : null,
      });
      if ('error' in result) {
        setErrorMsg(result.error.message);
        toast.error(result.error.message || hints.errorMessage);
        return;
      }
      toast.success(hints.successMessage);
      onSuccess();
      handleOpenChange(false);
    });
  };

  const stepTitle =
    step === 1 ? hints.step1Title : step === 2 ? hints.step2Title : hints.step3Title;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{hints.sheetTitle}</SheetTitle>
          <p className="text-muted-foreground text-xs">{stepTitle}</p>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4">
          {step === 1 && (
            <div className="space-y-2">
              <Label>{hints.step1MethodLabel}</Label>
              <Select
                value={method || undefined}
                onValueChange={(v) => setMethod((v ?? '') as TalentPaymentMethod | '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={hints.step1MethodLabel}>
                    {method ? hints.methodLabels[method] : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TALENT_PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {hints.methodLabels[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 2 && method === 'transfer' && (
            <div className="space-y-2">
              <Label htmlFor="mark-paid-notes">{hints.step2TransferLabel}</Label>
              <Input
                id="mark-paid-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={hints.step2TransferPlaceholder}
              />
            </div>
          )}

          {step === 2 && method === 'account_balance' && (
            <p className="text-muted-foreground text-sm">{hints.step2BalanceInfo}</p>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label htmlFor="mark-paid-file">{hints.step3UploadLabel}</Label>
              <input
                id="mark-paid-file"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              {file && (
                <p className="text-muted-foreground truncate text-xs">{file.name}</p>
              )}
            </div>
          )}

          {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          {step > 1 && (
            <Button variant="ghost" onClick={goBack} disabled={isPending}>
              {'<'}
            </Button>
          )}
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {hints.cancelButton}
          </Button>
          {step < 3 ? (
            <Button onClick={goNext} disabled={!method || isPending}>
              {hints.submitButton}
            </Button>
          ) : (
            <Button onClick={submit} disabled={isPending || !method}>
              {hints.submitButton}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
