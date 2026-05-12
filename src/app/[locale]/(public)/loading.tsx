// Public-section loading skeleton. Lightweight intentionally — header
// and footer already paint via parent layout before this lands.
export default function PublicLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center bg-brand-cream"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-mustard border-t-brand-coral" />
        <span className="sr-only">Cargando…</span>
      </div>
    </div>
  );
}
