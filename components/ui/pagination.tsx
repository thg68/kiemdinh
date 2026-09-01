"use client";

export const DEFAULT_PAGE_SIZE = 25;

export function Pagination({
  disabled = false,
  onPageChange,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  total,
}: {
  disabled?: boolean;
  onPageChange: (page: number) => void;
  page: number;
  pageSize?: number;
  total: number;
}) {
  if (total === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const firstItem = (safePage - 1) * pageSize + 1;
  const lastItem = Math.min(safePage * pageSize, total);

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-col gap-3 border-t border-[var(--color-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm tabular-nums text-[var(--color-graphite)]/70">
        Hiển thị {firstItem}–{lastItem} trong {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="button-secondary"
          disabled={disabled || safePage === 1}
          type="button"
          onClick={() => onPageChange(safePage - 1)}
        >
          Trang trước
        </button>
        <span className="min-w-24 text-center text-sm tabular-nums text-[var(--color-ink-navy)]">
          Trang {safePage}/{totalPages}
        </span>
        <button
          className="button-secondary"
          disabled={disabled || safePage === totalPages}
          type="button"
          onClick={() => onPageChange(safePage + 1)}
        >
          Trang sau
        </button>
      </div>
    </nav>
  );
}
