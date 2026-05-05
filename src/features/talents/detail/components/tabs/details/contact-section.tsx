'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocomplete, type AddressValue } from '@/shared/components/address-autocomplete';
import { saveTalentContact } from '../../../actions/save-contact';
import type { ContactValues, DetailsTabHints, TalentDetailContext } from '../../../types';
import { Field, SectionShell } from './details-tab';

type Props = {
  talentId: string;
  data: ContactValues;
  context: TalentDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

const PREFERRED_CONTACT_OPTIONS = ['email', 'phone', 'whatsapp'] as const;
const NONE_VALUE = '__none__';
const EMPTY_ADDRESS: AddressValue = {
  street: '', postal_code: '', lat: null, lng: null, mapbox_id: null,
  raw_text: '', country_code: '', city_name: '',
};

export function ContactSection({
  talentId, data, context, hints, locale, open, onToggle, onSaved, onDirtyChange,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ContactValues>(data);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm(data);
  }, [data]);

  const dirty = useMemo(
    () => editing && JSON.stringify(form) !== JSON.stringify(data),
    [editing, form, data],
  );

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const countryName = data.preferred_country
    ? context.countries.find((c) => c.id === data.preferred_country)?.name ?? null
    : null;
  const cityName = data.preferred_city
    ? context.cities.find((c) => c.id === data.preferred_city)?.name ?? null
    : null;

  const previewParts = [data.email, data.phone, [countryName, cityName].filter(Boolean).join(' ')]
    .filter((s) => s && s.length > 0);
  const previewText = previewParts.length > 0 ? previewParts.join(' · ') : hints.empty;

  const countryCodesForAutocomplete = useMemo(() => {
    const code = context.countries.find((c) => c.id === form.preferred_country)?.code;
    return code ? [code] : [];
  }, [context.countries, form.preferred_country]);

  const citiesForCountry = useMemo(
    () => context.cities.filter((c) => c.country_id === form.preferred_country),
    [context.cities, form.preferred_country],
  );

  const handleSave = () => {
    startTransition(async () => {
      const payload = { talentId, ...form, address: normalizeAddress(form.address) };
      const res = await saveTalentContact(payload);
      if ('error' in res) { toast.error(res.error.message || hints.section.saveError); return; }
      toast.success(hints.section.saveSuccess);
      setEditing(false); onDirtyChange(false); onSaved();
    });
  };

  function normalizeAddress(addr: AddressValue | null): AddressValue | null {
    if (!addr) return null;
    const isEmpty = !addr.raw_text && !addr.street && !addr.postal_code && !addr.mapbox_id;
    return isEmpty ? null : addr;
  }

  const readMode = (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={hints.emailLabel} value={data.email} fallback={hints.notProvided} />
      <Field label={hints.phoneLabel} value={data.phone} fallback={hints.notProvided} />
      <Field label={hints.preferredContactLabel} value={data.preferred_contact} fallback={hints.notProvided} />
      <Field label={hints.addressLabel} value={data.address?.raw_text ?? null} fallback={hints.notProvided} />
      <Field label={hints.countryLabel} value={countryName} fallback={hints.notProvided} />
      <Field label={hints.cityLabel} value={cityName} fallback={hints.notProvided} />
    </dl>
  );

  const setField = <K extends keyof ContactValues>(k: K, v: ContactValues[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const renderSelect = (
    label: string, value: string | null, onChange: (v: string | null) => void,
    options: { value: string; label: string }[], disabled = false,
  ) => {
    const labelMap = new Map(options.map((o) => [o.value, o.label]));
    return (
      <div className="flex flex-col gap-1.5">
        <Label>{label}</Label>
        <Select
          value={value ?? NONE_VALUE}
          onValueChange={(v) => onChange(v === NONE_VALUE ? null : (v ?? null))}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided}>
              {(v) =>
                v === NONE_VALUE || !v
                  ? hints.notProvided
                  : labelMap.get(v as string) ?? hints.notProvided
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{hints.notProvided}</SelectItem>
            {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ct-email">{hints.emailLabel}</Label>
        <Input
          id="ct-email"
          type="email"
          value={form.email ?? ''}
          onChange={(e) => setField('email', e.target.value || null)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ct-phone">{hints.phoneLabel}</Label>
        <Input
          id="ct-phone"
          value={form.phone ?? ''}
          onChange={(e) => setField('phone', e.target.value || null)}
        />
      </div>
      {renderSelect(
        hints.preferredContactLabel,
        form.preferred_contact,
        (v) => setField('preferred_contact', v),
        PREFERRED_CONTACT_OPTIONS.map((o) => ({ value: o, label: o })),
      )}
      {renderSelect(
        hints.countryLabel,
        form.preferred_country,
        (v) => setForm((s) => ({ ...s, preferred_country: v, preferred_city: null })),
        context.countries.map((c) => ({ value: c.id, label: c.name })),
      )}
      {renderSelect(
        hints.cityLabel,
        form.preferred_city,
        (v) => setField('preferred_city', v),
        citiesForCountry.map((c) => ({ value: c.id, label: c.name })),
        !form.preferred_country,
      )}
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label>{hints.addressLabel}</Label>
        <AddressAutocomplete
          value={form.address ?? EMPTY_ADDRESS}
          onChange={(value) => setField('address', value)}
          countryCodes={countryCodesForAutocomplete}
          language={locale}
        />
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.contactTitle}
      open={open} onToggle={onToggle} editing={editing}
      onStartEdit={() => { setForm(data); setEditing(true); }}
      onCancelEdit={() => { setForm(data); setEditing(false); onDirtyChange(false); }}
      onSave={handleSave} saving={isPending}
      hints={hints} previewText={previewText} readMode={readMode} editMode={editMode}
    />
  );
}

