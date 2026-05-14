'use client';

import { Accordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';

type Item = { id: string; question: string; answer: string };

// Public FAQ accordion. Base UI primitive handles ARIA + keyboard nav.
// `multiple` defaults to false → single-open behavior out of the box.
export function PublicFaqAccordion({ items }: { items: Item[] }) {
  return (
    <Accordion.Root className="border-t border-black/10">
      {items.map((it) => (
        <Accordion.Item
          key={it.id}
          value={it.id}
          className="border-b border-black/10"
        >
          <Accordion.Header className="m-0">
            <Accordion.Trigger
              className="
                group flex w-full items-center justify-between gap-4 py-5
                text-left text-[1.05rem] font-semibold
                text-brand-text transition-colors hover:text-brand-red
                data-[panel-open]:text-brand-red
              "
            >
              <span>{it.question}</span>
              <ChevronDown
                size={20}
                aria-hidden="true"
                className="
                  shrink-0 transition-transform
                  group-data-[panel-open]:rotate-180
                "
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            className="
              pb-5 text-[0.95rem] leading-relaxed text-brand-text
              whitespace-pre-line
            "
          >
            {it.answer}
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
