import Link from "next/link";

const features = [
  {
    title: "Bộ tiêu chuẩn",
    body: "Theo dõi trạng thái từng tiêu chí và biết tiêu chí nào đang cần chú ý.",
  },
  {
    title: "Kho minh chứng",
    body: "Một minh chứng có thể phục vụ nhiều tiêu chí mà không cần nhân bản.",
  },
  {
    title: "Tự đánh giá",
    body: "Đánh giá theo Mức 1 / Mức 2 với dữ liệu và minh chứng truy vết được.",
  },
  {
    title: "Gap Board",
    body: "Biết chính xác điều gì đang ngăn nhà trường đạt mức tiếp theo.",
    featured: true,
  },
  {
    title: "What-if",
    body: "Mô phỏng tác động của từng cải tiến trước khi đưa ra quyết định.",
    featured: true,
  },
  {
    title: "Báo cáo",
    body: "Chuẩn bị và xuất báo cáo từ dữ liệu đã có trong hệ thống.",
  },
];

const roleViews = [
  ["Hiệu trưởng", "Xem mức hiện tại, điểm nghẽn, kịch bản cải thiện và báo cáo sẵn sàng."],
  ["Hội đồng", "Theo dõi tiêu chí được phân công, duyệt nội dung và chốt mức."],
  ["Thư ký", "Quản lý minh chứng, tổng hợp đánh giá và chuẩn bị báo cáo."],
  ["Giáo viên", "Nộp minh chứng thuộc phạm vi công việc và theo dõi trạng thái xử lý."],
];

