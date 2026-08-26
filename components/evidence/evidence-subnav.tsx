import Link from "next/link";

type EvidenceSubnavKey = "list" | "create" | "health" | "verify";

type EvidenceSubnavItem = {
  key: EvidenceSubnavKey;
  href: string;
  label: string;
};

const baseItems: EvidenceSubnavItem[] = [
  { key: "list", href: "/minh-chung", label: "Kho minh chứng" },
  { key: "health", href: "/minh-chung/suc-khoe", label: "Kiểm tra sức khỏe" },
  { key: "verify", href: "/minh-chung/xac-minh", label: "Xác minh minh chứng" },
];

const createItem: EvidenceSubnavItem = {
  key: "create",
  href: "/minh-chung/tao",
  label: "Tạo minh chứng",
};

export function EvidenceSubnav({ active }: { active: EvidenceSubnavKey }) {
  const isCreating = active === "create";
  const items = isCreating ? [...baseItems, createItem] : baseItems;

  return (
    <nav className="evidence-subnav" aria-label="Điều hướng kho minh chứng">
      <div className="evidence-subnav-list">
        {items.map((item) => (
          <Link
            aria-current={active === item.key ? "page" : undefined}
            className={`evidence-subnav-link ${active === item.key ? "evidence-subnav-link-active" : ""}`}
            href={item.href}
            key={item.key}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {!isCreating ? (
        <div className="evidence-subnav-action">
          <Link aria-label="Tạo minh chứng" className="evidence-create-button" href="/minh-chung/tao" title="Tạo minh chứng">
            +
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
