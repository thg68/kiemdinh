import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ReadinessItem = {
  detail?: string;
  href?: string;
  id: string;
  label: string;
  status: "blocked" | "ready" | "warning";
};

type ReadinessChecklistProps = {
  description?: string;
  items: ReadinessItem[];
  title: string;
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
        <Badge tone={blockedCount > 0 ? "danger" : warningCount > 0 ? "warning" : "success"}>
          {blockedCount > 0
            ? `${blockedCount} mục cần xử lý`
            : warningCount > 0
              ? `${warningCount} mục cần rà soát`
              : "Sẵn sàng"}
        </Badge>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {items.map((item) => {
          const isReady = item.status === "ready";
          const content = (
            <>
              <div className="flex min-w-0 items-start gap-3">
                {isReady ? (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--color-success)]" size={20} />
                ) : (
                  <AlertCircle
                    aria-hidden="true"
                    className={`mt-0.5 shrink-0 ${item.status === "warning" ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}`}
                    size={20}
                  />
                )}
                <div>
                  <p className="font-semibold text-[var(--color-ink-navy)]">{item.label}</p>
                  {item.detail ? <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">{item.detail}</p> : null}
                </div>
              </div>
              {isReady ? (
                <Badge tone="success">Đã đủ</Badge>
              ) : item.href ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--color-electric-blue)]">
                  Xử lý<ChevronRight aria-hidden="true" size={16} />
                </span>
              ) : (
                <Badge tone={item.status === "warning" ? "warning" : "danger"}>
                  {item.status === "warning" ? "Cần rà soát" : "Cần xử lý"}
                </Badge>
              )}
            </>
          );

          return item.href && !isReady ? (
            <Link className="flex items-center justify-between gap-4 px-5 py-4" href={item.href} key={item.id}>{content}</Link>
          ) : (
            <div className="flex items-center justify-between gap-4 px-5 py-4" key={item.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
