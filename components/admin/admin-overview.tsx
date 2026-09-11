"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";
import { toUserMessage } from "@/lib/errors/user-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OverviewStats = {
  tong_co_so: number;
  co_so_dang_hoat_dong: number;
  co_so_chua_co_nam_hoc_hoat_dong: number;
  tong_nguoi_dung: number;
  nguoi_dung_dang_hoat_dong: number;
  tong_minh_chung: number;
  minh_chung_can_kiem_tra: number;
};

const quickLinks = [
  {
    href: "/quan-tri/co-so",
    title: "Cơ sở giáo dục",
    description: "Theo dõi danh mục trường, năm học và trạng thái hoạt động.",
  },
  {
    href: "/quan-tri/nguoi-tham-gia",
    title: "Người tham gia",
    description: "Kiểm soát trạng thái tài khoản trên toàn hệ thống.",
  },
  {
    href: "/quan-tri/minh-chung",
    title: "Quản trị minh chứng",
    description: "Rà soát metadata và vấn đề kỹ thuật, không mở nội dung tệp.",
  },
  {
    href: "/quan-tri/van-hanh",
    title: "Vận hành hệ thống",
    description: "Kiểm tra sức khỏe dịch vụ và nhật ký quản trị gần đây.",
  },
] as const;

export function AdminOverview() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("fn_admin_tong_quan");

    if (error) {
      setMessage(toUserMessage(error, "Không tải được số liệu quản trị. Vui lòng thử lại."));
      setLoading(false);
      return;
    }

    setStats(((data ?? [])[0] as OverviewStats | undefined) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStats(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStats]);

  if (loading) {
    return <LoadingState label="Đang tổng hợp trạng thái hệ thống…" />;
  }

  if (!stats) {
    return <Alert tone="warning">{message || "Chưa có số liệu quản trị để hiển thị."}</Alert>;
  }

  return (
    <div className="grid gap-7">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <section aria-label="Chỉ số hệ thống" className="admin-stat-grid">
        <Stat
          detail={`${stats.co_so_dang_hoat_dong} đang hoạt động`}
          label="Cơ sở giáo dục"
          value={stats.tong_co_so}
        />
        <Stat
          detail={`${stats.nguoi_dung_dang_hoat_dong} tài khoản hoạt động`}
          label="Người tham gia"
          value={stats.tong_nguoi_dung}
        />
        <Stat
          detail={`${stats.minh_chung_can_kiem_tra} mục cần kiểm tra kỹ thuật`}
          label="Minh chứng đang lưu"
          value={stats.tong_minh_chung}
        />
        <Stat
          detail="Cơ sở hoạt động chưa chọn năm học hiện hành"
          label="Thiếu năm học hoạt động"
          value={stats.co_so_chua_co_nam_hoc_hoat_dong}
        />
      </section>

      <section>
        <h2 className="section-title">Tác vụ quản trị</h2>
        <div className="admin-quick-links mt-3">
          {quickLinks.map((item) => (
            <Link className="admin-quick-link" href={item.href} key={item.href}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <p className="admin-privacy-note">
        Quản trị hệ thống chỉ xử lý cấu hình và metadata vận hành. Nội dung minh chứng, dữ liệu học sinh và liên kết tải tệp vẫn thuộc phạm vi nghiệp vụ của từng nhà trường.
      </p>
    </div>
  );
}

function Stat({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <article className="admin-stat">
      <p className="admin-stat-label">{label}</p>
      <p className="admin-stat-value">{value.toLocaleString("vi-VN")}</p>
      <p className="admin-stat-detail">{detail}</p>
    </article>
  );
}
