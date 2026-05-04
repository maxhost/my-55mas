'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { AnswersMap } from '@/shared/components/question-renderers';
import { saveServicesAndPricing } from '../../actions/save-services-and-pricing';
import type {
  AvailableService,
  OnboardingContext,
  ServicesSection,
  TalentServiceEntry,
} from '../../types';
import { ServicesStepAccordionItem } from './services-step-accordion-item';

type QuestionHints = {
  yes: string;
  no: string;
  fileTooLarge: string;
  fileWrongType: string;
};

type Hints = {
  title: string;
  pickServicesLabel: string;
  noServicesAvailable: string;
  noServiceSelected: string;
  suggestedPriceLabel: string;
  overridePriceLabel: string;
  customPriceLabel: string;
  saveAndContinue: string;
  saveAndBackToSummary: string;
  questionHints: QuestionHints;
};

type Props = {
  initial: ServicesSection;
  context: OnboardingContext;
  locale: string;
  mode: 'wizard' | 'edit';
  onSaved: () => void;
  hints: Hints;
};

type Entry = TalentServiceEntry & { suggested_price: number | null };

function buildInitialEntries(
  initial: ServicesSection,
  availableServices: AvailableService[],
): Entry[] {
  return initial.entries.map((e) => {
    const service = availableServices.find((s) => s.id === e.service_id);
    const suggested = service?.suggested_price ?? null;
    return {
      ...e,
      suggested_price: suggested,
      override_price: e.unit_price !== (suggested ?? 0),
    };
  });
}

export function ServicesStep({
  initial,
  context,
  locale,
  mode,
  onSaved,
  hints,
}: Props) {
  const [entries, setEntries] = useState<Entry[]>(() =>
    buildInitialEntries(initial, context.availableServices),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const noServices = context.availableServices.length === 0;

  const isSelected = (serviceId: string) =>
    entries.some((e) => e.service_id === serviceId);

  const toggleService = (service: AvailableService) => {
    setEntries((prev) => {
      if (prev.some((e) => e.service_id === service.id)) {
        return prev.filter((e) => e.service_id !== service.id);
      }
      const suggested = service.suggested_price ?? null;
      const newEntry: Entry = {
        service_id: service.id,
        unit_price: suggested ?? 0,
        override_price: false,
        answers: {},
        suggested_price: suggested,
      };
      return [...prev, newEntry];
    });
  };

  const updateEntry = (serviceId: string, patch: Partial<Entry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.service_id === serviceId ? { ...e, ...patch } : e)),
    );
  };

  const handleOverrideToggle = (serviceId: string, checked: boolean) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.service_id !== serviceId) return e;
        if (checked) {
          // turning override ON: keep current unit_price (or seed from suggested)
          return {
            ...e,
            override_price: true,
            unit_price: e.unit_price || (e.suggested_price ?? 0),
          };
        }
        // turning override OFF: snap unit_price back to suggested
        return {
          ...e,
          override_price: false,
          unit_price: e.suggested_price ?? 0,
        };
      }),
    );
  };

  const handleUnitPriceChange = (serviceId: string, value: number) => {
    updateEntry(serviceId, { unit_price: value });
  };

  const handleAnswersChange = (serviceId: string, answers: AnswersMap) => {
    updateEntry(serviceId, { answers });
  };

  const submit = () => {
    setError(null);
    const normalizedEntries = entries.map((e) => ({
      service_id: e.service_id,
      unit_price: e.override_price ? e.unit_price : e.suggested_price ?? 0,
      override_price: e.override_price,
      answers: e.answers,
    }));
    startTransition(async () => {
      const result = await saveServicesAndPricing({
        country_id: context.countryId,
        entries: normalizedEntries,
      });
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      onSaved();
    });
  };

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold">{hints.title}</h2>

      {noServices ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {hints.noServicesAvailable}
        </div>
      ) : (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {hints.pickServicesLabel}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {context.availableServices.map((service) => {
              const checked = isSelected(service.id);
              return (
                <Label
                  key={service.id}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm font-normal"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleService(service)}
                  />
                  <span>{service.name}</span>
                </Label>
              );
            })}
          </div>
          {entries.length === 0 && (
            <p className="text-muted-foreground text-sm">
              {hints.noServiceSelected}
            </p>
          )}
        </fieldset>
      )}

      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry) => {
            const service = context.availableServices.find(
              (s) => s.id === entry.service_id,
            );
            if (!service) return null;
            return (
              <ServicesStepAccordionItem
                key={entry.service_id}
                service={service}
                unitPrice={entry.unit_price}
                overridePrice={entry.override_price}
                suggestedPrice={entry.suggested_price}
                answers={entry.answers}
                locale={locale}
                hints={{
                  suggestedPriceLabel: hints.suggestedPriceLabel,
                  overridePriceLabel: hints.overridePriceLabel,
                  customPriceLabel: hints.customPriceLabel,
                  questionHints: hints.questionHints,
                }}
                onOverrideToggle={(c) =>
                  handleOverrideToggle(entry.service_id, c)
                }
                onUnitPriceChange={(v) =>
                  handleUnitPriceChange(entry.service_id, v)
                }
                onAnswersChange={(a) =>
                  handleAnswersChange(entry.service_id, a)
                }
              />
            );
          })}
        </div>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button
        onClick={submit}
        disabled={isPending || noServices || entries.length === 0}
        className="w-full"
      >
        {isPending
          ? '…'
          : mode === 'edit'
            ? hints.saveAndBackToSummary
            : hints.saveAndContinue}
      </Button>
    </section>
  );
}
