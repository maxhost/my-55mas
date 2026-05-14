'use client';

export type ServicesFilterOption = {
  key: string;
  label: string;
};

type Props = {
  options: ServicesFilterOption[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel?: string;
};

// Tab filter rendered as buttons. Selecting an option fires `onSelect`
// (no navigation, no scroll jump). Callers own the URL sync (e.g. via
// `router.replace(..., { scroll: false })`).
export function ServicesFilter({
  options,
  activeKey,
  onSelect,
  ariaLabel,
}: Props) {
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
          <button
            key={opt.key}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onSelect(opt.key)}
            className={`
              inline-flex h-[40.4px] items-center rounded-[10px] border-[1.5px]
              px-[18px] text-[0.95rem] font-semibold leading-none
              transition-colors cursor-pointer
              ${classes}
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </nav>
  );
}
