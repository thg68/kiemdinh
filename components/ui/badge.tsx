type BadgeTone = "default" | "danger" | "success" | "warning";

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
};

const toneClassName: Record<BadgeTone, string> = {
  danger: "bg-white/85 text-[var(--color-danger)]",
  default: "bg-[var(--color-lavender-mist)] text-[var(--color-ink-navy)]",
  success: "bg-white/85 text-[var(--color-success)]",
  warning: "bg-white/85 text-[var(--color-warning)]",
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClassName[tone]}`}>
      {children}
    </span>
  );
}
