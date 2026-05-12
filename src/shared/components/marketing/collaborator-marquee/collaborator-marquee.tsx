import Image from 'next/image';
import Link from 'next/link';

export type CollaboratorLogo = {
  key: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type CollaboratorMarqueeProps = {
  title: string;
  logos: CollaboratorLogo[];
  ctaLabel: string;
  ctaHref: string;
};

// Infinite horizontal marquee of partner logos. Pure CSS animation via
// the [animation-marquee] keyframe defined locally in this component
// (using arbitrary values). Hover pauses, prefers-reduced-motion
// disables.
export function CollaboratorMarquee({ title, logos, ctaLabel, ctaHref }: CollaboratorMarqueeProps) {
  return (
    <section className="bg-white px-4 py-14 md:py-16">
      <div className="mx-auto max-w-[1200px] text-center">
        <h2 className="m-0 mb-8 text-[1.4rem] font-bold text-brand-text">{title}</h2>

        <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent_0,#000_6%,#000_94%,transparent_100%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0,#000_6%,#000_94%,transparent_100%)] gap-14">
          <Track logos={logos} />
          <Track logos={logos} ariaHidden />
        </div>

        <div className="mt-8">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full bg-brand-mustard px-7 py-3 text-base font-semibold text-brand-text hover:bg-brand-mustard-deep transition-colors"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes mas-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        .mas-marquee-track {
          animation: mas-marquee 32s linear infinite;
        }
        .mas-marquee-stop:hover .mas-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .mas-marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

function Track({ logos, ariaHidden = false }: { logos: CollaboratorLogo[]; ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="mas-marquee-track flex flex-none items-center gap-14 pr-14"
    >
      {logos.map((logo) => (
        <li key={logo.key} className="flex h-16 flex-none items-center justify-center">
          <Image
            src={logo.src}
            alt={ariaHidden ? '' : logo.alt}
            width={logo.width}
            height={logo.height}
            className="max-h-16 w-auto max-w-[160px] object-contain"
          />
        </li>
      ))}
    </ul>
  );
}
