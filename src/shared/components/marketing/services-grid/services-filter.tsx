import Link from 'next/link';

export type ServicesFilterOption = {
  key: string;
  label: string;
  href: string;
};

type Props = {
  options: ServicesFilterOption[];
  activeKey: string;
  ariaLabel?: string;
};

// Tab filter rendered as RSC links. Each option points to a URL with the
// category in searchParams (?cat=...). RSC re-renders on navigation so we
// ship zero JS for the filter itself.
export function ServicesFilter({ options, activeKey, ariaLabel }: Props) {
  return (
    <nav
      aria-label={ariaLabel}
      className="my-5 flex flex-wrap justify-start gap-2.5 md:my-7"
    >
      {options.map((opt) => {
        const isActive = opt.key === activeKey;
        const classes = isActive
          ? 'bg-brand-coral text-white border-brand-coral'
          : 'bg-white text-brand-text border-black/10 hover:border-brand-coral';
        return (
          <Link
            key={opt.key}
            href={opt.href}
            aria-current={isActive ? 'page' : undefined}
            className={`
              inline-flex h-[40.4px] items-center rounded-[10px] border-[1.5px]
              px-[18px] text-[0.95rem] font-semibold leading-none
              transition-colors
              ${classes}
            `}
          >
            {opt.label}
          </Link>
        );
      })}
    </nav>
  );
}
