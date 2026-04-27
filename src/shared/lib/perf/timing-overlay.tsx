import type { Timing } from './server-timing';

// Overlay visual con los timings server-side. Se renderiza solo si la
// query string trae `?perf=1` para no contaminar UX normal.
//
// Uso:
//   const timings: Timing[] = [];
//   const data = await time(timings, 'query', () => ...);
//   ...
//   <TimingOverlay timings={timings} searchParams={searchParams} />
export function TimingOverlay({
  timings,
  searchParams,
}: {
  timings: Timing[];
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const enabled = searchParams?.perf === '1';
  if (!enabled) return null;
  const total = timings.reduce((acc, [, d]) => acc + d, 0);
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs space-y-1 rounded-md bg-black/80 p-3 font-mono text-xs text-white shadow-lg">
      <div className="font-bold border-b border-white/20 pb-1 mb-1">
        ⏱ Server timings
      </div>
      {timings.map(([name, dur], i) => (
        <div key={i} className="flex justify-between gap-3">
          <span>{name}</span>
          <span className={dur > 200 ? 'text-red-300' : 'text-green-300'}>
            {dur.toFixed(0)}ms
          </span>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-white/20 pt-1 mt-1 font-bold">
        <span>total</span>
        <span>{total.toFixed(0)}ms</span>
      </div>
    </div>
  );
}
