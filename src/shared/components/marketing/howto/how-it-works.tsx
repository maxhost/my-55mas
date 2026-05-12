import Image from 'next/image';
import Link from 'next/link';
import { HowItWorksShapes } from './how-it-works-shapes';

export type HowItWorksStep = { num: number; label: string };

export type HowItWorksProps = {
  /** Reverses the column order: false → image left / text right (talents),
   *  true → text left / image right (clients). */
  reversed?: boolean;
  /** Optional section title rendered above the row. */
  sectionTitle?: string;
  sectionTitleAccent?: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  /** Which decorative shape set to render. */
  shapeVariant: 'talents' | 'clients';
  heading: string;
  steps: HowItWorksStep[];
  cta: { label: string; href: string; variant: 'mustard' | 'coral' };
  /** Optional cream background (matches the clients variant in the mockup). */
  withCreamBg?: boolean;
};

const CTA_VARIANTS = {
  mustard: 'bg-brand-mustard text-brand-text hover:bg-brand-mustard-deep',
  coral: 'bg-brand-coral text-white hover:bg-brand-coral-deep',
} as const;

// Two-column "how it works" section. Agnostic — used by HomeHowtoTalents
// (reversed=false, shapeVariant='talents') and HomeHowtoClients
// (reversed=true, shapeVariant='clients', withCreamBg=true).
export function HowItWorks({
  reversed = false,
  sectionTitle,
  sectionTitleAccent,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  shapeVariant,
  heading,
  steps,
  cta,
  withCreamBg = false,
}: HowItWorksProps) {
  return (
    <section
      className={`relative overflow-hidden px-4 py-12 md:px-6 md:py-20 ${withCreamBg ? 'bg-brand-cream' : 'bg-white'}`}
    >
      <div className="mx-auto max-w-[1200px]">
        {sectionTitle && (
          <h2 className="mb-7 text-center text-2xl font-bold text-brand-text md:text-[2rem]">
            {sectionTitle}
            {sectionTitleAccent && <> <span className="text-brand-coral">{sectionTitleAccent}</span></>}
          </h2>
        )}

        <div
          className={`grid items-center gap-7 md:gap-14 md:grid-cols-2`}
        >
          <figure
            className={`relative m-0 ${reversed ? 'md:order-2' : ''}`}
            style={{ aspectRatio: `${imageWidth} / ${imageHeight}` }}
          >
            <HowItWorksShapes variant={shapeVariant} />
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              className="relative z-[2] block h-full w-full rounded-xl object-cover"
            />
          </figure>

          <div className={`relative z-[2] ${reversed ? 'md:order-1' : ''}`}>
            <h3 className="mb-4 text-xl font-bold text-brand-text md:mb-5 md:text-[1.65rem]">
              {heading}
            </h3>
            <ol className="mb-6 grid gap-3">
              {steps.map((step) => (
                <li key={step.num} className="flex items-start gap-2.5 text-base">
                  <span
                    className="
                      mt-0.5 inline-flex h-6 w-6 flex-shrink-0
                      items-center justify-center rounded-md
                      bg-brand-coral text-xs font-bold text-white
                    "
                    aria-hidden="true"
                  >
                    {step.num}
                  </span>
                  <span>{step.label}</span>
                </li>
              ))}
            </ol>
            <Link
              href={cta.href}
              className={`
                inline-flex items-center justify-center
                rounded-full px-7 py-3.5
                text-base font-semibold
                transition-colors
                w-full md:w-auto md:whitespace-nowrap
                ${CTA_VARIANTS[cta.variant]}
              `}
            >
              {cta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
