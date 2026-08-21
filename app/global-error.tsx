"use client";

export default function GlobalError() {
  return (
    <html lang="vi">
      <body>
        <main className="app-shell">
          <div className="content-wrap surface-card surface-card-pad max-w-3xl">
            <h1 className="section-title text-2xl">
              Có lỗi xảy ra
            </h1>
            <p className="muted mt-3 text-sm leading-6">
              Vui lòng tải lại trang hoặc quay lại sau ít phút.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
