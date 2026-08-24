type EmptyStateProps = {
  action?: React.ReactNode;
  description: string;
  title: string;
};

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div>
        <h3 className="text-base font-semibold text-[var(--color-ink-navy)]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/72">{description}</p>
      </div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
