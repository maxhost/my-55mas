export function EditorSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="min-h-[300px] rounded-md border border-input bg-muted/40 animate-pulse"
    />
  );
}
