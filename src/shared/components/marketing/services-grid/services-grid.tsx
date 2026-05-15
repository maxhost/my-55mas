import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  ariaLabel?: string;
};

// Responsive 3-column grid for the full services listing. Children
// (cards) stretch to fill each column track. Mirrors ServicesCarousel
// semantics (role=region) so the filter UX stays consistent.
export function ServicesGrid({ children, ariaLabel }: Props) {
  return (
    <div
      aria-label={ariaLabel}
      role="region"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {children}
    </div>
  );
}
