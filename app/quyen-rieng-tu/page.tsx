import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quyền riêng tư | PDT Quality",
  description: "Thông báo về cách PDT Quality xử lý và bảo vệ dữ liệu nhà trường.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--color-paper)] px-5 py-12 text-[var(--color-ink-navy)]">
      <article className="mx-auto max-w-3xl">
        <Link className="text-sm font-semibold text-[var(--color-electric-blue)] hover:underline" href="/">
          Quay lại trang chủ
        </Link>
        <header className="mt-10 border-b border-[var(--color-border)] pb-8">
          <p className="text-sm font-bold uppercase text-[var(--color-graphite)]">PDT Quality</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight">Thông báo quyền riêng tư</h1>
          <p className="mt-4 leading-7 text-[var(--color-graphite)]">
            Trang này tóm tắt cách hệ thống xử lý dữ liệu trong phạm vi quản trị chất lượng nhà trường.
          </p>
        </header>

        <div className="space-y-10 py-10 leading-7 text-[var(--color-graphite)]">
          <section>
            <h2 className="text-xl font-bold text-[var(--color-ink-navy)]">Dữ liệu được xử lý</h2>
            <p className="mt-3">
              Hệ thống lưu thông tin đơn vị, năm học, tài khoản, bộ tiêu chuẩn, minh chứng, tự đánh giá,
              kế hoạch cải tiến và báo cáo. Hồ sơ nhạy cảm của học sinh chỉ được quản lý dưới dạng chỉ mục;
              nội dung chi tiết không được lưu trong ứng dụng ở giai đoạn này.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[var(--color-ink-navy)]">Mục đích và phạm vi truy cập</h2>
            <p className="mt-3">
              Dữ liệu chỉ phục vụ vận hành, tự đánh giá và bảo đảm chất lượng của đơn vị. Quyền truy cập
              được giới hạn theo vai trò và cơ sở giáo dục tại tầng cơ sở dữ liệu. Tệp minh chứng được mở
              bằng liên kết có thời hạn, không dùng địa chỉ công khai vĩnh viễn.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[var(--color-ink-navy)]">Lưu giữ và xóa dữ liệu</h2>
            <p className="mt-3">
              Thời hạn lưu giữ do đơn vị vận hành xác định theo nghĩa vụ pháp lý và quy chế nội bộ. Yêu cầu
              sửa, xuất hoặc xóa dữ liệu cần được gửi cho người phụ trách hệ thống của đơn vị để kiểm tra
              quyền và ảnh hưởng đến hồ sơ đã phê duyệt.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-[var(--color-ink-navy)]">Quyền của người dùng</h2>
            <p className="mt-3">
              Người dùng có thể đề nghị xem, điều chỉnh hoặc xuất dữ liệu liên quan đến mình. Kênh tiếp
              nhận yêu cầu và người chịu trách nhiệm được từng đơn vị công bố trong quy chế sử dụng hệ thống.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}