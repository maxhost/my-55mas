// Decorative shapes for the FeatureRow section. Variant 'about' renders
// the donut SVG provided by the original 55+ design, positioned absolute
// against the SECTION (not the figure) so it stays flush with the page's
// left edge. The section's `overflow-hidden` clips the left half of the
// donut, giving the "peeking out" effect.

const ABOUT_DONUT_URL =
  'https://725e9d51ad7caf1033da4d1e65348273.cdn.bubble.io/f1740743310027x609174656727180000/Vector.svg';

type Props = { variant: 'about' };

export function FeatureRowShapes({ variant }: Props) {
  if (variant === 'about') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ABOUT_DONUT_URL}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute z-[1] top-1/2 -translate-y-1/2 -left-16 md:-left-20 h-[180px] w-[180px] md:h-[240px] md:w-[240px]"
      />
    );
  }
  return null;
}
