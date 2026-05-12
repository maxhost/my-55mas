// Decorative shapes around the hero. The composition matches the
// static-mockups/55mas-home recon: salmon ring + salmon disc bleeding
// off the left edge, yellow dot top-center, yellow strip right edge,
// light blue rect bottom-left, coral strip mid-right. All shapes are
// pure CSS (no images). z-index 0 so they always sit BEHIND content
// (which is z-index 2 in <Hero>).

export function HeroDecorations() {
  return (
    <>
      {/* Salmon outline ring — hidden on mobile per design request,
          visible only from md+. */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          hidden md:block
          md:top-[6%] md:-left-[150px]
          md:h-[220px] md:w-[220px] md:rounded-full
          md:border-[32px] md:border-brand-salmon
        "
      />
      {/* Salmon solid disc — kept on mobile and desktop; small enough
          to not collide with the headline. */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          top-[56%] -left-[30px]
          h-[64px] w-[64px] rounded-full
          bg-brand-salmon
          md:top-[58%] md:-left-[36px]
          md:h-[70px] md:w-[70px]
        "
      />
      {/* Yellow dot — hidden on mobile per design request, visible md+. */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          hidden md:block
          md:top-[8%] md:right-[48%] md:h-9 md:w-9 md:rounded-full
          md:bg-brand-mustard
        "
      />
      {/* Yellow vertical strip — right edge (desktop only) */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          hidden md:block
          top-[14%] right-[1%]
          h-20 w-6 bg-brand-mustard
        "
      />
      {/* Light blue horizontal rect — bottom left */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          bottom-[8%] left-0
          h-[22px] w-[60px]
          bg-brand-blue
          md:bottom-[12%] md:left-[1%] md:h-7 md:w-[90px]
        "
      />
      {/* Coral vertical rect — mid right edge */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute z-0
          top-[50%] right-0
          h-[50px] w-[18px]
          bg-brand-coral
          md:top-[66%] md:h-[70px] md:w-[22px]
        "
      />
    </>
  );
}
