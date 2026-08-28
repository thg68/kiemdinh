"use client";

import { toUserMessage } from "@/lib/errors/user-message";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAppContext } from "@/components/shared/use-app-context";

type RelatedDocument = {
  id: string;
  ten: string;
  so_hieu: string | null;
  co_quan_ban_hanh: string | null;
  ngay_ban_hanh: string | null;
  ngay_hieu_luc: string | null;
  ngay_het_hieu_luc: string | null;
  duong_dan: string | null;
  ghi_chu: string | null;
};

export function RelatedDocumentsWorkspace() {
  const { activeYear, loading, message, profile, setMessage, supabase, years } = useAppContext();
  const [selectedYearId, setSelectedYearId] = useState("");
  const [rows, setRows] = useState<RelatedDocument[]>([]);
  const [ten, setTen] = useState("");
  const [soHieu, setSoHieu] = useState("");
  const [coQuanBanHanh, setCoQuanBanHanh] = useState("");
  const [ngayBanHanh, setNgayBanHanh] = useState("");
  const [ngayHieuLuc, setNgayHieuLuc] = useState("");
  const [ngayHetHieuLuc, setNgayHetHieuLuc] = useState("");
  const [duongDan, setDuongDan] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);

  const effectiveYearId = selectedYearId || activeYear?.id || "";

  const loadRows = useCallback(async () => {
    if (!supabase || !profile || !effectiveYearId) {
      return;
    }

    setLoadingRows(true);
    setMessage("");

    const { data, error } = await supabase
      .from("van_ban_lien_quan")
      .select("id, ten, so_hieu, co_quan_ban_hanh, ngay_ban_hanh, ngay_hieu_luc, ngay_het_hieu_luc, duong_dan, ghi_chu")
      .eq("co_so_id", profile.co_so_id)
      .eq("nam_hoc_id", effectiveYearId)
      .order("ngay_ban_hanh", { ascending: false });

    if (error) {
      setMessage(toUserMessage(error));
      setLoadingRows(false);
      return;
    }

    setRows((data ?? []) as RelatedDocument[]);
    setLoadingRows(false);
  }, [effectiveYearId, profile, setMessage, supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadRows]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !profile || !effectiveYearId) {
      setMessage("Chưa đủ dữ liệu để lưu văn bản liên quan.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("van_ban_lien_quan").insert({
      co_so_id: profile.co_so_id,
      nam_hoc_id: effectiveYearId,
      ten,
      so_hieu: soHieu || null,
      co_quan_ban_hanh: coQuanBanHanh || null,
      ngay_ban_hanh: ngayBanHanh || null,
      ngay_hieu_luc: ngayHieuLuc || null,
      ngay_het_hieu_luc: ngayHetHieuLuc || null,
      duong_dan: duongDan || null,
      ghi_chu: ghiChu || null,
    });

    setSaving(false);

    if (error) {
      setMessage(toUserMessage(error));
      return;
    }

    setTen("");
    setSoHieu("");
    setCoQuanBanHanh("");
    setNgayBanHanh("");
    setNgayHieuLuc("");
    setNgayHetHieuLuc("");
    setDuongDan("");
    setGhiChu("");
    setMessage("Đã thêm văn bản liên quan.");
    await loadRows();
  }

  if (loading || loadingRows) {
    return <LoadingState label="Đang tải văn bản liên quan…" />;
  }

  if (!profile || !activeYear) {
    return (
      <EmptyState
        title="Chưa có năm học để nhập văn bản"
        description="Hãy thiết lập đơn vị và năm học trước khi nhập danh mục văn bản liên quan."
        action={<Link className="button-primary" href="/thiet-lap">Thiết lập ngay</Link>}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {message ? <Alert tone={message.startsWith("Đã") ? "success" : "warning"}>{message}</Alert> : null}

      <section className="surface-card grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-end">
        <label className="text-sm font-medium">
          Năm học
          <select
            className="form-control mt-2"
            value={effectiveYearId}
            onChange={(event) => setSelectedYearId(event.target.value)}
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.ten} {year.trang_thai === "dang_hoat_dong" ? "(đang hoạt động)" : ""}
              </option>
            ))}
          </select>
        </label>
        <Link className="button-secondary" href="/bo-tieu-chuan">
          Xem TT57
        </Link>
      </section>

      <form className="surface-card grid gap-4 p-5" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Thêm văn bản</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
            Chỉ TT57 là nguồn đã xác minh trong hệ thống. Các văn bản khác do nhà trường tự nhập và tự cập nhật.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="text-sm font-medium lg:col-span-3">
            Tên văn bản
            <input className="form-control mt-2" required value={ten} onChange={(event) => setTen(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Số hiệu
            <input className="form-control mt-2" value={soHieu} onChange={(event) => setSoHieu(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Cơ quan ban hành
            <input className="form-control mt-2" value={coQuanBanHanh} onChange={(event) => setCoQuanBanHanh(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Đường dẫn
            <input className="form-control mt-2" type="url" value={duongDan} onChange={(event) => setDuongDan(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Ngày ban hành
            <input className="form-control mt-2" type="date" value={ngayBanHanh} onChange={(event) => setNgayBanHanh(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Ngày hiệu lực
            <input className="form-control mt-2" type="date" value={ngayHieuLuc} onChange={(event) => setNgayHieuLuc(event.target.value)} />
          </label>
          <label className="text-sm font-medium">
            Ngày hết hiệu lực
            <input className="form-control mt-2" type="date" value={ngayHetHieuLuc} onChange={(event) => setNgayHetHieuLuc(event.target.value)} />
          </label>
          <label className="text-sm font-medium lg:col-span-3">
            Ghi chú
            <textarea className="form-control mt-2 min-h-24" value={ghiChu} onChange={(event) => setGhiChu(event.target.value)} />
          </label>
        </div>
        <button className="button-primary" disabled={saving}>
          {saving ? "Đang lưu…" : "Thêm văn bản"}
        </button>
      </form>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-ink-navy)]">Danh mục văn bản</h2>
        </div>
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Chưa có văn bản liên quan"
              description="Nhà trường có thể thêm điều lệ, quy định an toàn, cơ sở vật chất hoặc các văn bản nội bộ đang sử dụng."
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {rows.map((row) => (
              <article className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto]" key={row.id}>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-ink-navy)]">{row.ten}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                    {row.so_hieu ?? "Chưa có số hiệu"} · {row.co_quan_ban_hanh ?? "Chưa có cơ quan ban hành"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-graphite)]/70">
                    Hiệu lực: {row.ngay_hieu_luc ?? "?"} đến {row.ngay_het_hieu_luc ?? "chưa ghi hạn"}
                  </p>
                </div>
                {row.duong_dan ? (
                  <a className="button-secondary" href={row.duong_dan} rel="noreferrer" target="_blank">
                    Mở liên kết
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
