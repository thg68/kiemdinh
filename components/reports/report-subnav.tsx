import Link from "next/link";

type ReportSubnavProps = {
  active: "approved" | "compose" | "pending";
  canApprove?: boolean;
  canCompose?: boolean;
};

export function ReportSubnav({
  active,
  canApprove = false,
  canCompose = true,
}: ReportSubnavProps) {
  const items = [
    canCompose ? { href: "/bao-cao", key: "compose", label: "Soạn và xuất" } : null,
    canApprove ? { href: "/bao-cao/cho-duyet", key: "pending", label: "Chờ duyệt" } : null,
    { href: "/bao-cao/da-phe-duyet", key: "approved", label: "Đã phê duyệt" },
  ].filter(Boolean) as Array<{ href: string; key: ReportSubnavProps["active"]; label: string }>;

  return (
    <nav aria-label="Quy trình báo cáo" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          aria-current={active === item.key ? "page" : undefined}
          className={active === item.key ? "button-primary" : "button-secondary"}
          href={item.href}
          key={item.key}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
