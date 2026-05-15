import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  ariaLabel?: string;
};

// Pure-CSS horizontal carousel. The container owns child sizing (fixed
// widths + no-shrink) so cards stay agnostic. Hidden scrollbar via
// Tailwind utilities — JS-free.
export function ServicesCarousel({ children, ariaLabel }: Props) {
  return (
    <div
      aria-label={ariaLabel}
      role="region"
      className="
        flex gap-6 overflow-x-auto pb-4 -mx-1 px-1
        snap-x snap-mandatory
        [scrollbar-width:none] [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden
        [&>*]:snap-start [&>*]:shrink-0
        [&>*]:w-[84vw] sm:[&>*]:w-[calc(50%-12px)] md:[&>*]:w-[327px]
      "
    >
      {children}
    </div>
  );
}
