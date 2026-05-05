'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { saveTalentServices } from '../../../actions/save-talent-services';
import type { DetailsTabHints, TalentDetailContext, TalentServiceRow } from '../../../types';
import { SectionShell } from './details-tab';

type Props = {
  talentId: string;
  data: TalentServiceRow[];
  context: TalentDetailContext;
  hints: DetailsTabHints;
  locale: string;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
  talentCountryId: string | null;
};

type EditEntry = { service_id: string; unit_price: number; answers: Record<string, unknown> };
const ADD_PLACEHOLDER = '__add__';

export function TalentServicesSection({
  talentId, data, context, hints, open, onToggle, onSaved, onDirtyChange, talentCountryId,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [entries, setEntries] = useState<EditEntry[]>(() => toEntries(data));
  const [isPending, startTransition] = useTransition();

  useEffect(() => { setEntries(toEntries(data)); }, [data]);

  const dirty = useMemo(() => {
    if (!sheetOpen) return false;
    return JSON.stringify(toEntries(data)) !== JSON.stringify(entries);
  }, [sheetOpen, entries, data]);

  useEffect(() => { onDirtyChange(dirty); }, [dirty, onDirtyChange]);

  const previewText = data.length === 0
    ? hints.empty : `${data.length} · ${data[0]?.service_name ?? ''}`;

  const usedIds = new Set(entries.map((e) => e.service_id));
  const addableServices = context.availableServices.filter((s) => !usedIds.has(s.id));

  const addService = (id: string) => {
    const svc = context.availableServices.find((s) => s.id === id);
    if (!svc) return;
    setEntries((prev) => [...prev, { service_id: svc.id, unit_price: svc.suggested_price ?? 0, answers: {} }]);
  };
  const updatePrice = (id: string, price: number) =>
    setEntries((prev) => prev.map((e) => (e.service_id === id ? { ...e, unit_price: price } : e)));
  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.service_id !== id));

  const handleSave = () => {
    if (!talentCountryId) return;
    startTransition(async () => {
      const res = await saveTalentServices({ talentId, countryId: talentCountryId, entries });
      if ('error' in res) { toast.error(res.error.message || hints.section.saveError); return; }
      toast.success(hints.section.saveSuccess);
      setSheetOpen(false); onDirtyChange(false); onSaved();
    });
  };

  const readMode =
    data.length === 0 ? (
      <p className="text-sm text-muted-foreground">{hints.empty}</p>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{hints.talentServicesTitle}</TableHead>
            <TableHead>{hints.countryLabel}</TableHead>
            <TableHead className="text-right">{hints.unitPriceLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={`${row.service_id}-${row.country_id}`}>
              <TableCell>{row.service_name ?? row.service_id}</TableCell>
              <TableCell>{row.country_name ?? '—'}</TableCell>
              <TableCell className="text-right">{row.unit_price.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

  return (
    <>
      <SectionShell
        title={hints.talentServicesTitle}
        open={open} onToggle={onToggle} editing={false}
        onStartEdit={() => setSheetOpen(true)}
        onCancelEdit={() => undefined} onSave={() => undefined}
        saving={false} canEdit={!!talentCountryId}
        hints={{ ...hints, section: { ...hints.section, editLabel: hints.servicesEditButton } }}
        previewText={previewText}
        readMode={
          <>
            {readMode}
            {!talentCountryId && (
              <p className="text-xs text-amber-600">El talento no tiene país asignado</p>
            )}
          </>
        }
        editMode={null}
      />
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-lg">
          <SheetHeader><SheetTitle>{hints.servicesEditTitle}</SheetTitle></SheetHeader>
          <div className="flex flex-1 flex-col gap-3 px-4">
            {entries.length === 0 && <p className="text-sm text-muted-foreground">{hints.empty}</p>}
            {entries.map((e) => (
              <EntryRow
                key={e.service_id} entry={e}
                serviceName={context.availableServices.find((s) => s.id === e.service_id)?.name ?? e.service_id}
                priceLabel={hints.unitPriceLabel}
                removeLabel={hints.servicesRemoveButton}
                onPrice={(p) => updatePrice(e.service_id, p)}
                onRemove={() => removeEntry(e.service_id)}
              />
            ))}
            {addableServices.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>{hints.servicesAddButton}</Label>
                <Select
                  value={ADD_PLACEHOLDER}
                  onValueChange={(v) => v && v !== ADD_PLACEHOLDER && addService(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={hints.servicesAddButton}>
                      {() => hints.servicesAddButton}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ADD_PLACEHOLDER} disabled>
                      <Plus className="mr-1.5 inline size-3.5" />
                      {hints.servicesAddButton}
                    </SelectItem>
                    {addableServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setSheetOpen(false)} disabled={isPending}>
              {hints.section.cancelLabel}
            </Button>
            <Button onClick={handleSave} disabled={isPending || !talentCountryId}>
              {hints.section.saveLabel}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function EntryRow({ entry, serviceName, priceLabel, removeLabel, onPrice, onRemove }: {
  entry: EditEntry; serviceName: string; priceLabel: string; removeLabel: string;
  onPrice: (p: number) => void; onRemove: () => void;
}) {
  return (
    <div className="flex items-end gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-medium">{serviceName}</span>
        <Label htmlFor={`price-${entry.service_id}`} className="text-xs">{priceLabel}</Label>
        <Input
          id={`price-${entry.service_id}`}
          type="number" step="0.01" min="0" value={entry.unit_price}
          onChange={(ev) => onPrice(Number(ev.target.value) || 0)}
        />
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={removeLabel}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function toEntries(rows: TalentServiceRow[]): EditEntry[] {
  return rows.map((r) => ({ service_id: r.service_id, unit_price: r.unit_price, answers: r.answers ?? {} }));
}
