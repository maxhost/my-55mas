import Image from 'next/image';
import Link from 'next/link';

export type ProjectSectionProps = {
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  /** Optional external URL the image links to (e.g. an article on RTVE). */
  imageHref?: string;
  /** When true, opens imageHref in a new tab with rel=noopener noreferrer. */
  imageOpensInNewTab?: boolean;
  title: string;
  lead: string;
  cta: { label: string; href: string };
};

export function ProjectSection({
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  imageHref,
  imageOpensInNewTab,
  title,
  lead,
  cta,
}: ProjectSectionProps) {
  const imageEl = (
    <Image
      src={imageSrc}
      alt={imageAlt}
      width={imageWidth}
      height={imageHeight}
      className="block h-full w-full rounded-xl object-cover"
    />
  );

  return (
    <section className="bg-white px-4 py-12 md:px-6 md:py-20">
      <div className="mx-auto grid max-w-[1200px] items-center gap-7 md:grid-cols-[1.1fr_1fr] md:gap-14">
        <figure className="m-0">
          {imageHref ? (
            <Link
              href={imageHref}
              target={imageOpensInNewTab ? '_blank' : undefined}
              rel={imageOpensInNewTab ? 'noopener noreferrer' : undefined}
              className="block overflow-hidden rounded-xl transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(23,31,70,0.12)]"
            >
              {imageEl}
            </Link>
          ) : (
            imageEl
          )}
        </figure>
        <div>
          <h2 className="m-0 mb-3 text-2xl font-bold text-brand-text md:text-[2rem]">
            {title}
          </h2>
          <p className="mb-5 text-brand-text/75">{lead}</p>
          <Link
            href={cta.href}
            className="
              inline-flex items-center justify-center
              rounded-full bg-brand-mustard px-7 py-3.5
              text-base font-semibold text-brand-text
              hover:bg-brand-mustard-deep transition-colors
            "
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
