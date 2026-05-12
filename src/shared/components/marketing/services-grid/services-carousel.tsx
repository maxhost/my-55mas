import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  ariaLabel?: string;
};

// Pure-CSS horizontal carousel. Children (cards) own their own widths.
// Hidden scrollbar via Tailwind utilities — JS-free.
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
        [&>*]:snap-start
      "
    >
      {children}
    </div>
  );
}
