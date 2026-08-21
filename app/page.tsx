import Link from "next/link";

export default function Home() {
  return (
    <div className="app-shell">
      <main className="content-wrap flex min-h-[calc(100vh-8rem)] flex-col">
        <header className="page-header">
          <h1 className="page-title">
            Quản trị bảo đảm chất lượng giáo dục
          </h1>
          <p className="page-copy">
            Một không gian làm việc gọn, rõ và có chứng cứ: nhà trường vận hành tử tế,
            dữ liệu tự thành hồ sơ tự đánh giá.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="button-primary" href="/login">
              Đăng nhập
            </Link>
            <Link className="button-secondary" href="/thiet-lap">
              Thiết lập đơn vị
            </Link>
            <Link className="button-secondary" href="/minh-chung">
              Kho minh chứng
            </Link>
            <Link className="button-secondary" href="/tu-danh-gia">
              Tự đánh giá
            </Link>
            <Link className="button-secondary" href="/bao-cao">
              Xuất báo cáo
            </Link>
          </div>
        </header>

        <section className="grid flex-1 content-center gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="featured-card sm:col-span-2">
            <h2 className="font-serif text-3xl font-medium leading-tight">
              Vận hành trước
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/78">
              Minh chứng dùng lại đúng mã, không nhân bản tệp cho từng tiêu chí.
            </p>
          </div>

          <div className="surface-card surface-card-pad">
            <h2 className="section-title">
              Dữ liệu có khóa
            </h2>
            <p className="muted mt-3 text-sm leading-6">
              RLS theo cơ sở giáo dục và quyền vai trò được kiểm tra tại CSDL.
            </p>
          </div>

          <div className="surface-card surface-card-pad">
            <h2 className="section-title">
              Tính mức có giải trình
            </h2>
            <p className="muted mt-3 text-sm leading-6">
              Kết quả tự đánh giá luôn kèm lý do, điểm chặn và khoảng cách.
            </p>
          </div>

          <div className="surface-card surface-card-pad sm:col-span-2 lg:col-span-4">
            <h2 className="section-title">
              Xuất dữ liệu chuẩn
            </h2>
            <p className="muted mt-3 max-w-2xl text-sm leading-6">
              Mẫu 1, Mẫu 2, danh mục minh chứng, gói tệp và JSON theo năm học.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
