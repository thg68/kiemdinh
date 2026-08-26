"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmTone = "danger" | "primary" | "warning";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: React.ReactNode;
  isOpen: boolean;
  isWorking?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: ConfirmTone;
};

const confirmButtonClass: Record<ConfirmTone, string> = {
  danger: "button-danger",
  primary: "button-primary",
  warning: "button-secondary button-warning",
};

export function ConfirmDialog({
  cancelLabel = "Hủy",
  confirmLabel = "Xác nhận",
  description,
  isOpen,
  isWorking = false,
  onCancel,
  onConfirm,
  title,
  tone = "primary",
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog-backdrop" role="presentation">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]" id={titleId}>
            {title}
          </h2>
          <div className="mt-2 text-sm leading-6 text-[var(--color-graphite)]/78" id={descriptionId}>
            {description}
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            className="button-secondary"
            disabled={isWorking}
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            aria-busy={isWorking || undefined}
            className={confirmButtonClass[tone]}
            disabled={isWorking}
            type="button"
            onClick={onConfirm}
          >
            {isWorking ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
