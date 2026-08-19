import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2] px-6 py-10 text-[#1f2933]">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 md:grid-cols-[1fr_420px]">
        <section>
          <p className="text-sm font-medium uppercase tracking-[0.08em] text-[#6f5f36]">
            KiemDinh
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#17324d]">
            Đăng nhập hệ thống quản trị nhà trường
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#52606d]">
            Sau khi đăng nhập, tài khoản mới sẽ tạo cơ sở giáo dục và năm học
            đang hoạt động trong bước thiết lập ban đầu.
          </p>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
