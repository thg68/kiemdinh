import Link from "next/link";
import { EmailConfirmation } from "@/components/auth/email-confirmation";

export default function EmailConfirmationPage() {
  return (
    <main className="landing-shell">
      <div className="content-wrap flex min-h-[72px] items-center justify-between px-5">
        <Link className="text-lg font-bold text-[var(--color-ink-navy)]" href="/">
          PDT Quality
        </Link>
        <Link className="button-secondary" href="/login">Đăng nhập</Link>
      </div>
      <div className="content-wrap grid min-h-[calc(100vh-9rem)] place-items-center px-5 py-12">
        <EmailConfirmation />
      </div>
    </main>
  );
}
