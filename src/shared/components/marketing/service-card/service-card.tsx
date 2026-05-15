import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';

export type ServiceCardProps = {
  href: string;
  imageSrc: string;
  imageAlt: string;
  category: {
    label: string;
    /** Coral by default; pass 'salmon' for the lighter accent. */
    tone?: 'coral' | 'salmon';
  };
  title: string;
  bullets: string[];
};

// Agnostic service card. The outer footprint (width/shrink) is owned by
// the layout container (ServicesCarousel or ServicesGrid) — the card only
// describes its content + internal styling. 535px desktop height matches
// the original 55mas.es spec and keeps rows uniform in both layouts.
export function ServiceCard({ href, imageSrc, imageAlt, category, title, bullets }: ServiceCardProps) {
  const badgeColor =
    category.tone === 'salmon' ? 'bg-brand-salmon' : 'bg-brand-coral';

  return (
    <Link
      href={href}
      className="
        flex flex-col overflow-hidden rounded-xl bg-white
        border border-black/10 shadow-[0_2px_8px_rgba(23,31,70,0.06)]
        transition-[transform,box-shadow] duration-200
        hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(23,31,70,0.12)]
        h-full md:h-[535px]
      "
    >
      <div className="relative h-60 w-full flex-shrink-0 md:h-[280px]">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 400px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col px-[18px] pb-5 pt-4">
        <span
          className={`mb-2 inline-block self-start rounded-md ${badgeColor} px-2.5 py-1 text-[0.72rem] font-semibold text-white`}
        >
          {category.label}
        </span>
        <h3 className="m-0 mb-2.5 text-base font-bold text-brand-text md:text-[1.05rem]">
          {title}
        </h3>
        <ul className="grid gap-1 text-[0.86rem] text-brand-text/75">
          {bullets.map((b, i) => (
            <li key={i}>
              <span className="mr-1 text-brand-coral">•</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
