'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveOrderAddress } from '../../../actions/save-order-address';
import type {
  AddressValues,
  ServiceTabContext,
  ServiceTabHints,
} from '../../../types';
import { Field, SectionShell } from './service-tab';

const NONE_VALUE = '__none__';

type Props = {
  orderId: string;
  data: AddressValues;
  context: ServiceTabContext;
  hints: ServiceTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
  readOnly?: boolean;
};

export function AddressSection({
  orderId,
  data,
  context,
  hints,
  open,
  onToggle,
  onSaved,
  onDirtyChange,
  readOnly = false,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AddressValues>(data);
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

  const cityMap = useMemo(
    () => new Map(context.cities.map((c) => [c.id, c])),
    [context.cities],
  );
  const countryMap = useMemo(
    () => new Map(context.countries.map((c) => [c.id, c.name])),
    [context.countries],
  );

  const currentCity = data.service_city_id ? cityMap.get(data.service_city_id) : null;
  const currentCityName = currentCity?.name ?? null;
  const currentCountryName = currentCity ? countryMap.get(currentCity.country_id) ?? null : null;

  const previewText =
    [data.service_address, currentCityName, data.service_postal_code]
      .filter((s) => s && s.length > 0)
      .join(' · ') || hints.notProvided;

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveOrderAddress({
        orderId,
        service_address: form.service_address,
        service_city_id: form.service_city_id,
        service_postal_code: form.service_postal_code,
      });
      if ('error' in res) {
        toast.error(res.error.message || hints.section.saveError);
        return;
      }
      toast.success(hints.section.saveSuccess);
      setEditing(false);
      onDirtyChange(false);
      onSaved();
    });
  };

  const setField = <K extends keyof AddressValues>(k: K, v: AddressValues[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const cityLabelMap = new Map(context.cities.map((c) => [c.id, c.name]));

  const readMode = (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label={hints.addressLabel} value={data.service_address} fallback={hints.notProvided} />
      <Field label={hints.countryLabel} value={currentCountryName} fallback={hints.notProvided} />
      <Field label={hints.cityLabel} value={currentCityName} fallback={hints.notProvided} />
      <Field label={hints.postalCodeLabel} value={data.service_postal_code} fallback={hints.notProvided} />
    </dl>
  );

  const editMode = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor="addr-street">{hints.addressLabel}</Label>
        <Input
          id="addr-street"
          value={form.service_address ?? ''}
          onChange={(e) => setField('service_address', e.target.value || null)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{hints.cityLabel}</Label>
        <Select
          value={form.service_city_id ?? NONE_VALUE}
          onValueChange={(v) =>
            setField('service_city_id', v === NONE_VALUE ? null : (v ?? null))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={hints.notProvided}>
              {(v) =>
                v === NONE_VALUE || !v
                  ? hints.notProvided
                  : cityLabelMap.get(v as string) ?? hints.notProvided
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{hints.notProvided}</SelectItem>
            {context.cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="addr-postal">{hints.postalCodeLabel}</Label>
        <Input
          id="addr-postal"
          value={form.service_postal_code ?? ''}
          onChange={(e) => setField('service_postal_code', e.target.value || null)}
        />
      </div>
    </div>
  );

  return (
    <SectionShell
      title={hints.addressTitle}
      open={open}
      onToggle={onToggle}
      editing={editing}
      onStartEdit={() => {
        setForm(data);
        setEditing(true);
      }}
      onCancelEdit={() => {
        setForm(data);
        setEditing(false);
        onDirtyChange(false);
      }}
      onSave={handleSave}
      saving={isPending}
      readOnly={readOnly}
      sectionHints={hints.section}
      previewText={previewText}
      readMode={readMode}
      editMode={editMode}
    />
  );
}
