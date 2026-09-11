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
  so_nam_hoc_su_dung: number;
};

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
            <h2>Danh mục phiên bản</h2>
            <p>{filteredRows.length.toLocaleString("vi-VN")} phiên bản phù hợp</p>
          </div>
        </div>

        {filteredRows.length === 0 ? (
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
                  <th scope="col">Loại hình</th>
                  <th scope="col">Hiệu lực</th>
                  <th scope="col">Cấu trúc</th>
                  <th scope="col">Đang sử dụng</th>
                  <th scope="col">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="admin-cell-title">{row.ma_van_ban}</p>
                      <p className="admin-cell-meta">{row.ten}</p>
                      <p className="admin-cell-meta">Phiên bản {row.version}</p>
                    </td>
                    <td>{schoolTypeLabels[row.loai_hinh] ?? row.loai_hinh}</td>
                    <td>
                      <p>Từ {formatDate(row.ngay_hieu_luc)}</p>
                      <p className="admin-cell-meta">Đến {row.ngay_het_hieu_luc ? formatDate(row.ngay_het_hieu_luc) : "không ghi hạn"}</p>
                    </td>
                    <td>
                      <p>{row.so_tieu_chuan} tiêu chuẩn</p>
                      <p className="admin-cell-meta">{row.so_tieu_chi} tiêu chí</p>
                    </td>
                    <td>{row.so_nam_hoc_su_dung.toLocaleString("vi-VN")} năm học</td>
                    <td><StatusBadge status={row.trang_thai} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
