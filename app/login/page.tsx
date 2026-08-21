import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="landing-shell">
      <div className="content-wrap flex min-h-[72px] items-center justify-between px-5">
        <Link className="text-lg font-bold text-[var(--color-ink-navy)]" href="/">
          PDT Quality
        </Link>
        <Link className="button-secondary" href="/">
          Trang giới thiệu
        </Link>
      </div>

      <div className="content-wrap grid min-h-[calc(100vh-9rem)] items-center gap-10 px-5 py-12 md:grid-cols-[minmax(0,1fr)_430px]">
        <section>
          <h1 className="page-title">
            Đăng nhập hệ thống quản trị nhà trường
          </h1>
          <p className="page-copy mt-6">
            Sau khi đăng nhập, tài khoản mới sẽ tạo cơ sở giáo dục và năm học
            đang hoạt động trong bước thiết lập ban đầu.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-[var(--color-graphite)]/78 sm:grid-cols-3">
            <div className="surface-card p-4">Phân quyền theo đơn vị</div>
            <div className="surface-card p-4">Dữ liệu theo năm học</div>
            <div className="surface-card p-4">Minh chứng có mã duy nhất</div>
          </div>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
