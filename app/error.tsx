"use client";

import { useEffect } from "react";
import { logClientException } from "@/lib/observability/logger";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientException(error.digest);
  }, [error.digest]);

  return (
    <section className="surface-card surface-card-pad grid max-w-xl gap-4" role="alert">
      <div>
        <h2 className="section-title">Trang này chưa tải được</h2>
        <p className="muted mt-2">
          Dữ liệu của bạn chưa bị thay đổi. Hãy thử tải lại phần này; nếu lỗi vẫn còn, liên hệ người phụ trách hệ thống.
        </p>
      </div>
      <button className="button-primary justify-self-start" type="button" onClick={reset}>
        Thử lại
      </button>
    </section>
  );
}
