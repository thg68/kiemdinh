import Link from "next/link";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const hasRecoveryError = Boolean(params.error || params.error_code);

  return (
    <main className="landing-shell">
      <div className="content-wrap flex min-h-[72px] items-center justify-between px-5">
        <Link className="text-lg font-bold text-[var(--color-ink-navy)]" href="/">
          PDT Quality
        </Link>
        <Link className="button-secondary" href="/login">
          Đăng nhập
        </Link>
      </div>

      <div className="content-wrap grid min-h-[calc(100vh-9rem)] items-center gap-10 px-5 py-12 md:grid-cols-[minmax(0,1fr)_430px]">
        <section>
          <h1 className="page-title">Khôi phục quyền truy cập</h1>
          <p className="page-copy mt-6">
            Tài khoản vẫn đi qua Supabase Auth; ứng dụng không tự lưu mật khẩu
            và không gửi thông tin nhạy cảm qua dịch vụ AI.
          </p>
        </section>

        <PasswordResetForm initialRecoveryError={hasRecoveryError} />
      </div>
    </main>
  );
}
