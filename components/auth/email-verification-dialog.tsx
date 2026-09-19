"use client";

import { useEffect, useId, useRef } from "react";
import { Alert } from "@/components/ui/alert";

type EmailVerificationDialogProps = {
  cooldown: number;
  email: string;
  isOpen: boolean;
  isSending: boolean;
  message?: string;
  onContinue: () => void;
  onResend: () => void;
};

export function EmailVerificationDialog({
  cooldown,
  email,
  isOpen,
  isSending,
  message,
  onContinue,
  onResend,
}: EmailVerificationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => continueRef.current?.focus(), 0);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onContinue();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  const resendDisabled = isSending || cooldown > 0;
  const resendLabel = isSending
    ? "Đang gửi…"
    : cooldown > 0
      ? `Gửi lại sau ${cooldown} giây`
      : "Gửi lại email";

  return (
    <div className="confirm-dialog-backdrop" role="presentation">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <h2 className="text-xl font-semibold text-[var(--color-ink-navy)]" id={titleId}>
          Kiểm tra email để xác thực tài khoản
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--color-graphite)]/80" id={descriptionId}>
          <p>
            Hệ thống đã gửi email xác thực đến <strong className="break-all text-[var(--color-ink-navy)]">{email}</strong>.
          </p>
          <p>Hãy xác thực email trước khi đăng nhập. Nếu chưa thấy thư, hãy kiểm tra thư rác hoặc gửi lại sau thời gian chờ.</p>
        </div>

        {message ? <Alert className="mt-4" tone="info">{message}</Alert> : null}

        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            aria-busy={isSending || undefined}
            className="button-secondary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={resendDisabled}
            type="button"
            onClick={onResend}
          >
            {resendLabel}
          </button>
          <button className="button-primary" ref={continueRef} type="button" onClick={onContinue}>
            Đến trang đăng nhập
          </button>
        </div>
      </div>
    </div>
  );
}
