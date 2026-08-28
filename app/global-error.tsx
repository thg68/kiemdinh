"use client";

import { useEffect } from "react";
import { logClientException } from "@/lib/observability/logger";

export default function GlobalError({
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
    <html lang="vi">
      <body>
        <main className="app-shell">
          <section className="surface-card surface-card-pad mx-auto grid max-w-xl gap-4" role="alert">
            <div>
              <h1 className="section-title">Hệ thống đang tạm gián đoạn</h1>
              <p className="muted mt-2">
                Vui lòng thử lại. Nếu vẫn chưa truy cập được, hãy liên hệ người phụ trách hệ thống.
              </p>
            </div>
            <button className="button-primary justify-self-start" type="button" onClick={reset}>
              Thử lại
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
