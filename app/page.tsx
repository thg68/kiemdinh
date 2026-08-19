export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#1f2933]">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="border-b border-[#d8d6c9] pb-5">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#6f5f36]">
            Sprint 0
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#17324d]">
            Nền tảng ứng dụng quản trị nhà trường
          </h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              className="bg-[#17324d] px-4 py-2 text-sm font-semibold text-white"
              href="/login"
            >
              Đăng nhập
            </a>
            <a
              className="border border-[#17324d] px-4 py-2 text-sm font-semibold text-[#17324d]"
              href="/thiet-lap"
            >
              Thiết lập đơn vị
            </a>
          </div>
        </header>

        <section className="grid flex-1 content-center gap-4 py-10 sm:grid-cols-2">
          <div className="border border-[#d8d6c9] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#17324d]">
              Trạng thái
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#52606d]">
              Dự án đã sẵn sàng cho các bước nhập bộ tiêu chuẩn, kho minh chứng
              và tự đánh giá sau khi có dữ liệu phụ lục đã xác nhận.
            </p>
          </div>

          <div className="border border-[#d8d6c9] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#17324d]">
              Kết nối dữ liệu
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#52606d]">
              Supabase được cấu hình qua biến môi trường; khóa thật không được
              đưa vào Git.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
