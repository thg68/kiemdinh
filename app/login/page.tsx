import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="app-shell">
      <div className="content-wrap grid min-h-[calc(100vh-8rem)] items-center gap-10 md:grid-cols-[minmax(0,1fr)_430px]">
        <section>
          <h1 className="page-title">
            Đăng nhập hệ thống quản trị nhà trường
          </h1>
          <p className="page-copy mt-6">
            Sau khi đăng nhập, tài khoản mới sẽ tạo cơ sở giáo dục và năm học
            đang hoạt động trong bước thiết lập ban đầu.
          </p>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
