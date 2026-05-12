import type { ReactNode } from 'react';

type Props = { children: ReactNode; ariaLabel?: string };

// Horizontal scroll-snap carousel for testimonial cards. Pure CSS.
export function TestimonialsCarousel({ children, ariaLabel }: Props) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className="
        flex gap-6 overflow-x-auto pb-4 -mx-1 px-1
        snap-x snap-mandatory
        [scrollbar-width:none] [-ms-overflow-style:none]
        [&::-webkit-scrollbar]:hidden
        [&>*]:snap-start [&>*]:shrink-0
        [&>*]:w-[86vw] sm:[&>*]:w-[calc(50%-12px)]
        lg:[&>*]:w-[calc((100%-48px)/3)]
      "
    >
      {children}
    </div>
  );
}
