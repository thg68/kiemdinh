import { connection } from "next/server";

export default async function NotFound() {
  await connection();

  return (
    <main className="app-shell">
      <div className="content-wrap surface-card surface-card-pad max-w-3xl">
        <h1 className="section-title text-2xl">
          Không tìm thấy trang
        </h1>
        <p className="muted mt-3 text-sm leading-6">
          Đường dẫn này chưa có trong ứng dụng.
        </p>
      </div>
    </main>
  );
}
