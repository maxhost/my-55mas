export type TestimonialCardProps = {
  roleLabel: string;          // e.g. "Cliente"
  rating: number;             // 0-5; rendered as N filled stars
  quote: string;
  author: { name: string; initial?: string };
};

export function TestimonialCard({ roleLabel, rating, quote, author }: TestimonialCardProps) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  const initial = author.initial ?? author.name.charAt(0).toUpperCase();
  return (
    <article
      className="
        flex flex-col rounded-[18px] bg-white
        border border-black/10 shadow-[0_2px_8px_rgba(23,31,70,0.06)]
        px-7 pt-7 pb-6 text-center min-h-[280px]
      "
    >
      <span className="mb-2.5 text-[1.1rem] font-bold text-brand-text">{roleLabel}</span>
      <div
        className="mb-6 text-[1.4rem] tracking-[2px] text-brand-blue-deep"
        aria-label={`${clamped} de 5 estrellas`}
      >
        {'★'.repeat(clamped)}
        <span className="text-brand-blue/30">{'★'.repeat(5 - clamped)}</span>
      </div>
      <p className="mb-6 flex-1 text-left text-[0.95rem] italic text-brand-text leading-relaxed">
        {quote}
      </p>
      <footer className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="
            inline-flex h-9 w-9 items-center justify-center
            rounded-full bg-brand-blue text-brand-text
            text-[0.95rem] font-bold
          "
        >
          {initial}
        </span>
        <span className="text-[0.95rem] font-bold text-brand-text">{author.name}</span>
      </footer>
    </article>
  );
}
