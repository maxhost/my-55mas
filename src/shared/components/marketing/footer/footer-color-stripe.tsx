// Bottom 2×3 colored stripe under the footer. Pure presentational; cells
// receive their fill via tailwind utilities so the brand palette stays
// centralised in tokens.

const ROW1 = [
  'bg-brand-blue',         // #C5E8F2 — light accent
  'bg-brand-blue-deep',    // #5CB5E6 — sky
  'bg-white',
] as const;

const ROW2 = [
  'bg-brand-mustard',      // #FEC35A
  'bg-brand-coral',        // #F0513A
  'bg-brand-red',          // #DB1E3B
] as const;

export function FooterColorStripe() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-3">
        {ROW1.map((cls, i) => (
          <span key={i} className={`block h-1.5 sm:h-2 ${cls}`} />
        ))}
      </div>
      <div className="grid grid-cols-3">
        {ROW2.map((cls, i) => (
          <span key={i} className={`block h-1.5 sm:h-2 ${cls}`} />
        ))}
      </div>
    </div>
  );
}
