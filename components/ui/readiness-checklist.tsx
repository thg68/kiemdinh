import { StatusBadge } from "@/components/ui/status-badge";

export type ReadinessItem = {
  detail?: string;
  id: string;
  label: string;
  status: "blocked" | "ready" | "warning";
};

type ReadinessChecklistProps = {
  description?: string;
  items: ReadinessItem[];
  title: string;
};

const statusText: Record<ReadinessItem["status"], string> = {
  blocked: "Cần xử lý",
  ready: "Hoàn Thành",
  warning: "Cần rà soát",
};

const statusTone: Record<ReadinessItem["status"], "danger" | "success" | "warning"> = {
  blocked: "danger",
  ready: "success",
  warning: "warning",
};

export function ReadinessChecklist({
  description,
  items,
  title,
}: ReadinessChecklistProps) {
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const warningCount = items.filter((item) => item.status === "warning").length;

  return (
    <section className="surface-card overflow-hidden">
      <div className="grid gap-3 border-b border-[var(--color-border)] px-5 py-4 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">{description}</p>
          ) : null}
        </div>
        <StatusBadge tone={blockedCount > 0 ? "danger" : warningCount > 0 ? "warning" : "success"}>
          {blockedCount > 0
            ? `${blockedCount} việc cần xử lý`
            : warningCount > 0
              ? `${warningCount} việc cần rà soát`
              : "Sẵn sàng"}
        </StatusBadge>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {items.map((item) => (
          <div className="grid gap-2 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center" key={item.id}>
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-navy)]">{item.label}</p>
              {item.detail ? (
                <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">{item.detail}</p>
              ) : null}
            </div>
            <StatusBadge tone={statusTone[item.status]}>{statusText[item.status]}</StatusBadge>
          </div>
        ))}
      </div>
    </section>
  );
}
