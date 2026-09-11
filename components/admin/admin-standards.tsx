"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDate, schoolTypeLabels } from "@/components/admin/admin-format";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { toUserMessage } from "@/lib/errors/user-message";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type StandardSetRow = {
  id: string;
  ma_van_ban: string;
  ten: string;
  loai_hinh: string;
  version: number;
  trang_thai: string;
  ngay_hieu_luc: string | null;
  ngay_het_hieu_luc: string | null;
  so_tieu_chuan: number;
  so_tieu_chi: number;
  so_co_so_su_dung: number;
  so_luot_ap_dung: number;
  cac_ky_nam_hoc_su_dung: string[];
};

type StandardDocument = {
  key: string;
  ma_van_ban: string;
  version: number;
  variants: StandardSetRow[];
};

function groupStandardDocuments(rows: StandardSetRow[]) {
  const groups = new Map<string, StandardDocument>();

  rows.forEach((row) => {
    const key = `${row.ma_van_ban}:${row.version}`;
    const current = groups.get(key);

    if (current) {
      current.variants.push(row);
      return;
    }

    groups.set(key, {
      key,
      ma_van_ban: row.ma_van_ban,
      version: row.version,
      variants: [row],
    });
  });

  return Array.from(groups.values());
}

function uniqueValues<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function AdminStandards() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<StandardSetRow[]>([]);
  const [schoolType, setSchoolType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let activeRequest = true;

    async function loadStandards() {
      const { data, error } = await supabase.rpc("fn_admin_danh_sach_bo_tieu_chuan");

      if (!activeRequest) return;

      if (error) {
        setMessage(toUserMessage(error, "Không tải được danh mục bộ tiêu chuẩn."));
      } else {
        setRows((data ?? []) as StandardSetRow[]);
      }
      setLoading(false);
    }

    void loadStandards();
    return () => {
      activeRequest = false;
    };
  }, [supabase]);

  const filteredRows = useMemo(
    () => rows.filter((row) => (
      (!schoolType || row.loai_hinh === schoolType)
      && (!status || row.trang_thai === status)
    )),
    [rows, schoolType, status],
  );
  const documents = useMemo(() => groupStandardDocuments(filteredRows), [filteredRows]);

  if (loading) {
    return <LoadingState label="Đang tải danh mục bộ tiêu chuẩn…" />;
  }

  return (
    <div className="grid gap-5">
      {message ? <Alert tone="warning">{message}</Alert> : null}

      <p className="admin-privacy-note">
        Đây là danh mục phiên bản dùng chung toàn hệ thống. Nội dung nghiệp vụ của từng trường vẫn được thao tác trong workspace nhà trường.
      </p>

      <section className="admin-toolbar" aria-label="Bộ lọc bộ tiêu chuẩn">
        <label>
          Loại hình
          <select className="form-control" value={schoolType} onChange={(event) => setSchoolType(event.target.value)}>
            <option value="">Tất cả loại hình</option>
            <option value="mam_non">Mầm non</option>
            <option value="pho_thong">Phổ thông</option>
            <option value="gdtx">Giáo dục thường xuyên</option>
          </select>
        </label>
        <label>
          Trạng thái
          <select className="form-control" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="dang_ap_dung">Đang áp dụng</option>
            <option value="du_thao">Dự thảo</option>
            <option value="da_khoa">Đã khóa</option>
            <option value="het_hieu_luc">Hết hiệu lực</option>
          </select>
        </label>
      </section>

      <section className="admin-table-shell">
        <div className="admin-table-header">
          <div>
            <h2>Danh mục văn bản</h2>
            <p>
              {documents.length.toLocaleString("vi-VN")} văn bản · {filteredRows.length.toLocaleString("vi-VN")} phạm vi áp dụng
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Không có bộ tiêu chuẩn phù hợp"
              description="Hãy thay đổi bộ lọc để xem lại danh mục phiên bản."
            />
          </div>
        ) : (
          <div className="admin-table-scroll" data-lenis-prevent>
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Văn bản và phiên bản</th>
                  <th scope="col">Phạm vi áp dụng</th>
                  <th scope="col">Hiệu lực</th>
                  <th scope="col">Cấu trúc</th>
                  <th scope="col">Mức sử dụng</th>
                  <th scope="col">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => {
                  const firstVariant = document.variants[0];
                  const statuses = uniqueValues(document.variants.map((variant) => variant.trang_thai));
                  const startDates = uniqueValues(document.variants.map((variant) => variant.ngay_hieu_luc));
                  const endDates = uniqueValues(document.variants.map((variant) => variant.ngay_het_hieu_luc));
                  const structures = uniqueValues(document.variants.map(
                    (variant) => `${variant.so_tieu_chuan}:${variant.so_tieu_chi}`,
                  ));
                  const schoolCount = document.variants.reduce(
                    (total, variant) => total + variant.so_co_so_su_dung,
                    0,
                  );
                  const usageCount = document.variants.reduce(
                    (total, variant) => total + variant.so_luot_ap_dung,
                    0,
                  );
                  const schoolYearPeriods = uniqueValues(
                    document.variants.flatMap((variant) => variant.cac_ky_nam_hoc_su_dung),
                  );

                  return (
                    <tr key={document.key}>
                    <td>
                      <p className="admin-cell-title">{document.ma_van_ban}</p>
                      <p className="admin-cell-meta">Bộ tiêu chuẩn bảo đảm chất lượng giáo dục</p>
                      <p className="admin-cell-meta">
                        Phiên bản {document.version} · {document.variants.length} phạm vi
                      </p>
                    </td>
                    <td>
                      <div className="grid gap-3">
                        {document.variants.map((variant) => (
                          <div key={variant.id}>
                            <p className="admin-cell-title">
                              {schoolTypeLabels[variant.loai_hinh] ?? variant.loai_hinh}
                            </p>
                            <p className="admin-cell-meta">{variant.ten}</p>
                            <p className="admin-cell-meta">
                              {variant.so_co_so_su_dung.toLocaleString("vi-VN")} cơ sở · {variant.cac_ky_nam_hoc_su_dung.length.toLocaleString("vi-VN")} kỳ năm học
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <p>{startDates.length === 1 ? `Từ ${formatDate(startDates[0])}` : "Khác nhau theo phạm vi"}</p>
                      <p className="admin-cell-meta">
                        {endDates.length === 1
                          ? `Đến ${endDates[0] ? formatDate(endDates[0]) : "không ghi hạn"}`
                          : "Thời hạn khác nhau"}
                      </p>
                    </td>
                    <td>
                      {structures.length === 1 ? (
                        <>
                          <p>{firstVariant.so_tieu_chuan} tiêu chuẩn</p>
                          <p className="admin-cell-meta">{firstVariant.so_tieu_chi} tiêu chí mỗi phạm vi</p>
                        </>
                      ) : (
                        <div className="grid gap-2">
                          {document.variants.map((variant) => (
                            <p key={variant.id}>
                              {schoolTypeLabels[variant.loai_hinh] ?? variant.loai_hinh}: {variant.so_tieu_chuan} tiêu chuẩn · {variant.so_tieu_chi} tiêu chí
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <p>{schoolCount.toLocaleString("vi-VN")} cơ sở</p>
                      <p className="admin-cell-meta">
                        {schoolYearPeriods.length.toLocaleString("vi-VN")} kỳ năm học · {usageCount.toLocaleString("vi-VN")} lượt áp dụng
                      </p>
                    </td>
                    <td>
                      {statuses.length === 1
                        ? <StatusBadge status={statuses[0]} />
                        : <StatusBadge tone="warning">Nhiều trạng thái</StatusBadge>}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
