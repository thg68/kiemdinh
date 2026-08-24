type FieldProps = {
  children: React.ReactNode;
  error?: string;
  help?: string;
  label: string;
};

export function Field({ children, error, help, label }: FieldProps) {
  return (
    <label className="block text-sm font-medium text-[var(--color-charcoal)]">
      {label}
      <span className="mt-2 block">{children}</span>
      {help ? <span className="mt-1 block text-xs leading-5 text-[var(--color-graphite)]/65">{help}</span> : null}
      {error ? <span className="mt-1 block text-xs font-semibold text-[var(--color-danger)]">{error}</span> : null}
    </label>
  );
}