export default function Home() {
  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <div className="content-wrap flex min-h-[72px] items-center justify-between gap-4 px-5">
          <Link className="text-lg font-bold text-[var(--color-ink-navy)]" href="/">
            PDT Quality
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--color-graphite)] md:flex">
            <a href="#gioi-thieu">Giới thiệu</a>
            <a href="#tinh-nang">Tính năng</a>
            <a href="#quy-trinh">Quy trình</a>
            <a href="#bao-mat">Bảo mật</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link className="button-secondary hidden sm:inline-flex" href="/login">
              Đăng nhập
            </Link>
            <a className="button-primary" href="#quy-trinh">
              Xem cách hoạt động
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-section pt-16" id="gioi-thieu">
          <div className="content-wrap grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h1 className="page-title">
                Từ vận hành hằng ngày đến chất lượng có thể chứng minh.
              </h1>
              <p className="page-copy mt-6">
                Quản lý tiêu chuẩn, minh chứng, tự đánh giá, cải tiến chất lượng
                và báo cáo trên một hệ thống thống nhất.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="button-primary" href="#tinh-nang">
                  Khám phá hệ thống
                </a>
                <Link className="button-secondary" href="/login">
                  Đăng nhập
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-6 rotate-[-3deg] rounded-[var(--radius-large)] border border-[var(--color-border)] bg-white" />
              <div className="surface-card relative p-5 shadow-[0_4px_24px_rgba(12,23,84,0.08)]">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink-navy)]">Tổng quan</p>
                    <p className="mt-1 text-xs text-[var(--color-graphite)]/65">
                      Năm học 2026-2027
                    </p>
                  </div>
                  <span className="mini-badge">Dữ liệu hệ thống</span>
                </div>
                <div className="grid gap-5 pt-5 md:grid-cols-[1fr_0.9fr]">
                  <div className="featured-card">
                    <p className="text-sm text-white/72">Làm việc trên dữ liệu thật</p>
                    <p className="mt-5 font-serif text-4xl font-medium text-white">
                      Mở hệ thống quản trị
                    </p>
                    <p className="mt-4 text-sm leading-6 text-white/72">
                      Đăng nhập hoặc đăng ký tài khoản trước, sau đó số liệu được lấy từ tự đánh giá,
                      kho minh chứng và năm học đang hoạt động.
                    </p>
                    <Link className="mt-6 inline-flex rounded-[var(--radius-pill)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-ink-navy)]" href="/login">
                      Đăng nhập để sử dụng
                    </Link>
                  </div>
                  <div className="grid gap-3">
                    <Link className="surface-card p-4" href="/login">
                      <p className="text-sm font-semibold text-[var(--color-ink-navy)]">Gap Board sau đăng nhập</p>
                      <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/70">
                        Xem đủ 15 tiêu chí theo dữ liệu tự đánh giá.
                      </p>
                    </Link>
                    <Link className="surface-card p-4" href="/login">
                      <p className="text-sm font-semibold text-[var(--color-ink-navy)]">Kho minh chứng sau đăng nhập</p>
                      <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/70">
                        Tải lên, gắn tiêu chí và dùng lại mã minh chứng.
                      </p>
                    </Link>
                    <Link className="surface-card p-4" href="/login">
                      <p className="text-sm font-semibold text-[var(--color-ink-navy)]">Xuất báo cáo sau đăng nhập</p>
                      <p className="mt-2 text-xs leading-5 text-[var(--color-graphite)]/70">
                        Sinh Mẫu 1, Mẫu 2 và danh mục từ dữ liệu hiện có.
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="content-wrap grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="landing-heading">
              Kiểm định không nên là một chiến dịch cuối năm.
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="surface-card surface-card-pad">
                <h3 className="section-title">Cách làm rời rạc</h3>
                <p className="muted mt-4 text-sm leading-7">
                  Gom hồ sơ, đặt mã, ghép tiêu chí rồi viết báo cáo khi đến hạn.
                </p>
              </div>
              <div className="featured-card">
                <h3 className="text-xl font-semibold text-white">Vận hành có dữ liệu</h3>
                <p className="mt-4 text-sm leading-7 text-white/76">
                  Công việc hằng ngày tạo minh chứng, minh chứng nuôi tự đánh giá,
                  tự đánh giá dẫn tới cải tiến.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="quy-trinh">
          <div className="content-wrap">
            <h2 className="landing-heading">Mọi thứ được kết nối.</h2>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {[
                ["01", "Vận hành nhà trường", "Kế hoạch, phân công, chuyên môn, an toàn và hoạt động hằng ngày."],
                ["02", "Dữ liệu & Minh chứng", "Kho minh chứng, liên kết tiêu chí, mã hóa và chỉ số chất lượng."],
                ["03", "Đánh giá & Cải tiến", "Tự đánh giá, Gap Board, What-if, cải tiến và báo cáo."],
              ].map(([step, title, body]) => (
                <article className="surface-card surface-card-pad" key={title}>
                  <p className="text-sm font-semibold text-[var(--color-electric-cobalt)]">{step}</p>
                  <h3 className="mt-4 section-title text-xl">{title}</h3>
                  <p className="muted mt-4 text-sm leading-7">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="tinh-nang">
          <div className="content-wrap">
            <h2 className="landing-heading max-w-3xl">
              Mọi thứ nhà trường cần để quản trị chất lượng.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  className={feature.featured ? "featured-card" : "surface-card surface-card-pad"}
                  key={feature.title}
                >
                  <h3 className={`text-xl font-semibold ${feature.featured ? "text-white" : "text-[var(--color-charcoal)]"}`}>
                    {feature.title}
                  </h3>
                  <p className={`mt-4 text-sm leading-7 ${feature.featured ? "text-white/76" : "muted"}`}>
                    {feature.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="content-wrap grid items-center gap-10 lg:grid-cols-[0.45fr_0.55fr]">
            <div>
              <h2 className="landing-heading">Biết trường đang ở đâu trong vài giây.</h2>
              <ul className="mt-8 grid gap-3 text-sm leading-7 text-[var(--color-graphite)]/78">
                {[
                  "Trường đang đạt mức nào",
                  "Điều kiện nào đang thiếu",
                  "Tiêu chí nào đang là điểm nghẽn",
                  "Minh chứng nào cần bổ sung",
                  "Việc nào cần ưu tiên",
                ].map((item) => (
                  <li className="surface-card px-4 py-3" key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="surface-card surface-card-pad">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="section-title">Gap Board</h3>
                  <span className="mini-badge">15 tiêu chí</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 15 }).map((_, index) => (
                    <div
                      className={`h-16 rounded-[var(--radius-card)] border ${
                        index === 5 || index === 11
                          ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)]"
                          : index > 11
                            ? "border-[var(--color-warning)] bg-[var(--color-warning-soft)]"
                            : "border-[var(--color-success)] bg-[var(--color-success-soft)]"
                      }`}
                      key={index}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="content-wrap grid gap-6 lg:grid-cols-2">
            <div className="surface-card surface-card-pad">
              <h2 className="landing-heading text-3xl">Minh chứng được kết nối, không bị nhân bản.</h2>
              <div className="mt-8 rounded-[var(--radius-large)] bg-[var(--color-lavender-mist)] p-6 text-center">
                <p className="mx-auto inline-flex rounded-[var(--radius-pill)] bg-white px-5 py-3 font-semibold text-[var(--color-ink-navy)]">
                  MC.1.1.01 - Kế hoạch năm học
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 text-sm font-semibold text-[var(--color-ink-navy)]">
                  <span className="surface-card p-3">1.1</span>
                  <span className="surface-card p-3">1.3</span>
                  <span className="surface-card p-3">3.1</span>
                </div>
              </div>
            </div>
            <div className="featured-card">
              <h2 className="font-serif text-3xl font-medium text-white">
                Không chỉ biết hiện tại. Hãy thử xem điều gì xảy ra tiếp theo.
              </h2>
              <div className="mt-8 grid gap-3 text-sm text-white/78">
                <p>Hiện tại: Đạt Mức 1</p>
                <p>2.2: Mức 1 sang Mức 2</p>
                <p>3.1: Mức 1 sang Mức 2</p>
                <p className="rounded-[var(--radius-card)] bg-white p-4 font-semibold text-[var(--color-ink-navy)]">
                  Kết quả dự kiến: Đạt Mức 2
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="content-wrap">
            <h2 className="landing-heading">Được thiết kế cho từng vai trò.</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {roleViews.map(([role, body]) => (
                <article className="surface-card surface-card-pad" key={role}>
                  <h3 className="section-title">{role}</h3>
                  <p className="muted mt-4 text-sm leading-7">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="bao-mat">
          <div className="content-wrap grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="landing-heading">Dữ liệu nhà trường được bảo vệ từ thiết kế.</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Phân quyền theo vai trò",
                "Cô lập dữ liệu giữa các trường",
                "Kiểm soát quyền truy cập",
                "Nhật ký hoạt động",
                "Liên kết tài liệu có thời hạn",
                "Bảo vệ dữ liệu nhạy cảm",
              ].map((item) => (
                <div className="surface-card px-5 py-4 text-sm font-semibold text-[var(--color-ink-navy)]" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section" id="lien-he">
          <div className="content-wrap featured-card grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <h2 className="font-serif text-4xl font-medium leading-tight text-white">
              Sẵn sàng biến kiểm định thành một phần của quản trị?
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link className="button-primary" href="/login">
                Bắt đầu thiết lập
              </Link>
              <Link className="button-secondary bg-white" href="/login">
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border)] px-5 py-10">
        <div className="content-wrap grid gap-6 text-sm text-[var(--color-graphite)]/70 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-bold text-[var(--color-ink-navy)]">PDT Quality</p>
            <p className="mt-2">© 2026 PDT Academy</p>
          </div>
          <div className="flex flex-wrap gap-5">
            <a href="#tinh-nang">Tính năng</a>
            <a href="#quy-trinh">Quy trình</a>
            <a href="#bao-mat">Bảo mật</a>
            <Link href="/login">Đăng nhập</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
