import Link from 'next/link';
import { HeroDecorations } from './hero-decorations';

export type HeroCta = {
  id: string;
  /** Small bold label above the button (e.g. "Para Clientes:"). */
  prefix?: string;
  buttonLabel: string;
  href: string;
  variant: 'mustard' | 'outlined';
};

export type HeroMedia =
  | { type: 'video'; src: string; title: string }
  | { type: 'image'; src: string; alt: string };

export type HeroProps = {
  /** Title parts. "before" + "accent" + "after" rendered inline; only
   *  the accent gets the coral color treatment. Use blank strings if
   *  you don't need one of the parts. */
  titleBefore?: string;
  titleAccent?: string;
  titleAfter?: string;
  lead: string;
  ctas: HeroCta[];
  media: HeroMedia;
};

const CTA_BUTTON_VARIANTS: Record<HeroCta['variant'], string> = {
  mustard:
    'bg-brand-mustard text-brand-text hover:bg-brand-mustard-deep',
  outlined:
    'bg-white text-brand-text border-2 border-brand-mustard hover:bg-brand-mustard',
};

// Public-site Hero (RSC). Two-column grid on desktop, stacked on mobile.
// Background cream + min-height = viewport minus header + navbar.
// All decorations live behind content (z-index 0); content sits at z-2.
export function Hero({ titleBefore, titleAccent, titleAfter, lead, ctas, media }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-cream">
      <HeroDecorations />

      <div className="
        relative mx-auto grid w-full max-w-[1200px]
        items-center gap-7 px-4 py-12 md:px-6 md:py-16
        md:grid-cols-[1.1fr_1fr] md:py-20
        min-h-[calc(100vh-119px)]
      ">
        <div className="relative z-[2]">
          <h1 className="
            mb-4 text-3xl font-bold leading-[1.15] text-brand-text
            md:text-[2.6rem] lg:text-5xl
          ">
            {titleBefore && <>{titleBefore} </>}
            {titleAccent && <span className="text-brand-coral">{titleAccent}</span>}
            {titleAfter && <> {titleAfter}</>}
          </h1>
          <p className="mb-6 max-w-[50ch] text-base text-brand-text/75 md:text-[0.98rem]">
            {lead}
          </p>
          <div className="flex flex-col gap-6">
            {ctas.map((cta) => (
              <div key={cta.id} className="flex flex-col items-start gap-2.5">
                {cta.prefix && (
                  <span className="text-[0.95rem] font-bold text-brand-text">{cta.prefix}</span>
                )}
                <Link
                  href={cta.href}
                  className={`
                    inline-flex items-center justify-center
                    rounded-full px-7 py-3.5
                    text-base font-semibold whitespace-nowrap
                    transition-colors
                    ${CTA_BUTTON_VARIANTS[cta.variant]}
                  `}
                >
                  {cta.buttonLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <figure className="relative z-[2] m-0 overflow-hidden rounded-[20px] bg-black shadow-[0_6px_24px_rgba(23,31,70,0.10)] aspect-video">
          {media.type === 'video' ? (
            <iframe
              src={media.src}
              title={media.title}
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="block h-full w-full border-0"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.src} alt={media.alt} className="block h-full w-full object-cover" />
          )}
        </figure>
      </div>
    </section>
  );
}
