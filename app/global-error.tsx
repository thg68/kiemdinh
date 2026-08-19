"use client";

export default function GlobalError() {
  return (
    <html lang="vi">
      <body>
        <main className="min-h-screen bg-[#f7f7f2] px-6 py-10 text-[#1f2933]">
          <div className="mx-auto max-w-3xl border border-[#d8d6c9] bg-white p-6">
            <h1 className="text-2xl font-semibold text-[#17324d]">
              Có lỗi xảy ra
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#52606d]">
              Vui lòng tải lại trang hoặc quay lại sau ít phút.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
