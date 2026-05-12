'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FiscalIdTypeOption } from '../actions/list-fiscal-id-types';
import { checkEmailStatus } from '../actions/check-email-status';
import { saveGuestContact } from '../actions/save-guest-contact';
import { FiscalIdInput } from './fiscal-id-input';

type GuestData = {
  full_name: string;
  email: string;
  phone: string;
  fiscal_id_type_id: string;
  fiscal_id: string;
};

type Props = {
  fiscalIdTypes: FiscalIdTypeOption[];
  onSaved: (userId: string) => void;
  hints: {
    title: string;
    name: string;
    email: string;
    phone: string;
    fiscalType: string;
    fiscalTypePlaceholder: string;
    fiscalNumber: string;
    fiscalNumberPlaceholder: string;
    formatError: string;
    emailRegistered: string;
    submit: string;
    error: string;
  };
};

const EMAIL_DEBOUNCE_MS = 400;

// Guest data collection: fires after signinAsGuest. Performs a debounced
// email-existence check (B1 blocking) and a save-guest-contact on submit.
// The save action also re-checks email server-side as defense-in-depth.
export function GuestContactFields({ fiscalIdTypes, onSaved, hints }: Props) {
  const [data, setData] = useState<GuestData>({
    full_name: '',
    email: '',
    phone: '',
    fiscal_id_type_id: '',
    fiscal_id: '',
  });
  const [emailBlocked, setEmailBlocked] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setEmailBlocked(false);
    if (!data.email.includes('@') || data.email.length < 5) return;
    const emailToCheck = data.email;
    setEmailChecking(true);
    debounceRef.current = setTimeout(async () => {
      const r = await checkEmailStatus({ email: emailToCheck });
      setEmailChecking(false);
      if (emailToCheck !== data.email) return; // stale response
      if ('data' in r && r.data.hasAccount) setEmailBlocked(true);
    }, EMAIL_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [data.email]);

  const canSubmit =
    !isSaving &&
    !emailBlocked &&
    !emailChecking &&
    data.full_name.trim().length > 0 &&
    data.email.includes('@') &&
    data.phone.trim().length > 0 &&
    data.fiscal_id_type_id.length > 0 &&
    data.fiscal_id.trim().length > 0;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const r = await saveGuestContact(data);
      if ('error' in r) {
        if (r.error.message === 'email_already_registered') setEmailBlocked(true);
        setError(r.error.message);
        return;
      }
      onSaved(r.data.userId);
    });
  };

  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-sm font-medium">{hints.title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="guest-name">{hints.name}</Label>
          <Input
            id="guest-name"
            value={data.full_name}
            onChange={(e) => setData((d) => ({ ...d, full_name: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest-phone">{hints.phone}</Label>
          <Input
            id="guest-phone"
            type="tel"
            value={data.phone}
            onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="guest-email">{hints.email}</Label>
        <Input
          id="guest-email"
          type="email"
          value={data.email}
          onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
          aria-invalid={emailBlocked || undefined}
          aria-describedby={emailBlocked ? 'guest-email-error' : undefined}
        />
        {emailBlocked && (
          <p id="guest-email-error" className="text-destructive text-xs">
            {hints.emailRegistered}
          </p>
        )}
      </div>
      <FiscalIdInput
        idPrefix="guest"
        options={fiscalIdTypes}
        typeId={data.fiscal_id_type_id}
        number={data.fiscal_id}
        onTypeChange={(id) => setData((d) => ({ ...d, fiscal_id_type_id: id }))}
        onNumberChange={(n) => setData((d) => ({ ...d, fiscal_id: n }))}
        hints={{
          typeLabel: hints.fiscalType,
          typePlaceholder: hints.fiscalTypePlaceholder,
          numberLabel: hints.fiscalNumber,
          numberPlaceholder: hints.fiscalNumberPlaceholder,
          formatError: hints.formatError,
        }}
      />
      {error && !emailBlocked && (
        <p className="text-destructive text-xs">
          {hints.error}: {error}
        </p>
      )}
      <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
        {isSaving ? '…' : hints.submit}
      </Button>
    </div>
  );
}
