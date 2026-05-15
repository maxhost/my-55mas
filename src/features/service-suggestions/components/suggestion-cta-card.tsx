'use client';

import { useState } from 'react';
import type { CountryAdminOption } from '@/shared/lib/countries/types';
import type { CityOption } from '@/shared/lib/countries/list-active-cities';
import { SuggestionFormModal } from './suggestion-form-modal';

type Props = {
  title: string;
  body: string;
  buttonLabel: string;
  countries: CountryAdminOption[];
  cities: CityOption[];
};

// Same footprint contract as ServiceCard (h-full md:h-[535px], no
// width, rounded-xl) so CSS grid flows it into the next cell.
export function SuggestionCtaCard({
  title,
  body,
  buttonLabel,
  countries,
  cities,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex h-full flex-col justify-center rounded-xl bg-brand-coral px-8 py-10 text-white md:h-[535px]">
        <h3 className="m-0 mb-4 text-2xl font-bold">{title}</h3>
        <p className="mb-8 text-base leading-relaxed text-white/90">{body}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start rounded-full bg-brand-mustard px-6 py-3 text-base font-semibold text-brand-text transition-colors hover:bg-brand-mustard-deep"
        >
          {buttonLabel}
        </button>
      </div>
      <SuggestionFormModal
        open={open}
        onOpenChange={setOpen}
        countries={countries}
        cities={cities}
      />
    </>
  );
}
