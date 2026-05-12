import Link from 'next/link';

export type JoinCtaButton = {
  label: string;
  href: string;
  variant: 'mustard' | 'outlined';
};

export type JoinCtaProps = {
  title: string;
  buttons: JoinCtaButton[];
};

const VARIANTS = {
  mustard: 'bg-brand-mustard text-brand-text hover:bg-brand-mustard-deep',
  outlined: 'bg-white text-brand-text border-2 border-brand-mustard hover:bg-brand-mustard',
} as const;

export function JoinCta({ title, buttons }: JoinCtaProps) {
  return (
    <section
      className="
        relative overflow-hidden bg-brand-cream
        px-4 py-24 md:py-32
      "
      aria-label={title}
    >
      {/* Decorations */}
      <span aria-hidden="true" className="pointer-events-none absolute z-0 top-5 left-[22%] h-16 w-7 bg-brand-coral md:top-14 md:left-1/4" />
      <span aria-hidden="true" className="pointer-events-none absolute z-0 top-7 right-[8%] h-8 w-20 bg-brand-blue md:top-16 md:right-6" />
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          top-1/2 -left-[90px] -translate-y-1/2
          h-[180px] w-[180px] rounded-full
          border-[36px] border-brand-blue-deep
          md:-left-[120px] md:h-[240px] md:w-[240px] md:border-[48px]
        "
      />
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          -bottom-[90px] -right-[80px]
          h-[200px] w-[200px] rounded-full
          border-[40px] border-brand-coral
          md:-bottom-[120px] md:-right-[100px] md:h-[260px] md:w-[260px] md:border-[52px]
        "
      />

      <div className="relative z-[2] mx-auto max-w-[880px] text-center">
        <h2 className="m-0 mb-9 text-[1.8rem] font-bold leading-[1.35] text-brand-text md:text-[2.2rem]">
          {title}
        </h2>
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:flex-wrap md:items-center md:justify-center">
          {buttons.map((btn, i) => (
            <Link
              key={i}
              href={btn.href}
              className={`
                inline-flex items-center justify-center
                rounded-full px-7 py-3.5
                text-base font-semibold
                transition-colors
                w-full md:w-auto md:whitespace-nowrap
                ${VARIANTS[btn.variant]}
              `}
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
