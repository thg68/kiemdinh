type LoadingStateProps = {
  label: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="surface-card surface-card-pad grid gap-3" role="status" aria-live="polite">
      <div className="skeleton-line w-1/3" />
      <div className="skeleton-line w-2/3" />
      <span className="sr-only">{label}</span>
      <p className="text-sm text-[var(--color-graphite)]/70">{label}</p>
    </div>
  );
}
