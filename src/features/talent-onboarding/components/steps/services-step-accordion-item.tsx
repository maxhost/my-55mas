'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ServiceQuestionsRenderer,
  type AnswersMap,
} from '@/shared/components/question-renderers';
import type { AvailableService } from '../../types';

type QuestionHints = {
  yes: string;
  no: string;
  fileTooLarge: string;
  fileWrongType: string;
};

type Hints = {
  suggestedPriceLabel: string;
  overridePriceLabel: string;
  customPriceLabel: string;
  questionHints: QuestionHints;
};

type Props = {
  service: AvailableService;
  unitPrice: number;
  overridePrice: boolean;
  suggestedPrice: number | null;
  answers: AnswersMap;
  locale: string;
  hints: Hints;
  onOverrideToggle: (checked: boolean) => void;
  onUnitPriceChange: (value: number) => void;
  onAnswersChange: (answers: AnswersMap) => void;
};

export function ServicesStepAccordionItem({
  service,
  unitPrice,
  overridePrice,
  suggestedPrice,
  answers,
  locale,
  hints,
  onOverrideToggle,
  onUnitPriceChange,
  onAnswersChange,
}: Props) {
  const [open, setOpen] = useState(true);

  const overrideId = `override-${service.id}`;
  const priceId = `price-${service.id}`;

  return (
    <div className="rounded-md border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="hover:bg-muted/50 flex w-full items-center gap-2 p-3 text-left text-sm"
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="font-medium">{service.name}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t p-3">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {hints.suggestedPriceLabel}:{' '}
              {suggestedPrice !== null ? `${suggestedPrice} €` : '—'}
            </p>

            <Label className="flex items-center gap-2 text-sm font-normal">
              <Checkbox
                id={overrideId}
                checked={overridePrice}
                onCheckedChange={(c) => onOverrideToggle(Boolean(c))}
              />
              <span>{hints.overridePriceLabel}</span>
            </Label>

            {overridePrice && (
              <div className="space-y-1.5">
                <Label htmlFor={priceId}>{hints.customPriceLabel}</Label>
                <Input
                  id={priceId}
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number.isFinite(unitPrice) ? unitPrice : 0}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    onUnitPriceChange(Number.isFinite(n) ? n : 0);
                  }}
                />
              </div>
            )}
          </div>

          <ServiceQuestionsRenderer
            questions={service.talent_questions}
            answers={answers}
            onChange={onAnswersChange}
            locale={locale}
            assignedGroups={service.assignedGroups}
            hints={hints.questionHints}
            errors={undefined}
          />
        </div>
      )}
    </div>
  );
}
