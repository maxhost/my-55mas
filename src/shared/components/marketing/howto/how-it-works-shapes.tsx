// Decorative shapes around the howto image. Two variants per the
// mockup: 'talents' (image left) and 'clients' (image right). z-index 1
// so they sit behind the image (z-2). All sizes match the recon.

type Props = { variant: 'talents' | 'clients' };

export function HowItWorksShapes({ variant }: Props) {
  if (variant === 'talents') {
    return (
      <>
        {/* coral vertical rect peeking from top-left corner */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] -top-[22px] left-[28px] h-[60px] w-[18px] bg-brand-coral"
        />
        {/* light-blue horizontal rect peeking from bottom-left corner */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] -bottom-[14px] -left-[22px] h-[26px] w-[78px] bg-brand-blue"
        />
        {/* yellow right half-disc bulging from the right edge */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] top-1/2 -right-[40px] h-[160px] w-20 -translate-y-1/2 bg-brand-mustard rounded-r-[80px]"
        />
      </>
    );
  }
  // clients — both shapes hidden on mobile per design feedback.
  return (
    <>
      {/* light-blue horizontal rect peeking from top-right corner */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-[1] hidden md:block -top-4 right-9 h-[26px] w-[78px] bg-brand-blue"
      />
      {/* coral ring bottom-left: 150x150 with 24px border, peeks from under-left */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-[1] hidden md:block -bottom-14 -left-14 h-[150px] w-[150px] rounded-full border-[24px] border-brand-coral"
      />
    </>
  );
}
