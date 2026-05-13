import Image from 'next/image';
import Link from 'next/link';
import { FeatureRowShapes } from './feature-row-shapes';

export type FeatureRowMedia =
  | { type: 'image'; src: string; alt: string; width: number; height: number }
  | { type: 'video'; src: string; title: string };

export type FeatureRowBackground = 'white' | 'cream';

export type FeatureRowCta = {
  label: string;
  href: string;
  variant?: 'mustard' | 'coral';
};

export type FeatureRowProps = {
  title: string;
  /** Optional descriptive paragraph under the heading. */
  lead?: string;
  media: FeatureRowMedia;
  /** Reverses column order: false → media left / text right (default). */
  reversed?: boolean;
  /** Optional list of items rendered as a check-bulleted list. */
  bullets?: string[];
  /** Optional decorative shapes behind the media. */
  shapeVariant?: 'about';
  /** Section background. Default 'white'. */
  background?: FeatureRowBackground;
  /** Optional call-to-action button rendered below the text. */
  cta?: FeatureRowCta;
};

const SECTION_BACKGROUNDS: Record<FeatureRowBackground, string> = {
  white: 'bg-white',
  cream: 'bg-brand-cream',
};

const CTA_VARIANTS: Record<NonNullable<FeatureRowCta['variant']>, string> = {
  mustard: 'bg-brand-mustard text-brand-text hover:bg-brand-mustard-deep',
  coral: 'bg-brand-coral text-white hover:bg-brand-coral-deep',
};

// Agnostic two-column "feature row" used on the /sobre-55 about page.
// Pairs an image or video with a heading + optional lead + optional bullets.
// No CTA on purpose — the about page sections do not carry one.
export function FeatureRow({
  title,
  lead,
  media,
  reversed = false,
  bullets,
  shapeVariant,
  background = 'white',
  cta,
}: FeatureRowProps) {
  const hasBullets = bullets !== undefined && bullets.length > 0;
  const ctaVariant = cta?.variant ?? 'mustard';
  return (
    <section
      className={`relative overflow-hidden px-4 py-12 md:px-6 md:py-20 ${SECTION_BACKGROUNDS[background]}`}
    >
      {shapeVariant && <FeatureRowShapes variant={shapeVariant} />}
      <div className="relative z-[2] mx-auto grid max-w-[1200px] items-center gap-7 md:grid-cols-2 md:gap-14">
        <figure className={`relative m-0 ${reversed ? 'md:order-2' : ''}`}>
          {media.type === 'image' ? (
            <Image
              src={media.src}
              alt={media.alt}
              width={media.width}
              height={media.height}
              className="relative z-[2] mx-auto block h-auto w-full max-w-[260px] md:max-w-[300px] rounded-xl object-cover"
            />
          ) : (
            <div className="relative z-[2] aspect-video overflow-hidden rounded-xl bg-black shadow-[0_6px_24px_rgba(23,31,70,0.10)]">
              <iframe
                src={media.src}
                title={media.title}
                loading="lazy"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="block h-full w-full border-0"
              />
            </div>
          )}
        </figure>

        <div className={`relative z-[2] ${reversed ? 'md:order-1' : ''}`}>
          <h2 className="m-0 mb-3 text-2xl font-bold text-brand-text md:text-[2rem]">
            {title}
          </h2>
          {lead && <p className="mb-5 text-brand-text/75">{lead}</p>}
          {hasBullets && (
            <ul className="mb-6 grid gap-3">
              {bullets!.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base">
                  <CheckIcon className="mt-1 h-4 w-4 flex-shrink-0 text-brand-red" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {cta && (
            <Link
              href={cta.href}
              className={`
                inline-flex items-center justify-center
                rounded-full px-7 py-3.5
                text-base font-semibold transition-colors
                w-full md:w-auto md:whitespace-nowrap
                ${CTA_VARIANTS[ctaVariant]}
              `}
            >
              {cta.label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408L8.5 12.092l6.796-6.796a1 1 0 011.408 0z"
      />
    </svg>
  );
}
