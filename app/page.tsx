import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#1f2933]">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8">
        <header className="border-b border-[#d8d6c9] pb-5">
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#6f5f36]">
            Sprint 2
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#17324d]">
            Nền tảng quản trị bảo đảm chất lượng giáo dục
          </h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="bg-[#17324d] px-4 py-2 text-sm font-semibold text-white"
              href="/login"
            >
              Đăng nhập
            </Link>
            <Link
              className="border border-[#17324d] px-4 py-2 text-sm font-semibold text-[#17324d]"
              href="/thiet-lap"
            >
              Thiết lập đơn vị
            </Link>
            <Link
              className="border border-[#17324d] px-4 py-2 text-sm font-semibold text-[#17324d]"
              href="/minh-chung"
            >
              Kho minh chứng
            </Link>
          </div>
        </header>

        <section className="grid flex-1 content-center gap-4 py-10 sm:grid-cols-2">
          <div className="border border-[#d8d6c9] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#17324d]">
              Vận hành trước, minh chứng theo sau
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#52606d]">
              Mỗi minh chứng chỉ có một mã, nhưng có thể phục vụ nhiều tiêu chí
              trong bộ tiêu chuẩn.
            </p>
          </div>

          <div className="border border-[#d8d6c9] bg-white p-5">
            <h2 className="text-lg font-semibold text-[#17324d]">
              Dữ liệu có phân quyền
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#52606d]">
              Supabase Auth, Storage private và RLS theo cơ sở giáo dục bảo vệ
              dữ liệu ngay tại tầng cơ sở dữ liệu.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
